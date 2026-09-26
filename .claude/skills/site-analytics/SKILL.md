---
name: site-analytics
description: Answer questions about scrimbaguide.tech traffic, conversions, SEO and affiliate funnels from the shared snapshot and GA4/GSC: how is X doing, did PR N work, leaks, AI traffic, CTA placement, reconciliation, the monthly Site Report, annotation rules.
---

# Site analytics

Answers come from one committed contract and one cached snapshot. `scripts/analytics/tracking.json` holds the property, the bot countries, the hostname, the AI regex, the custom dimension registry and the tracking epochs. `.seo-cache/analytics-snapshot.json` (built by `scripts/analytics/snapshot.py`, `schema_version: 1`) holds every pre-computed section. Read the snapshot first and query GA4 only for what it does not already answer.

The repo is public. Clicks are the optimization metric. Money figures (sales, commission, balances, payouts, earnings) never go into an answer, a PR, memory, a GA4 annotation, a committed file or the Artifact, unless the owner asks for them in the current chat.

## Modes

- `question` (default): one question, one answer. Answer first, then the numbers, then one next step.
- `before-after <PR#|YYYY-MM-DD>`: did a change move a metric. Procedure below.
- `monthly`: the Site Report. Procedure below.

Annotations: this skill owns the rules (`references/annotation-rules.md`) and lists `health.unannotated_merges` when it sees them. It never creates one. `/site-health` plans and applies them.

## Data access, in this order

1. `python3 scripts/analytics/snapshot.py --max-age 24`, then read `.seo-cache/analytics-snapshot.json`. `.seo-cache/summary.txt` is the short human version. `--days` (GA4, default 28) and `--gsc-days` (default 90) are separate windows; pass them when the question needs another span.
2. analytics-mcp `run_report` for drill-downs. Use the bodies in `references/recipes.md` as written, snake_case field names, and always the Humans filter from `references/ga4-schema.md`. Property id `523469938`.
3. A one-off script in the scratchpad that imports `scripts/analytics/gapi.py` (`gapi.session(gapi.RO)` or `gapi.session(gapi.GSC)`, then `gapi.ga_batch(sess, ...)`, `gapi.gsc_query(sess, ...)`, `gapi.humans_filter()`). Never commit it.

GSC has no MCP: it comes from the snapshot (`pages[].gsc`, `pages[].top_queries`, `gaps`, `cannibalization`) or from `gapi.gsc_query` in a scratch script. The service-account key is `secrets/gsc-service-account.json`; never print or copy it.

## Ground rules (mandatory)

1. Apply the Humans filter to every GA4 query. The one exception is the host health check (recipe 8a), which is unfiltered on purpose (no country or hostname filter), so a hostname-guard leak from human countries is visible too.
2. Read `snapshot.epoch_warnings` and the `epochs` in `tracking.json` before comparing two windows. A comparison that crosses a `never-across` epoch says so in the answer's first line, naming the epoch and its date.
3. Quote a rate only at 30 or more sessions (`min_sessions`). Rates are per 100 sessions, with the raw counts beside them ("2.4 per 100, 5 clicks on 208 sessions"). A snapshot `*_per_100` or `per_1000_views` of `null` means under the floor: say "too few sessions", never compute it yourself. A placement or page test needs at least 28 days.
4. Report Copilot on its own line (`is_copilot`). Never fold it into an AI conversion rate.
5. Classify AI traffic with the `ai_source_regex` on `sessionSource`, never with the default channel group or the "Business channels" group.
6. Never filter GSC by country.
7. From `udemy_affiliate` (2026-09-26) on, split affiliate clicks into Scrimba and Udemy by `destination_type` (`udemy` versus everything else). For windows that start earlier, say the split is unavailable and use `health.reconciliation.pre_step5_udemy_em_clicks`.
8. Dates are America/Los_Angeles. GA4 windows end yesterday; GSC windows end today minus 3 days.
9. If any `sources.<x>.status` is not `ok`, say which and what it means (`partial` lists `missing_dimensions`; `stale` means a reading older than 10 days; `not_collected` means nobody has captured it yet). A `null` section is "no data", never zero.
10. Clicks are the metric. See the money rule above.
11. Scrimbassadors has one referral id and no sub-IDs, and our links open with `rel=noreferrer`, so Scrimba never sees our pages as the referrer. Per-page attribution comes only from GA4. `affiliate.reconciliation.landing_join` is not computed yet and is always `null`; the approximate per-page join is manual (recipe 9). Scrimba's visitor count includes `?via=` traffic that did not come from the site.

