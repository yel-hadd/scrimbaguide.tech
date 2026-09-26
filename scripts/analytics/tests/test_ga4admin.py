import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ga4admin  # noqa: E402
import gapi  # noqa: E402


class TestKindRules(unittest.TestCase):
    def test_tracking(self):
        self.assertEqual(ga4admin.classify_kind(['plugins/analytics/index.js']), 'tracking')
        self.assertEqual(ga4admin.classify_kind(['src/components/AffiliateLink.tsx']), 'tracking')

    def test_conversion(self):
        self.assertEqual(ga4admin.classify_kind(['src/components/PricingCTA.tsx']), 'conversion')
        self.assertEqual(ga4admin.classify_kind(['src/utils/moneyPagePaths.ts']), 'conversion')

    def test_catalog(self):
        self.assertEqual(ga4admin.classify_kind(['data/courses.json']), 'catalog')

    def test_seo(self):
        self.assertEqual(ga4admin.classify_kind(['docusaurus.config.ts']), 'seo')

    def test_content(self):
        self.assertEqual(ga4admin.classify_kind(['blog/2026-09-01-post.mdx']), 'content')

    def test_ux_perf(self):
        self.assertEqual(ga4admin.classify_kind(['src/css/global.css']), 'ux-perf')

    def test_none_for_claude_and_scripts_and_tests(self):
        self.assertEqual(ga4admin.classify_kind(['.claude/skills/foo/SKILL.md']), 'none')
        self.assertEqual(ga4admin.classify_kind(['scripts/analytics/gapi.py']), 'none')
        self.assertEqual(ga4admin.classify_kind(['README.md']), 'none')
        self.assertEqual(ga4admin.classify_kind(['Makefile']), 'none')
        self.assertEqual(ga4admin.classify_kind(['package.json']), 'none')

    def test_first_matching_rule_wins_on_mixed_file_set(self):
        # tracking listed before content in KIND_RULES
        self.assertEqual(ga4admin.classify_kind(['blog/x.mdx', 'plugins/analytics/index.js']), 'tracking')


class TestDateAnchoring(unittest.TestCase):
    def test_bare_since_anchored_to_la_midnight(self):
        anchored = ga4admin._anchor_since('2026-09-20')
        self.assertTrue(anchored.startswith('2026-09-20T00:00:00'))

    def test_bare_until_anchored_to_next_day_la_midnight(self):
        anchored = ga4admin._anchor_until('2026-09-20')
        self.assertTrue(anchored.startswith('2026-09-21T00:00:00'))

    def test_iso_datetime_passes_through_unanchored(self):
        iso = '2026-09-20T10:00:00-07:00'
        self.assertEqual(ga4admin._anchor_since(iso), iso)
        self.assertEqual(ga4admin._anchor_until(iso), iso)


