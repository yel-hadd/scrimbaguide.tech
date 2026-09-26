import io
import json
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import gapi  # noqa: E402
import indexing  # noqa: E402


class FakeHTTPResponse:
    def __init__(self, status, url):
        self.status = status
        self._url = url

    def getcode(self):
        return self.status

    def geturl(self):
        return self._url

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class TestChanged(unittest.TestCase):
    def test_maps_diff_files_to_urls_and_picks_up_added_redirects(self):
        diff_calls = []

        def fake_git(*args_):
            diff_calls.append(args_)
            if args_[0] == 'diff' and '-U0' not in args_:
                return 'docs/courses/react.mdx\ndata/course-redirects.json\n'
            # -U0 diff of the redirect files
            return (
                "diff --git a/data/course-redirects.json b/data/course-redirects.json\n"
                "+ {\n"
                "+  \"from\": \"/docs/courses/old-react\",\n"
                "+  \"to\": \"/docs/courses/react/\"\n"
                "+ }\n"
            )

        with mock.patch.object(indexing, '_git', side_effect=fake_git), \
             mock.patch.object(indexing.inventory, 'routes_for_files', return_value=['/docs/courses/react/']):
            urls = indexing.changed('HEAD~5')

        self.assertIn('https://scrimbaguide.tech/docs/courses/react/', urls)
        self.assertIn('https://scrimbaguide.tech/docs/courses/old-react/', urls)
        # every url ends in a trailing slash
        for u in urls:
            self.assertTrue(u.endswith('/'), u)


class TestInspect(unittest.TestCase):
    def test_inspect_urls_shapes_rows(self):
        calls = []

        def fake_call(sess, method, url, body):
            calls.append((method, url, body))
            return {
                'inspectionResult': {
                    'indexStatusResult': {
                        'verdict': 'PASS',
                        'coverageState': 'Submitted and indexed',
                        'lastCrawlTime': '2026-09-20T00:00:00Z',
                        'googleCanonical': body['inspectionUrl'],
                    }
                }
            }

        with mock.patch.object(gapi, 'call', side_effect=fake_call):
            rows = indexing.inspect_urls(['https://scrimbaguide.tech/docs/x/'], sess=object())

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['url'], 'https://scrimbaguide.tech/docs/x/')
        self.assertEqual(rows[0]['coverage'], 'Submitted and indexed')
        self.assertEqual(len(calls), 1)

    def test_inspect_urls_handles_api_error_per_url(self):
        def fake_call(sess, method, url, body):
            raise gapi.ApiError(500, 'boom')

        with mock.patch.object(gapi, 'call', side_effect=fake_call):
            rows = indexing.inspect_urls(['https://scrimbaguide.tech/docs/x/'], sess=object())

        self.assertEqual(rows[0]['verdict'], 'ERROR')

    def test_write_inspect_results_merges_same_day_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(indexing, 'INSPECT_DIR', tmp):
                path1 = indexing.write_inspect_results(
                    [{'url': 'https://x/a/', 'verdict': 'PASS', 'coverage': 'c1', 'lastCrawl': None, 'canonical': None}],
                    la_date='2026-09-26',
                )
                path2 = indexing.write_inspect_results(
                    [{'url': 'https://x/b/', 'verdict': 'PASS', 'coverage': 'c2', 'lastCrawl': None, 'canonical': None}],
                    la_date='2026-09-26',
                )
                self.assertEqual(path1, path2)
                with open(path1) as f:
                    merged = json.load(f)
                urls = {r['url'] for r in merged}
                self.assertEqual(urls, {'https://x/a/', 'https://x/b/'})

    def test_write_inspect_results_partial_vs_full_use_separate_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(indexing, 'INSPECT_DIR', tmp):
                full_path = indexing.write_inspect_results(
                    [{'url': 'https://x/a/', 'verdict': 'PASS', 'coverage': 'c1', 'lastCrawl': None, 'canonical': None}],
                    la_date='2026-09-26', full=True,
                )
                partial_path = indexing.write_inspect_results(
                    [{'url': 'https://x/b/', 'verdict': 'PASS', 'coverage': 'c2', 'lastCrawl': None, 'canonical': None}],
                    la_date='2026-09-26', full=False,
                )
        self.assertEqual(os.path.basename(full_path), 'inspect-2026-09-26.json')
        self.assertEqual(os.path.basename(partial_path), 'inspect-pending-2026-09-26.json')
        self.assertNotEqual(full_path, partial_path)


