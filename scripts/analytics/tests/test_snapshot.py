import argparse
import os
import sys
import unittest
from datetime import date
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import gapi  # noqa: E402
import snapshot  # noqa: E402


class TestWindows(unittest.TestCase):
    def test_ga4_window_ends_yesterday(self):
        w = snapshot.build_windows(28, 90, today=date(2026, 10, 5))
        self.assertEqual(w['ga4']['end'], '2026-10-04')
        self.assertEqual(w['ga4']['start'], '2026-09-07')

    def test_gsc_window_ends_today_minus_3(self):
        w = snapshot.build_windows(28, 90, today=date(2026, 10, 5))
        self.assertEqual(w['gsc']['end'], '2026-10-02')

    def test_week_and_prev_week_are_distinct_7_day_windows(self):
        w = snapshot.build_windows(28, 90, today=date(2026, 10, 5))
        self.assertEqual(w['week']['start'], '2026-09-28')
        self.assertEqual(w['prev_week']['end'], '2026-09-27')


class TestBusinessChannel(unittest.TestCase):
    def test_ai_source_wins_over_medium(self):
        self.assertEqual(snapshot.business_channel('chatgpt.com', 'referral'), 'AI')

    def test_copilot_flagged_separately(self):
        self.assertEqual(snapshot.business_channel('copilot.microsoft.com', 'referral'), 'Copilot')

    def test_organic(self):
        self.assertEqual(snapshot.business_channel('google', 'organic'), 'Organic Search')

    def test_referral(self):
        self.assertEqual(snapshot.business_channel('someblog.com', 'referral'), 'Referral')

    def test_social_referral(self):
        self.assertEqual(snapshot.business_channel('facebook.com', 'referral'), 'Social')

    def test_social_subdomain_match(self):
        self.assertEqual(snapshot.business_channel('m.facebook.com', 'referral'), 'Social')

    def test_referral_not_matched_by_social_substring(self):
        self.assertEqual(snapshot.business_channel('microsoft.com', 'referral'), 'Referral')
        self.assertEqual(snapshot.business_channel('producthunt.com', 'referral'), 'Referral')
        self.assertEqual(snapshot.business_channel('dropbox.com', 'referral'), 'Referral')
        self.assertEqual(snapshot.business_channel('box.com', 'referral'), 'Referral')
        self.assertEqual(snapshot.business_channel('yandex.com', 'referral'), 'Referral')

    def test_direct(self):
        self.assertEqual(snapshot.business_channel('(direct)', '(none)'), 'Direct')

    def test_other(self):
        self.assertEqual(snapshot.business_channel('some-app', 'push'), 'Other')


class TestPer100(unittest.TestCase):
    def test_null_under_min_sessions(self):
        self.assertIsNone(snapshot.per_100(5, 29))

    def test_computed_at_min_sessions(self):
        self.assertEqual(snapshot.per_100(3, 30), 10.0)

    def test_null_when_sessions_none(self):
        self.assertIsNone(snapshot.per_100(3, None))


class TestNormPath(unittest.TestCase):
    def test_strips_query_and_hash_and_adds_slash(self):
        self.assertEqual(snapshot.norm_path('https://scrimbaguide.tech/docs/pricing?x=1#y'), '/docs/pricing/')

    def test_keeps_trailing_slash(self):
        self.assertEqual(snapshot.norm_path('/docs/pricing/'), '/docs/pricing/')


class TestStripMoney(unittest.TestCase):
    def test_keeps_usd_when_money_true(self):
        reading = {'money': True, 'as_of': 'x', 'cumulative': {'visitors': 1, 'sales_usd': 500}}
        out = snapshot.strip_money(reading)
        self.assertEqual(out['cumulative']['sales_usd'], 500)

    def test_nulls_usd_when_money_false(self):
        reading = {'money': False, 'as_of': 'x', 'cumulative': {'visitors': 1, 'sales_usd': 500}}
        out = snapshot.strip_money(reading)
        self.assertIsNone(out['cumulative']['sales_usd'])
        self.assertEqual(out['cumulative']['visitors'], 1)


class TestIsStale(unittest.TestCase):
    def test_recent_reading_not_stale(self):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        self.assertFalse(snapshot.is_stale(now))

    def test_old_reading_is_stale(self):
        self.assertTrue(snapshot.is_stale('2020-01-01T00:00:00Z'))

    def test_malformed_is_stale(self):
        self.assertTrue(snapshot.is_stale('not-a-date'))


