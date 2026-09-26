"""Shared REST layer for scripts/analytics/*.

Stdlib + google-auth only (no googleapiclient). Calls GA4 Data API, GA4 Admin
API and Search Console over REST via `AuthorizedSession`. Every network
function accepts `sess=` so tests can inject a fake session that records
calls instead of hitting the network.
"""
from __future__ import annotations

import json
import os
import random
import time
import urllib.parse
import zoneinfo
from datetime import date, datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEY = os.path.join(ROOT, 'secrets', 'gsc-service-account.json')
TRACKING_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tracking.json')

with open(TRACKING_PATH) as _f:
    TRACKING = json.load(_f)

PROPERTY = TRACKING['property']
GSC_SITE = TRACKING['gsc_site']
HOST = TRACKING['hostname']
TZ = zoneinfo.ZoneInfo(TRACKING['timezone'])
BOT = TRACKING['bot_countries']

RO = 'https://www.googleapis.com/auth/analytics.readonly'
EDIT = 'https://www.googleapis.com/auth/analytics.edit'
GSC = 'https://www.googleapis.com/auth/webmasters.readonly'
IDX = 'https://www.googleapis.com/auth/indexing'

_SESSIONS: dict[tuple, object] = {}


class ApiError(Exception):
    def __init__(self, status, body):
        super().__init__(f'{status}: {body}')
        self.status = status
        self.body = body


class QuotaExceeded(Exception):
    pass


def session(*scopes):
    """Cached AuthorizedSession for a given set of scopes."""
    key = tuple(sorted(scopes))
    if key in _SESSIONS:
        return _SESSIONS[key]
    if not os.path.exists(KEY):
        raise FileNotFoundError('missing secrets/gsc-service-account.json')
    from google.oauth2 import service_account
    from google.auth.transport.requests import AuthorizedSession

    creds = service_account.Credentials.from_service_account_file(KEY, scopes=list(key))
    sess = AuthorizedSession(creds)
    _SESSIONS[key] = sess
    return sess


RETRY_STATUSES = {429, 500, 502, 503, 504}
BACKOFFS = [2, 4, 8, 16]


def call(sess, method, url, json_body=None, max_retries=4, _sleep=time.sleep):
    """POST/GET with retry on transient errors. Raises QuotaExceeded or ApiError."""
    last_exc = None
    for attempt in range(max_retries + 1):
        resp = sess.request(method, url, json=json_body)
        status = resp.status_code
        if status < 400:
            return resp.json() if resp.content else {}
        body_text = resp.text if hasattr(resp, 'text') else str(resp.content)
        if status == 429:
            is_daily_quota = 'RESOURCE_EXHAUSTED' in body_text and ('quota' in body_text.lower() or 'daily' in body_text.lower())
            is_indexing = 'indexing.googleapis.com' in url
            if is_daily_quota or is_indexing:
                raise QuotaExceeded(body_text)
        if status in RETRY_STATUSES and attempt < max_retries:
            retry_after = resp.headers.get('Retry-After') if hasattr(resp, 'headers') else None
            if retry_after:
                try:
                    delay = float(retry_after)
                except ValueError:
                    delay = BACKOFFS[min(attempt, len(BACKOFFS) - 1)]
            else:
                delay = BACKOFFS[min(attempt, len(BACKOFFS) - 1)]
            delay += random.uniform(0, 1)
            _sleep(delay)
            last_exc = ApiError(status, body_text)
            continue
        raise ApiError(status, body_text)
    if last_exc:
        raise last_exc
    raise ApiError('unknown', 'retries exhausted')


# ---------------------------------------------------------------- reports --

def ga_batch(sess, requests_, chunk=5):
    """POST batchRunReports in chunks of up to `chunk` report requests."""
    url = f'https://analyticsdata.googleapis.com/v1beta/{PROPERTY}:batchRunReports'
    out = []
    for i in range(0, len(requests_), chunk):
        body = {'requests': requests_[i:i + chunk]}
        resp = call(sess, 'POST', url, body)
        out.extend(resp.get('reports', []))
    return out


