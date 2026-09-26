# Report templates

Two outputs: the weekly note (written by `/site-health`, plain text in chat and in `.seo-cache/reports/<routine>-<date>.md`) and the monthly Site Report (a narrative JSON rendered into `assets/site-report.html`). Neither ever carries a money figure: ratios and counts only.

## Weekly note

Fill every `<...>`. Keep it to one screen. A line with nothing to say is dropped, except Checks and Due.

```
Week of <date>: <OK|WATCH|ACT>
Affiliate clicks <n> (Scrimba <n> / Udemy <n>), <±%> vs prev week; human sessions <n>; AI <n> (Copilot <n>); Organic <n>. <epoch warning if any>
Decisions for you (max 5):
[ACT] <one line>. Evidence: <numbers>. If yes: <exact action>. If no: <what happens>.
Done automatically (after your one approval): <n> annotations (<titles>); <n> URLs to Indexing API; readings saved.
Scrimbassadors: visitors/signups/subs +<n>/+<n>/+<n> since <date>; visitors per GA4 click <ratio>; terms <unchanged|CHANGED>.
Udemy (impact): clicks <n> vs GA4 <n> (<ratio>) | skipped: needs owner.
Watch: ...
Checks: tracking OK | index WATCH | links OK | deploys OK | consent OK | dims OK | catalog n/a
Due: <items from site-health-state due[] and analytics-experiments.md>
```

Where each number comes from in the snapshot:

| Line | Fields |
|---|---|
| Affiliate clicks, split, change | `site.week.aff_clicks`, `site.week.aff_scrimba`, `site.week.aff_udemy`, against `site.prev_week` |
| Human sessions | `site.week.sessions` |
| AI, Copilot | `ai_sources[]` (sum, and the `is_copilot` rows); `channels[]` for Organic — both are 28-day (`ga4`/`cur` window) totals, not `week`-scoped; label them "AI (28d)" etc. next to the week-scoped affiliate/session numbers |
| Epoch warning | `epoch_warnings[]` whose window is `week` or `prev_week` |
| Scrimbassadors | `affiliate.scrimba_affiliate.delta`, `affiliate.reconciliation.scrimba.ratio`, `affiliate.scrimba_affiliate.terms_changed` |
| Udemy | `affiliate.udemy_impact.clicks`, `affiliate.reconciliation.udemy` |
| Checks | `/site-health` threshold table over `health.*`, `sources.*` |

Status of the first line: `ACT` if any check or decision is ACT, else `WATCH` if any is WATCH, else `OK`. If `site.week.aff_scrimba` is `null`, write "split unavailable" instead of the two counts.

## Monthly Site Report

`/site-analytics monthly` writes a narrative JSON to the scratchpad. `scripts/analytics/render_report.py` then strips every money key from the snapshot (`*_usd`, `balances`, `transactions`, `new_transactions`, `payouts`, `new_payout`, `refund_flags`, `money`, `raw_excerpt`), merges the narrative and injects the result into `<script type="application/json" id="data">` of `assets/site-report.html`.

### Narrative JSON

```json
{
  "headline": "One sentence: the month's verdict, with the one number that proves it.",
  "findings": [
    {
      "title": "Student discount page earns, pro-vs-free leaks",
      "evidence": "student-discount 3.1 per 100 (9 clicks, 290 sessions); pro-vs-free 0.6 per 100 (1 click, 160 sessions)",
      "action": "Move the pricing CTA above the comparison table on /docs/pricing/pro-vs-free/",
      "recheck_on": "2026-11-23"
    }
  ],
  "decisions": [
    {
      "severity": "ACT",
      "question": "Merge the two Udemy React posts?",
      "evidence": "Both rank 8 to 14 for 'best udemy react course', 55/45 impression split",
      "if_yes": "Redirect the weaker post, keep the stronger slug",
      "if_no": "Both stay on page 2"
    }
  ]
}
```

The numbers above are illustrative, not real readings.

Rules:

- At most 5 findings and at most 3 decisions. Every finding ends in an action with a page, a metric and a `recheck_on` date (YYYY-MM-DD, at least 28 days out for page or placement tests).
- Every rate in `evidence` has its raw counts beside it and meets the 30-session floor.
- A finding whose windows cross a `never-across` epoch names the epoch in `evidence`.
- No money figures, no personal data, nothing from the Scrimbassadors transactions or payouts tabs.
- Each finding acted on becomes a line in memory `analytics-experiments.md`.

### What the template shows

The template reads the injected object. It accepts `{snapshot, narrative}`, or a snapshot with `narrative` merged in, or `headline`/`findings`/`decisions` at the top level. It hides any section whose data is `null` or empty and says why.

| Section | Data |
|---|---|
| Header | `narrative.headline`, `generated_at`, `windows.ga4`, `windows.gsc`, `sources.*.status` badges |
| Epoch warnings | `epoch_warnings[]` |
| KPI tiles | `site.cur` versus `site.prev`: sessions, engaged sessions, affiliate clicks (Scrimba / Udemy), clicks per 100 sessions |
| 28-day sparkline | `daily[]` (sessions and affiliate clicks) |
| Channels and AI | `channels[]`, `ai_sources[]` (Copilot on its own row) |
| Content groups | `content_groups[]` |
| Pages that earn | `pages[]` with `ga4.aff_clicks > 0`, top 10 by clicks |
| Leaks | `leaks[]`, top 10 |
| Placements | `placements[]`, shown only from 2026-10-24 (before that: "too early") |
| Search terms | `search_terms[]` with outcome `no-results` |
| Index | `health.index.counts`, `money_not_indexed` |
| Funnel ratios | `affiliate.reconciliation.scrimba.ratio`, `affiliate.reconciliation.udemy.ratio`, `health.reconciliation.ratio` |
| Annotations timeline | `annotations[]` (system ones dimmed) |
| Findings and decisions | `narrative.findings[]`, `narrative.decisions[]` |

The main session publishes the rendered file as the private Artifact "Site Report", republished at the URL in memory `site-report-artifact`. The GA4 collection "Scrimba Guide Business" stays the owner's primary dashboard.