class TestCandidates(unittest.TestCase):
    def _git_log_fixture(self):
        return (
            'abc1234\x092026-09-20T10:00:00-07:00\x09Merge pull request #92 from x/y\n'
            'def5678\x092026-09-21T09:00:00-07:00\x09Merge pull request #95 from x/z\n'
        )

    @mock.patch('ga4admin._deploy_completion_la')
    @mock.patch('ga4admin._pr_note_and_title')
    @mock.patch('subprocess.check_output')
    def test_candidates_from_git_log_fixture(self, mock_co, mock_note_title, mock_deploy):
        def co_side_effect(args, cwd=None):
            if args[0] == 'git' and args[1] == 'log' and '--format=%H\x09%cI\x09%s' in args:
                return self._git_log_fixture().encode()
            if args[:3] == ['git', 'diff', '--name-only']:
                return b'docs/courses/react/learn-react.mdx\n'
            if args[:4] == ['git', 'log', '-1', '--format=%B']:
                return b'Merge pull request #92 from x/y\n\nno note here\n'
            raise AssertionError(args)
        mock_co.side_effect = co_side_effect
        mock_note_title.return_value = ('Titles on top pages', 'Titles on top pages (PR title)')
        mock_deploy.side_effect = lambda sha, iso: gapi.la_date(iso)

        out = ga4admin.candidates(since='2026-09-01')
        self.assertEqual(len(out), 2)
        self.assertEqual(out[0]['prs'], [92])
        self.assertEqual(out[0]['kind'], 'content')
        self.assertEqual(out[0]['title'], 'Titles on top pages')

    @mock.patch('ga4admin._deploy_completion_la')
    @mock.patch('ga4admin._pr_note_and_title')
    @mock.patch('subprocess.check_output')
    def test_candidates_falls_back_to_pr_title_not_merge_subject_when_no_note(self, mock_co, mock_note_title, mock_deploy):
        def co_side_effect(args, cwd=None):
            if args[0] == 'git' and args[1] == 'log' and '--format=%H\x09%cI\x09%s' in args:
                return self._git_log_fixture().encode()
            if args[:3] == ['git', 'diff', '--name-only']:
                return b'docs/courses/react/learn-react.mdx\n'
            if args[:4] == ['git', 'log', '-1', '--format=%B']:
                return b'Merge pull request #92 from x/y\n\nno note here\n'
            raise AssertionError(args)
        mock_co.side_effect = co_side_effect
        # No analytics-note in the PR body: candidates() must use the PR's own
        # title, the same source candidates_for_prs() uses, never the raw
        # merge-commit subject.
        mock_note_title.return_value = (None, 'The real PR title')
        mock_deploy.side_effect = lambda sha, iso: gapi.la_date(iso)

        out = ga4admin.candidates(since='2026-09-01')
        self.assertEqual(out[0]['title'], 'The real PR title')
        self.assertNotEqual(out[0]['title'], out[0]['subject'])

    def test_backfill_uses_committer_date(self):
        with mock.patch('subprocess.check_output') as mock_co:
            def co_side_effect(args, cwd=None):
                if 'log' in args and '--format=%H\x09%cI\x09%s' in args:
                    return b'sha0001\x092026-02-06T01:00:00-08:00\x09Site launch\n'
                if args[:3] == ['git', 'diff', '--name-only']:
                    return b'docusaurus.config.ts\n'
                if args[:4] == ['git', 'log', '-1', '--format=%B']:
                    return b'Site launch\n'
                raise AssertionError(args)
            mock_co.side_effect = co_side_effect
            out = ga4admin.candidates(since='2026-02-06', backfill=True)
        self.assertEqual(out[0]['date'], '2026-02-06')
        self.assertEqual(out[0]['kind'], 'seo')

    def test_analytics_note_skip_drops_commit(self):
        with mock.patch('subprocess.check_output') as mock_co:
            def co_side_effect(args, cwd=None):
                if 'log' in args and '--format=%H\x09%cI\x09%s' in args:
                    return b'sha0002\x092026-09-10T10:00:00-07:00\x09Housekeeping\n'
                if args[:3] == ['git', 'diff', '--name-only']:
                    return b'scripts/foo.mjs\n'
                if args[:4] == ['git', 'log', '-1', '--format=%B']:
                    return b'Housekeeping\n\nanalytics-note: skip\n'
                raise AssertionError(args)
            mock_co.side_effect = co_side_effect
            out = ga4admin.candidates(since='2026-09-01', backfill=True)
        self.assertEqual(out, [])

    def test_analytics_note_forces_commit_in_with_kind_content_fallback(self):
        with mock.patch('subprocess.check_output') as mock_co:
            def co_side_effect(args, cwd=None):
                if 'log' in args and '--format=%H\x09%cI\x09%s' in args:
                    return b'sha0003\x092026-09-10T10:00:00-07:00\x09Small script fix\n'
                if args[:3] == ['git', 'diff', '--name-only']:
                    return b'scripts/analytics/gapi.py\n'
                if args[:4] == ['git', 'log', '-1', '--format=%B']:
                    return b'Small script fix\n\nanalytics-note: Udemy links tracked\n'
                raise AssertionError(args)
            mock_co.side_effect = co_side_effect
            out = ga4admin.candidates(since='2026-09-01', backfill=True)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]['title'], 'Udemy links tracked')
        self.assertEqual(out[0]['kind'], 'content')

    def test_pr_body_skip_drops_commit(self):
        with mock.patch('subprocess.check_output') as mock_co:
            def co_side_effect(args, cwd=None):
                if 'log' in args and '--format=%H\x09%cI\x09%s' in args:
                    return b'sha0004\x092026-09-10T10:00:00-07:00\x09Merge pull request #200 from x/y\n'
                if args[:3] == ['git', 'diff', '--name-only']:
                    return b'docs/foo.mdx\n'
                if args[:4] == ['git', 'log', '-1', '--format=%B']:
                    return b'Merge pull request #200 from x/y\n'
                if args[:2] == ['gh', 'pr']:
                    return json.dumps({'body': 'analytics-note: skip\n'}).encode()
                raise AssertionError(args)
            mock_co.side_effect = co_side_effect
            out = ga4admin.candidates(since='2026-09-01', backfill=True)
        self.assertEqual(out, [])

    def test_pr_body_note_forces_kind_none_to_content(self):
        with mock.patch('subprocess.check_output') as mock_co:
            def co_side_effect(args, cwd=None):
                if 'log' in args and '--format=%H\x09%cI\x09%s' in args:
                    return b'sha0005\x092026-09-10T10:00:00-07:00\x09Merge pull request #201 from x/y\n'
                if args[:3] == ['git', 'diff', '--name-only']:
                    return b'.claude/skills/foo/SKILL.md\n'
                if args[:4] == ['git', 'log', '-1', '--format=%B']:
                    return b'Merge pull request #201 from x/y\n'
                if args[:2] == ['gh', 'pr']:
                    return json.dumps({'body': 'analytics-note: New search UI copy\n'}).encode()
                raise AssertionError(args)
            mock_co.side_effect = co_side_effect
            out = ga4admin.candidates(since='2026-09-01', backfill=True)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]['title'], 'New search UI copy')
        self.assertEqual(out[0]['kind'], 'content')


