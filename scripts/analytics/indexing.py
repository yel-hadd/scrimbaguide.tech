#!/usr/bin/env python3
"""URL Inspection + Indexing API helper: changed/inspect/submit.

Best-effort: Google documents the Indexing API for JobPosting and
BroadcastEvent pages only, so a URL Inspection re-check is what decides
whether a submission actually worked, not the publish call's 200. The quota
(200/day per GCP project) is shared with use-apify.

`submit` is a dry run unless `--send` is passed. `--send` is meant to be run
by the main session with the owner's one approval, never by the site-ops
subagent directly (see .claude/agents/site-ops.md).
"""
from __future__ import annotations

import argparse
import concurrent.futures
import glob
import json
import os
import re
import subprocess
import sys
import time
from datetime import date, timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gapi  # noqa: E402
import inventory  # noqa: E402

ROOT = gapi.ROOT
T = gapi.TRACKING
HOST = T['hostname']
LEDGER_PATH = os.path.join(ROOT, 'secrets', 'indexing-log.tsv')
INSPECT_DIR = os.path.join(ROOT, 'secrets')
# Google's default publish quota: 200 per day per GCP project (developers.google.com/search/apis/indexing-api/v3/quota-pricing),
# shared with use-apify. Stopping on the first 429 covers whatever use-apify already spent.
DAILY_QUOTA = 200
DEDUPE_DAYS = 7
PENDING_MIN_AGE_DAYS = 2
USER_AGENT = 'scrimbaguide-indexing/1.0 (+https://scrimbaguide.tech)'

DIFF_PATHS = ['docs', 'blog', 'src/pages', 'data/course-redirects.json', 'docusaurus.config.ts']
_FROM_RE = re.compile(r"""['"]?from['"]?\s*[:=]\s*['"]([^'"]+)['"]""")


def _git(*args_):
    return subprocess.check_output(['git', *args_], cwd=ROOT).decode()


# ------------------------------------------------------------------ changed --

def changed(since, ref='origin/main'):
    """Absolute, trailing-slash URLs for every route touched between
    `since` and `ref`, plus the `from:` side of any redirect added in that
    range (docusaurus.config.ts inline list and data/course-redirects.json)."""
    out = _git('diff', '--name-only', since, ref, '--', *DIFF_PATHS)
    files = [p for p in out.splitlines() if p.strip()]
    routes = inventory.routes_for_files(files, include_catalog=False)
    urls = {_abs_url(r) for r in routes}

    redirect_files = [f for f in ('docusaurus.config.ts', 'data/course-redirects.json') if f in files]
    if redirect_files:
        redirect_diff = _git('diff', '-U0', since, ref, '--', *redirect_files)
        for line in redirect_diff.splitlines():
            if not line.startswith('+') or line.startswith('+++'):
                continue
            m = _FROM_RE.search(line)
            if not m:
                continue
            frm = m.group(1)
            if not frm.startswith('/'):
                continue
            urls.add(_abs_url(frm))

    return sorted(urls)


def _abs_url(route):
    if not route.endswith('/'):
        route = route + '/'
    return f'https://{HOST}{route}'


# ----------------------------------------------------------------- inspect --

def inspect_urls(urls, workers=4, sess=None):
    """POSTs urlInspection/index:inspect for each URL (4 threads). Returns
    [{url, verdict, coverage, lastCrawl, canonical}], one row per input URL,
    order not guaranteed."""
    sess = sess or gapi.session(gapi.GSC)
    endpoint = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

    def _one(url):
        body = {'inspectionUrl': url, 'siteUrl': T['gsc_site']}
        try:
            resp = gapi.call(sess, 'POST', endpoint, body)
        except gapi.ApiError as e:
            return {'url': url, 'verdict': 'ERROR', 'coverage': f'{e.status}: {e.body}', 'lastCrawl': None, 'canonical': None}
        result = resp.get('inspectionResult', {}) or {}
        idx = result.get('indexStatusResult', {}) or {}
        return {
            'url': url,
            'verdict': idx.get('verdict'),
            'coverage': idx.get('coverageState'),
            'lastCrawl': idx.get('lastCrawlTime'),
            'canonical': idx.get('googleCanonical'),
        }

    if not urls:
        return []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        return list(ex.map(_one, urls))


