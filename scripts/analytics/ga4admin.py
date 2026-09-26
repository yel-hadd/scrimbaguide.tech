#!/usr/bin/env python3
"""GA4 Admin API helper: annotations (candidates/plan/apply/list) and custom
dimensions (check/create). REST via google-auth AuthorizedSession, no
googleapiclient.

Never edits or deletes an annotation. `apply` and `dims create` are the only
writes, both gated by `--yes` and meant to be run by the main session, never
by a subagent.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gapi  # noqa: E402

ROOT = gapi.ROOT
T = gapi.TRACKING
PROPERTY_ID = T['property'].split('/')[-1]
LOG_PATH = os.path.join(ROOT, 'secrets', 'ops', 'annotations-log.jsonl')

COLORS = {
    'content': 'BLUE', 'seo': 'PURPLE', 'conversion': 'GREEN',
    'tracking': 'RED', 'catalog': 'CYAN', 'ux-perf': 'BROWN',
}

KIND_RULES = [
    ('tracking', [
        r'^plugins/analytics/', r'^src/components/AffiliateLink\.tsx$',
        r'^src/utils/contentGroup', r'^src/utils/affiliateDestination',
        r'^src/utils/trackSearch', r'^scripts/analytics/tracking\.json$',
    ]),
    ('conversion', [
        r'^src/components/(PricingCTA|CourseCard|VerdictBox|ComparisonTable|ScrimPoster|DesktopStickyCTA|PathAdvisor|CodePreview)',
        r'^src/utils/moneyPagePaths\.ts$', r'^src/theme/DocItem/', r'^src/constants\.ts$',
    ]),
    ('catalog', [r'^data/courses\.json$', r'^data/course-overrides\.json$', r'^data/path-membership\.json$']),
    ('seo', [
        r'^docusaurus\.config\.ts$', r'^sidebars\.ts$', r'^data/course-redirects\.json$',
        r'^src/content/relatedGuidesMap\.ts$', r'^static/robots\.txt$', r'^scripts/generate-llms-from-sitemap\.mjs$',
    ]),
    ('content', [r'^blog/', r'^docs/', r'^src/pages/']),
    ('ux-perf', [r'^src/css/', r'^src/components/', r'^src/theme/', r'^static/img/']),
    ('none', [r'^\.claude/', r'^scripts/', r'^[^/]+\.md$', r'^Makefile$', r'^package.*\.json$', r'test', r'^\.github/']),
]


def classify_kind(files):
    for kind, patterns in KIND_RULES:
        for f in files:
            for pat in patterns:
                if re.search(pat, f):
                    return kind
    return 'none'


# ------------------------------------------------------------- annotations --

def annotations_list(sess=None):
    sess = sess or gapi.session(gapi.EDIT)
    url = f'https://analyticsadmin.googleapis.com/v1alpha/{T["property"]}/reportingDataAnnotations'
    out = []
    page_token = None
    while True:
        full = url + (f'?pageToken={page_token}' if page_token else '')
        resp = gapi.call(sess, 'GET', full)
        for a in resp.get('reportingDataAnnotations', []):
            d = a.get('annotationDate', {})
            date_str = f"{d.get('year')}-{d.get('month', 0):02d}-{d.get('day', 0):02d}" if d else None
            out.append({
                'date': date_str, 'title': a.get('title'), 'description': a.get('description'),
                'color': a.get('color'), 'prs': [int(n) for n in re.findall(r'#(\d+)', a.get('description') or '')],
                'system': bool(a.get('systemGenerated')), 'name': a.get('name'),
            })
        page_token = resp.get('nextPageToken')
        if not page_token:
            break
    return out


def _git(*args_):
    return subprocess.check_output(['git', *args_], cwd=ROOT).decode()


_BARE_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def _anchor_since(since):
    """A bare `YYYY-MM-DD` reaches `git log --since` unanchored, which git
    reads at the current wall-clock time in the machine's zone, dropping
    merges earlier that day. Anchor it to that date's own LA midnight;
    anything already carrying a time (an ISO datetime) passes through."""
    return gapi.la_midnight_iso(since) if _BARE_DATE_RE.match(since or '') else since


def _anchor_until(until):
    """Same as `_anchor_since`, but for `--until`: anchored to the *next*
    day's LA midnight so a bare date's own day is included in full."""
    return gapi.la_midnight_iso(until, end_of_day=True) if _BARE_DATE_RE.match(until or '') else until


def _pr_note_and_title(pr_number):
    """Returns (analytics_note, pr_title) from a single `gh pr view` call:
    `analytics_note` is the raw `analytics-note:` body line, or None; `pr_title`
    is the PR's own title, or None only when the `gh` call itself failed.
    One call, so a merge with no commit note gets the same title source
    (`candidates_for_prs` uses PR title, never the merge subject) whichever
    path builds its candidate row."""
    try:
        raw = subprocess.check_output(['gh', 'pr', 'view', str(pr_number), '--json', 'title,body'], cwd=ROOT).decode()
        data = json.loads(raw)
        note = None
        m = re.search(r'^analytics-note:\s*(.+)$', data.get('body', '') or '', re.M)
        if m:
            note = m.group(1).strip()
        return note, data.get('title')
    except Exception:
        return None, None


def _deploy_completion_la(sha, fallback_iso):
    try:
        out = subprocess.check_output(
            ['gh', 'run', 'list', '--workflow', 'deploy.yml', '--commit', sha, '--json', 'conclusion,updatedAt'],
            cwd=ROOT).decode()
        runs = json.loads(out)
        ok = [r for r in runs if r.get('conclusion') == 'success']
        if ok:
            return gapi.la_date(ok[0]['updatedAt'])
    except Exception:
        pass
    return gapi.la_date(fallback_iso)


def _candidate_exists(c, annotations):
    """Same match rule plan() applies at the per-annotation level (skip
    system annotations; a match is a same-date title match, or a same-date
    PR/commit overlap)."""
    c_prs = set(c.get('prs') or [])
    c_sha7 = (c.get('sha') or '')[:7]
    for a in annotations or []:
        if a.get('system'):
            continue
        if a.get('date') != c.get('date'):
            continue
        if a.get('title', '').lower() == (c.get('title') or '').lower():
            return True
        a_prs = set(a.get('prs', []) or [])
        a_shas = set(re.findall(r'\b[0-9a-f]{7}\b', a.get('description') or ''))
        if (a_prs & c_prs) or (c_sha7 and c_sha7 in a_shas):
            return True
    return False


def candidates(since, until=None, backfill=False, annotations=None):
    """[{date, sha, prs, subject, kind, files_n, title, exists}]

    `exists` is computed with the same match rule `plan()` applies, but only
    when the caller passes `annotations` (a prior `annotations_list()`
    result). This never calls GA4 itself -- most callers (the CLI's own
    `candidates` subcommand, unit tests) don't need or want a network call
    just to print candidate rows; a caller about to run `plan()` anyway
    (main's `--since-merged`, snapshot.py's `unannotated_merges`) already
    has `annotations` in hand and can pass it through."""
    fmt = '%H\x09%cI\x09%s'
    args_ = ['log', '--first-parent', 'origin/main', f'--format={fmt}', f'--since={_anchor_since(since)}']
    if until:
        args_.append(f'--until={_anchor_until(until)}')
    try:
        raw = _git(*args_)
    except Exception:
        return []
    out = []
    lines = [l for l in raw.splitlines() if l.strip()]
    for line in lines:
        sha, committer_iso, subject = line.split('\x09', 2)
        try:
            diff_target = f'{sha}^1'
            files = _git('diff', '--name-only', f'{sha}^1', sha).splitlines()
        except Exception:
            try:
                files = _git('diff', '--name-only', f'{sha}^', sha).splitlines()
            except Exception:
                files = []
        prs = [int(n) for n in re.findall(r'Merge pull request #(\d+)', subject)]
        title, title_source = (None, 'merge_subject')
        analytics_note = None
        try:
            log_body = subprocess.check_output(['git', 'log', '-1', '--format=%B', sha], cwd=ROOT).decode()
            m = re.search(r'^analytics-note:\s*(.+)$', log_body, re.M)
            if m:
                analytics_note = m.group(1).strip()
        except Exception:
            pass
        if analytics_note:
            title, title_source = analytics_note, 'analytics_note'
        elif prs:
            pr_note, pr_title = _pr_note_and_title(prs[0])
            if pr_note is not None:
                title, title_source, analytics_note = pr_note, 'analytics_note', pr_note
            elif pr_title is not None:
                title, title_source = pr_title, 'pr_title'
        if title is None:
            title = subject
        kind = classify_kind(files)
        if analytics_note and analytics_note.lower() == 'skip':
            continue
        if analytics_note and analytics_note.lower() != 'skip':
            kind = kind if kind != 'none' else 'content'
        if backfill:
            date = gapi.la_date(committer_iso)
        else:
            date = _deploy_completion_la(sha, committer_iso)
        row = {
            'date': date, 'sha': sha, 'prs': prs, 'subject': subject.strip(),
            'kind': kind, 'files_n': len(files), 'title': title, 'exists': False,
            'title_source': title_source,
        }
        if annotations is not None:
            row['exists'] = _candidate_exists(row, annotations)
        out.append(row)
    return out


def candidates_for_prs(prs, annotations=None):
    """Builds candidate rows for specific PR numbers directly via `gh pr view`,
    instead of scanning the full git log since property creation (annotations
    plan --prs is meant to be fast, e.g. right after a post-merge routine).
    `exists` is computed only when the caller passes `annotations` (see
    `candidates()`). Returns (candidates, errors): a PR that `gh pr view`
    can't resolve, or that isn't merged yet, is never silently dropped -- it
    comes back as an entry in `errors` ({'pr', 'reason'}) so the caller can
    report it instead of treating an empty candidate list as "nothing to do"."""
    out = []
    errors = []
    for pr in prs:
        try:
            raw = subprocess.check_output(
                ['gh', 'pr', 'view', str(pr), '--json', 'mergeCommit,mergedAt,title,body'], cwd=ROOT).decode()
            data = json.loads(raw)
        except Exception as e:
            errors.append({'pr': pr, 'reason': f'gh pr view failed: {e}'})
            continue
        sha = (data.get('mergeCommit') or {}).get('oid')
        merged_at = data.get('mergedAt')
        if not sha or not merged_at:
            errors.append({'pr': pr, 'reason': 'not merged'})
            continue
        try:
            files = _git('diff', '--name-only', f'{sha}^1', sha).splitlines()
        except Exception:
            try:
                files = _git('diff', '--name-only', f'{sha}^', sha).splitlines()
            except Exception:
                files = []
        m = re.search(r'^analytics-note:\s*(.+)$', data.get('body') or '', re.M)
        title = m.group(1).strip() if m else data.get('title') or f'PR #{pr}'
        title_source = 'analytics_note' if m else 'pr_title'
        if m and title.lower() == 'skip':
            continue
        kind = classify_kind(files)
        if m and kind == 'none':
            kind = 'content'
        row = {
            'date': _deploy_completion_la(sha, merged_at), 'sha': sha, 'prs': [pr],
            'subject': data.get('title') or '', 'kind': kind, 'files_n': len(files),
            'title': title, 'exists': False, 'title_source': title_source,
        }
        if annotations is not None:
            row['exists'] = _candidate_exists(row, annotations)
        out.append(row)
    return out, errors


def _valid_entry(entry):
    if not isinstance(entry.get('title'), str) or not isinstance(entry.get('date'), str):
        return False, 'missing title/date'
    if len(entry['title']) > 60:
        return False, 'title over 60 chars'
    if not entry.get('description'):
        return False, 'missing description'
    if len(entry.get('description', '')) > 150:
        return False, 'description over 150 chars'
    if not entry.get('color'):
        return False, 'missing color'
    if entry.get('color') not in COLORS.values():
        return False, 'invalid color'
    if entry.get('kind') == 'none':
        return False, 'kind is none'
    if not entry.get('prs') and not entry.get('commits'):
        return False, 'no prs or commits'
    desc = entry.get('description', '')
    if entry.get('prs'):
        desc_prs = set(int(n) for n in re.findall(r'#(\d+)', desc))
        for pr in entry['prs']:
            if pr not in desc_prs:
                return False, f'description missing PR #{pr}'
    elif entry.get('commits'):
        desc_shas = set(re.findall(r'\b[0-9a-f]{7}\b', desc))
        if 'commits' not in desc or not set(entry['commits']) <= desc_shas:
            return False, 'description missing "commits <sha7>"'
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', entry['date']):
        return False, 'bad date format'
    try:
        datetime.date.fromisoformat(entry['date'])
    except ValueError:
        return False, 'bad date'
    if not (T['property_created'] <= entry['date'] <= gapi.la_today()):
        return False, 'date out of range'
    return True, None


def _load_log():
    if not os.path.exists(LOG_PATH):
        return []
    return [json.loads(l) for l in open(LOG_PATH) if l.strip()]


def covered_sets(existing, log):
    """Union of PR numbers and commit sha7s already covered: from every
    non-system annotation's description, and from every logged row's own
    entry. Used to drop candidates that are already fully annotated before
    they are grouped, so a group that mixes an already-annotated PR with a
    new one is not skipped whole."""
    prs = set()
    shas = set()
    for a in existing or []:
        if a.get('system'):
            continue
        prs |= set(a.get('prs', []) or [])
        shas |= set(re.findall(r'\b[0-9a-f]{7}\b', a.get('description') or ''))
    for row in log or []:
        le = row.get('entry', {})
        prs |= set(le.get('prs', []) or [])
        shas |= set(le.get('commits', []) or [])
    return prs, shas


def filter_uncovered_candidates(cands, covered_prs, covered_shas):
    """Drops a candidate whose PRs (if any) are all in covered_prs, or,
    lacking PRs, whose sha7 is in covered_shas. A candidate with PRs only
    partly covered is kept, so its group still gets planned and a partial
    overlap surfaces instead of being silently dropped."""
    out = []
    for c in cands:
        prs = set(c.get('prs') or [])
        if prs:
            if prs <= covered_prs:
                continue
        elif c.get('sha', '')[:7] in covered_shas:
            continue
        out.append(c)
    return out


def _group_candidates(cands):
    groups = {}
    for c in cands:
        if c['kind'] == 'none':
            continue
        key = (c['date'], c['kind'])
        groups.setdefault(key, []).append(c)
    entries = []
    for (date, kind), items in groups.items():
        prs = sorted({p for c in items for p in c['prs']})
        commits = [c['sha'][:7] for c in items if not c['prs']]
        if prs:
            if len(prs) == 1:
                title = items[0]['title']
            else:
                # List every PR, not just the first and last; fall back to a
                # short "(+N PRs)" suffix only when the full list would run
                # past the 60-char annotation title limit.
                title = 'PRs ' + ', '.join(f'#{p}' for p in prs) + ': ' + items[0]['title']
                if len(title) > 60:
                    title = f"{items[0]['title']} (+{len(prs) - 1} PRs)"
            desc = ', '.join(f'PR #{p}' for p in prs) + ': ' + items[0]['title']
        else:
            title = items[0]['title']
            desc = 'commits ' + ', '.join(commits) + ': ' + items[0]['title']
        sources = {c.get('title_source') for c in items}
        title_source = sources.pop() if len(sources) == 1 else 'mixed'
        # No blind [:60]/[:150] cut here: an oversized title or description
        # surfaces through `plan()` as `invalid` ("title over 60 chars" /
        # "description over 150 chars") so it gets rewritten, not silently
        # truncated (which can drop a PR reference the description promised).
        entries.append({
            'date': date, 'title': title, 'description': desc, 'color': COLORS.get(kind, 'BLUE'),
            'prs': prs, 'commits': commits, 'kind': kind, 'title_source': title_source,
        })
    return entries


def plan(entries, existing=None, log=None, recreate=False):
    existing = existing if existing is not None else annotations_list()
    existing = [a for a in existing if not a.get('system')]
    log = log if log is not None else _load_log()
    # Each logged row is keyed by its own date, case-folded title, and its
    # PR/commit sets, so a new entry is recognized as "deleted by owner" even
    # when it regroups (different title, same PRs/commits) rather than only
    # when it regroups to the exact same title.
    logged_rows = []
    for row in log:
        le = row.get('entry', {})
        logged_rows.append({
            'date': le.get('date'), 'title': (le.get('title') or '').lower(),
            'prs': set(le.get('prs', [])), 'commits': set(le.get('commits', [])),
        })
    rows = []
    for e in entries:
        ok, reason = _valid_entry(e)
        if not ok:
            rows.append({**e, 'action': 'invalid', 'reason': reason})
            continue
        e_prs = set(e.get('prs', []) or [])
        e_shas = set(e.get('commits', []))
        match = None
        partial = None
        conflict = None
        for a in existing:
            a_prs = set(a.get('prs', []) or [])
            a_shas = set(re.findall(r'\b[0-9a-f]{7}\b', a.get('description') or ''))
            overlaps = bool(a_prs & e_prs or (a_shas & e_shas))
            same_date = a.get('date') == e['date']
            same_title = same_date and a.get('title', '').lower() == e['title'].lower()
            if same_date and (same_title or overlaps):
                # A match ("exists") requires the entry's whole PR/commit set
                # to already be covered by this same-date annotation. An
                # overlap that doesn't fully cover the entry is a partial:
                # some of the entry's PRs/commits still need their own
                # annotation, so the group must not be skipped whole.
                fully_covered = same_title or (e_prs <= a_prs and e_shas <= a_shas)
                if fully_covered:
                    match = a
                    break
                uncovered_prs = sorted(e_prs - a_prs)
                uncovered_shas = sorted(e_shas - a_shas)
                partial = {'annotation': a, 'uncovered_prs': uncovered_prs, 'uncovered_commits': uncovered_shas}
                continue
            if overlaps and not same_date:
                conflict = a
        if match:
            rows.append({**e, 'action': 'skip', 'reason': f"exists {match.get('name')}"})
            continue
        if partial:
            rows.append({**e, 'action': 'partial', 'reason': f"overlaps {partial['annotation'].get('name')}; not covered: "
                         f"{', '.join('#' + str(p) for p in partial['uncovered_prs']) or ', '.join(partial['uncovered_commits'])}",
                         'uncovered_prs': partial['uncovered_prs'], 'uncovered_commits': partial['uncovered_commits']})
            continue
        if conflict:
            rows.append({**e, 'action': 'conflict', 'reason': f"overlaps {conflict.get('name')} on {conflict.get('date')}"})
            continue
        deleted = any(
            (lr['prs'] & e_prs) or (lr['commits'] & e_shas)
            or (lr['date'] == e['date'] and lr['title'] == e['title'].lower())
            for lr in logged_rows
        )
        if deleted and not recreate:
            rows.append({**e, 'action': 'skip', 'reason': 'deleted by owner'})
            continue
        rows.append({**e, 'action': 'create'})
    return rows


def apply(rows, yes=False):
    if not yes:
        return None
    sess = gapi.session(gapi.EDIT)
    url = f'https://analyticsadmin.googleapis.com/v1alpha/{T["property"]}/reportingDataAnnotations'
    created = []
    for row in rows:
        if row.get('action') != 'create':
            continue
        y, m, d = row['date'].split('-')
        body = {'title': row['title'], 'description': row['description'], 'color': row['color'],
                'annotationDate': {'year': int(y), 'month': int(m), 'day': int(d)}}
        resp = gapi.call(sess, 'POST', url, body)
        gapi.append_jsonl(LOG_PATH, {'ts': gapi.la_today(), 'name': resp.get('name'), 'entry': row})
        created.append(resp)
        time.sleep(1)
    return created


# ----------------------------------------------------------------- dims --

def dims_check(sess=None):
    sess = sess or gapi.session(gapi.EDIT)
    url = f'https://analyticsadmin.googleapis.com/v1beta/{T["property"]}/customDimensions'
    resp = gapi.call(sess, 'GET', url)
    remote = {d.get('parameterName') for d in resp.get('customDimensions', [])}
    wanted = {d['parameter'] for d in T['custom_dimensions']}
    missing = sorted(wanted - remote)
    extra = sorted(remote - wanted)
    return missing, extra


def dims_create(missing, yes=False, sess=None):
    if not yes:
        return None
    sess = sess or gapi.session(gapi.EDIT)
    url = f'https://analyticsadmin.googleapis.com/v1beta/{T["property"]}/customDimensions'
    by_param = {d['parameter']: d for d in T['custom_dimensions']}
    created = []
    for param in missing:
        d = by_param.get(param)
        if not d:
            continue
        body = {'parameterName': param, 'displayName': d['display'], 'scope': 'EVENT'}
        created.append(gapi.call(sess, 'POST', url, body))
    return created


# ------------------------------------------------------------------- CLI --

def main(argv=None):
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd')

    p_ann = sub.add_parser('annotations')
    ann_sub = p_ann.add_subparsers(dest='ann_cmd')
    ann_sub.add_parser('list')
    p_cand = ann_sub.add_parser('candidates')
    p_cand.add_argument('--since', required=True)
    p_cand.add_argument('--until')
    p_cand.add_argument('--backfill', action='store_true')
    p_plan = ann_sub.add_parser('plan')
    p_plan.add_argument('--file')
    p_plan.add_argument('--prs')
    p_plan.add_argument('--since-merged')
    p_plan.add_argument('--recreate', action='store_true')
    p_apply = ann_sub.add_parser('apply')
    p_apply.add_argument('--file')
    p_apply.add_argument('--prs')
    p_apply.add_argument('--since-merged')
    p_apply.add_argument('--recreate', action='store_true')
    p_apply.add_argument('--yes', action='store_true')

    p_dims = sub.add_parser('dims')
    dims_sub = p_dims.add_subparsers(dest='dims_cmd')
    dims_sub.add_parser('check')
    p_dc = dims_sub.add_parser('create')
    p_dc.add_argument('--yes', action='store_true')

    args = ap.parse_args(argv)

    if args.cmd == 'annotations':
        if args.ann_cmd == 'list':
            print(json.dumps(annotations_list(), indent=1))
            return 0
        if args.ann_cmd == 'candidates':
            try:
                _ann = annotations_list()
            except Exception:
                _ann = None
            print(json.dumps(candidates(args.since, args.until, args.backfill, annotations=_ann), indent=1))
            return 0
        if args.ann_cmd in ('plan', 'apply'):
            pr_errors = []
            if args.file:
                entries = json.load(open(args.file))
                if entries and 'action' not in entries[0]:
                    is_candidate_rows = 'sha' in entries[0] and 'description' not in entries[0]
                    entries = _group_candidates(entries) if is_candidate_rows else entries
                    if not is_candidate_rows:
                        for entry in entries:
                            if not entry.get('color'):
                                entry['color'] = COLORS.get(entry.get('kind'), 'BLUE')
            elif args.prs:
                prs = [int(n) for n in args.prs.split(',')]
                try:
                    _ann = annotations_list()
                except Exception:
                    _ann = None
                cands, pr_errors = candidates_for_prs(prs, annotations=_ann)
                for pe in pr_errors:
                    print(f"PR #{pe['pr']}: {pe['reason']}", file=sys.stderr)
                entries = _group_candidates(cands)
            elif args.since_merged:
                _ann = annotations_list()
                cands = candidates(since=args.since_merged, annotations=_ann)
                cov_prs, cov_shas = covered_sets(_ann, _load_log())
                cands = filter_uncovered_candidates(cands, cov_prs, cov_shas)
                entries = _group_candidates(cands)
            else:
                print('need --file, --prs or --since-merged', file=sys.stderr)
                return 1
            rows = plan(entries, recreate=getattr(args, 'recreate', False))
            if args.ann_cmd == 'plan':
                print(json.dumps(rows, indent=1))
                return 4 if pr_errors else 0
            if not args.yes:
                print(json.dumps(rows, indent=1))
                return 2
            result = apply(rows, yes=args.yes)
            print(json.dumps(result, indent=1, default=str))
            return 4 if pr_errors else 0
    elif args.cmd == 'dims':
        if args.dims_cmd == 'check':
            missing, extra = dims_check()
            print(json.dumps({'missing': missing, 'extra': extra}, indent=1))
            return 0 if not missing else 3
        if args.dims_cmd == 'create':
            missing, _ = dims_check()
            if not args.yes:
                print(json.dumps({'would_create': missing}, indent=1))
                return 2
            result = dims_create(missing, yes=args.yes)
            print(json.dumps(result, indent=1, default=str))
            return 0
    ap.print_help()
    return 1


if __name__ == '__main__':
    sys.exit(main())