class TestGrouping(unittest.TestCase):
    def test_groups_same_date_and_kind(self):
        cands = [
            {'date': '2026-09-20', 'sha': 'a1111111', 'prs': [92], 'subject': 's1', 'kind': 'seo', 'files_n': 1, 'title': 'Titles', 'exists': False},
            {'date': '2026-09-20', 'sha': 'a2222222', 'prs': [94], 'subject': 's2', 'kind': 'seo', 'files_n': 1, 'title': 'AI-SEO', 'exists': False},
        ]
        entries = ga4admin._group_candidates(cands)
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]['color'], 'PURPLE')
        self.assertIn('PR #92', entries[0]['description'])
        self.assertIn('PR #94', entries[0]['description'])

    def test_three_pr_group_title_lists_every_pr(self):
        cands = [
            {'date': '2026-09-20', 'sha': 'a1111111', 'prs': [92], 'subject': 's1', 'kind': 'seo', 'files_n': 1, 'title': 'Fix', 'exists': False},
            {'date': '2026-09-20', 'sha': 'a2222222', 'prs': [93], 'subject': 's2', 'kind': 'seo', 'files_n': 1, 'title': 'Fix', 'exists': False},
            {'date': '2026-09-20', 'sha': 'a3333333', 'prs': [94], 'subject': 's3', 'kind': 'seo', 'files_n': 1, 'title': 'Fix', 'exists': False},
        ]
        entries = ga4admin._group_candidates(cands)
        self.assertEqual(len(entries), 1)
        self.assertIn('#93', entries[0]['title'])

    def test_single_pr_plus_direct_commit_keeps_pr_title(self):
        cands = [
            {'date': '2026-09-20', 'sha': 'a1111111', 'prs': [92], 'subject': 's1', 'kind': 'seo', 'files_n': 1, 'title': 'Titles on top pages', 'exists': False},
            {'date': '2026-09-20', 'sha': 'b2222222', 'prs': [], 'subject': 's2', 'kind': 'seo', 'files_n': 1, 'title': 'Direct commit fix', 'exists': False},
        ]
        entries = ga4admin._group_candidates(cands)
        self.assertEqual(len(entries), 1)
        self.assertNotEqual(entries[0]['title'], 'PR #92')


