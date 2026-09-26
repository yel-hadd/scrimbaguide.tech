import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import render_report  # noqa: E402


class TestStripMoney(unittest.TestCase):
    def test_removes_money_keys_recursively(self):
        obj = {
            'cumulative': {'visitors': 10, 'sales_usd': 500, 'commission_usd': 50},
            'nested': {'payouts': [{'amount_usd': 1, 'money': True}], 'balances': 9},
            'new_transactions': 3, 'refund_flags': [], 'raw_excerpt': 'secret text',
            'safe': 'keep me',
        }
        out = render_report.strip_money(obj)
        flat = json.dumps(out)
        for bad in ('_usd', 'balances', 'transactions', 'payouts', 'refund_flags', 'raw_excerpt'):
            self.assertNotIn(bad, flat, bad)
        self.assertEqual(out['safe'], 'keep me')
        self.assertEqual(out['cumulative']['visitors'], 10)


class TestRender(unittest.TestCase):
    def test_output_html_has_no_money_fields(self):
        snapshot = {'site': {'cur': {'sessions': 100}}, 'affiliate': {'scrimba_affiliate': {
            'cumulative': {'visitors': 5, 'sales_usd': 900}, 'money': True}}}
        narrative = {'headline': 'ok', 'findings': [], 'decisions': []}
        template = '<html><body><script type="application/json" id="data">{}</script></body></html>'
        html = render_report.render(snapshot, narrative, template)
        self.assertNotIn('sales_usd', html)
        self.assertNotIn('"money"', html)
        self.assertIn('"sessions": 100', html)

    def test_missing_marker_raises(self):
        with self.assertRaises(ValueError):
            render_report.render({}, {}, '<html></html>')

    def test_script_close_tag_in_data_is_escaped(self):
        snapshot = {'search_terms': [{'term': '</script><img src=x onerror=1>', 'count': 1}]}
        narrative = {'headline': 'ok'}
        template = '<html><body><script type="application/json" id="data">{}</script></body></html>'
        html = render_report.render(snapshot, narrative, template)
        self.assertNotIn('</script><img', html)
        marker = '<script type="application/json" id="data">'
        before, rest = html.split(marker, 1)
        payload_text, after = rest.split('</script>', 1)
        self.assertEqual(payload_text.count('</script>'), 0)
        data = json.loads(payload_text)
        self.assertEqual(data['snapshot']['search_terms'][0]['term'], '</script><img src=x onerror=1>')


if __name__ == '__main__':
    unittest.main()