def rows(sess, report, request_body=None, limit=100000):
    """Turns a runReport-shaped response into a list of dicts.

    Dimension values stay strings, metric values become numbers. If the
    report says more rows exist than were returned, pages with `offset` by
    reissuing single runReport calls (used for report bodies without an
    explicit batch, i.e. `request_body` given).
    """
    dim_headers = [d['name'] for d in report.get('dimensionHeaders', [])]
    met_headers = [m['name'] for m in report.get('metricHeaders', [])]
    out = []

    def add(rep):
        for r in rep.get('rows', []):
            d = {}
            for name, v in zip(dim_headers, r.get('dimensionValues', [])):
                d[name] = v.get('value', '')
            for name, v in zip(met_headers, r.get('metricValues', [])):
                val = v.get('value', '0')
                try:
                    d[name] = float(val) if '.' in val else int(val)
                except ValueError:
                    d[name] = val
            out.append(d)

    add(report)
    row_count = report.get('rowCount', len(out))
    if request_body is not None and row_count > limit:
        offset = limit
        url = f'https://analyticsdata.googleapis.com/v1beta/{PROPERTY}:runReport'
        while offset < row_count:
            body = dict(request_body)
            body['offset'] = offset
            body['limit'] = limit
            resp = call(sess, 'POST', url, body)
            add(resp)
            offset += limit
    return out


def gsc_query(sess, start, end, dims, row_limit=25000):
    site_path = urllib.parse.quote(GSC_SITE, safe='')
    url = f'https://searchconsole.googleapis.com/webmasters/v3/sites/{site_path}/searchAnalytics/query'
    rows_out, offset = [], 0
    while True:
        body = {'startDate': start, 'endDate': end, 'dimensions': dims, 'rowLimit': row_limit, 'startRow': offset}
        resp = call(sess, 'POST', url, body)
        batch = resp.get('rows', [])
        rows_out += batch
        if len(batch) < row_limit:
            return rows_out
        offset += row_limit


def gsc_sitemaps(sess):
    site_path = urllib.parse.quote(GSC_SITE, safe='')
    url = f'https://searchconsole.googleapis.com/webmasters/v3/sites/{site_path}/sitemaps'
    resp = call(sess, 'GET', url)
    return resp.get('sitemap', [])


# --------------------------------------------------------------- filters --

def humans_filter():
    return {
        'andGroup': {
            'expressions': [
                {'notExpression': {'filter': {'fieldName': 'country', 'inListFilter': {'values': BOT}}}},
                {'filter': {'fieldName': 'hostName', 'stringFilter': {'matchType': 'EXACT', 'value': HOST}}},
            ]
        }
    }


def and_filter(*exprs):
    exprs = [e for e in exprs if e]
    if len(exprs) == 1:
        return exprs[0]
    return {'andGroup': {'expressions': list(exprs)}}


def event_filter(names):
    return {'filter': {'fieldName': 'eventName', 'inListFilter': {'values': list(names)}}}


# -------------------------------------------------------------- utilities --

def la_date(iso_utc):
    if iso_utc.endswith('Z'):
        iso_utc = iso_utc[:-1] + '+00:00'
    d = datetime.fromisoformat(iso_utc)
    return d.astimezone(TZ).date().isoformat()


def la_today():
    return datetime.now(TZ).date().isoformat()


def la_midnight_iso(date_str, end_of_day=False):
    """Anchors a bare `YYYY-MM-DD` to LA midnight that day (or the next
    day's midnight when `end_of_day`, so an inclusive last day isn't cut
    short), with that specific date's own UTC offset (DST-aware, not
    today's). `git log --since/--until` reads a bare date at the current
    wall-clock time in the machine's zone, which drops same-day merges; a
    caller building `--since`/`--until` for `git log` should anchor through
    this instead of interpolating the date string directly."""
    d = date.fromisoformat(date_str)
    if end_of_day:
        d = d + timedelta(days=1)
    return datetime(d.year, d.month, d.day, tzinfo=TZ).isoformat()


def atomic_write_json(path, obj):
    d = os.path.dirname(path)
    os.makedirs(d, exist_ok=True)
    tmp = os.path.join(d, f'.tmp-{os.path.basename(path)}-{os.getpid()}-{random.randint(0, 1 << 30)}')
    with open(tmp, 'w') as f:
        json.dump(obj, f, indent=1)
        f.write('\n')
    os.replace(tmp, path)


def append_jsonl(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'a') as f:
        f.write(json.dumps(obj) + '\n')


def ensure_dirs():
    for d in ('.seo-cache/history', '.seo-cache/reports', 'secrets/ops'):
        os.makedirs(os.path.join(ROOT, d), exist_ok=True)
