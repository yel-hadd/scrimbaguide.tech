# Scrimba Guide: operating guide

[scrimbaguide.tech](https://scrimbaguide.tech) is a first-hand review site for Scrimba courses and learning paths. The docs and the blog are the product. Revenue comes from affiliate clicks: Scrimba through the Scrimbassadors program, and Udemy through impact.com.

This README is for the site owner. It covers what runs where, what you do each week and month, how to read the numbers, and what needs your decision. Rules for writing and editing pages live in [`CLAUDE.md`](CLAUDE.md); Claude Code reads it on every run.

## What runs where

| Piece | Where | How it changes |
|---|---|---|
| Website | GitHub Pages, repo `yel-hadd/scrimbaguide.tech` | Every push to `main` builds and deploys (`.github/workflows/deploy.yml`), then pings IndexNow |
| Analytics | GA4 property `523469938` (stream `G-03WS2KR7EX`) | Tracking code in `plugins/analytics`; reports in the GA4 UI |
| Dashboard | GA4 > Reports > Library > collection **Scrimba Guide Business** | Edited in the GA4 UI |
| Search data | Google Search Console, `sc-domain:scrimbaguide.tech` | Read by `npm run snapshot` |
| Scrimba affiliate | Scrimbassadors dashboard, `https://scrimba.com/u42d4986:affiliate` | Read in Chrome; no export or API |
| Udemy affiliate | impact.com, brand Udemy | Tracking links `trk.udemy.com/...` created in the impact.com dashboard |
| Course facts | `data/courses.json`, built from the scraper plus `data/course-overrides.json` and `data/path-membership.json` | Scraper and overrides, never hand edits |

## Your routine

**Weekly (Monday, about 10 minutes)**
1. Run `/site-health weekly` in Claude Code. The `site-ops` agent pulls a fresh snapshot, checks tracking, index state, deploys and the Scrimbassadors totals, and prepares annotation and Indexing API plans. You get one note: OK, WATCH or ACT, with at most five decisions.
2. Approve or refuse the writes it proposes (GA4 annotations, Indexing API submissions). Nothing external is written without your yes.
3. Open the GA4 collection and skim the **Overview** topic with the **Humans** comparison on.

**Monthly (first Monday, about 30 minutes)**
1. Run `/site-health monthly`. It adds URL Inspection for the whole sitemap, catalog drift, outbound link health, content gates on `main` and a check of the affiliate terms pages.
2. Stay for the owner-assisted part: Claude reads the Scrimbassadors detail tables and impact.com in your Chrome session. Sign in to impact.com first if you want Udemy numbers.
3. Run `/site-analytics monthly` for the **Site Report**, a private Artifact with KPIs, channels, earning pages, leaks and the change timeline.

**When you want a new post**
Run `/daily-post` (optionally with a topic: `/daily-post best laptops for coding`). It researches demand from the snapshot and the web, guards against cannibalization, drafts, fact-checks, links the post in, and opens one PR. It never merges. A skipped day is fine.

**After you merge any PR**
Run `/site-health post-merge <PR number>`. It watches the deploy, checks the changed URLs are live and in the sitemap, and plans the GA4 annotation and the Indexing API submission for you to approve.

## Commands

| Command | What it does | When |
|---|---|---|
| `/site-health weekly` / `monthly` / `post-merge <n>` | Operations routines through the `site-ops` agent | Weekly, monthly, after merges |
| `/site-analytics` | Answers "how is X doing", "did PR N work", leaks, AI traffic, CTA placement; `monthly` builds the Site Report | Any time |
| `/daily-post [topic]` | One researched post or refresh, as a PR | When you want content |
| `npm run snapshot` | Pulls GA4 + Search Console into `.seo-cache/analytics-snapshot.json` | The skills run it for you |
| `python3 scripts/analytics/ga4admin.py annotations plan --prs <n>` | Shows the annotation a PR would get | Before applying by hand |
| `python3 scripts/analytics/ga4admin.py dims check` | Confirms every tracked parameter has a GA4 custom dimension | After tracking changes |
| `python3 scripts/analytics/indexing.py submit --changed <sha>` | Dry run of an Indexing API submission (`--send` to send) | Rarely by hand |
| `make dev` / `make build` | Local preview / production build | Development |

## Reading the numbers

**Always use the Humans view.** Bots from Singapore, China and "(not set)" inflate raw GA4 traffic. In the collection's reports and anywhere else in GA4, turn on the saved comparison **Humans** (Explorations use the segment **Humans**). The snapshot and `/site-analytics` apply the same filter for you.

**The one key event is `affiliate_link_clicked`.** It fires on every Scrimba and Udemy link rendered through `<AffiliateLink>` (all in-page CTAs; the navbar "Try Scrimba for free" button is not tracked as a key event) and carries:
- `cta_type`: the format (`pricing-cta`, `course-card`, `sticky`, `inline-text`, and so on);
- `cta_location`: the exact placement on the page;
- `destination_type` / `destination_slug`: where the click goes (course, path, pricing, demo, udemy, ...);
- `content_group`: the kind of page it came from (blog, course, path, pricing, comparison, ...).

Clicks are the metric to optimize. Scrimba does not report sales per page, so GA4 clicks are the only per-page attribution.

**Tracking epochs: never compare across them without saying so.**
| Date | What changed | Effect |
|---|---|---|
| 2026-09-25 19:00 PT | Enhanced Measurement history-change page views turned off | Earlier page views are inflated (double counted) |
| 2026-09-26 | `cta_location` registered, `affiliate_link_clicked` made the key event | No per-placement data or key-event rate before this |
| 2026-09-26 | Udemy links moved to impact.com tracking links (PR #110) | Before this, Udemy clicks are not in `affiliate_link_clicked`; the Scrimba/Udemy split starts here |
| 2026-09-26 | Consent banner and Consent Mode v2 (PR #111, #112); `content_group`, `cta_type`, destinations, search event | EU, EEA, UK and Swiss numbers drop (analytics waits for Accept); new dimensions start here; localhost hits stop |

Every metric-moving change has a GA4 annotation (the dots under line charts). History back to launch was backfilled on 2026-09-26; new ones come from `/site-health post-merge`.

**Dashboard topics:** Overview (business pulse, pages that earn), Acquisition (channels, AI assistants), Content (content groups, landing pages, site search), Monetization (clicks by placement, destinations, outbound leakage), SEO and health (Search Console, site health, tech; 404s cannot be filtered in the report builder). Known GA4 limits: the custom "Business channels" group shows 0 rows as a table dimension (a GA4 bug), and scheduled email reports are not available in this property.

## Money and affiliates

- **Scrimba.** Every scrimba.com link goes through the `<AffiliateLink>` component, which adds `?via=u42d4986` and `rel="nofollow"`. The 20% discount travels with the link; the code is never printed on the site. Scrimbassadors attributes a sale to the account that signed up through the link, with no time limit. There are no sub-IDs, no export and no API: `/site-health` reads the totals in Chrome and keeps the history in `secrets/ops/`.
- **Udemy.** Every Udemy link is an impact.com tracking link (`trk.udemy.com/...`) inside `<AffiliateLink>`. A course without one needs a new link created in impact.com. Ask Claude to do it with you in your signed-in Chrome session; no routine does it on its own.
- **Never quote a Scrimba price** on the site; pages link to scrimba.com/our-pricing.
- Money figures (sales, commission, payouts) stay out of this repo, PRs, GA4 and memory. The repo is public.

## Privacy and consent

The banner shows to visitors whose browser time zone is European (a proxy; it includes some non-EU countries). Google decides by location: in the EU, EEA, UK and Switzerland analytics storage stays denied until Accept, and Google receives only cookieless pings until then. A visitor there with a non-European time zone sees no banner and stays unmeasured. Everyone else is measured by default; advertising storage is denied everywhere. "Cookie settings" in the footer reopens the banner. The privacy policy (`src/pages/legal/privacy-policy.md`) describes this. Do not remove the banner to recover traffic.

## Credentials and access (no secrets in this repo)

| What | Where |
|---|---|
| Google service account key (Search Console, GA4 Data and Admin API, Indexing API) | `secrets/gsc-service-account.json` (gitignored), a copy in `~/use-apify/indexer/`, and the GitHub secret `GSC_SERVICE_ACCOUNT_JSON`. Rotate all three together |
| GA4 roles | The service account is Editor (annotations, custom dimensions). Your own Google accounts manage users and settings |
| GA4 in Chrome | Use URLs with `?authuser=<your personal Google account>`; the default profile goes to a corporate SSO |
| Indexing API quota | 200 URLs a day per Google Cloud project, shared with use-apify.com. `indexing.py` budgets the full 200 per Pacific day and stops at the first quota error |
| Scrimba Pro, Scrimbassadors, impact.com | Your browser sessions. Claude never types passwords; if a sign-in appears, it stops and tells you |

## What Claude does, and what stays with you

| Claude may | Only you |
|---|---|
| Write and review pages, open PRs, run gates | Merge PRs (unless you authorize a run to merge) |
| Pull GA4, Search Console and Scrimbassadors numbers; read scrimba.com with your Pro account | Change GA4 settings: filters, key events, channel groups, retention, roles |
| Plan annotations and Indexing submissions, and apply them after your permission prompt | Create GA4 custom dimensions outside a tracking PR |
| Open small fix PRs (links, slugs, epoch dates, catalog overrides) | Anything in account, billing or payout settings on any site |
| Create impact.com links when you ask, in your signed-in session | Rotate keys; Cloudflare or other infrastructure; removing the consent banner |

## Decisions taken (2026-09-26)

1. **Permission rules.** `.claude/settings.json` asks before merges, GA4 annotation writes, custom-dimension creation, Indexing API submissions and catalog regeneration, and blocks force-pushes, pushes to `main` and `npm install`.
2. **Refund window.** The site states the 7-day money-back guarantee from Scrimba's pricing page. Scrimba's help centre says 14 days; if Scrimba changes the pricing page, update the pricing pages and `PricingCTA`.
3. **Referrer on affiliate links.** Monetised links send the page address (`referrerPolicy=no-referrer-when-downgrade`, still `nofollow`), so from 2026-09-26 the Scrimbassadors Referrer column can show which of our pages sent a visitor. The privacy policy says so.
4. **No Internal Traffic filter.** Your IP is not static, so your own visits stay in GA4; the "Owner" IP rule in GA4 is unused.

## Dated follow-ups

- **2026-09-28:** new custom dimensions are queryable in standard reports; check the placement and destination reports fill in.
- **2026-10-03:** re-baseline after the tracking release: localhost hits, click reconciliation, "(not set)" share of `cta_type` and `content_group`.
- **2026-10-21 to 2026-11-04:** Search Console re-check of "crawled, not indexed" pages against the 2026-09-23 baseline (148 indexed, 61 crawled not indexed).
- **From 2026-10-24:** CTA placement analysis (four weeks of `cta_location` data).

`/site-health` keeps these in `secrets/ops/site-health-state.json` and lists the ones that are due.

## Troubleshooting

- **The deploy is red.** A failed post-deploy step usually means a sitemap or canonical regression, not a broken build. Check the `indexnow` job log; fix forward with a PR, or revert.
- **Affiliate clicks dropped to zero for a day.** Almost always tracking, not business. Check the live page source for `consent","default"` and a recent deploy to `plugins/analytics` or `AffiliateLink`.
- **Numbers dropped in Europe after 2026-09-26.** Expected: the consent banner. Compare non-EU traffic instead.
- **`node_modules` is empty.** Run `npm ci` in the repo. A `make build` inside a git worktree with a linked `node_modules` wipes it.
- **Course facts look stale.** Scrimba edits courses in place. `/site-health monthly` diffs a fresh scrape against `data/courses.json`; fixes go into `data/course-overrides.json`, then the catalog is regenerated from a fresh scrape (never from an old `output/`).

## For developers

```bash
make install   # Node 20+ and a Python .venv for the scraper
make dev       # localhost:3000
make build     # content gates, production build, llms.txt
```

Docusaurus 3, React 19, TypeScript. Pages are hand-authored MDX in `docs/`, `blog/` and `src/pages/`. Tracking lives in `plugins/analytics` and `src/components/AffiliateLink.tsx`; the analytics and ops scripts live in `scripts/analytics/` (tests: `npm run test:analytics`). Everything else, including the content rules and the gates to run before a commit, is in [`CLAUDE.md`](CLAUDE.md).
