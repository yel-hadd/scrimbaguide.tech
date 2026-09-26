#!/usr/bin/env python3
"""Pull the GA4 + GSC snapshot for scrimbaguide.tech into .seo-cache/.

Writes `.seo-cache/analytics-snapshot.json` (schema_version 1), a dated copy
in `.seo-cache/history/`, and `.seo-cache/summary.txt`. Fail-soft: each
source runs in its own try block; if both GA4 and GSC fail the previous
snapshot is left untouched and the script exits 2.

Usage: python3 scripts/analytics/snapshot.py [--days 28] [--gsc-days 90]
       [--max-age HOURS] [--dry-run] [--no-history]
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import os
import re
import statistics
import subprocess
import sys
import traceback
from datetime import date, datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gapi  # noqa: E402
import inventory  # noqa: E402
import ga4admin  # noqa: E402

ROOT = gapi.ROOT
T = gapi.TRACKING
HOST = T['hostname']
BOT = T['bot_countries']
MIN_SESSIONS = T.get('min_sessions', 30)
SNAPSHOT_PATH = os.path.join(ROOT, '.seo-cache', 'analytics-snapshot.json')
HISTORY_DIR = os.path.join(ROOT, '.seo-cache', 'history')
SUMMARY_PATH = os.path.join(ROOT, '.seo-cache', 'summary.txt')

AI_RE = re.compile(T['ai_source_regex'], re.I)
COPILOT_RE = re.compile(T['copilot_regex'], re.I)
SOCIAL_SOURCES = {'facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com', 't.co',
                   'instagram.com', 'youtube.com', 'pinterest.com', 'tiktok.com'}


# ---------------------------------------------------------------- windows --

def _iso(d):
    return d.isoformat()


def build_windows(days, gsc_days, today=None):
    today = today or date.fromisoformat(gapi.la_today())
    ga_end = today - timedelta(days=1)
    ga_start = ga_end - timedelta(days=days - 1)
    ga_prev_end = ga_start - timedelta(days=1)
    ga_prev_start = ga_prev_end - timedelta(days=days - 1)
    week_end = ga_end
    week_start = week_end - timedelta(days=6)
    prev_week_end = week_start - timedelta(days=1)
    prev_week_start = prev_week_end - timedelta(days=6)
    gsc_end = today - timedelta(days=3)
    gsc_start = gsc_end - timedelta(days=gsc_days - 1)
    gsc_prev_end = gsc_start - timedelta(days=1)
    gsc_prev_start = gsc_prev_end - timedelta(days=gsc_days - 1)
    return {
        'ga4': {'start': _iso(ga_start), 'end': _iso(ga_end), 'days': days},
        'ga4_prev': {'start': _iso(ga_prev_start), 'end': _iso(ga_prev_end), 'days': days},
        'week': {'start': _iso(week_start), 'end': _iso(week_end)},
        'prev_week': {'start': _iso(prev_week_start), 'end': _iso(prev_week_end)},
        'gsc': {'start': _iso(gsc_start), 'end': _iso(gsc_end), 'days': gsc_days, 'lag_days': 3},
        'gsc_prev': {'start': _iso(gsc_prev_start), 'end': _iso(gsc_prev_end), 'days': gsc_days},
    }


def _ga4_date_to_iso(d):
    if d and len(d) == 8 and d.isdigit():
        return f'{d[:4]}-{d[4:6]}-{d[6:8]}'
    return d


def norm_path(url):
    if _unset(url):
        return url
    p = re.sub(r'^https?://[^/]+', '', url).split('#')[0].split('?')[0]
    return p if p.endswith('/') else p + '/'


# --------------------------------------------------------------- reports --

def build_report_requests(windows, registered_event_dims):
    """Returns (R1..R8 bodies, meta) as a flat list in order."""
    hf = gapi.humans_filter()
    dr = lambda w: [{'startDate': w['start'], 'endDate': w['end']}]  # noqa: E731

    def has(dim):
        return dim in registered_event_dims

    aff_filter = gapi.and_filter(hf, {'filter': {'fieldName': 'eventName', 'stringFilter': {'value': 'affiliate_link_clicked'}}})
    r1 = {
        'dimensions': [],
        'metrics': [{'name': 'sessions'}, {'name': 'engagedSessions'}, {'name': 'totalUsers'},
                    {'name': 'screenPageViews'}],
        'dateRanges': [
            {'startDate': windows['ga4']['start'], 'endDate': windows['ga4']['end'], 'name': 'cur'},
            {'startDate': windows['ga4_prev']['start'], 'endDate': windows['ga4_prev']['end'], 'name': 'prev'},
            {'startDate': windows['week']['start'], 'endDate': windows['week']['end'], 'name': 'week'},
            {'startDate': windows['prev_week']['start'], 'endDate': windows['prev_week']['end'], 'name': 'prev_week'},
        ],
        'dimensionFilter': hf,
        'limit': 10,
        'keepEmptyRows': True,
    }
    r2 = {
        'dimensions': [{'name': 'date'}],
        'metrics': [{'name': 'sessions'}],
        'dateRanges': dr(windows['ga4']),
        'dimensionFilter': hf,
        'limit': 100000,
    }
    r3 = {
        'dimensions': [{'name': 'landingPage'}, {'name': 'sessionSource'}, {'name': 'sessionMedium'}],
        'metrics': [{'name': 'sessions'}, {'name': 'engagedSessions'}],
        'dateRanges': [
            {'startDate': windows['ga4']['start'], 'endDate': windows['ga4']['end'], 'name': 'cur'},
            {'startDate': windows['ga4_prev']['start'], 'endDate': windows['ga4_prev']['end'], 'name': 'prev'},
        ],
        'dimensionFilter': hf,
        'limit': 100000,
    }
    # Affiliate clicks come from eventCount on affiliate_link_clicked, never
    # keyEvents:affiliate_link_clicked, which reads 0 for any date before the
    # key event was registered (2026-09-26). Same dims/ranges as R1-R3, joined
    # back in by dimension key + range.
    ae1 = {
        'dimensions': [],
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': r1['dateRanges'],
        'dimensionFilter': aff_filter,
        'limit': 10,
        'keepEmptyRows': True,
    }
    ae2 = {
        'dimensions': [{'name': 'date'}],
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': dr(windows['ga4']),
        'dimensionFilter': aff_filter,
        'limit': 100000,
    }
    ae3 = {
        'dimensions': [{'name': 'landingPage'}, {'name': 'sessionSource'}, {'name': 'sessionMedium'}],
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': r3['dateRanges'],
        'dimensionFilter': aff_filter,
        'limit': 100000,
    }
    r4_dims = [{'name': 'pagePath'}, {'name': 'pageTitle'}]
    if has('contentGroup'):
        r4_dims.append({'name': 'contentGroup'})
    r4_dims.append({'name': 'eventName'})
    r4 = {
        'dimensions': r4_dims,
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': dr(windows['ga4']),
        'dimensionFilter': gapi.and_filter(hf, gapi.event_filter(['page_view', 'affiliate_link_clicked'])),
        'limit': 100000,
    }
    r5_dims = [{'name': 'pagePath'}]
    missing_r5 = []
    for dim in ('customEvent:cta_type', 'customEvent:cta_location', 'customEvent:destination_type', 'customEvent:destination_slug'):
        if has(dim):
            r5_dims.append({'name': dim})
        else:
            missing_r5.append(dim)
    r5 = {
        'dimensions': r5_dims,
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': dr(windows['ga4']),
        'dimensionFilter': gapi.and_filter(hf, {'filter': {'fieldName': 'eventName', 'stringFilter': {'value': 'affiliate_link_clicked'}}}),
        'limit': 100000,
    }
    r6 = {
        'dimensions': [{'name': 'pagePath'}, {'name': 'linkUrl'}],
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': dr(windows['ga4']),
        'dimensionFilter': gapi.and_filter(hf, {'filter': {'fieldName': 'eventName', 'stringFilter': {'value': 'click'}}}),
        'limit': 100000,
    }
    r7_dims = [{'name': 'eventName'}]
    missing_r7 = []
    for dim in ('searchTerm', 'customEvent:search_outcome', 'customEvent:search_ui', 'customEvent:advisor_step', 'customEvent:recommended_path'):
        if has(dim):
            r7_dims.append({'name': dim})
        else:
            missing_r7.append(dim)
    r7 = {
        'dimensions': r7_dims,
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': dr(windows['ga4']),
        'dimensionFilter': gapi.and_filter(hf, gapi.event_filter(
            ['search', 'path_advisor_start', 'path_advisor_step', 'path_advisor_complete',
             'path_advisor_scrimba_click', 'path_advisor_guide_click'])),
        'limit': 100000,
    }
    r8 = {
        'dimensions': [{'name': 'hostName'}],
        'metrics': [{'name': 'screenPageViews'}],
        'dateRanges': dr(windows['ga4']),
        'limit': 1000,
    }
    # Daily affiliate clicks by destination_type, for LA-date reconciliation
    # against the Scrimbassadors/Udemy readings (recipe 9), independent of R5's
    # whole-window aggregation.
    r9_dims = [{'name': 'date'}]
    if has('customEvent:destination_type'):
        r9_dims.append({'name': 'customEvent:destination_type'})
    r9 = {
        'dimensions': r9_dims,
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': dr(windows['ga4']),
        'dimensionFilter': aff_filter,
        'limit': 100000,
    }
    # Scrimba/Udemy split (aff_scrimba/aff_udemy) by the same four named
    # windows R1 uses, so site.week/prev_week/prev carry it too, not just cur.
    r10_dims = []
    if has('customEvent:destination_type'):
        r10_dims.append({'name': 'customEvent:destination_type'})
    r10 = {
        'dimensions': r10_dims,
        'metrics': [{'name': 'eventCount'}],
        'dateRanges': r1['dateRanges'],
        'dimensionFilter': aff_filter,
        'limit': 100000,
    }
    reqs = [r1, r2, r3, r4, r5, r6, r7, r8, ae1, ae2, ae3, r9, r10]
    meta = {'missing': {'R5': missing_r5, 'R7': missing_r7}}
    return reqs, meta


# ------------------------------------------------------------- derivations --

def business_channel(source, medium):
    if AI_RE.search(source or ''):
        if COPILOT_RE.search(source or ''):
            return 'Copilot'
        return 'AI'
    if medium == 'organic':
        return 'Organic Search'
    s = (source or '').lower()
    if any(s == soc or s.endswith('.' + soc) for soc in SOCIAL_SOURCES):
        return 'Social'
    if medium == 'referral':
        return 'Referral'
    if source == '(direct)':
        return 'Direct'
    return 'Other'


def _unset(v):
    """True when a GA4 dimension value means 'no data', including the
    literal string GA4 sends for an unregistered/unpopulated custom
    dimension, '(not set)'."""
    return v in (None, '', '(not set)')


def per_100(count, sessions):
    if sessions is None or sessions < MIN_SESSIONS:
        return None
    return round(100 * count / sessions, 2) if sessions else 0.0


def load_affiliate_readings():
    def read_last_two(path):
        if not os.path.exists(path):
            return []
        all_lines = [(i, l) for i, l in enumerate(open(path), start=1) if l.strip()]
        out = []
        for lineno, l in all_lines[-2:]:
            try:
                out.append(json.loads(l))
            except json.JSONDecodeError:
                out.append({'error': f'malformed line {lineno}', 'raw': l.strip()})
        return out
    return {
        'scrimbassadors': read_last_two(os.path.join(ROOT, 'secrets', 'ops', 'scrimbassadors.jsonl')),
        'impact': read_last_two(os.path.join(ROOT, 'secrets', 'ops', 'impact.jsonl')),
    }


def strip_money(reading, money_flag=None):
    """Nulls every money-shaped field. `money_flag` is the CLI --money gate;
    with it omitted (None), only the reading's own `money` field decides, for
    backward compatibility with older single-arg callers."""
    if not isinstance(reading, dict):
        return reading
    allow = reading.get('money') if money_flag is None else bool(money_flag and reading.get('money'))
    if allow:
        return reading
    out = json.loads(json.dumps(reading))
    for key in list(out.get('cumulative', {}) or {}):
        if key.endswith('_usd'):
            out['cumulative'][key] = None
    for k in ('earnings_usd', 'commission_usd', 'paid_out_usd', 'due_usd', 'maturing_usd', 'sales_usd'):
        if k in out:
            out[k] = None
    detail = out.get('detail')
    if isinstance(detail, dict):
        for k in ('new_transactions', 'refund_flags', 'new_payout'):
            if k in detail:
                detail[k] = None
    for k in ('refund_flags', 'new_payout', 'new_transactions', 'balances', 'transactions', 'payouts', 'raw_excerpt'):
        if k in out:
            out[k] = None
    return out


def newest_inspect_files():
    files = sorted(glob.glob(os.path.join(ROOT, 'secrets', 'inspect-*.json')))
    if not files:
        return None, None
    return (files[-1], files[-2] if len(files) > 1 else None)


def is_stale(as_of_iso, days=10):
    try:
        d = datetime.fromisoformat(as_of_iso.replace('Z', '+00:00'))
    except Exception:
        return True
    return (datetime.now(d.tzinfo) - d).days > days


# ------------------------------------------------------------------- main --

def _run_sources(args, snap):
    errors = []
    windows = build_windows(args.days, args.gsc_days)
    snap['windows'] = windows
    snap['filters'] = {'bot_countries': BOT, 'hostname': HOST, 'ai_source_regex': T['ai_source_regex'], 'min_sessions': MIN_SESSIONS}
    snap['sources'] = {}

    # -- inventory --
    try:
        inv = inventory.main()
        snap['sources']['inventory'] = {'status': 'ok', 'pages': len(inv)}
    except Exception as e:
        errors.append({'section': 'inventory', 'error': str(e)})
        snap['sources']['inventory'] = {'status': 'error', 'error': str(e)}
        inv = []

    inv_by_route = {p['route']: p for p in inv}

    # Normalized once: redirect source route -> its final target route.
    # GSC's 90-day window still carries impressions for a page that was
    # merged away days or weeks ago, so every consumer below (pages,
    # cannibalization, gaps, leaks) needs to know which routes are redirects.
    try:
        redirect_map = {norm_path(r['from']): norm_path(r['to']) for r in inventory.redirect_sources()}
    except Exception:
        redirect_map = {}

    # --dry-run prints the request bodies and makes no network calls: no
    # admin, GA4, GSC, annotations or ga4admin.candidates (which runs `gh`
    # per commit), and it needs no service-account key.
    if args.dry_run:
        registered_event_dims = {f"customEvent:{d['parameter']}" for d in T['custom_dimensions']}
        registered_event_dims.update({'contentGroup', 'hostName', 'searchTerm'})
        reqs, _meta = build_report_requests(windows, registered_event_dims)
        print(json.dumps({'ga4_requests': reqs}, indent=1, default=str))
        w, wp = windows['gsc'], windows['gsc_prev']
        gsc_requests = {
            'page_query': {'startDate': w['start'], 'endDate': w['end'], 'dimensions': ['page', 'query'], 'rowLimit': 25000, 'startRow': 0},
            'page': {'startDate': w['start'], 'endDate': w['end'], 'dimensions': ['page'], 'rowLimit': 25000, 'startRow': 0},
            'page_prev': {'startDate': wp['start'], 'endDate': wp['end'], 'dimensions': ['page'], 'rowLimit': 25000, 'startRow': 0},
            'query': {'startDate': w['start'], 'endDate': w['end'], 'dimensions': ['query'], 'rowLimit': 25000, 'startRow': 0},
        }
        print(json.dumps({'gsc_requests': gsc_requests, 'sitemaps_request': f'GET sites/{gapi.GSC_SITE}/sitemaps'}, indent=1, default=str))
        snap['sources'] = {'dry_run': {'status': 'ok'}}
        return snap, True

    # -- admin: which customEvent:* dims are usable --
    registered_event_dims = set()
    try:
        sess = gapi.session(gapi.EDIT)
        url = f'https://analyticsadmin.googleapis.com/v1beta/{gapi.PROPERTY}/customDimensions'
        resp = gapi.call(sess, 'GET', url)
        for d in resp.get('customDimensions', []):
            registered_event_dims.add(f"customEvent:{d.get('parameterName')}")
        registered_event_dims.add('contentGroup')
        registered_event_dims.add('hostName')
        registered_event_dims.add('searchTerm')
        snap['sources']['admin'] = {'status': 'ok', 'error': None}
    except Exception as e:
        errors.append({'section': 'admin', 'error': str(e)})
        snap['sources']['admin'] = {'status': 'error', 'error': str(e)}

    # -- GA4 batch reports --
    ga_ok = False
    reports = []
    missing_dims = []
    try:
        sess = gapi.session(gapi.RO)
        reqs, meta = build_report_requests(windows, registered_event_dims)
        missing_dims = sorted(set(meta['missing']['R5'] + meta['missing']['R7']))
        reports = gapi.ga_batch(sess, reqs)
        ga_ok = True
        status = 'partial' if missing_dims else 'ok'
        snap['sources']['ga4'] = {'status': status, 'error': None, 'missing_dimensions': missing_dims}
    except Exception as e:
        errors.append({'section': 'ga4', 'error': f'{e}\n{traceback.format_exc()}'})
        snap['sources']['ga4'] = {'status': 'error', 'error': str(e), 'missing_dimensions': []}
        reports = [{}] * 13

    r1 = gapi.rows(sess, reports[0]) if ga_ok else []
    r2 = gapi.rows(sess, reports[1]) if ga_ok else []
    r3 = gapi.rows(sess, reports[2]) if ga_ok else []
    r4 = gapi.rows(sess, reports[3]) if ga_ok else []
    r5 = gapi.rows(sess, reports[4]) if ga_ok else []
    r6 = gapi.rows(sess, reports[5]) if ga_ok else []
    r7 = gapi.rows(sess, reports[6]) if ga_ok else []
    r8 = gapi.rows(sess, reports[7]) if ga_ok else []
    ae1 = gapi.rows(sess, reports[8]) if ga_ok else []
    ae2 = gapi.rows(sess, reports[9]) if ga_ok else []
    ae3 = gapi.rows(sess, reports[10]) if ga_ok else []
    r9 = gapi.rows(sess, reports[11]) if ga_ok else []
    r10 = gapi.rows(sess, reports[12]) if ga_ok else []

    # -- GSC --
    gsc_ok = False
    pq = cur_g = prev_g = queries_g = []
    sitemaps = []
    try:
        gsess = gapi.session(gapi.GSC)
        w, wp = windows['gsc'], windows['gsc_prev']
        pq = gapi.gsc_query(gsess, w['start'], w['end'], ['page', 'query'])
        cur_g = gapi.gsc_query(gsess, w['start'], w['end'], ['page'])
        prev_g = gapi.gsc_query(gsess, wp['start'], wp['end'], ['page'])
        queries_g = gapi.gsc_query(gsess, w['start'], w['end'], ['query'])
        sitemaps = gapi.gsc_sitemaps(gsess)
        gsc_ok = True
        snap['sources']['gsc'] = {'status': 'ok', 'error': None}
    except Exception as e:
        errors.append({'section': 'gsc', 'error': str(e)})
        snap['sources']['gsc'] = {'status': 'error', 'error': str(e)}

    if not ga_ok and not gsc_ok:
        snap['errors'] = errors
        return snap, False

    # -- annotations --
    try:
        annotations = ga4admin.annotations_list()
        snap['annotations'] = annotations
    except Exception as e:
        errors.append({'section': 'annotations', 'error': str(e)})
        annotations = []
        snap['annotations'] = []

    # -- local sources --
    inspect_new, inspect_prev = newest_inspect_files()
    if inspect_new:
        snap['sources']['url_inspection'] = {'status': 'ok', 'as_of': os.path.basename(inspect_new)[8:18], 'file': os.path.relpath(inspect_new, ROOT)}
    else:
        snap['sources']['url_inspection'] = {'status': 'not_collected', 'as_of': None}

    affiliate_readings = load_affiliate_readings()
    scrimba_readings = affiliate_readings['scrimbassadors']
    impact_readings = affiliate_readings['impact']
    snap['sources']['scrimba_affiliate'] = {'status': 'ok' if scrimba_readings else 'not_collected', 'as_of': scrimba_readings[-1].get('as_of') if scrimba_readings else None}
    snap['sources']['udemy_impact'] = {'status': 'ok' if impact_readings else 'not_collected', 'as_of': impact_readings[-1].get('as_of') if impact_readings else None}

    # ============================================================ site --
    def sum_metrics(rows_, date_range_name, metrics):
        row = next((r for r in rows_ if r.get('dateRange') == date_range_name), None)
        if row is None:
            # A multi-range report omits a zero-metric range's row entirely,
            # so an empty row here means that window truly had zeros, never
            # another window's numbers. Only a single-range report (no row
            # carries a `dateRange` key at all) falls back to the first row.
            if rows_ and not any('dateRange' in r for r in rows_):
                row = rows_[0]
            else:
                row = {}
        return {m: row.get(m, 0) for m in metrics}

    site = {}
    metrics_names = ['sessions', 'engagedSessions', 'totalUsers', 'screenPageViews']
    ae1_aff = {row.get('dateRange', 'cur'): row.get('eventCount', 0) for row in ae1}
    for rng in ('cur', 'prev', 'week', 'prev_week'):
        m = sum_metrics(r1, rng, metrics_names)
        site[rng] = {
            'sessions': m.get('sessions', 0), 'engaged_sessions': m.get('engagedSessions', 0),
            'users': m.get('totalUsers', 0), 'views': m.get('screenPageViews', 0),
            'aff_clicks': ae1_aff.get(rng, 0),
            'aff_scrimba': None, 'aff_udemy': None, 'aff_per_100': None,
        }

    # aff split by destination_type (R5, whole-window cur only, used by
    # placements/reconciliation) and by window (R10, all four named windows
    # so site.week/prev_week/prev carry the split too, not just cur).
    step5_date = next((e['date'] for e in T['epochs'] if e['key'] == 'analytics_step5'), None)
    epoch_warnings = []
    step5_available = bool(step5_date) and windows['ga4']['start'] >= step5_date
    aff_scrimba_total = aff_udemy_total = 0
    for r in r5:
        dt_ = r.get('customEvent:destination_type', '')
        c = r.get('eventCount', 0)
        if dt_ == 'udemy':
            aff_udemy_total += c
        elif dt_:
            aff_scrimba_total += c

    _rng_window_start = {'cur': windows['ga4']['start'], 'prev': windows['ga4_prev']['start'],
                          'week': windows['week']['start'], 'prev_week': windows['prev_week']['start']}
    r10_by_rng = collections.defaultdict(lambda: {'scrimba': 0, 'udemy': 0})
    for r in r10:
        rng = r.get('dateRange', 'cur')
        dt_ = r.get('customEvent:destination_type', '')
        c = r.get('eventCount', 0)
        if dt_ == 'udemy':
            r10_by_rng[rng]['udemy'] += c
        elif dt_:
            r10_by_rng[rng]['scrimba'] += c
    dims_ok = 'customEvent:destination_type' not in missing_dims
    # Map R1's range names ('cur'/'prev'/'week'/'prev_week') to the `windows`
    # keys the never-across warnings below use ('ga4'/'ga4_prev'/'week'/'prev_week'),
    # so a consumer can filter epoch_warnings on one consistent key, and give
    # each window its own warning text instead of repeating one sentence.
    _rng_to_window_key = {'cur': 'ga4', 'prev': 'ga4_prev', 'week': 'week', 'prev_week': 'prev_week'}
    for rng in ('cur', 'prev', 'week', 'prev_week'):
        rng_available = bool(step5_date) and _rng_window_start[rng] >= step5_date and dims_ok
        if rng_available:
            site[rng]['aff_scrimba'] = r10_by_rng[rng]['scrimba']
            site[rng]['aff_udemy'] = r10_by_rng[rng]['udemy']
        else:
            wname = _rng_to_window_key[rng]
            epoch_warnings.append({'key': 'analytics_step5', 'window': wname,
                                    'text': f'{wname}: window starts before analytics_step5 or destination_type unavailable; aff split unavailable'})

    for rng in ('cur', 'prev', 'week', 'prev_week'):
        site[rng]['aff_per_100'] = per_100(site[rng]['aff_clicks'], site[rng]['sessions'])

    # Any never-across epoch whose date falls strictly after a comparison
    # window's earlier side and on/before its later side means that
    # comparison straddles the epoch (not just the one hardcoded case).
    _cmp_pairs = [(windows['ga4_prev'], windows['ga4'], 'ga4'), (windows['prev_week'], windows['week'], 'week')]
    for e in T['epochs']:
        if e.get('compare') != 'never-across' or not e.get('date'):
            continue
        for prev_w, cur_w, window_name in _cmp_pairs:
            if prev_w['start'] < e['date'] <= cur_w['end']:
                epoch_warnings.append({'key': e['key'], 'window': window_name,
                                        'text': f"comparison crosses {e['key']} ({e['date']}): {e['effect']}"})

    # Pending epochs (status 'pending', no date yet) are never inferred here:
    # R2 only carries [date, sessions], so a pending epoch's `fields` (e.g.
    # a custom dimension or event name) can't be read off it. A pending
    # epoch's date must be set by hand in tracking.json once it is known.
    for e in T['epochs']:
        if e.get('status') != 'pending':
            continue
        epoch_warnings.append({'key': e['key'], 'window': None,
                                'text': f"{e['key']} is pending: set its date in tracking.json by hand once known"})

    # ============================================================ daily --
    ae2_aff = collections.defaultdict(int)
    for r in ae2:
        ae2_aff[_ga4_date_to_iso(r.get('date', ''))] += r.get('eventCount', 0)
    daily = []
    for r in sorted(r2, key=lambda r: r.get('date', '')):
        d = _ga4_date_to_iso(r.get('date', ''))
        daily.append({'date': d, 'sessions': r.get('sessions', 0), 'aff_clicks': ae2_aff.get(d, 0)})
    zero_click_days = [d['date'] for d in daily if d['aff_clicks'] == 0]
    last_aff = next((d['date'] for d in reversed(daily) if d['aff_clicks'] > 0), None)

    # ========================================================= channels --
    chan_cur = collections.defaultdict(lambda: {'sessions': 0, 'engaged_sessions': 0, 'aff_clicks': 0})
    chan_prev = collections.defaultdict(lambda: {'sessions': 0, 'aff_clicks': 0})
    ai_sources = collections.defaultdict(lambda: {'sessions': 0, 'engaged_sessions': 0, 'aff_clicks': 0, 'prev_sessions': 0, '_landings': collections.defaultdict(lambda: {'sessions': 0, 'aff_clicks': 0})})
    page_ga4 = collections.defaultdict(lambda: {'sessions': 0, 'engaged_sessions': 0, 'aff_clicks': 0, 'prev_sessions': 0, 'prev_aff_clicks': 0})

    ae3_aff = collections.defaultdict(int)
    for r in ae3:
        key = (r.get('landingPage', ''), r.get('sessionSource', ''), r.get('sessionMedium', ''), r.get('dateRange', 'cur'))
        ae3_aff[key] += r.get('eventCount', 0)

    unattributed_sessions = {'cur': 0, 'prev': 0}
    for r in r3:
        raw_lp = r.get('landingPage', '/')
        src, med = r.get('sessionSource', ''), r.get('sessionMedium', '')
        rng = r.get('dateRange', 'cur')
        s, es = r.get('sessions', 0), r.get('engagedSessions', 0)
        aff = ae3_aff.get((raw_lp, src, med, rng), 0)
        ch = business_channel(src, med)
        if _unset(raw_lp) or not str(raw_lp).startswith('/'):
            # '(not set)' (or any other non-path landingPage) is not a real
            # route: count it toward channel totals only, never as a page.
            unattributed_sessions[rng if rng in ('cur', 'prev') else 'cur'] += s
            if rng == 'cur':
                chan_cur[ch]['sessions'] += s
                chan_cur[ch]['engaged_sessions'] += es
                chan_cur[ch]['aff_clicks'] += aff
                if ch in ('AI', 'Copilot'):
                    ai_sources[src]['sessions'] += s
                    ai_sources[src]['engaged_sessions'] += es
                    ai_sources[src]['aff_clicks'] += aff
            else:
                chan_prev[ch]['sessions'] += s
                chan_prev[ch]['aff_clicks'] += aff
                if ch in ('AI', 'Copilot'):
                    ai_sources[src]['prev_sessions'] += s
            continue
        lp = norm_path(raw_lp)
        if rng == 'cur':
            chan_cur[ch]['sessions'] += s
            chan_cur[ch]['engaged_sessions'] += es
            chan_cur[ch]['aff_clicks'] += aff
            page_ga4[lp]['sessions'] += s
            page_ga4[lp]['engaged_sessions'] += es
            page_ga4[lp]['aff_clicks'] += aff
            if ch in ('AI', 'Copilot'):
                ai_sources[src]['sessions'] += s
                ai_sources[src]['engaged_sessions'] += es
                ai_sources[src]['aff_clicks'] += aff
                ai_sources[src]['_landings'][lp]['sessions'] += s
                ai_sources[src]['_landings'][lp]['aff_clicks'] += aff
        else:
            chan_prev[ch]['sessions'] += s
            chan_prev[ch]['aff_clicks'] += aff
            page_ga4[lp]['prev_sessions'] += s
            page_ga4[lp]['prev_aff_clicks'] += aff
            if ch in ('AI', 'Copilot'):
                ai_sources[src]['prev_sessions'] += s

    channels = []
    for ch, cur in chan_cur.items():
        prev = chan_prev.get(ch, {'sessions': 0, 'aff_clicks': 0})
        channels.append({
            'channel': ch, 'sessions': cur['sessions'], 'engaged_sessions': cur['engaged_sessions'],
            'aff_clicks': cur['aff_clicks'], 'aff_per_100': per_100(cur['aff_clicks'], cur['sessions']),
            'prev_sessions': prev['sessions'], 'prev_aff_clicks': prev['aff_clicks'],
        })
    channels.sort(key=lambda c: -c['sessions'])

    ai_sources_out = []
    for src, v in sorted(ai_sources.items(), key=lambda kv: -kv[1]['sessions']):
        top_landings = sorted(
            [{'route': lp, 'sessions': lv['sessions'], 'aff_clicks': lv['aff_clicks']} for lp, lv in v['_landings'].items()],
            key=lambda x: -x['sessions'])[:10]
        ai_sources_out.append({
            'source': src, 'is_copilot': bool(COPILOT_RE.search(src)), 'sessions': v['sessions'],
            'engaged_sessions': v['engaged_sessions'], 'aff_clicks': v['aff_clicks'],
            'prev_sessions': v['prev_sessions'], 'top_landings': top_landings,
        })

    # views per route, from R4 page_view rows -- shared by content_groups,
    # pages[].ga4.views, placements carrier_views and content_group_other_routes
    views_by_route = collections.defaultdict(int)
    for r in r4:
        if r.get('eventName') == 'page_view':
            views_by_route[norm_path(r.get('pagePath', '/'))] += r.get('eventCount', 0)

    # ===================================================== content_groups --
    # aff_clicks (and everything else here) is landing-page attribution, the
    # same as sessions/prev_sessions/prev_aff_clicks, so aff_per_100 compares
    # like with like. R4's own affiliate_link_clicked rows are click-page
    # attribution and are kept separately as aff_clicks_on_page.
    cg = collections.defaultdict(lambda: {'views': 0, 'sessions': 0, 'aff_clicks': 0, 'aff_clicks_on_page': 0,
                                           'prev_sessions': 0, 'prev_aff_clicks': 0})
    not_set_cg_views = 0
    total_views = 0
    for r in r4:
        path = norm_path(r.get('pagePath', '/'))
        row = inv_by_route.get(path)
        group = row['content_group'] if row else inventory.content_group(path)
        ev = r.get('eventName')
        cnt = r.get('eventCount', 0)
        if ev == 'page_view':
            cg[group]['views'] += cnt
            total_views += cnt
            if r.get('contentGroup') in (None, '', '(not set)'):
                not_set_cg_views += cnt
        elif ev == 'affiliate_link_clicked':
            cg[group]['aff_clicks_on_page'] += cnt
    for route, g in page_ga4.items():
        row = inv_by_route.get(route)
        grp = row['content_group'] if row else inventory.content_group(route)
        cg[grp]['sessions'] += g['sessions']
        cg[grp]['aff_clicks'] += g['aff_clicks']
        cg[grp]['prev_sessions'] += g['prev_sessions']
        cg[grp]['prev_aff_clicks'] += g['prev_aff_clicks']
    content_groups = []
    for group, v in cg.items():
        content_groups.append({
            'group': group, 'views': v['views'], 'sessions': v['sessions'], 'aff_clicks': v['aff_clicks'],
            'aff_clicks_on_page': v['aff_clicks_on_page'],
            'aff_per_100': per_100(v['aff_clicks'], v['sessions']) if v['sessions'] else None,
            'prev_sessions': v['prev_sessions'], 'prev_aff_clicks': v['prev_aff_clicks'],
        })
    content_groups.sort(key=lambda c: -c['views'])
    not_set_share_content_group = round(not_set_cg_views / total_views, 4) if total_views else None

    # not_found / no_slash_paths from R4 page_view rows -- R4 is split by
    # pageTitle and contentGroup, so the same path can appear in several
    # rows; accumulate by raw path first and emit one row per path.
    not_found_counts = collections.defaultdict(int)
    no_slash_counts = collections.defaultdict(int)
    views_total_for_slash = 0
    no_slash_views = 0
    for r in r4:
        if r.get('eventName') != 'page_view':
            continue
        raw = r.get('pagePath', '')
        cnt = r.get('eventCount', 0)
        views_total_for_slash += cnt
        if raw and not raw.endswith('/') and '?' not in raw:
            no_slash_views += cnt
            no_slash_counts[raw] += cnt
        title = (r.get('pageTitle') or '')
        if '404' in title or 'not found' in title.lower():
            not_found_counts[raw] += cnt
    no_slash_paths = [{'path': p, 'views': v} for p, v in sorted(no_slash_counts.items(), key=lambda kv: -kv[1])]
    not_found = [{'path': p, 'views': v} for p, v in sorted(not_found_counts.items(), key=lambda kv: -kv[1])]
    no_slash_share = round(no_slash_views / views_total_for_slash, 4) if views_total_for_slash else 0.0

    content_group_other_routes = [
        {'route': p['route'], 'views': views_by_route.get(p['route'], 0)}
        for p in inv if p['content_group'] == 'other' and views_by_route.get(p['route'], 0) >= 10
    ]

    # ============================================================ pages --
    gsc_pages = collections.defaultdict(lambda: {'clicks': 0, 'impressions': 0, 'pos_sum': 0.0, 'prev_clicks': 0, 'prev_impressions': 0, 'queries': []})
    for r in cur_g:
        p = gsc_pages[norm_path(r['keys'][0])]
        p['clicks'] += r.get('clicks', 0)
        p['impressions'] += r.get('impressions', 0)
        p['pos_sum'] += r.get('position', 0) * r.get('impressions', 0)
    for r in prev_g:
        p = gsc_pages[norm_path(r['keys'][0])]
        p['prev_clicks'] += r.get('clicks', 0)
        p['prev_impressions'] += r.get('impressions', 0)
    for r in pq:
        gsc_pages[norm_path(r['keys'][0])]['queries'].append(
            {'q': r['keys'][1], 'imp': r.get('impressions', 0), 'clk': r.get('clicks', 0), 'pos': round(r.get('position', 0), 1)})

    from urllib.parse import urlparse, parse_qs

    outbound = collections.defaultdict(lambda: collections.defaultdict(int))
    outbound_urls = collections.defaultdict(lambda: collections.defaultdict(int))
    outbound_url_has_via = {}
    for r in r6:
        path = norm_path(r.get('pagePath', '/'))
        link = r.get('linkUrl', '')
        cnt = r.get('eventCount', 0)
        try:
            parsed = urlparse(link)
            dom = parsed.hostname or link
            clean_url = f'{parsed.scheme}://{parsed.hostname or ""}{parsed.path}'
            has_via = 'via' in parse_qs(parsed.query)
        except Exception:
            dom = link
            clean_url = link
            has_via = False
        outbound[path][dom] += cnt
        outbound_urls[path][clean_url] += cnt
        outbound_url_has_via[clean_url] = outbound_url_has_via.get(clean_url, False) or has_via

    all_routes = set(inv_by_route) | set(page_ga4) | set(gsc_pages)
    pages = []
    for route in sorted(all_routes):
        row = inv_by_route.get(route)
        g = page_ga4.get(route, {'sessions': 0, 'engaged_sessions': 0, 'aff_clicks': 0, 'prev_sessions': 0, 'prev_aff_clicks': 0})
        views = views_by_route.get(route, 0)
        gsc = gsc_pages.get(route)
        pages.append({
            'route': route,
            'file': row['file'] if row else None,
            'kind': row['kind'] if row else None,
            'content_group': row['content_group'] if row else inventory.content_group(route),
            'money_page': row['money_page'] if row else inventory.money_page(route),
            'ga4': {
                'sessions': g['sessions'], 'engaged_sessions': g['engaged_sessions'], 'views': views,
                'aff_clicks': g['aff_clicks'], 'aff_per_100': per_100(g['aff_clicks'], g['sessions']),
                'prev_sessions': g['prev_sessions'], 'prev_aff_clicks': g['prev_aff_clicks'],
            },
            'gsc': {
                'clicks': gsc['clicks'] if gsc else 0, 'impressions': gsc['impressions'] if gsc else 0,
                'ctr': round(gsc['clicks'] / gsc['impressions'], 4) if gsc and gsc['impressions'] else 0.0,
                'position': round(gsc['pos_sum'] / gsc['impressions'], 1) if gsc and gsc['impressions'] else None,
                'prev_clicks': gsc['prev_clicks'] if gsc else 0, 'prev_impressions': gsc['prev_impressions'] if gsc else 0,
            },
            'top_queries': sorted(gsc['queries'], key=lambda q: -q['imp'])[:25] if gsc else [],
            'outbound': dict(outbound.get(route, {})),
            'redirect_to': redirect_map.get(route),
            'orphan': row is None and redirect_map.get(route) is None,
        })

    # ============================================================= leaks --
    rates = [p['ga4']['aff_per_100'] for p in pages if p['ga4']['aff_per_100'] is not None]
    median_rate = statistics.median(rates) if rates else 0.0
    leaks = []
    if ga_ok and gsc_ok:
        for p in pages:
            if p.get('redirect_to'):
                continue
            s = p['ga4']['sessions']
            rate = p['ga4']['aff_per_100']
            if not (s >= MIN_SESSIONS and rate is not None and rate < median_rate / 2):
                continue
            aff_clicks = p['ga4']['aff_clicks']
            leak_doms = {d: c for d, c in p['outbound'].items() if 'scrimba.com' not in d}
            non_scrimba_outbound = sum(leak_doms.values())
            top_leak_domain = max(leak_doms, key=leak_doms.get) if leak_doms else None
            base = {'route': p['route'], 'sessions': s, 'gsc_clicks': p['gsc']['clicks'],
                    'aff_per_100': rate, 'site_median_aff_per_100': round(median_rate, 2),
                    'top_leak_domain': top_leak_domain}
            if non_scrimba_outbound >= 10 and (aff_clicks == 0 or non_scrimba_outbound >= 0.25 * aff_clicks):
                leaks.append({**base, 'reason': 'outbound_leak', 'value': non_scrimba_outbound})
            elif p['gsc']['prev_impressions'] >= 500 and p['gsc']['impressions'] <= 0.7 * p['gsc']['prev_impressions']:
                leaks.append({**base, 'reason': 'falling_impr',
                              'value': p['gsc']['prev_impressions'] - p['gsc']['impressions']})
            elif p['gsc']['impressions'] >= 200 and p['gsc']['position'] is not None and 8 <= p['gsc']['position'] <= 20:
                leaks.append({**base, 'reason': 'striking_distance', 'value': p['gsc']['position']})
            else:
                leaks.append({**base, 'reason': 'low_aff_rate', 'value': round(median_rate - rate, 2)})

    # ============================================================== gaps --
    # A query's best-ranking URL in GSC's 90-day window can be a route that
    # was since redirected away; attribute it to the redirect's live target
    # and flag via_redirect so the reader knows the ranking isn't the live
    # page's own yet.
    best = {}
    for r in pq:
        raw_page = norm_path(r['keys'][0])
        via_redirect = raw_page in redirect_map
        page = redirect_map.get(raw_page, raw_page)
        q, pos, imp = r['keys'][1], r.get('position', 999), r.get('impressions', 0)
        if q not in best or pos < best[q]['pos']:
            best[q] = {'page': page, 'pos': round(pos, 1), 'imp': imp, 'via_redirect': via_redirect}
    tot = {r['keys'][0]: r.get('impressions', 0) for r in queries_g}
    gaps = sorted(
        ({'q': q, 'impressions': tot.get(q, v['imp']), 'best_route': v['page'], 'best_position': v['pos'],
          'via_redirect': v['via_redirect']}
         for q, v in best.items() if v['pos'] > 10 and tot.get(q, 0) >= 20),
        key=lambda g: -g['impressions'])[:300]

    # ===================================================== cannibalization --
    q_routes = collections.defaultdict(lambda: collections.defaultdict(lambda: {'imp': 0, 'pos_sum': 0.0}))
    for r in pq:
        route = norm_path(r['keys'][0])
        q = r['keys'][1]
        q_routes[q][route]['imp'] += r.get('impressions', 0)
        q_routes[q][route]['pos_sum'] += r.get('position', 0) * r.get('impressions', 0)
    cannibalization = []
    redirect_lag = []
    for q, routes in q_routes.items():
        total_imp = sum(v['imp'] for v in routes.values())
        if total_imp < 50:
            continue
        shares = [(r, v['imp'] / total_imp, round(v['pos_sum'] / v['imp'], 1) if v['imp'] else None) for r, v in routes.items()]
        qualifying = [s for s in shares if s[1] >= 0.15]
        if len(qualifying) >= 2 and any(s[2] is not None and s[2] <= 20 for s in qualifying):
            # A route that only "cannibalizes" its own redirect target, or a
            # redirect source and target both qualifying for the same query,
            # is not two pages competing: it's a merge that hasn't rolled off
            # GSC's 90-day window yet. Report those separately as lag, not as
            # cannibalization the reader needs to act on.
            targets = {redirect_map.get(r, r) for r, _sh, _p in qualifying}
            if len(targets) <= 1:
                redirect_lag.append({
                    'q': q, 'impressions': total_imp,
                    'routes': [{'route': r, 'share': round(sh, 3), 'pos': p} for r, sh, p in sorted(qualifying, key=lambda x: -x[1])],
                })
                continue
            cannibalization.append({
                'q': q, 'impressions': total_imp,
                'routes': [{'route': r, 'share': round(sh, 3), 'pos': p} for r, sh, p in sorted(qualifying, key=lambda x: -x[1])],
            })
    cannibalization.sort(key=lambda c: -c['impressions'])
    redirect_lag.sort(key=lambda c: -c['impressions'])

    # ========================================================= placements --
    placements = []
    destinations = collections.defaultdict(int)
    for r in r5:
        clicks = r.get('eventCount', 0)
        dt_ = r.get('customEvent:destination_type', '')
        slug = r.get('customEvent:destination_slug', '')
        p_route = norm_path(r.get('pagePath', '/'))
        cv = views_by_route.get(p_route, 0)
        placements.append({
            'route': p_route, 'cta_type': r.get('customEvent:cta_type', ''),
            'cta_location': r.get('customEvent:cta_location', ''), 'destination_type': dt_,
            'clicks': clicks, 'carrier_views': cv,
            'per_1000_views': round(1000 * clicks / cv, 2) if cv >= 30 else None,
        })
        if dt_ and not _unset(dt_):
            destinations[(dt_, slug)] += clicks
    destinations_out = [{'destination_type': k[0], 'destination_slug': k[1], 'clicks': v} for k, v in destinations.items()]
    destinations_out.sort(key=lambda d: -d['clicks'])

    not_set_share = {
        'content_group': not_set_share_content_group,
        'cta_type': None, 'cta_location': None, 'destination_type': None,
    }
    if placements:
        for field, key in (('cta_type', 'cta_type'), ('cta_location', 'cta_location'), ('destination_type', 'destination_type')):
            total = sum(p['clicks'] for p in placements)
            missing = sum(p['clicks'] for p in placements if _unset(p.get(key)))
            not_set_share[field] = round(missing / total, 4) if total else None

    # ======================================================= search/advisor --
    search_terms = []
    advisor = {'starts': 0, 'completes': 0, 'scrimba_clicks': 0, 'guide_clicks': 0, 'by_step': {}, 'by_path': {}, 'steps_unset': 0}
    for r in r7:
        ev = r.get('eventName')
        cnt = r.get('eventCount', 0)
        if ev == 'search':
            search_terms.append({'term': r.get('searchTerm', ''), 'count': cnt,
                                 'outcome': r.get('customEvent:search_outcome', ''), 'ui': r.get('customEvent:search_ui', '')})
        elif ev == 'path_advisor_start':
            advisor['starts'] += cnt
        elif ev == 'path_advisor_complete':
            advisor['completes'] += cnt
            path_ = r.get('customEvent:recommended_path', '')
            if not _unset(path_):
                advisor['by_path'][path_] = advisor['by_path'].get(path_, 0) + cnt
        elif ev == 'path_advisor_scrimba_click':
            advisor['scrimba_clicks'] += cnt
        elif ev == 'path_advisor_guide_click':
            advisor['guide_clicks'] += cnt
        elif ev == 'path_advisor_step':
            step = r.get('customEvent:advisor_step', '')
            if _unset(step):
                advisor['steps_unset'] += cnt
                continue
            advisor['by_step'][step] = advisor['by_step'].get(step, 0) + cnt
    search_terms.sort(key=lambda s: -s['count'])

    # ============================================================= health --
    non_site_hosts = [{'host': r.get('hostName', ''), 'views': r.get('screenPageViews', 0)} for r in r8 if r.get('hostName') != HOST]

    explain_clicks = 0
    untracked_urls = []
    for path_, urls in outbound_urls.items():
        for u, c in urls.items():
            host = urlparse(u).hostname or ''
            upath = urlparse(u).path or '/'
            is_scrimba = host == 'scrimba.com' or host.endswith('.scrimba.com')
            is_explain = upath == '/explain' or upath.startswith('/explain/')
            if is_scrimba and is_explain:
                explain_clicks += c
                untracked_urls.append({'page': path_, 'url': u, 'clicks': c, 'expected': True})
            elif is_scrimba and not is_explain and not outbound_url_has_via.get(u, False):
                untracked_urls.append({'page': path_, 'url': u, 'clicks': c, 'expected': False})

    em_clicks_scrimba = sum(c for path_, doms in outbound.items() for dom, c in doms.items() if 'scrimba.com' in dom)
    em_clicks_scrimba -= explain_clicks
    if site['cur']['aff_scrimba'] is not None:
        aff_clicks_scrimba = site['cur']['aff_scrimba']
    elif 'customEvent:destination_type' not in missing_dims:
        aff_clicks_scrimba = aff_scrimba_total
    else:
        aff_clicks_scrimba = None
    ratio = round(em_clicks_scrimba / aff_clicks_scrimba, 3) if aff_clicks_scrimba else None
    pre_step5_udemy_em = None
    if not step5_available:
        pre_step5_udemy_em = sum(c for path_, doms in outbound.items() for dom, c in doms.items() if 'udemy.com' in dom)
    if not ga_ok:
        em_clicks_scrimba = aff_clicks_scrimba = ratio = explain_clicks = None
        untracked_urls = None
        pre_step5_udemy_em = None

    COVERAGE_KEY_MAP = {
        'Submitted and indexed': 'indexed',
        'Crawled - currently not indexed': 'crawled_not_indexed',
        'Discovered - currently not indexed': 'discovered',
        'URL is unknown to Google': 'unknown',
    }

    def _read_pending_recheck(inspect_date, cur_inspect_urls):
        """secrets/indexing-log.tsv: tab-separated date, url, status, no header.
        Keeps 200-status rows, one newest submission date per URL, and lists
        URLs submitted after the inspect snapshot or missing from it."""
        log_path = os.path.join(ROOT, 'secrets', 'indexing-log.tsv')
        if not os.path.exists(log_path):
            return []
        newest = {}
        with open(log_path) as f:
            for line in f:
                parts = line.rstrip('\n').split('\t')
                if len(parts) < 3:
                    continue
                d, u, status = parts[0], parts[1], parts[2]
                if status != '200':
                    continue
                if u not in newest or d > newest[u]:
                    newest[u] = d
        if inspect_date is None:
            return sorted(newest)
        return sorted(u for u, d in newest.items() if d > inspect_date or u not in cur_inspect_urls)

    index_health = None
    if inspect_new:
        try:
            cur_inspect = json.load(open(inspect_new))
            counts = collections.Counter()
            verdict_by_url = {}
            for row in cur_inspect:
                v = row.get('coverage') or row.get('verdict') or 'unknown'
                counts[v] += 1
                verdict_by_url[row.get('url')] = v
            money_routes = {p['route'] for p in inv if p['money_page']}
            money_not_indexed = [u for u, v in verdict_by_url.items() if v != 'Submitted and indexed'
                                  and any(u.rstrip('/').endswith(mr.rstrip('/')) for mr in money_routes)]
            changed = []
            if inspect_prev:
                prev_inspect = json.load(open(inspect_prev))
                # Older inspect files may use a positional [url, coverage, date]
                # shape instead of the current {url, verdict, coverage, ...}
                # dict shape; skip the diff rather than guess at a bad row.
                if prev_inspect and isinstance(prev_inspect[0], dict):
                    prev_by_url = {row.get('url'): (row.get('coverage') or row.get('verdict')) for row in prev_inspect}
                    for u, v in verdict_by_url.items():
                        if u in prev_by_url and prev_by_url[u] != v:
                            changed.append({'url': u, 'from': prev_by_url[u], 'to': v})
            normalized_counts = collections.Counter()
            for raw, n in counts.items():
                normalized_counts[COVERAGE_KEY_MAP.get(raw, 'error')] += n
            as_of = os.path.basename(inspect_new)[8:18]
            index_health = {
                'as_of': as_of, 'counts': dict(normalized_counts),
                'changed': changed, 'money_not_indexed': money_not_indexed,
                'pending_recheck': _read_pending_recheck(as_of, set(verdict_by_url)),
            }
        except Exception as e:
            errors.append({'section': 'index_health', 'error': str(e)})
    else:
        try:
            pending = _read_pending_recheck(None, set())
            if pending:
                index_health = {'as_of': None, 'counts': {}, 'changed': [], 'money_not_indexed': [], 'pending_recheck': pending}
        except Exception as e:
            errors.append({'section': 'index_health', 'error': str(e)})

    unannotated_merges = []
    try:
        last_annotation_date = max((a.get('date', '') for a in annotations if not a.get('system')), default=None)
        if last_annotation_date:
            since = gapi.la_midnight_iso(last_annotation_date)
            cands = ga4admin.candidates(since=since, annotations=annotations)
            cov_prs, cov_shas = ga4admin.covered_sets(annotations, ga4admin._load_log())
            cands = ga4admin.filter_uncovered_candidates(cands, cov_prs, cov_shas)
            entries = ga4admin._group_candidates(cands)
            rows = ga4admin.plan(entries, existing=annotations)
            unannotated_merges = [r for r in rows if r['action'] in ('create', 'conflict', 'partial')]
    except Exception as e:
        errors.append({'section': 'unannotated_merges', 'error': str(e)})

    dims_registered = [d['parameter'] for d in T['custom_dimensions'] if f"customEvent:{d['parameter']}" in registered_event_dims]
    dims_missing = [d['parameter'] for d in T['custom_dimensions'] if f"customEvent:{d['parameter']}" not in registered_event_dims]

    health = {
        'non_site_hosts': non_site_hosts,
        'unattributed_sessions': unattributed_sessions,
        'no_slash_paths': no_slash_paths, 'no_slash_share': no_slash_share,
        'not_set_share': not_set_share,
        'not_found': not_found,
        'zero_click_days': zero_click_days, 'last_affiliate_click': last_aff,
        'reconciliation': {
            'em_clicks_scrimba': em_clicks_scrimba, 'aff_clicks_scrimba': aff_clicks_scrimba, 'ratio': ratio,
            'explain_clicks': explain_clicks, 'untracked_urls': untracked_urls, 'pre_step5_udemy_em_clicks': pre_step5_udemy_em,
        },
        'content_group_other_routes': content_group_other_routes,
        'dimensions': {'registered': dims_registered, 'missing': dims_missing},
        'sitemaps': [{'path': s.get('path'), 'last_downloaded': s.get('lastDownloaded'),
                      'errors': int(s.get('errors', 0)), 'warnings': int(s.get('warnings', 0))} for s in sitemaps],
        'index': index_health,
        'unannotated_merges': unannotated_merges,
    }

    # ============================================================ affiliate --
    def build_affiliate_side(readings, money_flag, require_cumulative=False):
        if not readings:
            return None
        last = readings[-1]
        if 'error' in last:
            return {'status': 'error', 'error': last.get('error'),
                    'raw_excerpt': last.get('raw') if money_flag else None}
        if 'as_of' not in last or (require_cumulative and 'cumulative' not in last):
            return {'status': 'error', 'error': 'missing as_of/cumulative'}
        stale = is_stale(last.get('as_of', ''))
        prev = readings[-2] if len(readings) > 1 else None
        out = strip_money(last, money_flag)
        out['status'] = 'stale' if stale else 'ok'
        out['prev_as_of'] = prev.get('as_of') if prev else None
        if prev and 'cumulative' in out and 'cumulative' in prev:
            out['delta'] = {k: (out['cumulative'].get(k) or 0) - (prev.get('cumulative', {}).get(k) or 0)
                            for k in ('visitors', 'signups', 'subscribers') if k in out['cumulative']}
        else:
            out['delta'] = {}
        lh = last.get('terms_sha256')
        ph = prev.get('terms_sha256') if prev else None
        out['terms_changed'] = (lh != ph) if (lh and ph) else None
        return out

    money_flag = getattr(args, 'money', False)
    affiliate_scrimba = build_affiliate_side(scrimba_readings, money_flag, require_cumulative=True)
    affiliate_udemy = build_affiliate_side(impact_readings, money_flag)

    for key, side in (('scrimba_affiliate', affiliate_scrimba), ('udemy_impact', affiliate_udemy)):
        if side:
            snap['sources'][key] = {'status': side.get('status', 'error'), 'as_of': side.get('as_of')}
            if side.get('status') == 'error':
                snap['sources'][key]['error'] = side.get('error')

    def _r9_non_udemy_sum(start_date, end_date):
        """Sums R9 eventCount for dates in [start_date, end_date), excluding
        destination_type=='udemy'. Returns (total, dates_covered)."""
        total = 0
        dates_seen = set()
        for row in r9:
            d = _ga4_date_to_iso(row.get('date', ''))
            if not d or not (start_date <= d < end_date):
                continue
            dates_seen.add(d)
            if row.get('customEvent:destination_type') != 'udemy':
                total += row.get('eventCount', 0)
        return total, dates_seen

    def _r9_udemy_sum(start_date, end_date):
        total = 0
        for row in r9:
            d = _ga4_date_to_iso(row.get('date', ''))
            if d and start_date <= d < end_date and row.get('customEvent:destination_type') == 'udemy':
                total += row.get('eventCount', 0)
        return total

    recon_scrimba = {'days': None, 'ga4_aff_scrimba': None, 'visitors_delta': None, 'ratio': None, 'skipped_reason': None}
    if ga_ok and affiliate_scrimba and affiliate_scrimba.get('delta', {}).get('visitors') is not None:
        prev_as_of, as_of = affiliate_scrimba.get('prev_as_of'), affiliate_scrimba.get('as_of')
        if prev_as_of and as_of:
            prev_date = gapi.la_date(prev_as_of) if 'T' in prev_as_of else prev_as_of
            cur_date = gapi.la_date(as_of) if 'T' in as_of else as_of
            if not (step5_date and prev_date >= step5_date and prev_date < cur_date):
                recon_scrimba['skipped_reason'] = 'pre_step5'
            elif not (windows['ga4']['start'] <= prev_date
                      and cur_date <= (date.fromisoformat(windows['ga4']['end']) + timedelta(days=1)).isoformat()):
                # R9 (like R2/daily) only covers the GA4 window; a reading
                # interval outside it can't be proven covered even though
                # every day in it had zero affiliate clicks (no R9 row).
                recon_scrimba['skipped_reason'] = 'outside_ga4_window'
            else:
                total, _dates_seen = _r9_non_udemy_sum(prev_date, cur_date)
                expected_days = (date.fromisoformat(cur_date) - date.fromisoformat(prev_date)).days
                vd = affiliate_scrimba['delta']['visitors']
                recon_scrimba['days'] = expected_days
                recon_scrimba['ga4_aff_scrimba'] = total
                recon_scrimba['visitors_delta'] = vd
                recon_scrimba['ratio'] = round(vd / total, 3) if total else None
        else:
            recon_scrimba['skipped_reason'] = 'no_prev_reading'
    elif ga_ok and affiliate_scrimba:
        recon_scrimba['skipped_reason'] = 'no_prev_reading'

    udemy_epoch_date = next((e['date'] for e in T['epochs'] if e['key'] == 'udemy_affiliate'), None) or step5_date

    recon_udemy = {'ga4_aff_udemy': None, 'impact_clicks': None, 'ratio': None, 'days': None, 'reason': None}
    if ga_ok and affiliate_udemy and 'clicks' in affiliate_udemy:
        # impact.jsonl's contract (spec 1.5) stores the window as
        # {start, end}; window_start/window_end is kept as a fallback for
        # older readings. The end is inclusive.
        w = affiliate_udemy.get('window') or {}
        w_start = w.get('start') or affiliate_udemy.get('window_start')
        w_end = w.get('end') or affiliate_udemy.get('window_end')
        if w_start and w_end:
            w_end_exclusive = (date.fromisoformat(w_end) + timedelta(days=1)).isoformat()
            if udemy_epoch_date and w_start < udemy_epoch_date:
                recon_udemy['reason'] = 'window_before_udemy_epoch'
                epoch_warnings.append({'key': 'udemy_affiliate', 'window': 'udemy_recon',
                                        'text': f"Impact window starts {w_start}, before udemy_affiliate ({udemy_epoch_date}); GA4 undercounts pre-migration Udemy clicks"})
            elif w_start < windows['ga4']['start'] or w_end > windows['ga4']['end']:
                recon_udemy['reason'] = 'window_outside_ga4_range'
                epoch_warnings.append({'key': 'udemy_affiliate', 'window': 'udemy_recon',
                                        'text': f"Impact window {w_start}..{w_end} falls outside the GA4 window {windows['ga4']['start']}..{windows['ga4']['end']}; ratio unavailable"})
            else:
                # The window is fully inside [ga4.start, ga4.end] and on or
                # after the udemy_affiliate epoch, so R9's coverage of it is
                # complete (R9 is pulled over the same GA4 window as R2/daily);
                # a day with no row is a real zero, not a gap.
                total_udemy = _r9_udemy_sum(w_start, w_end_exclusive)
                recon_udemy['days'] = (date.fromisoformat(w_end) - date.fromisoformat(w_start)).days + 1
                recon_udemy['ga4_aff_udemy'] = total_udemy
                recon_udemy['impact_clicks'] = affiliate_udemy['clicks']
                recon_udemy['ratio'] = round(affiliate_udemy['clicks'] / total_udemy, 3) if total_udemy else None

    affiliate = {
        'scrimba_affiliate': affiliate_scrimba, 'udemy_impact': affiliate_udemy,
        'reconciliation': {'scrimba': recon_scrimba, 'udemy': recon_udemy, 'landing_join': None},
    }

    # Every internal computation above (leaks, medians, reconciliation) reads
    # the fully-populated per-page ga4/gsc dicts; only the exported pages
    # list is nulled out for whichever source failed.
    if not ga_ok:
        for p in pages:
            p['ga4'] = None
    if not gsc_ok:
        for p in pages:
            p['gsc'] = None

    snap.update({
        'epochs': T['epochs'], 'epoch_warnings': epoch_warnings,
        'site': site if ga_ok else None,
        'daily': daily if ga_ok else None,
        'channels': channels if ga_ok else None,
        'ai_sources': ai_sources_out if ga_ok else None,
        'content_groups': content_groups if ga_ok else None,
        'pages': pages,
        'gaps': gaps if gsc_ok else None,
        'cannibalization': cannibalization if gsc_ok else None,
        'redirect_lag': redirect_lag if gsc_ok else None,
        'placements': placements if ga_ok else None,
        'destinations': destinations_out if ga_ok else None,
        'leaks': leaks if (ga_ok and gsc_ok) else None,
        'search_terms': search_terms if ga_ok else None,
        'advisor': advisor if ga_ok else None,
        'health': health, 'affiliate': affiliate, 'errors': errors,
    })
    return snap, True


def render_summary(snap):
    lines = []
    lines.append(f"# scrimbaguide.tech snapshot — generated {snap.get('generated_at')}")
    lines.append('')
    lines.append('## Source status')
    for name, s in snap.get('sources', {}).items():
        lines.append(f"{name}: {s.get('status')}" + (f" ({s.get('error')})" if s.get('error') else ''))
    if snap.get('epoch_warnings'):
        lines.append('')
        lines.append('## Epoch warnings')
        for w in snap['epoch_warnings']:
            lines.append(f"- {w['key']} ({w.get('window')}): {w['text']}")
    def section(title, key, render_rows, limit=None):
        lines.append('')
        lines.append(f'## {title}')
        rows = snap.get(key)
        if rows is None:
            lines.append('unavailable (source error)')
            return
        for row in (rows[:limit] if limit else rows):
            lines.append(render_rows(row))

    section('Destinations', 'destinations', lambda d: f"{d['destination_type']} {d['destination_slug']} | {d['clicks']}", 20)
    section('Cannibalization', 'cannibalization', lambda c: f"{c['q']} | {c['impressions']} | {', '.join(r['route'] for r in c['routes'])}", 20)

    lines.append('')
    lines.append('## Search terms with no results')
    search_terms = snap.get('search_terms')
    if search_terms is None:
        lines.append('unavailable (source error)')
    else:
        for s in search_terms:
            if s.get('outcome') == 'no-results':
                lines.append(f"{s['term']} | {s['count']}")

    lines.append('')
    recon = snap.get('affiliate', {}).get('reconciliation', {})
    lines.append(f"## Affiliate ratios: scrimba {recon.get('scrimba', {}).get('ratio')} | udemy {recon.get('udemy', {}).get('ratio')}")

    pages = snap.get('pages')
    lines.append('')
    lines.append('## Top pages (route | sessions | aff_clicks | aff_per_100)')
    if pages is None:
        lines.append('unavailable (source error)')
    else:
        for p in sorted(pages, key=lambda p: -((p['ga4'] or {}).get('sessions', 0) if p['ga4'] else 0))[:60]:
            if not p['ga4']:
                continue
            lines.append(f"{p['route']} | {p['ga4']['sessions']} | {p['ga4']['aff_clicks']} | {p['ga4']['aff_per_100']}")

    lines.append('')
    lines.append('## Conversion (>= 30 sessions)')
    if pages is None:
        lines.append('unavailable (source error)')
    else:
        for p in sorted(pages, key=lambda p: -((p['ga4'] or {}).get('aff_per_100') or 0 if p['ga4'] else 0)):
            if p['ga4'] and p['ga4']['sessions'] >= MIN_SESSIONS:
                lines.append(f"{p['route']} | {p['ga4']['aff_per_100']} | {p['ga4']['sessions']} | {p['ga4']['aff_clicks']}")

    section('Leaks', 'leaks', lambda l: f"{l['route']} | {l['reason']} | {l['value']}")
    section('Placements', 'placements', lambda p: f"{p['route']} | {p['cta_type']} | {p['cta_location']} | {p['clicks']}", 40)

    lines.append('')
    lines.append('## Catalog')
    lines.append(f"{snap.get('sources', {}).get('inventory', {}).get('pages', 0)} pages in inventory")

    section('Gaps', 'gaps', lambda g: f"{g['q']} | {g['impressions']} | {g['best_route']} | {g['best_position']}", 120)

    text = '\n'.join(lines) + '\n'
    gapi.atomic_write_json  # noqa (keep import used)
    os.makedirs(os.path.dirname(SUMMARY_PATH), exist_ok=True)
    with open(SUMMARY_PATH, 'w') as f:
        f.write(text)
    return text


def _git_sha():
    try:
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT).decode().strip()
    except Exception:
        return None


def _fresh_enough(max_age_hours, args):
    if max_age_hours is None or not os.path.exists(SNAPSHOT_PATH):
        return False
    try:
        prev = json.load(open(SNAPSHOT_PATH))
    except Exception:
        return False
    if prev.get('args', {}).get('days') != args.days or prev.get('args', {}).get('gsc_days') != args.gsc_days:
        return False
    if prev.get('args', {}).get('money', False) != bool(getattr(args, 'money', False)):
        return False
    gen = prev.get('generated_at')
    if not gen:
        return False
    try:
        gen_dt = datetime.fromisoformat(gen.replace('Z', '+00:00'))
    except Exception:
        return False
    from datetime import timezone
    age_hours = (datetime.now(timezone.utc) - gen_dt).total_seconds() / 3600
    return age_hours < max_age_hours


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=28)
    ap.add_argument('--gsc-days', type=int, default=90)
    ap.add_argument('--max-age', type=float, default=None)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--no-history', action='store_true')
    ap.add_argument('--money', action='store_true')
    args = ap.parse_args(argv)

    if _fresh_enough(args.max_age, args):
        print('snapshot fresh enough, skipping pull')
        return 0

    gapi.ensure_dirs()
    snap = {
        'schema_version': 1,
        'generated_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'generated_by': 'scripts/analytics/snapshot.py',
        'git_sha': _git_sha(),
        'args': {'days': args.days, 'gsc_days': args.gsc_days, 'money': bool(args.money)},
        'property': gapi.PROPERTY, 'gsc_site': gapi.GSC_SITE, 'timezone': T['timezone'],
    }
    snap, ok = _run_sources(args, snap)
    if not ok:
        print('both GA4 and GSC failed; leaving previous snapshot untouched', file=sys.stderr)
        for e in snap.get('errors', []):
            print(e, file=sys.stderr)
        return 2

    if args.dry_run:
        print(json.dumps(snap, indent=1, default=str))
        return 0

    gapi.atomic_write_json(SNAPSHOT_PATH, snap)
    if not args.no_history:
        os.makedirs(HISTORY_DIR, exist_ok=True)
        hist_path = os.path.join(HISTORY_DIR, f"analytics-snapshot-{gapi.la_today()}.json")
        gapi.atomic_write_json(hist_path, snap)
        history_files = sorted(glob.glob(os.path.join(HISTORY_DIR, 'analytics-snapshot-*.json')))
        for old in history_files[:-26]:
            os.remove(old)
    render_summary(snap)
    print(f"snapshot: sources={ {k: v.get('status') for k, v in snap['sources'].items()} }")
    site = snap.get('site')
    print(f"site.cur.sessions={site['cur']['sessions'] if site else 'unavailable (ga4 error)'}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
