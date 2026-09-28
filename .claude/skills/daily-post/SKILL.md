---
name: daily-post
description: Produce one new blog post (or a refresh of an existing one) for scrimbaguide.tech from the shared analytics snapshot (Search Console, GA4) and web-demand data, with cannibalization guard, web fact-check and internal linking, then open a PR. Use when the owner runs /daily-post, optionally with a topic seed ("/daily-post best laptops for coding"). Manual and local only; needs secrets/gsc-service-account.json.
---

# /daily-post

One run = at most one piece of content, delivered as one PR the owner merges. The post is top of funnel: timely, useful coverage of what is happening in the technologies Scrimba teaches (releases, CVEs, breaking changes, AI tooling, hiring data) that brings in developers who don't know Scrimba yet and introduces it in context. A refresh of a review or money page is the fallback when no timely topic qualifies. A skipped day is a valid outcome: publishing something thin or cannibalizing costs more than publishing nothing. The skill never merges, never runs on a schedule, and never auto-merges.

`$ARGUMENTS` (optional) is a topic seed. It is a candidate, not an order; the guard can still reject it.

## Steps

1. **Preflight (shell, main session, no agent).**
   - **Today's date comes from the shell, never from memory**: `TODAY=$(date +%F)`. Your training data ends before today, so a remembered date is wrong. Use `$TODAY` for the branch, `args.date`, the drift file and the snapshot age check; the workflow derives the current year, the news window (last 30 days, "recent" = last 14) and every dated instruction from it.
   - **Fail** if the working tree is dirty (ask the owner).
   - `git fetch origin`.
   - **Fail** if `secrets/gsc-service-account.json` is missing. Never print or copy it.
   - `gh pr list --state open --search "head:content/daily-" --json number,files,createdAt`: collect every open daily PR's file paths into `pending_files`. Warn (do not fail) for any open daily PR older than 7 days.
   - Chrome: set `chrome=true`, then
     - if `.seo-cache/chrome.lock` exists with an mtime under 60 minutes old (`f=.seo-cache/chrome.lock; [ -e $f ] && [ $(( $(date +%s)-$(stat -c %Y $f) )) -lt 3600 ] && cat $f`), warn with its contents and set `chrome=false`;
     - if `tabs_context_mcp` fails (Chrome not connected), warn and set `chrome=false`.
     Never fail the run on Chrome.
   - `.venv` missing: warn only (the draft agent can create it for the bridge re-scrape).
   - Follow-ups: read `.seo-cache/followups.json` (`[{followup_date, topic, primary_source}]`, missing means empty). Entries with `followup_date <= $TODAY` go to the workflow as `followups_due`; tell the owner which ones are due.
   - Create the branch from fresh `origin/main`: `git checkout -b content/daily-<YYYY-MM-DD> origin/main` (append `-2`, `-3` if it exists).
2. **Fresh data.** `python3 scripts/analytics/snapshot.py --max-age 20 --gsc-days 90`. It writes `.seo-cache/analytics-snapshot.json` (`schema_version: 1`) and `summary.txt` — but only when the existing snapshot is older than `--max-age` hours; under that age it returns early without touching anything. Then run `python3 scripts/analytics/inventory.py` unconditionally (it is local-only, needs no credentials, and is what actually (re)writes `inventory.json`, `redirects.json` and `scrimba-catalog.json`) so those three files are never stale even when the snapshot step was a no-op.
   - **Stop** if `snapshot.py` exits non-zero: exit 2 means GA4 and GSC both failed and the previous snapshot file was left in place unchanged (its `sources.gsc.status` can still read `"ok"` from the old run). Do not read the snapshot in that case.
   - **Stop** if `sources.gsc.status != "ok"` in the snapshot: the guard cannot work without GSC.
   - **Stop** if `generated_at` is more than 20 hours old (a second safeguard against a stale snapshot slipping through).
   - A GA4 error (`sources.ga4.status` not `ok`) is allowed. Carry it to the PR body. Also note any `epoch_warnings`.
   - Keep `generated_at` for the PR body.
