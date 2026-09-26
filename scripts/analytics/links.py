#!/usr/bin/env python3
"""Link auditor: --outbound (affiliate/competitor links out to Scrimba and
Udemy) and --internal (relatedGuidesMap.ts and redirect targets against the
content inventory). stdlib urllib only, no third-party HTTP dependency.

Prints [{kind, file, url, status, final_url, issue}] as JSON.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gapi  # noqa: E402
import inventory  # noqa: E402

ROOT = gapi.ROOT
SCAN_DIRS = ['docs', 'blog', 'src/pages']
ALLOWED_HOSTS = {'scrimba.com', 'docs.scrimba.com', 'trk.udemy.com'}
USER_AGENT = 'scrimbaguide-links/1.0 (+https://scrimbaguide.tech)'
UDEMY_MAX_HOPS = 5

AFFILIATE_LINK_RE = re.compile(r"<AffiliateLink\b[^>]*?href=['\"](https?://[^'\"]+)['\"]", re.S)
COMPETITOR_URL_RE = re.compile(r"competitorUrl=['\"](https?://[^'\"]+)['\"]")


def _scan_files():
    out = []
    for d in SCAN_DIRS:
        base = os.path.join(ROOT, d)
        if not os.path.isdir(base):
            continue
        out += glob.glob(os.path.join(base, '**', '*.md*'), recursive=True)
        out += glob.glob(os.path.join(base, '**', '*.tsx'), recursive=True)
    return sorted(set(out))


def extract_outbound_links(files=None):
    """{host+path: {url, files:[...]}} for every <AffiliateLink href=...>
    and competitorUrl=... whose host is in ALLOWED_HOSTS. Deduped on the URL
    with its query string dropped."""
    files = files if files is not None else _scan_files()
    seen = {}
    for fpath in files:
        try:
            with open(fpath, encoding='utf-8') as f:
                text = f.read()
        except OSError:
            continue
        rel = os.path.relpath(fpath, ROOT) if fpath.startswith(ROOT + os.sep) else fpath
        for pattern in (AFFILIATE_LINK_RE, COMPETITOR_URL_RE):
            for m in pattern.finditer(text):
                _add_link(seen, rel, m.group(1))
    return seen


def _add_link(seen, rel, url):
    parts = urlsplit(url)
    if parts.netloc not in ALLOWED_HOSTS:
        return
    bare = f'{parts.scheme}://{parts.netloc}{parts.path}'
    key = parts.netloc + parts.path
    entry = seen.setdefault(key, {'url': bare, 'files': []})
    if rel not in entry['files']:
        entry['files'].append(rel)


class _NoRedirect(HTTPRedirectHandler):
    """Blocks automatic redirect following so each hop of a trk.udemy.com
    chain can be inspected: a normal opener follows redirects transparently
    and lands on www.udemy.com, which 403s to scripted clients before the
    home/search landing check ever runs."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_UDEMY_OPENER = build_opener(_NoRedirect)


def _extract_u_param(url):
    """Pulls the URL-decoded `u=` destination off an impact.com redirect
    URL, or None if there isn't one."""
    vals = parse_qs(urlsplit(url).query).get('u')
    return vals[0] if vals else None


def _resolve_udemy(url, opener=urlopen):
    """Follows a trk.udemy.com redirect chain hop by hop with a
    non-redirecting opener, up to UDEMY_MAX_HOPS. Never fetches
    www.udemy.com directly (it 403s to scripted clients); when a hop would
    land there, or a hop returns a non-redirect error, the destination is
    read off the `u=` param of the impact.com URL that led there instead.

    Returns (status, final_url, blocked): `blocked` is True when the
    landing page itself was never fetched, only inferred from `u=`.
    """
    call = _UDEMY_OPENER.open if opener is urlopen else opener
    current = url
    for _ in range(UDEMY_MAX_HOPS):
        req = Request(current, method='HEAD', headers={'User-Agent': USER_AGENT})
        try:
            with call(req, timeout=15) as resp:
                status = getattr(resp, 'status', None) or resp.getcode()
                final_url = resp.geturl() if hasattr(resp, 'geturl') else current
                return status, final_url, False
        except HTTPError as e:
            loc = e.headers.get('Location') if getattr(e, 'headers', None) else None
            if e.code in (301, 302, 303, 307, 308) and loc:
                loc_abs = urljoin(current, loc)
                if urlsplit(loc_abs).netloc == 'www.udemy.com':
                    dest = _extract_u_param(loc_abs) or _extract_u_param(current)
                    return None, dest or loc_abs, True
                current = loc_abs
                continue
            # Terminal, non-redirect status (typically 403 from Udemy
            # blocking a scripted client). Fall back to `u=` on the URL
            # that led here, if it has one.
            dest = _extract_u_param(current)
            if dest:
                return None, dest, True
            return e.code, current, False
        except URLError:
            return None, current, False
    return None, current, False