class TestValidation(unittest.TestCase):
    def test_title_too_long(self):
        entry = {'date': '2026-09-20', 'title': 'x' * 61, 'description': 'PR #1', 'prs': [1]}
        ok, reason = ga4admin._valid_entry(entry)
        self.assertFalse(ok)

    def test_description_missing_pr_number(self):
        entry = {'date': '2026-09-20', 'title': 'ok', 'description': 'no pr ref', 'prs': [1]}
        ok, reason = ga4admin._valid_entry(entry)
        self.assertFalse(ok)

    def test_date_floor(self):
        entry = {'date': '2026-01-01', 'title': 'ok', 'description': 'PR #1', 'prs': [1]}
        ok, reason = ga4admin._valid_entry(entry)
        self.assertFalse(ok)

    def test_valid_entry_with_commits(self):
        entry = {'date': gapi.T if False else '2026-09-20', 'title': 'ok', 'description': 'commits abc1234',
                 'commits': ['abc1234'], 'color': 'RED', 'kind': 'tracking'}
        ok, reason = ga4admin._valid_entry(entry)
        self.assertTrue(ok, reason)

    def test_missing_color_invalid(self):
        entry = {'date': '2026-09-20', 'title': 'ok', 'description': 'commits abc1234', 'commits': ['abc1234']}
        ok, reason = ga4admin._valid_entry(entry)
        self.assertFalse(ok)

    def test_kind_none_invalid(self):
        entry = {'date': '2026-09-20', 'title': 'ok', 'description': 'commits abc1234', 'commits': ['abc1234'],
                  'color': 'BLUE', 'kind': 'none'}
        ok, reason = ga4admin._valid_entry(entry)
        self.assertFalse(ok)

    def test_no_prs_or_commits_invalid(self):
        entry = {'date': '2026-09-20', 'title': 'ok', 'description': 'nothing here', 'color': 'BLUE', 'kind': 'content'}
        ok, reason = ga4admin._valid_entry(entry)
        self.assertFalse(ok)


class TestPlan(unittest.TestCase):
    def _existing(self):
        return [
            {'date': '2026-09-20', 'title': 'Titles on top pages, AI-SEO, practice consolidation', 'description': 'PR #92, PR #94', 'color': 'PURPLE', 'prs': [92, 94], 'system': False, 'name': 'properties/x/reportingDataAnnotations/108'},
            {'date': '2026-06-09', 'title': 'System note', 'description': '', 'color': 'ORANGE', 'prs': [], 'system': True, 'name': 'properties/x/reportingDataAnnotations/sys1'},
        ]

    def test_existing_pr_skips(self):
        entries = [{'date': '2026-09-20', 'title': 'Titles on top pages, AI-SEO, practice consolidation',
                   'description': 'PR #92, PR #94', 'color': 'PURPLE', 'prs': [92, 94], 'commits': [], 'kind': 'seo'}]
        rows = ga4admin.plan(entries, existing=self._existing(), log=[])
        self.assertEqual(rows[0]['action'], 'skip')

    def test_system_annotation_ignored_for_matching(self):
        entries = [{'date': '2026-06-09', 'title': 'Some new content', 'description': 'PR #200', 'color': 'BLUE', 'prs': [200], 'commits': [], 'kind': 'content'}]
        rows = ga4admin.plan(entries, existing=self._existing(), log=[])
        self.assertEqual(rows[0]['action'], 'create')

    def test_pr_overlap_different_date_is_conflict(self):
        entries = [{'date': '2026-09-21', 'title': 'Different day', 'description': 'PR #92', 'color': 'BLUE', 'prs': [92], 'commits': [], 'kind': 'content'}]
        rows = ga4admin.plan(entries, existing=self._existing(), log=[])
        self.assertEqual(rows[0]['action'], 'conflict')

    def test_deleted_by_owner_skips_without_recreate(self):
        entries = [{'date': '2026-05-01', 'title': 'Old fix', 'description': 'PR #10', 'color': 'BLUE', 'prs': [10], 'commits': [], 'kind': 'content'}]
        log = [{'ts': '2026-05-02', 'name': 'properties/x/reportingDataAnnotations/999', 'entry': {'date': '2026-05-01', 'title': 'Old fix'}}]
        rows = ga4admin.plan(entries, existing=[], log=log)
        self.assertEqual(rows[0]['action'], 'skip')
        self.assertIn('deleted by owner', rows[0]['reason'])

    def test_new_entry_creates(self):
        entries = [{'date': '2026-09-25', 'title': 'Page views de-duplicated', 'description': 'commits abc1234', 'color': 'RED', 'prs': [], 'commits': ['abc1234'], 'kind': 'tracking'}]
        rows = ga4admin.plan(entries, existing=self._existing(), log=[])
        self.assertEqual(rows[0]['action'], 'create')

    def test_commit_overlap_same_date_skips_as_existing(self):
        existing = [
            {'date': '2026-09-25', 'title': 'A different title entirely', 'description': 'commits abc1234: x',
             'color': 'RED', 'prs': [], 'system': False, 'name': 'properties/x/reportingDataAnnotations/200'},
        ]
        entries = [{'date': '2026-09-25', 'title': 'Some new title', 'description': 'commits abc1234',
                    'color': 'RED', 'prs': [], 'commits': ['abc1234'], 'kind': 'tracking'}]
        rows = ga4admin.plan(entries, existing=existing, log=[])
        self.assertEqual(rows[0]['action'], 'skip')
        self.assertIn('exists', rows[0]['reason'])

    def test_deleted_by_owner_matches_on_regrouped_prs_not_just_title(self):
        entries = [{'date': '2026-05-01', 'title': 'New batch title', 'description': 'PR #10, PR #11',
                    'color': 'BLUE', 'prs': [10, 11], 'commits': [], 'kind': 'content'}]
        log = [{'ts': '2026-05-02', 'name': 'properties/x/reportingDataAnnotations/999',
                'entry': {'date': '2026-05-01', 'title': 'Old fix', 'prs': [10], 'commits': []}}]
        rows = ga4admin.plan(entries, existing=[], log=log)
        self.assertEqual(rows[0]['action'], 'skip')
        self.assertIn('deleted by owner', rows[0]['reason'])

    def test_partial_overlap_names_uncovered_pr(self):
        existing = [
            {'date': '2026-09-20', 'title': 'Titles on top pages', 'description': 'PR #92',
             'color': 'PURPLE', 'prs': [92], 'system': False, 'name': 'properties/x/reportingDataAnnotations/108'},
        ]
        entries = [{'date': '2026-09-20', 'title': 'Titles on top pages, AI-SEO', 'description': 'PR #92, PR #113',
                    'color': 'PURPLE', 'prs': [92, 113], 'commits': [], 'kind': 'seo'}]
        rows = ga4admin.plan(entries, existing=existing, log=[])
        self.assertEqual(rows[0]['action'], 'partial')
        self.assertIn(113, rows[0]['uncovered_prs'])

    def test_deleted_by_owner_matches_despite_recomputed_date_drift(self):
        # The logged date can differ from the recomputed date (deploy lookup
        # fallback, backfill using committer date); a PR/commit overlap must
        # still mark the entry as owner-deleted, whatever the date.
        entries = [{'date': '2026-05-02', 'title': 'Old fix retitled', 'description': 'PR #10',
                    'color': 'BLUE', 'prs': [10], 'commits': [], 'kind': 'content'}]
        log = [{'ts': '2026-05-02', 'name': 'properties/x/reportingDataAnnotations/999',
                'entry': {'date': '2026-05-01', 'title': 'Old fix', 'prs': [10], 'commits': []}}]
        rows = ga4admin.plan(entries, existing=[], log=log)
        self.assertEqual(rows[0]['action'], 'skip')
        self.assertIn('deleted by owner', rows[0]['reason'])

    def test_recreate_bypasses_deleted_by_owner_skip(self):
        entries = [{'date': '2026-05-01', 'title': 'Old fix', 'description': 'PR #10', 'color': 'BLUE', 'prs': [10], 'commits': [], 'kind': 'content'}]
        log = [{'ts': '2026-05-02', 'name': 'properties/x/reportingDataAnnotations/999', 'entry': {'date': '2026-05-01', 'title': 'Old fix'}}]
        rows = ga4admin.plan(entries, existing=[], log=log, recreate=True)
        self.assertEqual(rows[0]['action'], 'create')