## Before/after procedure

1. Change date: the GA4 annotation for the PR (`snapshot.annotations[]`, or analytics-mcp `list_property_annotations`), falling back to `git log --first-parent main` for the merge commit, converted to LA time.
2. Two equal windows of 14 or 28 days. Skip deploy day through day 3: the "after" window starts on day 4.
3. Changed routes: the PR's files mapped with `inventory.routes_for_files`. Control: the site minus those routes.
4. Pull both windows with recipe 2. Report the difference-in-differences: (after/before for the changed routes) minus (after/before for the control), per 100 sessions, with raw counts.
5. Name every epoch that falls between the windows. If one is `never-across` for the metric, the verdict is "not measurable across <epoch>" and the answer proposes the first date a clean comparison is possible.

## Monthly procedure

1. Read the snapshot (`--days 28 --gsc-days 90`).
2. List the due entries of memory `analytics-experiments.md` first and give each a verdict: worked, did not, too early (under 28 days or 30 sessions).
3. Write at most 5 findings. Each ends in an action with a page, a metric and a re-check date. Findings come from `leaks`, `cannibalization`, `gaps`, `search_terms` (outcome `no-results`), `ai_sources`, `placements` (only from 2026-10-24) and `health`. Before proposing a merge or redirect, cross-check `.seo-cache/redirects.json` (or `pages[].redirect_to`) so a finding never asks to consolidate a page that is already a redirect source; `redirect_lag` lists pairs GSC still shows split after 90 days.
4. Write the narrative JSON (`references/report-template.md`) to the scratchpad and run:
   `python3 scripts/analytics/render_report.py --snapshot .seo-cache/analytics-snapshot.json --narrative <scratch>/narrative.json --template .claude/skills/site-analytics/assets/site-report.html --out .seo-cache/reports/site-report.html`
   `render_report.py` strips every money key before injecting the data.
5. The main session publishes `.seo-cache/reports/site-report.html` as the private Artifact "Site Report", republished at the URL stored in memory `site-report-artifact`. On the first run it creates the Artifact and records the URL there.
6. The GA4 collection "Scrimba Guide Business" stays the owner's primary dashboard. The Site Report is Claude's monthly reading of it, not a replacement.

## Iterate loop

Every change made because of a finding gets a line in memory `analytics-experiments.md`: `{date, page, change, metric, baseline, recheck_on}`. Only the main session writes it; a subagent returns the line for the main session to add. Every run of this skill lists the due entries (`recheck_on` on or before today) first.

## Model routing

Sonnet runs the queries, drill-downs and recipe checks. Opus writes the synthesis and the monthly narrative.

## References

- `references/recipes.md`: 14 recipes. Each names the snapshot field to read first, then the exact `run_report` body for the drill-down.
- `references/ga4-schema.md`: events as shipped, parameters, the closed `cta_type` list, `destination_type` values, the key event, the Humans filter JSON, the AI regex, the AI-classifier gap, known GA4 bugs and API gotchas.
- `references/report-template.md`: the weekly note (used by `/site-health`), the monthly narrative JSON and what the Site Report shows.
- `references/annotation-rules.md`: what qualifies, `KIND_RULES`, the format, colors, the `analytics-note:` PR line, grouping, and the `ga4admin.py` commands.
- `assets/site-report.html`: the Site Report template, filled by `render_report.py`.
