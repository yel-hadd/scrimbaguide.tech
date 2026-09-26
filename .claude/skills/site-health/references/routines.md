# Routines

Three routines: `post-merge <PR#...>`, `weekly` (Mondays) and `monthly` (first Monday; runs weekly first). The `site-ops` agent runs these steps and returns plans; the `/site-health` main session applies them. Paths are relative to the repo root. Dates are America/Los_Angeles: GA4 windows end yesterday, GSC windows end today minus 3 days.

## Chrome lock

`/daily-post` and site-ops share one Chrome. Take the lock before the first Chrome call:

```
f=.seo-cache/chrome.lock; if [ -e $f ] && [ $(( $(date +%s)-$(stat -c %Y $f) )) -lt 3600 ]; then echo HELD; else echo "site-ops $(date -Is)" > $f; fi
```

- `HELD`: every Chrome check becomes `skipped (daily-post running)`. Do not wait for it.
- A lock older than one hour is stale and is taken over.
- Release with `rm -f .seo-cache/chrome.lock` when Chrome work ends, also after an error. Only remove a lock whose content starts with `site-ops`.
- A held lock also means no build (`pgrep -f "docusaurus (build|start)"` is the other signal).

## post-merge `<PR#...>`

Run once per merged PR, or once for a list.

1. **Deploy.** `gh pr view N --json mergeCommit,mergedAt,files,body` gives the merge SHA. Poll `gh run list --workflow deploy.yml --commit <SHA> --json status,conclusion,databaseId` every 60 seconds for up to 15 minutes, then `gh run view <id> --json jobs` for per-job results.
   - `build` or `deploy` job failed: `deploy.main` is ACT and the routine stops here.
   - Only the `indexnow` job failed: WATCH. It usually means a sitemap or canonical regression (see CLAUDE.md), so check the live sitemap for the changed routes in step 2.
   - Still running after 15 minutes: WATCH, "deploy pending", and continue with steps 3 and 4 only.