def write_inspect_results(results, la_date=None, full=False):
    """Writes secrets/inspect-YYYY-MM-DD.json for a full `--sitemap` run, or
    secrets/inspect-pending-YYYY-MM-DD.json for a partial `--pending` or
    `--urls` run, merging with a same-day file of the same kind if one
    already exists (later results for a URL replace earlier ones).

    The two are named apart so `snapshot.py`'s newest-inspect-file diff (and
    the monthly full-sitemap comparison) never picks up a partial run in
    place of a full one."""
    la_date = la_date or gapi.la_today()
    prefix = 'inspect' if full else 'inspect-pending'
    path = os.path.join(INSPECT_DIR, f'{prefix}-{la_date}.json')
    existing = []
    if os.path.exists(path):
        with open(path) as f:
            existing = json.load(f)
    by_url = {r['url']: r for r in existing}
    for r in results:
        by_url[r['url']] = r
    merged = list(by_url.values())
    gapi.atomic_write_json(path, merged)
    return path


def _sitemap_urls():
    url = f'https://{HOST}/sitemap.xml'
    req = Request(url, headers={'User-Agent': USER_AGENT})
    with urlopen(req, timeout=30) as resp:
        text = resp.read().decode('utf-8', errors='replace')
    return re.findall(r'<loc>([^<]+)</loc>', text)


def _submitted_dates():
    """{url: newest LA date submitted with status 200} from the ledger."""
    out = {}
    if not os.path.exists(LEDGER_PATH):
        return out
    with open(LEDGER_PATH) as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 3 or parts[2] != '200':
                continue
            d, u = parts[0], parts[1]
            if u not in out or d > out[u]:
                out[u] = d
    return out


def _last_inspected_dates():
    """{url: newest inspect-*.json / inspect-pending-*.json date the url
    appears in}. Both count here: either kind means the URL was actually
    re-checked with the URL Inspection API since it was submitted."""
    out = {}
    for fp in sorted(glob.glob(os.path.join(INSPECT_DIR, 'inspect-*.json'))):
        m = re.search(r'inspect-(?:pending-)?(\d{4}-\d{2}-\d{2})\.json$', fp)
        if not m:
            continue
        d = m.group(1)
        try:
            with open(fp) as f:
                rows_ = json.load(f)
        except Exception:
            continue
        for r in rows_:
            u = r.get('url')
            if u and (u not in out or d > out[u]):
                out[u] = d
    return out


def pending_urls(min_age_days=PENDING_MIN_AGE_DAYS, today=None):
    """URLs submitted at least `min_age_days` ago (LA date) with no
    inspection since the submission."""
    today = today or gapi.la_today()
    cutoff = (date.fromisoformat(today) - timedelta(days=min_age_days)).isoformat()
    submitted = _submitted_dates()
    inspected = _last_inspected_dates()
    out = []
    for u, submit_date in submitted.items():
        if submit_date > cutoff:
            continue
        last_insp = inspected.get(u)
        if last_insp is None or last_insp < submit_date:
            out.append(u)
    return sorted(out)


# ------------------------------------------------------------------ submit --

def _head_status(url, opener=urlopen):
    """Returns the HTTP status of a HEAD request, or None on network error."""
    try:
        req = Request(url, method='HEAD', headers={'User-Agent': USER_AGENT})
        with opener(req, timeout=15) as resp:
            return getattr(resp, 'status', None) or resp.getcode()
    except HTTPError as e:
        return e.code
    except URLError:
        return None


def _deferred_urls():
    """URLs whose newest ledger row is `deferred` (not superseded by a
    later 200). These are retried first on the next run."""
    newest = {}
    if not os.path.exists(LEDGER_PATH):
        return []
    with open(LEDGER_PATH) as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 3:
                continue
            d, u, status = parts
            if u not in newest or d >= newest[u][0]:
                newest[u] = (d, status)
    return sorted(u for u, (_, status) in newest.items() if status == 'deferred')


def _append_ledger(date_str, url, status):
    os.makedirs(os.path.dirname(LEDGER_PATH), exist_ok=True)
    with open(LEDGER_PATH, 'a') as f:
        f.write(f'{date_str}\t{url}\t{status}\n')


def _sent_count(today):
    """Count of status-200 ledger rows for `today` (LA date), not unique
    URLs: a URL force-resubmitted twice the same day counts twice against
    the budget."""
    if not os.path.exists(LEDGER_PATH):
        return 0
    count = 0
    with open(LEDGER_PATH) as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) >= 3 and parts[0] == today and parts[2] == '200':
                count += 1
    return count