class TestApplyGating(unittest.TestCase):
    def test_apply_without_yes_sends_no_post(self):
        rows = [{'date': '2026-09-25', 'title': 'x', 'description': 'commits abc1234', 'color': 'RED', 'action': 'create'}]
        with mock.patch('gapi.session') as mock_sess, mock.patch('gapi.call') as mock_call:
            result = ga4admin.apply(rows, yes=False)
        mock_call.assert_not_called()
        self.assertIsNone(result)


class TestDimsGating(unittest.TestCase):
    def test_dims_create_without_yes_makes_no_call(self):
        with mock.patch('gapi.call') as mock_call:
            result = ga4admin.dims_create(['cta_type'], yes=False, sess=object())
        mock_call.assert_not_called()
        self.assertIsNone(result)

    def test_dims_check_reports_missing_and_extra(self):
        fake_sess = object()
        with mock.patch('gapi.call', return_value={'customDimensions': [
            {'parameterName': 'cta_location'}, {'parameterName': 'legacy_dim'},
        ]}):
            missing, extra = ga4admin.dims_check(sess=fake_sess)
        self.assertIn('cta_type', missing)
        self.assertNotIn('cta_location', missing)
        self.assertEqual(extra, ['legacy_dim'])


if __name__ == '__main__':
    unittest.main()