2. **Routes.** `python3 scripts/analytics/indexing.py changed --since <SHA>^1`. For each URL: `curl -s -o /dev/null -w '%{http_code}' -I <url>` (curl follows redirects by default, and a GitHub Pages client-redirect stub reports 200, so expect 200 even for a redirect source) and check it appears in `https://scrimbaguide.tech/sitemap.xml` (redirect sources and drafts must not). Any non-200 or a live route missing from the sitemap is ACT.
3. **Indexing plan.** `python3 scripts/analytics/indexing.py submit --changed <SHA>^1` (dry run). Write its `to_send[].url` values, one per line, to `secrets/ops/indexing-plan.txt` (one-liner in the agent file, section 5). Empty list: plan `null`.
4. **Annotations plan.** `python3 scripts/analytics/ga4admin.py annotations plan --prs N[,M] > secrets/ops/annotations-plan.json`. You may improve a `create` row's title (60 characters or fewer) or description; validation still applies at apply time. `conflict` rows become decisions. Only `skip` rows: plan `null`.
5. **Tracking paths.** If the PR touched `plugins/analytics/**`, `src/components/AffiliateLink.tsx`, `src/utils/track*.ts`, `src/utils/contentGroup*`, `src/utils/affiliateDestination*`, `src/components/ConsentBanner.tsx`, `src/components/PathAdvisor.tsx`, or `scripts/analytics/tracking.json`:
   - compare each epoch `date` the PR added or changed in `tracking.json` with the LA date of the deploy. Open an `ops/epoch-<key>-<date>` PR only if they differ.
   - run `python3 scripts/analytics/ga4admin.py dims check`. A missing dimension is ACT for the owner (`dims create --yes` is the owner's call, decision D3).
   - add a decision reminding the owner of GA4 UI chores (new custom dimension, key event, filter), and a `watch` line with the re-baseline date (deploy + 7 days).

## weekly (Monday)

Run steps 7 and 8 (the Chrome readings) first, so the snapshot's reconciliation includes the new reading; number order is only for reference.

1. **Snapshot.** `python3 scripts/analytics/snapshot.py` (add `--money` only if the run has it). Read `.seo-cache/analytics-snapshot.json` and `.seo-cache/summary.txt`. A `sources.*.status` other than `ok` goes in `watch[]` with its reason.
2. **Tracking health.** Apply the thresholds table below to `health.*`.
3. **Annotations sweep.** `python3 scripts/analytics/ga4admin.py annotations plan --since-merged <last_weekly or 7 days ago> > secrets/ops/annotations-plan.json`. This catches PRs whose post-merge never ran.
4. **Indexing.** `python3 scripts/analytics/indexing.py submit --changed <last_postmerge_sha>` (dry run; deferred rows from the ledger are retried first by the CLI, whether or not they are in this run's changed list). Write its `to_send[].url` values, one per line, to `secrets/ops/indexing-plan.txt` (one-liner in the agent file, section 5). Empty list: plan `null`. Then `python3 scripts/analytics/indexing.py inspect --pending` (writes a partial `secrets/inspect-pending-YYYY-MM-DD.json`, kept apart from a full `--sitemap` run so the monthly diff never compares a partial file against a full one) and compare its verdicts with `health.index`: a submitted URL still not indexed after 14 days goes in `watch[]`.
5. **Deploys.** `gh run list --workflow deploy.yml --branch main --created ">=<7 days ago>" --json conclusion,databaseId,headSha`. On any failure, `gh run view <id> --json jobs` for per-job results. Map to `deploy.main` with the table's green/indexnow/build rules.
6. **Custom dimensions.** `python3 scripts/analytics/ga4admin.py dims check`. Exit 3 (a missing dimension) is `dims.check` ACT for the owner (`dims create --yes` is never run in a routine).
7. **Scrimbassadors totals** (Chrome; navigate and read only; counts only). Take the lock. Open a new tab, navigate to `https://scrimba.com/u42d4986:affiliate`, `get_page_text` up to 3 times a few seconds apart until Visitors, Signups and Subs parse. Append one line to `secrets/ops/scrimbassadors.jsonl` (format in the agent file). Close the tab. On parse failure: no line, check `affiliate.scrimbassadors` ACT "needs owner-assisted capture" with a raw excerpt. After the snapshot, read its reconciliation:
   - `affiliate.reconciliation.scrimba.ratio` below 0.8: ACT (our clicks may be losing `?via=`; run `links.py --outbound` now).
   - last reading older than 10 days: WATCH.
8. **impact.com** (Udemy brand). Only if the session is already signed in: navigate to the performance report for the last 30 days and read clicks, then append to `secrets/ops/impact.jsonl`. On a login page: `skipped (needs owner)`. `affiliate.reconciliation.udemy.ratio` below 0.7: WATCH.
9. **Consent live check.** `curl -s https://scrimbaguide.tech/ | grep -cE "consent[\"'],[\"']default"` must print 1 or more; 0 is ACT (the live HTML is minified with double quotes, `consent","default"`, so the check accepts either quote style). For the 4 weeks after `consent_v2` (until 2026-10-24), note the EEA/UK session share in `watch[]`.
10. **Stale PRs and worktrees.** `gh pr list --state open --json number,title,headRefName,createdAt`: open `content/daily-*` or `ops/*` PRs older than 7 days are WATCH. `git worktree list`: an `ops-*` worktree whose branch has merged is proposed for removal in `watch[]`; never remove it.
11. **Due items.** List every `state.due[]` item with `done: false` and `from` on or before today as `due: <id> (<what>)` in `watch[]`. Do not analyse them.

### Thresholds

| Check id | Source | OK | WATCH | ACT |
|---|---|---|---|---|
| `tracking.zero_click` | zero-click days, last 7 | 0 | 1 | 2 or more in a row |
| `tracking.non_site_hosts` | views on other hostnames (after step 5) | 0 | 1 to 50 | more than 50 |
| `tracking.not_set_cta_type` | `(not set)` share of `cta_type` (after step 5) | 2% or less | n/a | more than 2% |
| `tracking.reconciliation` | reconciliation ratio / untracked non-`/explain` URLs | 1.25 or less and none | ratio above 1.25 | a new untracked URL |
| `tracking.no_slash` | `no_slash_share` | 1% or less | more than 1% | n/a |
| `tracking.content_group_other` | `content_group_other_routes` | none | any | n/a |
| `tracking.pending_epoch` | `epoch_warnings[]` rows with `window: null` (equivalently `epochs[]` with `status == 'pending'`) | none | any | n/a |
| `dims.check` | `dims check` missing | none | n/a | any (owner) |
| `index.sitemaps` | sitemap errors | 0 | warnings | errors |
| `deploy.main` | main deploys, last 7 days | green | indexnow red | build or deploy red |
| `affiliate.scrimbassadors` | visitors per GA4 Scrimba click | 0.8 or more | reading older than 10 days | below 0.8, or parse failed |
| `affiliate.impact` | impact clicks per GA4 Udemy click | 0.7 or more | below 0.7 | n/a |
| `consent.live` | consent default in live HTML | present | n/a | missing |
| `index.money_pages` (monthly) | money page not indexed | none | n/a | any |
| `index.count` (monthly) | indexed count vs previous inspect | down 5 or fewer | down more than 5 | n/a |
| `links.outbound` (monthly) | non-2xx outbound | none | redirect to a new slug | any non-2xx |
| `terms.hash` (monthly) | terms page hash | unchanged | n/a | changed |

A value "after step 5" means windows starting on or after 2026-09-26. For earlier windows the check is `skipped (before analytics_step5)`.

## monthly (first Monday; weekly first)

1. **Full inspection.** `python3 scripts/analytics/indexing.py inspect --sitemap`. Diff the new `secrets/inspect-YYYY-MM-DD.json` with the previous one: a money page (`src/utils/moneyPagePaths.ts`) not indexed is ACT; indexed count down by more than 5 is WATCH. Between 2026-10-21 and 2026-11-04 this is also the `gsc-recheck` due item: compare with the 2026-09-23 baseline (148 indexed, 61 crawled-not-indexed).
2. **Catalog drift.** `data/` is never written.
   ```
   mkdir -p .seo-cache/drift/data
   python3 -c "import json;print('\n'.join(c['scrimbaUrl'] for c in json.load(open('data/courses.json')) if c.get('scrimbaUrl','').startswith('https://scrimba.com/') and '/blog/' not in c['scrimbaUrl']))" > .seo-cache/drift/urls.txt
   .venv/bin/python scraper/scrape.py --urls .seo-cache/drift/urls.txt --output .seo-cache/drift/scrape
   CATALOG_OUTPUT_DIR=.seo-cache/drift/scrape CATALOG_DATA_DIR=.seo-cache/drift/data node scripts/build-data.mjs
   node scripts/catalog-diff.mjs data/courses.json .seo-cache/drift/data/courses.json > .seo-cache/drift-<YYYY-MM-DD>.json
   ```
   Merge in any `.seo-cache/drift-*.json` that `/daily-post` left. `.venv` missing: `catalog.drift` is `skipped (no .venv)`. A `possible_swap` row (instructor or title changed at the same slug) is always a decision. Proven value drift: one overrides-only PR (`data/course-overrides.json`), saying regeneration is the owner's step. Otherwise report.
3. **Links.** `python3 scripts/analytics/links.py --outbound --internal`. Non-2xx is ACT, then a fix PR where the type is allowed (slug rename, internal link, trailing slash, `relatedGuidesMap.ts`).
4. **Content gates on origin/main,** in a throwaway worktree (`ops-gates-<date>`, `node_modules` symlinked): `npm run check:content`, `npm run typecheck`, and `node scripts/audit-course-links.mjs` over all pages. Report failures; fix only allowed types. Propose the worktree's removal in `watch[]`.
5. **Terms watch** (Chrome, lock held; do it in the same Chrome pass as weekly step 7, before that step appends its line). `get_page_text` on `https://scrimba.com/affiliate` and `https://scrimba.com/scrimbassadors`; normalize whitespace (`' '.join(text.split())`); SHA-256 each. Put both hashes in this run's `scrimbassadors.jsonl` line (`terms_sha256`). A hash different from the last non-null reading is ACT with a short diff excerpt; never interpret the new terms.
6. **Cannibalization and leaks.** From the snapshot's `cannibalization` and `leaks`, at most 3 proposals as decisions. Check `.seo-cache/redirects.json` first so nothing proposes merging a page that is already a redirect source. No edits.
7. **Hand-back.** Add a decision telling the main session to run the owner-assisted captures (skill step 5) and `/site-analytics monthly`.