def submit(urls, max_urls=DAILY_QUOTA, force=False, send=False, today=None, opener=urlopen, sess=None):
    """Dry run unless `send`. Returns a plan dict; with `send` it also POSTs
    and appends to the ledger.

    Budget: `max_urls` minus today's status-200 ledger rows (LA date; a URL
    resubmitted twice the same day counts twice). Dedupe: URLs sent (status
    200) in the last DEDUPE_DAYS are skipped unless `force`. Deferred URLs
    from a prior quota stop are always tried first, whether or not they are
    in this run's `urls`. Pre-check: HEAD each remaining URL; 200 is
    submitted, anything else (including a redirect source's 301/308, since
    the default opener follows redirects and a client-redirect stub on
    GitHub Pages reports 200 anyway) is skipped. On QuotaExceeded, the run
    stops at once and logs the rest as `deferred`.
    """
    today = today or gapi.la_today()
    submitted = _submitted_dates()
    sent_today = _sent_count(today)
    budget = max(0, max_urls - sent_today)

    cutoff = (date.fromisoformat(today) - timedelta(days=DEDUPE_DAYS)).isoformat()
    deferred_first = _deferred_urls()
    ordered = deferred_first + [u for u in urls if u not in deferred_first]

    candidates = []
    skipped_deduped = []
    for u in ordered:
        if not force:
            last = submitted.get(u)
            if last and last > cutoff and u not in deferred_first:
                skipped_deduped.append(u)
                continue
        candidates.append(u)

    plan = []
    for u in candidates:
        status = _head_status(u, opener=opener)
        if status == 200:
            plan.append({'url': u, 'action': 'submit', 'head_status': status})
        else:
            plan.append({'url': u, 'action': 'skip', 'head_status': status})

    submittable = [p for p in plan if p['action'] == 'submit']
    to_send = submittable[:budget]
    deferred = [{'url': p['url'], 'reason': 'over_budget'} for p in submittable[budget:]]

    result = {
        'dry_run': not send,
        'today': today,
        'budget': budget,
        'sent_today_already': sent_today,
        'deduped': skipped_deduped,
        'plan': plan,
        'to_send': to_send,
        'deferred': deferred,
    }
    if not send:
        return result

    sess = sess or gapi.session(gapi.IDX)
    endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
    sent = []
    for i, p in enumerate(to_send):
        url = p['url']
        try:
            gapi.call(sess, 'POST', endpoint, {'url': url, 'type': 'URL_UPDATED'})
        except gapi.QuotaExceeded:
            for rest in to_send[i:]:
                _append_ledger(today, rest['url'], 'deferred')
                deferred.append({'url': rest['url'], 'reason': 'quota_exceeded'})
            result['quota_exceeded'] = True
            break
        except gapi.ApiError as e:
            _append_ledger(today, url, str(e.status))
            sent.append({'url': url, 'status': e.status})
            continue
        _append_ledger(today, url, '200')
        sent.append({'url': url, 'status': 200})

    result['sent'] = sent
    result['deferred'] = deferred
    return result


# -------------------------------------------------------------------- CLI --

def main(argv=None):
    ap = argparse.ArgumentParser(prog='indexing.py')
    sub = ap.add_subparsers(dest='cmd', required=True)

    p_changed = sub.add_parser('changed')
    p_changed.add_argument('--since', required=True)
    p_changed.add_argument('--ref', default='origin/main')

    p_inspect = sub.add_parser('inspect')
    grp = p_inspect.add_mutually_exclusive_group(required=True)
    grp.add_argument('--urls')
    grp.add_argument('--sitemap', action='store_true')
    grp.add_argument('--pending', action='store_true')

    p_submit = sub.add_parser('submit')
    grp2 = p_submit.add_mutually_exclusive_group(required=True)
    grp2.add_argument('--urls')
    grp2.add_argument('--changed')
    p_submit.add_argument('--ref', default='origin/main')
    p_submit.add_argument('--max', type=int, default=DAILY_QUOTA)
    p_submit.add_argument('--force', action='store_true')
    p_submit.add_argument('--send', action='store_true')

    args = ap.parse_args(argv)

    if args.cmd == 'changed':
        for u in changed(args.since, ref=args.ref):
            print(u)
        return 0

    if args.cmd == 'inspect':
        if args.urls:
            with open(args.urls) as f:
                urls = [line.strip() for line in f if line.strip()]
        elif args.sitemap:
            urls = _sitemap_urls()
        else:
            urls = pending_urls()
        if not urls:
            print('no urls to inspect')
            return 0
        results = inspect_urls(urls)
        path = write_inspect_results(results, full=args.sitemap)
        print(f'inspected {len(results)} urls -> {os.path.relpath(path, ROOT)}')
        return 0

    if args.cmd == 'submit':
        if args.urls:
            with open(args.urls) as f:
                urls = [line.strip() for line in f if line.strip()]
        else:
            urls = changed(args.changed, ref=args.ref)
        result = submit(urls, max_urls=args.max, force=args.force, send=args.send)
        print(json.dumps(result, indent=1))
        return 0

    return 1


if __name__ == '__main__':
    sys.exit(main())
