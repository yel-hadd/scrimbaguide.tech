"""Content inventory: docs/blog/pages -> routes, content_group, money_page.

Ports `inventory()`, `frontmatter()` and `norm()` from
`scripts/seo/pull-search-data.py` (feat/daily-post-engine, never merged) plus
the catalog join, and adds `content_group`, `money_page`, `routes_for_files`
and `redirect_sources`.
"""
from __future__ import annotations

import glob
import json
import os
import re

from gapi import ROOT

DOCS_DIR = os.path.join(ROOT, 'docs')
BLOG_DIR = os.path.join(ROOT, 'blog')
PAGES_DIR = os.path.join(ROOT, 'src', 'pages')
RULES_PATH = os.path.join(ROOT, 'src', 'utils', 'contentGroupRules.json')
CONFIG_PATH = os.path.join(ROOT, 'docusaurus.config.ts')
COURSE_REDIRECTS_PATH = os.path.join(ROOT, 'data', 'course-redirects.json')
COURSES_JSON = os.path.join(ROOT, 'data', 'courses.json')

FRONTMATTER_RE = re.compile(r'^---\n(.*?)\n---\n(.*)', re.S)


def frontmatter(text):
    """Parses the YAML-ish frontmatter block with a plain regex (no yaml dep).

    Keeps the same style as the WIP script: one `key: value` per line, value
    unquoted. `draft` accepts `true`/`True`. Also reads `last_update.date`
    (nested) and `reviewed`.
    """
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    fm, body = m.group(1), m.group(2)

    def get(key):
        r = re.search(r'^' + re.escape(key) + r':\s*(.*)$', fm, re.M)
        return r.group(1).strip().strip('"\'') if r else None

    fields = {k: get(k) for k in ('title', 'description', 'slug', 'keywords', 'date', 'sidebar_label', 'reviewed')}
    draft_raw = get('draft')
    fields['draft'] = draft_raw in ('true', 'True')
    # last_update:\n  date: 2026-09-26  (nested one level)
    lu = re.search(r'^last_update:\s*\n(?:^\s+.*\n)*?^\s+date:\s*(.*)$', fm, re.M)
    fields['last_update_date'] = lu.group(1).strip().strip('"\'') if lu else None
    return fields, body


def _h2s(body):
    return re.findall(r'^## (.+)$', body, re.M)


def _content_group_rules():
    with open(RULES_PATH) as f:
        return json.load(f)


def content_group(route):
    rules = _content_group_rules()
    path = route if route.endswith('/') else route + '/'
    for pattern, group in rules:
        if re.search(pattern, path):
            return group
    return 'other'


def money_page(route):
    """Python port of `isMoneyPagePath` (src/utils/moneyPagePaths.ts).

    Pinned to the TS source by the parity fixture
    (scripts/__tests__/fixtures/route-cases.json), checked by both
    test_inventory.py and analytics.test.mjs. Keep in sync by hand.
    """
    return bool(
        '/pricing/' in route
        or route.startswith('/docs/paths/')
        or re.match(r'^/docs/comparisons/scrimba-vs-[^/]+/?$', route)
        or route in ('/blog/scrimba-review', '/blog/scrimba-review/')
    )


def _blog_route(fpath):
    with open(fpath, encoding='utf-8') as fh:
        text = fh.read()
    fm, body = frontmatter(text)
    slug = fm.get('slug')
    if not slug:
        # Bug fix: no slug: falls back to the filename minus its YYYY-MM-DD- prefix.
        base = os.path.splitext(os.path.basename(fpath))[0]
        slug = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', base)
    slug = slug.strip('/')
    return f'/blog/{slug}/', fm, body


def _docs_route(fpath):
    with open(fpath, encoding='utf-8') as fh:
        text = fh.read()
    fm, body = frontmatter(text)
    if fm.get('slug'):
        route = fm['slug']
        if not route.startswith('/'):
            route = '/' + route
    else:
        rel = os.path.relpath(fpath, DOCS_DIR)
        rel = re.sub(r'\.mdx?$', '', rel)
        rel = re.sub(r'(^|/)\d+-', r'\1', rel)
        rel = re.sub(r'(^|/)index$', '', rel)
        route = '/docs/' + rel
    route = route.rstrip('/') + '/'
    if not route.startswith('/docs'):
        route = '/docs' + route
    return route, fm, body


def _page_route(fpath):
    if fpath.endswith('.tsx'):
        # TSX pages carry no YAML frontmatter; don't try to parse it as MDX.
        fm, body = {}, ''
    else:
        with open(fpath, encoding='utf-8') as fh:
            text = fh.read()
        fm, body = frontmatter(text)
    rel = os.path.relpath(fpath, PAGES_DIR)
    rel = re.sub(r'\.(mdx?|tsx)$', '', rel)
    rel = re.sub(r'/?index$', '', rel).strip('/')
    route = '/' + rel + '/' if rel else '/'
    return route, fm, body