3. **Run the workflow.** Invoking this skill is the opt-in for it:
   `Workflow({ name: "daily-post", args: { date: "$TODAY", branch: "<branch>", topic: "<$ARGUMENTS or omit>", pending_files: [...], chrome: <true|false>, followups_due: [...], snapshot_generated_at: "<generated_at>" } })`
   It returns `outcome` plus `file`, `route`, `shape`, `family`, `relevance`, `brief`, `serp`, `drift`, `followups`, `chrome`, `annotation_title` and `snapshot_generated_at` (the last two feed the PR body).
   - **Research**, five lenses in parallel: GSC (non-brand gaps, top-of-funnel posts at 8 to 20, hub candidates, at most two bottom-of-funnel fallbacks); catalog-technology releases, upgrade errors and advisories (watch list from `scrimba-catalog.json` `teaches`/`topics`/`modules`, official sources first); AI tools, hiring reports and the seasonal calendar; community questions (Reddit, HN, dev.to); the live Scrimba catalog in Chrome (skipped when `chrome=false`), which also reports catalog drift. Every candidate carries `event_date`, `shelf_life`, `primary_source`, `family`, `shape` and `relevance`; the script drops and logs `skip` shapes, no-relevance topics, stale spikes, undated timely claims and seasonal events outside 3 to 35 days ahead, and returns data-not-out-yet items as `followups`.
   - **Select** (Opus): shortlist five by top-of-funnel value (learner demand 30, angle 20, durability 15, Scrimba relevance 15, consolidation 10, resources 10). A bottom-of-funnel refresh only when nothing scores 55.
   - **Demand**, in parallel: Google Trends in Chrome (range chosen by event date; `too-low-new` for a fresh term is not a drop reason; captcha means stop, never solve) and a SERP winnability check via WebSearch (works without Chrome). Low winnability vetoes a new page.
   - **Pick + Guard**: one shape (hub-update, hub-new, own-post, fallback refresh) with a full brief, then an adversarial cannibalization and shape check against `pages[].top_queries`, `cannibalization`, `redirects.json`, `pending_files`, the hub list, course leaves and money pages; up to three picks.
   - **Draft**: template by shape; re-scrapes the bridged course live before quoting numbers; places the Scrimba bridge by relevance tier.
   - **Verify**: web fact-check (dates, latest versions, security advisories character for character) and house-rules critic in parallel, fix, re-check.
   - **Wire**: `relatedGuidesMap.ts` and 2 to 3 inbound in-prose links from the pages with the most `pages[].ga4.sessions`.
   Agents are Sonnet; shortlist and pick are Opus. Do not run builds while it runs.
   **Chrome lock.** Every agent that uses Chrome conditionally acquires `.seo-cache/chrome.lock` before its first Chrome call: if the lock exists, is under 60 minutes old, and does not already say `daily-post`, it is held by someone else (site-ops or another run) and the agent makes no Chrome calls that phase, reporting empty candidates or "trends-unavailable (chrome lock held)" instead; otherwise it writes `daily-post <iso>` and proceeds. It releases the lock only if it still says `daily-post` when it finishes (success, captcha or error). If the workflow dies mid-lens, remove a lock whose contents start with `daily-post` before reporting.
4. **Act on the outcome.**
   - `skip`: delete the branch, report the reason and the best rejected candidates in two or three lines.
   - `blocked`: leave the branch, list the open findings, ask the owner.
   - `ready`: continue.
   - **Follow-ups**, any outcome: merge the workflow's `followups` into `.seo-cache/followups.json` (dedupe on topic, drop entries you passed as due this run).
   - **Drift**, any outcome: write `.seo-cache/drift-<YYYY-MM-DD>.json` as `[{slug, course, field, ours, live}]` (the `catalog-diff.mjs` row format), merging the workflow's `drift` rows with any CATALOG DRIFT lines in the draft's final message. List the stale facts for the owner and keep drift separate from the content: a catalog update is its own PR (repo scraper, memory `catalog-drift-audit`, or `/site-health`). Never mix catalog edits into the content PR. Never run `npm run generate:data`, `make generate` or `make pipeline`.
