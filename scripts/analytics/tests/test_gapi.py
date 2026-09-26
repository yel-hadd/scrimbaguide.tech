import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import gapi  # noqa: E402


class FakeResp:
    def __init__(self, status, body=None, headers=None):
        self.status_code = status
        self._body = body if body is not None else {}
        self.headers = headers or {}
        self.content = b'x'
        self.text = str(self._body)

    def json(self):
        return self._body


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, json=None):
        self.calls.append((method, url, json))
        return self.responses.pop(0)


class TestCall(unittest.TestCase):
    def test_retries_429_503_then_succeeds(self):
        sess = FakeSession([
            FakeResp(429, {'error': {'message': 'busy'}}),
            FakeResp(503, {'error': {'message': 'unavailable'}}),
            FakeResp(200, {'ok': True}),
        ])
        sleeps = []
        result = gapi.call(sess, 'GET', 'https://example.com/x', _sleep=sleeps.append)
        self.assertEqual(result, {'ok': True})
        self.assertEqual(len(sess.calls), 3)
        self.assertEqual(len(sleeps), 2)

    def test_daily_quota_429_raises_without_retry(self):
        sess = FakeSession([
            FakeResp(429, {'error': {'status': 'RESOURCE_EXHAUSTED', 'message': 'Quota exceeded for quota metric daily requests'}}),
        ])
        with self.assertRaises(gapi.QuotaExceeded):
            gapi.call(sess, 'POST', 'https://analyticsdata.googleapis.com/v1beta/x:runReport', _sleep=lambda s: None)
        self.assertEqual(len(sess.calls), 1)

    def test_indexing_429_always_quota_exceeded(self):
        sess = FakeSession([FakeResp(429, {'error': {'message': 'rate limited'}})])
        with self.assertRaises(gapi.QuotaExceeded):
            gapi.call(sess, 'POST', 'https://indexing.googleapis.com/v3/urlNotifications:publish', _sleep=lambda s: None)

    def test_other_error_raises_api_error(self):
        sess = FakeSession([FakeResp(400, {'error': {'message': 'bad request'}})])
        with self.assertRaises(gapi.ApiError):
            gapi.call(sess, 'POST', 'https://example.com/x', _sleep=lambda s: None)


class TestUtilities(unittest.TestCase):
    def test_la_date_crosses_midnight_utc(self):
        self.assertEqual(gapi.la_date('2026-09-26T02:00:26Z'), '2026-09-25')

    def test_la_date_same_day(self):
        self.assertEqual(gapi.la_date('2026-09-26T20:00:00Z'), '2026-09-26')

    def test_humans_filter_exact_shape(self):
        f = gapi.humans_filter()
        self.assertEqual(f, {
            'andGroup': {
                'expressions': [
                    {'notExpression': {'filter': {'fieldName': 'country', 'inListFilter': {'values': gapi.BOT}}}},
                    {'filter': {'fieldName': 'hostName', 'stringFilter': {'matchType': 'EXACT', 'value': gapi.HOST}}},
                ]
            }
        })


if __name__ == '__main__':
    unittest.main()
