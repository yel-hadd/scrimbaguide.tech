# Capability matrix

What the site can do for itself, where each capability runs, and what always waits for the owner. "Main session" means the `/site-health` (or `/site-analytics`) conversation the owner is in; "site-ops" is the Sonnet agent it launches.

| # | Capability | Runs in | Mode | Cadence | Always needs the owner |
|---|---|---|---|---|---|
| 1 | GA4 + GSC snapshot | `snapshot.py` (site-ops, /site-analytics, /daily-post) | read; writes `.seo-cache` | weekly, per daily-post, on demand | none |
| 2 | Ad hoc analysis, monthly report | /site-analytics (main session) + analytics-mcp | read; private Artifact published by the main session | on demand, monthly | none |
| 3 | Tracking health (hosts, (not set), canary, slashes, content_group, reconciliation) | snapshot `health` + site-ops thresholds | read; fix PR for code | weekly | merging; any GA4 UI change (filters, key events, channel group, retention, Internal Traffic activation) |
| 4 | Custom dimension registry | `ga4admin.py dims check` / `dims create --yes` | check is read-only; create is a GA4 write | check weekly | always for create (limited slots, no backfill); never in a routine |
| 5 | GA4 annotations for merged PRs | site-ops `plan` → main session `apply` | additive GA4 write, one approval per routine | post-merge, weekly sweep | editing or deleting any annotation; approving the step 9 backfill list |
| 6 | Tracking epochs | `tracking.json`; ops PR only on a date mismatch | repo PR | on tracking merges | merging |
| 7 | Indexing API (best-effort; Google documents it only for JobPosting and BroadcastEvent) | site-ops plan → main `indexing.py submit --send` | external write, up to 200 per LA day (Google's quota), shared with use-apify, stops on the first 429 | post-merge, weekly | more than 200/day or any sitemap-wide resubmission |
| 8 | URL Inspection | `indexing.py inspect` | read (2,000/day) | pending weekly, full monthly, 10-21 to 11-04 re-check | none |
| 9 | Deploy and live-route check | site-ops (`gh run list`, HEAD, sitemap) | read | post-merge, weekly | rerun, revert or rollback |
| 10 | Catalog drift | scratch scrape + env build-data + `catalog-diff.mjs` | read; overrides-only PR | monthly | regenerate / `generate:data`; merge; prose changes |
| 11 | Outbound affiliate link health | `links.py --outbound` | read; slug-rename PR | monthly | creating impact.com links |
| 12 | Internal links / 404s | `links.py --internal` + `health.not_found` (+ a build when idle) | read; link-fix PR | monthly | new redirects or URL changes |
| 13 | Cannibalization / leaks | snapshot + site-ops | read | monthly | every merge, refresh, redirect or CTA move |
| 14 | Content gates on main | site-ops in a worktree | read | monthly | none |
| 15 | Scrimbassadors totals | site-ops in Chrome (navigate + read) | read; writes `secrets/ops` jsonl (counts) | weekly | `--money`; anything under payout details, profile or settings; Discord |
| 16 | Scrimbassadors detail (Visitors landing join, transactions, payouts) | main session in Chrome, owner-assisted (tab clicks) | read; writes `secrets/ops` | monthly | present for the run; money opt-in |
| 17 | Affiliate terms watch | site-ops Chrome read + hash | read | monthly | interpreting and acting on a change |
| 18 | impact.com Udemy stats | site-ops read if signed in, otherwise main session owner-assisted | read | weekly / monthly | sign-in; link creation; money |
| 19 | scrimba.com catalog browsing (Pro) | `scrimba-browsing` skill in content work and the /daily-post scrimba lens | read | as needed | none |
| 20 | Consent live check | site-ops curl | read | weekly; watch the EEA/UK shift for 4 weeks after `consent_v2` | any consent change; never remove the banner |
| 21 | /daily-post preflight | daily-post skill step 1 (shell) | read | each run | running /daily-post and merging its PR |
| 22 | Memory, experiments, Site Report | main session only | write memory / publish privately | monthly | none |
| 23 | Key rotation, GCP quotas, Cloudflare/bot edge, GA4 roles | none | none | none | always the owner |

## Notes

- `/daily-post` stays manual, local, one PR per run, and is never auto-merged. `/site-health` does not start it; it only reports a stale `content/daily-*` PR.
- Approval for rows 5 and 7: `.claude/settings.json` (adopted 2026-09-26) makes each write an `ask` permission prompt in the main session. A subagent never runs either write.
- Rows 15 to 18 never put money into a committed file, PR, annotation, memory entry or Artifact, with or without `--money`.
- Owner decisions taken 2026-09-26: permission rules adopted; the site states Scrimba's pricing-page 7-day guarantee (its help centre says 14 days); monetised links send the page URL as referrer; no Internal Traffic filter (the owner has no static IP).