5. **Gates, then your own review.** `npm run check:content`, `npm run typecheck`, `node scripts/audit-course-links.mjs --file <each changed page>`, `make build` (links changed, so broken links fail here). Read the full diff yourself: invented facts, a CTA over budget, a link to a draft page, the checker quietly reverting something. Fix what you find.
6. **Ship as a PR, never to main.** Commit (`content(blog): ...`, body lists target query, evidence and sources), `git push -u origin <branch>`, `gh pr create` with:
   - target query, shape, family and Scrimba relevance tier; its GSC numbers or, for a fresh event, the demand and SERP evidence; why it does not cannibalize (the guard's notes), sources, inbound links added;
   - `analytics-note: <annotation_title from the workflow, 60 characters or fewer>` on its own line;
   - `snapshot: <generated_at>` on its own line, plus the GA4 status if it was not `ok`;
   - the line: "After merge: `/site-health post-merge <n>` (annotation and Indexing API)."
   No money figures in the PR (the repo is public). Never merge. Report the PR URL.

## House rules the workflow already enforces (do not relax them)

- CLAUDE.md Voice, Links, Affiliate and pricing, CTA placement (Blog row), SEO invariants.
- The post is top of funnel by default: people who don't know Scrimba yet, searching about the technologies Scrimba teaches. The news triggers it; the angle is the learner's durable question ("does this change what I'm learning", "which version should a beginner install", "fix: <exact error>"), never the news itself, which vendors and big publishers own.
- Shapes, decided in order: **skip** (low SERP winnability for a new page, a spike whose only action is "bump a dependency", no Scrimba relevance, data not out yet: record a follow-up); **hub-update** (a recurring stream with a hub; at least 150 words of new sourced substance); **hub-new** (only the approved hub slugs in the workflow's `HUBS`); **own-post** (a distinct learner query, months/evergreen or a seasonal event 3 to 21 days out, medium or high winnability, direct or adjacent relevance); **refresh** of a review or money page as the fallback. Security advisories are hub notes or an evergreen safety guide, never their own post; hiring data only updates the hiring hub.
- Learner hubs: `/blog/react-updates-for-learners/` and `/blog/nextjs-updates-for-learners/` (to be seeded), `blog/2026-04-01-ai-tools-for-learning-to-code-2026.mdx` and `blog/2026-01-31-junior-developer-job-market-2026.mdx` (grown in place). Year-free slugs, a "Current state as of" table and a newest-first update log. When a hub-new PR ships, set that hub's `file` in `HUBS` (`.claude/workflows/daily-post.js`) in the same PR, so later runs update it instead of seeding it again.
- Scrimba by relevance tier: **direct** (a course teaches the affected skill): an H2 bridge before the conclusion with first-hand specifics, the review link and one inline `AffiliateLink location="tofu-bridge-direct"`; **adjacent**: one or two sentences with the review link only; **distant**: one sentence in the conclusion with the path review link only. Every post still ends with `PricingCTA ctaType="free"` as its only counted CTA. Scrimba never appears in a top-of-funnel title, description, slug, first H2 or answer block.
- News facts trace to their primary source, cited inline with its date; Scrimba facts to our review pages and `data/courses.json`. Everything date-relative derives from `$TODAY`: titles and slugs use the current year, "latest" is confirmed on the official source that day.
- Mix over time: the selector avoids a third consecutive post in the same family, and when it does refresh, prefers a post that ranks 8 to 20 over writing a competitor to it.
- Merged-away slugs (`.seo-cache/redirects.json`, fallback: redirects in `docusaurus.config.ts`) never come back as new posts.
- A topic or file already in an open daily PR (`pending_files`) is covered.
- Social-card PNGs are generated at deploy; never commit them.

## Monthly health check

Covered by `/site-health monthly`.