class TestRenderSummarySmoke(unittest.TestCase):
    def test_render_summary_writes_status_and_sections(self):
        snap = {
            'generated_at': '2026-10-05T00:00:00Z',
            'sources': {'ga4': {'status': 'ok', 'error': None}, 'gsc': {'status': 'ok', 'error': None}},
            'epoch_warnings': [{'key': 'analytics_step5', 'window': 'ga4', 'text': 'pending'}],
            'destinations': [], 'cannibalization': [], 'search_terms': [],
            'affiliate': {'reconciliation': {'scrimba': {'ratio': None}, 'udemy': {'ratio': None}}},
            'pages': [], 'leaks': [], 'placements': [], 'gaps': [],
        }
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            orig = snapshot.SUMMARY_PATH
            snapshot.SUMMARY_PATH = os.path.join(d, 'summary.txt')
            try:
                text = snapshot.render_summary(snap)
                self.assertIn('ga4: ok', text)
                self.assertIn('analytics_step5', text)
                self.assertTrue(os.path.exists(snapshot.SUMMARY_PATH))
            finally:
                snapshot.SUMMARY_PATH = orig


def _ga4_report(dim_names, met_names, rows):
    """Builds a raw batchRunReports-shaped report from (dim_values, met_values)
    row tuples, matching what gapi.rows() consumes."""
    out_rows = []
    for dims, mets in rows:
        out_rows.append({
            'dimensionValues': [{'value': v} for v in dims],
            'metricValues': [{'value': str(v)} for v in mets],
        })
    return {
        'dimensionHeaders': [{'name': n} for n in dim_names],
        'metricHeaders': [{'name': n} for n in met_names],
        'rows': out_rows,
        'rowCount': len(out_rows),
    }


def _gsc_side_effect(sess, start, end, dims, row_limit=25000):
    if dims == ['page', 'query']:
        return [{'keys': ['https://scrimbaguide.tech/docs/foo/', 'foo query'], 'clicks': 5, 'impressions': 100, 'position': 3.0}]
    if dims == ['page']:
        return [{'keys': ['https://scrimbaguide.tech/docs/foo/'], 'clicks': 5, 'impressions': 100, 'position': 3.0}]
    if dims == ['query']:
        return [{'keys': ['foo query'], 'clicks': 5, 'impressions': 100, 'position': 3.0}]
    return []


class TestRunSourcesFailSoft(unittest.TestCase):
    """Exercises _run_sources end to end with a fake GA4/GSC layer."""

    def _base_args(self):
        return argparse.Namespace(days=28, gsc_days=90, dry_run=False, money=False)

    def _patch_common(self):
        return [
            mock.patch('snapshot.inventory.main', return_value=[]),
            mock.patch('snapshot.ga4admin.annotations_list', return_value=[]),
            mock.patch('gapi.session', return_value=mock.MagicMock()),
            mock.patch('gapi.call', return_value={'customDimensions': [
                {'parameterName': d['parameter']} for d in gapi.TRACKING['custom_dimensions']
            ]}),
            mock.patch('gapi.gsc_query', side_effect=_gsc_side_effect),
            mock.patch('gapi.gsc_sitemaps', return_value=[]),
        ]

    def test_ga4_error_gsc_ok_gives_null_ga4_sections(self):
        patches = self._patch_common()
        patches.append(mock.patch('gapi.ga_batch', side_effect=RuntimeError('ga4 down')))
        for p in patches:
            p.start()
        self.addCleanup(mock.patch.stopall)

        snap = {'sources': {}}
        result, ok = snapshot._run_sources(self._base_args(), snap)

        self.assertTrue(ok)
        self.assertEqual(result['sources']['ga4']['status'], 'error')
        self.assertEqual(result['sources']['gsc']['status'], 'ok')
        self.assertIsNone(result['site'])
        self.assertIsNone(result['daily'])
        self.assertIsNone(result['channels'])
        self.assertIsNone(result['ai_sources'])
        self.assertIsNone(result['content_groups'])
        self.assertIsNone(result['placements'])
        self.assertIsNone(result['destinations'])
        self.assertIsNone(result['leaks'])
        self.assertIsNone(result['search_terms'])
        self.assertIsNone(result['advisor'])
        self.assertIsInstance(result['gaps'], list)
        self.assertIsInstance(result['cannibalization'], list)
        for p in result['pages']:
            self.assertIsNone(p['ga4'])
            self.assertIsNotNone(p['gsc'])

    def test_gsc_error_ga4_ok_gives_null_gsc_sections(self):
        patches = self._patch_common()
        r1 = _ga4_report([], ['sessions', 'engagedSessions', 'totalUsers', 'screenPageViews'],
                          [(['cur'], [50, 40, 45, 60]), (['prev'], [40, 30, 35, 50]),
                           (['week'], [50, 40, 45, 60]), (['prev_week'], [40, 30, 35, 50])])
        # the rows() helper reads a 'dateRange' pseudo-dimension header the
        # real GA4 API adds automatically for multi-range requests without an
        # explicit dimension; the fixture below adds it explicitly so rows()
        # (which only zips declared dimensionHeaders) exposes it the same way.
        r1 = {
            'dimensionHeaders': [{'name': 'dateRange'}],
            'metricHeaders': [{'name': n} for n in ('sessions', 'engagedSessions', 'totalUsers', 'screenPageViews')],
            'rows': [
                {'dimensionValues': [{'value': 'cur'}], 'metricValues': [{'value': '50'}, {'value': '40'}, {'value': '45'}, {'value': '60'}]},
                {'dimensionValues': [{'value': 'prev'}], 'metricValues': [{'value': '40'}, {'value': '30'}, {'value': '35'}, {'value': '50'}]},
                {'dimensionValues': [{'value': 'week'}], 'metricValues': [{'value': '50'}, {'value': '40'}, {'value': '45'}, {'value': '60'}]},
                {'dimensionValues': [{'value': 'prev_week'}], 'metricValues': [{'value': '40'}, {'value': '30'}, {'value': '35'}, {'value': '50'}]},
            ],
        }
        empty = {'dimensionHeaders': [], 'metricHeaders': [], 'rows': []}
        reports = [r1, empty, empty, empty, empty, empty, empty, empty, empty, empty, empty, empty, empty]
        patches.append(mock.patch('gapi.ga_batch', return_value=reports))
        patches.append(mock.patch('gapi.gsc_query', side_effect=RuntimeError('gsc down')))
        for p in patches:
            p.start()
        self.addCleanup(mock.patch.stopall)

        snap = {'sources': {}}
        result, ok = snapshot._run_sources(self._base_args(), snap)

        self.assertTrue(ok)
        self.assertEqual(result['sources']['gsc']['status'], 'error')
        self.assertIsNone(result['gaps'])
        self.assertIsNone(result['cannibalization'])
        self.assertIsNone(result['leaks'])
        self.assertIsNotNone(result['site'])
        self.assertEqual(result['site']['cur']['sessions'], 50)
        for p in result['pages']:
            self.assertIsNone(p['gsc'])

    def test_both_fail_returns_not_ok_and_leaves_caller_to_skip_write(self):
        patches = self._patch_common()
        patches.append(mock.patch('gapi.ga_batch', side_effect=RuntimeError('ga4 down')))
        patches.append(mock.patch('gapi.gsc_query', side_effect=RuntimeError('gsc down')))
        for p in patches:
            p.start()
        self.addCleanup(mock.patch.stopall)

        snap = {'sources': {}}
        result, ok = snapshot._run_sources(self._base_args(), snap)
        self.assertFalse(ok)
        self.assertNotIn('site', result)


