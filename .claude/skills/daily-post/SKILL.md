---
name: daily-post
description: Produce one new blog post (or a refresh of an existing one) for scrimbaguide.tech from the shared analytics snapshot (Search Console, GA4) and web-demand data, with cannibalization guard, web fact-check and internal linking, then open a PR. Use when the owner runs /daily-post, optionally with a topic seed ("/daily-post best laptops for coding"). Manual and local only; needs secrets/gsc-service-account.json.
---

# /daily-post

One run = at most one piece of content, delivered as one PR the owner merges. A skipped day is a valid outcome: publishing something thin or cannibalizing costs more than publishing nothing. The skill never merges, never runs on a schedule, and never auto-merges.

`$ARGUMENTS` (optional) is a topic seed. It is a candidate, not an order; the guard can still reject it.

## Steps

1. **Preflight (shell, main session, no agent).**
   - **Fail** if the working tree is dirty (ask the owner).
   - `git fetch origin`.
   - **Fail** if `secrets/gsc-service-account.json` is missing. Never print or copy it.
   - `gh pr list --state open --search "head:content/daily-" --json number,files,createdAt`: collect every open daily PR's file paths into `pending_files`. Warn (do not fail) for any open daily PR older than 7 days.
   - Chrome: set `chrome=true`, then
     - if `.seo-cache/chrome.lock` exists with an mtime under 60 minutes old (`f=.seo-cache/chrome.lock; [ -e $f ] && [ $(( $(date +%s)-$(stat -c %Y $f) )) -lt 3600 ] && cat $f`), warn with its contents and set `chrome=false`;
     - if `tabs_context_mcp` fails (Chrome not connected), warn and set `chrome=false`.
     Never fail the run on Chrome.
   - `.venv` missing: warn only (the draft agent can create it for the bridge re-scrape).
   - Create the branch from fresh `origin/main`: `git checkout -b content/daily-<YYYY-MM-DD> origin/main` (append `-2`, `-3` if it exists).
2. **Fresh data.** `python3 scripts/analytics/snapshot.py --max-age 20 --gsc-days 90`. It writes `.seo-cache/analytics-snapshot.json` (`schema_version: 1`) and `summary.txt` — but only when the existing snapshot is older than `--max-age` hours; under that age it returns early without touching anything. Then run `python3 scripts/analytics/inventory.py` unconditionally (it is local-only, needs no credentials, and is what actually (re)writes `inventory.json`, `redirects.json` and `scrimba-catalog.json`) so those three files are never stale even when the snapshot step was a no-op.
   - **Stop** if `snapshot.py` exits non-zero: exit 2 means GA4 and GSC both failed and the previous snapshot file was left in place unchanged (its `sources.gsc.status` can still read `"ok"` from the old run). Do not read the snapshot in that case.
   - **Stop** if `sources.gsc.status != "ok"` in the snapshot: the guard cannot work without GSC.
   - **Stop** if `generated_at` is more than 20 hours old (a second safeguard against a stale snapshot slipping through).
   - A GA4 error (`sources.ga4.status` not `ok`) is allowed. Carry it to the PR body. Also note any `epoch_warnings`.
   - Keep `generated_at` for the PR body.