class TestPendingUrls(unittest.TestCase):
    def test_pending_urls_needs_age_and_no_recent_inspection(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            with open(ledger, 'w') as f:
                f.write('2026-09-20\thttps://x/old/\t200\n')  # old enough, never inspected -> pending
                f.write('2026-09-25\thttps://x/new/\t200\n')  # too recent -> not pending
                f.write('2026-09-20\thttps://x/checked/\t200\n')  # old, but inspected since -> not pending

            insp_dir = tmp
            with open(os.path.join(insp_dir, 'inspect-2026-09-21.json'), 'w') as f:
                json.dump([{'url': 'https://x/checked/'}], f)

            with mock.patch.object(indexing, 'LEDGER_PATH', ledger), \
                 mock.patch.object(indexing, 'INSPECT_DIR', insp_dir):
                pending = indexing.pending_urls(min_age_days=2, today='2026-09-26')

        self.assertEqual(pending, ['https://x/old/'])


class TestSubmit(unittest.TestCase):
    def _opener(self, status_by_url):
        def opener(req, timeout=15):
            return FakeHTTPResponse(status_by_url.get(req.full_url, 200), req.full_url)
        return opener

    def test_dry_run_by_default_no_send(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            with mock.patch.object(indexing, 'LEDGER_PATH', ledger):
                result = indexing.submit(
                    ['https://x/a/'], opener=self._opener({'https://x/a/': 200}), today='2026-09-26',
                )
        self.assertTrue(result['dry_run'])
        self.assertFalse(os.path.exists(ledger))
        self.assertEqual(result['to_send'][0]['url'], 'https://x/a/')

    def test_budget_is_max_minus_todays_200_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            with open(ledger, 'w') as f:
                f.write('2026-09-26\thttps://x/already/\t200\n')
            with mock.patch.object(indexing, 'LEDGER_PATH', ledger):
                result = indexing.submit(
                    ['https://x/a/', 'https://x/b/'],
                    max_urls=2,
                    opener=self._opener({'https://x/a/': 200, 'https://x/b/': 200}),
                    today='2026-09-26',
                )
        self.assertEqual(result['budget'], 1)
        self.assertEqual(len(result['to_send']), 1)
        self.assertEqual(len(result['deferred']), 1)

    def test_dedupe_skips_urls_sent_within_7_days_unless_forced(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            with open(ledger, 'w') as f:
                f.write('2026-09-24\thttps://x/recent/\t200\n')
            with mock.patch.object(indexing, 'LEDGER_PATH', ledger):
                result = indexing.submit(
                    ['https://x/recent/'], opener=self._opener({'https://x/recent/': 200}), today='2026-09-26',
                )
                self.assertEqual(result['deduped'], ['https://x/recent/'])
                self.assertEqual(result['to_send'], [])

                result_forced = indexing.submit(
                    ['https://x/recent/'], force=True,
                    opener=self._opener({'https://x/recent/': 200}), today='2026-09-26',
                )
        self.assertEqual(len(result_forced['to_send']), 1)

    def test_head_precheck_submits_200_and_skips_everything_else(self):
        # The default opener follows redirects (and a GitHub Pages
        # client-redirect stub reports 200 anyway), so a redirect source's
        # HEAD status is 200 here, not 301/308. Only a genuine non-200 (404,
        # network error, ...) is skipped.
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            statuses = {'https://x/ok/': 200, 'https://x/redirect-source/': 200, 'https://x/gone/': 404}
            with mock.patch.object(indexing, 'LEDGER_PATH', ledger):
                result = indexing.submit(
                    list(statuses), opener=self._opener(statuses), today='2026-09-26',
                )
        actions = {p['url']: p['action'] for p in result['plan']}
        self.assertEqual(actions['https://x/ok/'], 'submit')
        self.assertEqual(actions['https://x/redirect-source/'], 'submit')
        self.assertEqual(actions['https://x/gone/'], 'skip')

    def test_deferred_urls_go_first_even_when_not_in_this_runs_urls(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            with open(ledger, 'w') as f:
                f.write('2026-09-25\thttps://x/stuck/\tdeferred\n')
            with mock.patch.object(indexing, 'LEDGER_PATH', ledger):
                result = indexing.submit(
                    ['https://x/new/'],
                    opener=self._opener({'https://x/new/': 200, 'https://x/stuck/': 200}),
                    today='2026-09-26',
                )
        self.assertEqual(result['plan'][0]['url'], 'https://x/stuck/')
        to_send_urls = [p['url'] for p in result['to_send']]
        self.assertEqual(to_send_urls[0], 'https://x/stuck/')
        self.assertIn('https://x/new/', to_send_urls)

    def test_budget_counts_ledger_rows_not_unique_urls(self):
        # The same URL force-resubmitted twice today should count twice
        # against the budget, not once.
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            with open(ledger, 'w') as f:
                f.write('2026-09-26\thttps://x/already/\t200\n')
                f.write('2026-09-26\thttps://x/already/\t200\n')
            with mock.patch.object(indexing, 'LEDGER_PATH', ledger):
                result = indexing.submit(
                    ['https://x/a/'],
                    max_urls=3,
                    opener=self._opener({'https://x/a/': 200}),
                    today='2026-09-26',
                )
        self.assertEqual(result['sent_today_already'], 2)
        self.assertEqual(result['budget'], 1)

    def test_send_appends_ledger_in_existing_format(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')

            def fake_call(sess, method, url, body):
                return {}

            with mock.patch.object(indexing, 'LEDGER_PATH', ledger), \
                 mock.patch.object(gapi, 'call', side_effect=fake_call):
                indexing.submit(
                    ['https://x/a/'], send=True, sess=object(),
                    opener=self._opener({'https://x/a/': 200}), today='2026-09-26',
                )
            with open(ledger) as f:
                line = f.read().strip()
        self.assertEqual(line, '2026-09-26\thttps://x/a/\t200')

    def test_quota_exceeded_stops_and_logs_remaining_as_deferred(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = os.path.join(tmp, 'indexing-log.tsv')
            calls = []

            def fake_call(sess, method, url, body):
                calls.append(body['url'])
                if body['url'] == 'https://x/b/':
                    raise gapi.QuotaExceeded('boom')
                return {}

            with mock.patch.object(indexing, 'LEDGER_PATH', ledger), \
                 mock.patch.object(gapi, 'call', side_effect=fake_call):
                result = indexing.submit(
                    ['https://x/a/', 'https://x/b/', 'https://x/c/'], send=True, sess=object(),
                    opener=self._opener({'https://x/a/': 200, 'https://x/b/': 200, 'https://x/c/': 200}),
                    today='2026-09-26',
                )
            with open(ledger) as f:
                lines = [l.strip() for l in f if l.strip()]

        self.assertTrue(result['quota_exceeded'])
        self.assertEqual(calls, ['https://x/a/', 'https://x/b/'])
        self.assertIn('2026-09-26\thttps://x/a/\t200', lines)
        self.assertIn('2026-09-26\thttps://x/b/\tdeferred', lines)
        self.assertIn('2026-09-26\thttps://x/c/\tdeferred', lines)


if __name__ == '__main__':
    unittest.main()
