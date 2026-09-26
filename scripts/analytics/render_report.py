#!/usr/bin/env python3
"""Renders the monthly Site Report HTML from a snapshot + a narrative JSON.

Usage: render_report.py --snapshot P --narrative N.json
       --template .claude/skills/site-analytics/assets/site-report.html
       --out .seo-cache/reports/site-report.html

`strip_money` recursively removes every money-shaped key so no dollar figure
reaches the published Artifact. The merged {snapshot, narrative} object is
injected into <script type="application/json" id="data"> in the template.
"""
from __future__ import annotations

import argparse
import json
import sys

MONEY_KEYS = {'balances', 'transactions', 'new_transactions', 'payouts', 'new_payout', 'refund_flags', 'money', 'raw_excerpt'}


def strip_money(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in MONEY_KEYS or k.endswith('_usd'):
                continue
            out[k] = strip_money(v)
        return out
    if isinstance(obj, list):
        return [strip_money(v) for v in obj]
    return obj


def render(snapshot, narrative, template_html):
    merged = strip_money({'snapshot': snapshot, 'narrative': narrative})
    payload = (json.dumps(merged)
               .replace('<', '\\u003c')
               .replace('>', '\\u003e')
               .replace('&', '\\u0026')
               .replace(' ', '\\u2028')
               .replace(' ', '\\u2029'))
    marker = '<script type="application/json" id="data">'
    if marker not in template_html:
        raise ValueError('template missing <script type="application/json" id="data">')
    before, rest = template_html.split(marker, 1)
    _, after = rest.split('</script>', 1)
    return f'{before}{marker}{payload}</script>{after}'


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--snapshot', required=True)
    ap.add_argument('--narrative', required=True)
    ap.add_argument('--template', required=True)
    ap.add_argument('--out', required=True)
    args = ap.parse_args(argv)

    snapshot = json.load(open(args.snapshot))
    narrative = json.load(open(args.narrative))
    template_html = open(args.template).read()
    html = render(snapshot, narrative, template_html)
    with open(args.out, 'w') as f:
        f.write(html)
    print(f'wrote {args.out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