def inventory():
    """Returns the published-page inventory (drafts excluded)."""
    pages = []
    for f in sorted(glob.glob(os.path.join(BLOG_DIR, '*.mdx'))):
        route, fm, body = _blog_route(f)
        if fm.get('draft'):
            continue
        pages.append(_row('blog', route, f, fm, body))
    for f in sorted(glob.glob(os.path.join(DOCS_DIR, '**', '*.md*'), recursive=True)):
        route, fm, body = _docs_route(f)
        if fm.get('draft'):
            continue
        pages.append(_row('docs', route, f, fm, body))
    if os.path.isdir(PAGES_DIR):
        for f in sorted(glob.glob(os.path.join(PAGES_DIR, '**', '*.md*'), recursive=True)):
            route, fm, body = _page_route(f)
            if fm.get('draft'):
                continue
            pages.append(_row('page', route, f, fm, body))
        for f in sorted(glob.glob(os.path.join(PAGES_DIR, '**', '*.tsx'), recursive=True)):
            basename = os.path.basename(f)
            rel = os.path.relpath(f, PAGES_DIR)
            if basename.startswith('_') or 'components' in rel.split(os.sep):
                continue
            route, fm, body = _page_route(f)
            if fm.get('draft'):
                continue
            pages.append(_row('page', route, f, fm, body))
    return pages


def _row(kind, route, fpath, fm, body):
    return {
        'kind': kind,
        'route': route,
        'file': os.path.relpath(fpath, ROOT),
        'title': fm.get('title'),
        'description': fm.get('description'),
        'keywords': fm.get('keywords'),
        'date': fm.get('date') or fm.get('last_update_date'),
        'h2': _h2s(body),
        'draft': False,
        'content_group': content_group(route),
        'money_page': money_page(route),
    }


def routes_for_files(paths, include_catalog=False):
    """Maps changed repo-relative file paths to affected routes."""
    inv = inventory()
    by_file = {p['file']: p['route'] for p in inv}
    routes = set()
    for p in paths:
        p = p.strip()
        if not p:
            continue
        if p in by_file:
            routes.add(by_file[p])
        elif p == 'data/courses.json' and include_catalog:
            for row in inv:
                if row['route'].startswith('/docs/courses/'):
                    routes.add(row['route'])
    return sorted(routes)


def redirect_sources():
    """[{from, to}] from docusaurus.config.ts's inline redirect list plus
    data/course-redirects.json."""
    out = []
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, encoding='utf-8') as fh:
            text = fh.read()
        for m in re.finditer(r"from:\s*'([^']+)',\s*to:\s*'([^']+)'", text):
            out.append({'from': m.group(1), 'to': m.group(2)})
    if os.path.exists(COURSE_REDIRECTS_PATH):
        with open(COURSE_REDIRECTS_PATH) as fh:
            out.extend(json.load(fh))
    return out


def catalog():
    """Joins data/courses.json to our review routes (docSlug -> docs route)."""
    inv = inventory()
    by_file = {}
    for p in inv:
        if p['kind'] != 'docs':
            continue
        base = os.path.splitext(os.path.basename(p['file']))[0]
        base = re.sub(r'^\d+-', '', base)
        by_file[base] = p['route']
    out = []
    if not os.path.exists(COURSES_JSON):
        return out
    with open(COURSES_JSON) as fh:
        courses = json.load(fh)
    for c in courses:
        out.append({
            'name': c.get('cleanName'),
            'url': c.get('scrimbaUrl'),
            'slug': c.get('scrimbaSlug'),
            'review': by_file.get(c.get('docSlug')),
            'category': c.get('category'),
            'topics': c.get('topics'),
            'teaches': c.get('teaches'),
            'level': c.get('level'),
            'access': c.get('access'),
            'duration': c.get('duration'),
            'lessons': c.get('lessonCount'),
            'modified': c.get('dateModified'),
            'paths': c.get('pathMembership'),
            'modules': [m.get('name') for m in c.get('modules') or []],
        })
    return out


def main():
    from gapi import atomic_write_json, ensure_dirs
    ensure_dirs()
    inv = inventory()
    atomic_write_json(os.path.join(ROOT, '.seo-cache', 'inventory.json'), inv)
    atomic_write_json(os.path.join(ROOT, '.seo-cache', 'redirects.json'), redirect_sources())
    atomic_write_json(os.path.join(ROOT, '.seo-cache', 'scrimba-catalog.json'), catalog())
    print(f'inventory: {len(inv)} pages')
    return inv


if __name__ == '__main__':
    main()