3. **Run the workflow.** Invoking this skill is the opt-in for it:
   `Workflow({ name: "daily-post", args: { date: "<YYYY-MM-DD>", branch: "<branch>", topic: "<$ARGUMENTS or omit>", pending_files: [...], chrome: <true|false>, snapshot_generated_at: "<generated_at>" } })`
   It returns `outcome` plus `file`, `route`, `brief`, `drift`, `chrome`, `annotation_title` and `snapshot_generated_at` (the last two feed the PR body).
   - **Research**, five lenses in parallel: GSC gaps, refresh candidates, leaks and cannibalization; releases and news (framework, AI tooling, hiring reports, official changelogs first); community questions (Reddit, HN, dev.to); weak AI answers; the live Scrimba catalog in Chrome (skipped when `chrome=false`), which also reports catalog drift.
   - **Select** (Opus): shortlist five, each with a *Scrimba bridge* (the course/path a reader of that topic would want) weighted by what `content_groups` and `leaks` say converts.
   - **Trends**: Google Trends in Chrome picks the best phrasing, drops declining topics, and supplies rising related queries as H2s. Captcha means stop, never solve. With `chrome=false` it records "trends unavailable" and the selector weighs GSC evidence instead.
   - **Pick + Guard**: full brief, then an adversarial cannibalization check against `pages[].top_queries`, `cannibalization`, `redirects.json` and `pending_files`, up to three picks.
   - **Draft**: re-scrapes the bridged course live before quoting numbers, writes the post with the bridge at the reader's "how do I learn this" moment.
   - **Verify**: web fact-check and house-rules critic in parallel, fix, re-check.
   - **Wire**: `relatedGuidesMap.ts` and 2 to 3 inbound in-prose links from the pages with the most `pages[].ga4.sessions`.
   Agents are Sonnet; shortlist and pick are Opus. Do not run builds while it runs.
   **Chrome lock.** Every agent that uses Chrome conditionally acquires `.seo-cache/chrome.lock` before its first Chrome call: if the lock exists, is under 60 minutes old, and does not already say `daily-post`, it is held by someone else (site-ops or another run) and the agent makes no Chrome calls that phase, reporting empty candidates or "trends-unavailable (chrome lock held)" instead; otherwise it writes `daily-post <iso>` and proceeds. It releases the lock only if it still says `daily-post` when it finishes (success, captcha or error). If the workflow dies mid-lens, remove a lock whose contents start with `daily-post` before reporting.
4. **Act on the outcome.**
   - `skip`: delete the branch, report the reason and the best rejected candidates in two or three lines.
   - `blocked`: leave the branch, list the open findings, ask the owner.
   - `ready`: continue.
   - **Drift**, any outcome: write `.seo-cache/drift-<YYYY-MM-DD>.json` as `[{slug, course, field, ours, live}]` (the `catalog-diff.mjs` row format), merging the workflow's `drift` rows with any CATALOG DRIFT lines in the draft's final message. List the stale facts for the owner and keep drift separate from the content: a catalog update is its own PR (repo scraper, memory `catalog-drift-audit`, or `/site-health`). Never mix catalog edits into the content PR. Never run `npm run generate:data`, `make generate` or `make pipeline`.
5. **Gates, then your own review.** `npm run check:content`, `npm run typecheck`, `node scripts/audit-course-links.mjs --file <each changed page>`, `make build` (links changed, so broken links fail here). Read the full diff yourself: invented facts, a CTA over budget, a link to a draft page, the checker quietly reverting something. Fix what you find.
6. **Ship as a PR, never to main.** Commit (`content(blog): ...`, body lists target query, evidence and sources), `git push -u origin <branch>`, `gh pr create` with:
   - target query and its GSC numbers, why it does not cannibalize (the guard's notes), sources, inbound links added;
   - `analytics-note: <annotation_title from the workflow, 60 characters or fewer>` on its own line;
   - `snapshot: <generated_at>` on its own line, plus the GA4 status if it was not `ok`;
   - the line: "After merge: `/site-health post-merge <n>` (annotation and Indexing API)."
   No money figures in the PR (the repo is public). Never merge. Report the PR URL.

## House rules the workflow already enforces (do not relax them)

- CLAUDE.md Voice, Links, Affiliate and pricing, CTA placement (Blog row), SEO invariants.
- Topics may sit outside Scrimba (careers, AI engineering, learning methods, job market) if learners search for them; Scrimba appears where it genuinely helps.
- Mix over time: the selector avoids a third consecutive post in the same cluster and prefers refreshing a post that ranks 8 to 20 over writing a competitor to it.
- Merged-away slugs (`.seo-cache/redirects.json`, fallback: redirects in `docusaurus.config.ts`) never come back as new posts.
- A topic or file already in an open daily PR (`pending_files`) is covered.
- Social-card PNGs are generated at deploy; never commit them.

## Monthly health check

Covered by `/site-health monthly`.