class TestContentGroupsAggregation(unittest.TestCase):
    def test_content_groups_sessions_and_leak_classification_via_run_sources(self):
        patches = [
            mock.patch('snapshot.inventory.main', return_value=[
                {'route': '/docs/courses/react/', 'file': 'docs/courses/react.mdx', 'kind': 'docs',
                 'content_group': 'courses', 'money_page': False},
            ]),
            mock.patch('snapshot.ga4admin.annotations_list', return_value=[]),
            mock.patch('gapi.session', return_value=mock.MagicMock()),
            mock.patch('gapi.call', return_value={'customDimensions': [
                {'parameterName': d['parameter']} for d in gapi.TRACKING['custom_dimensions']
            ]}),
            mock.patch('gapi.gsc_sitemaps', return_value=[]),
        ]

        def gsc_side_effect(sess, start, end, dims, row_limit=25000):
            if dims == ['page']:
                return [{'keys': ['https://scrimbaguide.tech/docs/courses/react/'], 'clicks': 1, 'impressions': 50, 'position': 5.0}]
            return []
        patches.append(mock.patch('gapi.gsc_query', side_effect=gsc_side_effect))

        r3 = {
            'dimensionHeaders': [{'name': 'landingPage'}, {'name': 'sessionSource'}, {'name': 'sessionMedium'}, {'name': 'dateRange'}],
            'metricHeaders': [{'name': 'sessions'}, {'name': 'engagedSessions'}],
            'rows': [
                {'dimensionValues': [{'value': '/docs/courses/react/'}, {'value': 'google'}, {'value': 'organic'}, {'value': 'cur'}],
                 'metricValues': [{'value': '40'}, {'value': '30'}]},
            ],
        }
        empty = {'dimensionHeaders': [], 'metricHeaders': [], 'rows': []}
        reports = [empty, empty, r3, empty, empty, empty, empty, empty, empty, empty, empty, empty, empty]
        patches.append(mock.patch('gapi.ga_batch', return_value=reports))

        for p in patches:
            p.start()
        self.addCleanup(mock.patch.stopall)

        snap = {'sources': {}}
        args = argparse.Namespace(days=28, gsc_days=90, dry_run=False, money=False)
        result, ok = snapshot._run_sources(args, snap)

        self.assertTrue(ok)
        courses_group = next(g for g in result['content_groups'] if g['group'] == 'courses')
        self.assertEqual(courses_group['sessions'], 40)


if __name__ == '__main__':
    unittest.main()