def _head_or_get(url, opener=urlopen, throttle=None):
    """Tries HEAD, falls back to GET. Returns (status, final_url, blocked).
    trk.udemy.com is resolved hop by hop instead (see `_resolve_udemy`)."""
    host = urlsplit(url).netloc
    if host == 'trk.udemy.com':
        if throttle:
            throttle(host)
        return _resolve_udemy(url, opener=opener)
    for method in ('HEAD', 'GET'):
        if throttle:
            throttle(host)
        try:
            req = Request(url, method=method, headers={'User-Agent': USER_AGENT})
            with opener(req, timeout=15) as resp:
                status = getattr(resp, 'status', None) or resp.getcode()
                final_url = resp.geturl() if hasattr(resp, 'geturl') else url
                return status, final_url, False
        except HTTPError as e:
            if method == 'HEAD':
                continue
            final_url = e.geturl() if hasattr(e, 'geturl') else url
            return e.code, final_url, False
        except URLError:
            if method == 'HEAD':
                continue
            return None, None, False
    return None, None, False


def _make_throttle(sleep=time.sleep):
    """Returns a callable(host) that waits so at least 1 second passes
    between requests to the same host. Called before every attempt
    (including a HEAD->GET fallback and each manual redirect hop), not just
    once per link."""
    last_request_at = {}

    def throttle(host):
        prev = last_request_at.get(host)
        if prev is not None:
            elapsed = time.monotonic() - prev
            if elapsed < 1:
                sleep(1 - elapsed)
        last_request_at[host] = time.monotonic()

    return throttle


def check_outbound(limit=None, sleep=time.sleep, opener=urlopen):
    links = extract_outbound_links()
    items = sorted(links.items())
    if limit:
        items = items[:limit]

    out = []
    throttle = _make_throttle(sleep=sleep)
    for _, info in items:
        url = info['url']
        if '/explain' in url:
            continue
        host = urlsplit(url).netloc

        status, final_url, blocked = _head_or_get(url, opener=opener, throttle=throttle)
        issue = _outbound_issue(url, host, status, final_url, blocked)
        for f in info['files']:
            out.append({'kind': 'outbound', 'file': f, 'url': url, 'status': status, 'final_url': final_url, 'issue': issue})
    return out


def _outbound_issue(url, host, status, final_url, blocked=False):
    if host == 'trk.udemy.com' and final_url:
        final_path = urlsplit(final_url).path.strip('/').lower()
        if final_path in ('', 'search') or 'search' in final_path.split('/'):
            return 'lands on the Udemy home or search page'
    if blocked:
        return 'unverifiable'
    if status is None or not (200 <= status < 400):
        return f'bad status {status}'
    if host == 'scrimba.com' and final_url:
        orig_slug = urlsplit(url).path.strip('/')
        final_slug = urlsplit(final_url).path.strip('/')
        if orig_slug and final_slug and orig_slug != final_slug:
            return f'renamed: {orig_slug} -> {final_slug}'
    return None


# Only `href: '/...'` values are real links a reader can click; the map's
# keys are deliberately slashless (resolveRelatedGuides strips the trailing
# slash before lookup) and other quoted '/...' strings in the file are
# `includes()`/`startsWith()` literals, not routes, so neither is scanned by
# the general route pattern below.
_HREF_RE = re.compile(r"""href:\s*['"](/[^'"]*)['"]""")
_KEY_RE = re.compile(r"""^\s*['"](/[^'"]*)['"]\s*:\s*\[""", re.M)
_KNOWN_ROUTES = {'/blog/'}


def check_internal():
    """relatedGuidesMap.ts keys/hrefs and redirect `to` targets against the
    inventory routes: missing trailing slashes and routes that don't exist."""
    inv = inventory.inventory()
    routes = {p['route'] for p in inv}
    out = []

    rg_path = os.path.join(ROOT, 'src', 'content', 'relatedGuidesMap.ts')
    if os.path.exists(rg_path):
        with open(rg_path, encoding='utf-8') as f:
            text = f.read()
        rel = os.path.relpath(rg_path, ROOT)
        for m in _HREF_RE.finditer(text):
            path = m.group(1)
            issue = _route_issue(path, routes)
            if issue:
                out.append({'kind': 'internal', 'file': rel, 'url': path, 'status': None, 'final_url': None, 'issue': issue})
        for m in _KEY_RE.finditer(text):
            path = m.group(1)
            issue = _route_issue(path, routes, require_slash=False)
            if issue:
                out.append({'kind': 'internal', 'file': rel, 'url': path, 'status': None, 'final_url': None, 'issue': issue})

    for r in inventory.redirect_sources():
        to = r.get('to')
        if not to or not to.startswith('/'):
            continue
        issue = _route_issue(to, routes)
        if issue:
            out.append({'kind': 'internal', 'file': 'redirects', 'url': to, 'status': None, 'final_url': None, 'issue': issue})

    return out


def _route_issue(path, routes, require_slash=True):
    if require_slash and not path.endswith('/'):
        return 'missing trailing slash'
    checked = path if path.endswith('/') else path + '/'
    if checked not in routes and checked not in _KNOWN_ROUTES:
        return 'route not in inventory'
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(prog='links.py')
    ap.add_argument('--outbound', action='store_true')
    ap.add_argument('--internal', action='store_true')
    ap.add_argument('--limit', type=int, default=None, help='cap the number of outbound links checked (network calls)')
    args = ap.parse_args(argv)

    if not args.outbound and not args.internal:
        ap.error('pass --outbound and/or --internal')

    out = []
    if args.outbound:
        out += check_outbound(limit=args.limit)
    if args.internal:
        out += check_internal()

    print(json.dumps(out, indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
