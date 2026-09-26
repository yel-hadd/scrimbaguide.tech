# CLAUDE.md

scrimbaguide.tech is a first-hand review site for Scrimba courses and paths (Docusaurus 3, React 19, TypeScript), deployed to GitHub Pages on push to `main`. The docs and blog are the product; revenue is Scrimba affiliate clicks.

## Commands

    make install        # Node + Python deps (.venv, node_modules); Node 20+
    make dev            # localhost:3000
    make build          # check:content, docusaurus build, llms.txt
    make typecheck
    npm run check:content                               # content gate, also the prebuild step
    node scripts/audit-course-links.mjs --file <path>   # unlinked course names and raw scrimba.com URLs
    node --test scripts/__tests__/<file>.test.mjs
    npm run snapshot                                    # GA4 + GSC snapshot to .seo-cache/ (needs secrets/gsc-service-account.json)
    npm run test:analytics                              # Python and Node tests for scripts/analytics
    /site-analytics                                     # traffic, conversion, SEO and affiliate questions; monthly Site Report
    /site-health                                        # ops routines: weekly, monthly, post-merge <PR#>

Everything else is in `package.json` and the `Makefile`. Local social-card builds need `rsvg-convert` (librsvg2-bin).

## Architecture you cannot see at a glance

- Every page is hand-authored MDX: edit `docs/**`, `blog/**`, `src/pages/**` directly. Page generation was retired on purpose.
- Catalog facts flow `scraper/scrape.py` -> `output/` -> `scripts/build-data.mjs` -> `data/courses.json` -> `CourseCard`, `CourseCurriculum`, `src/utils/scrimbaFacts.ts`. `data/courses.json` is generated: never edit it by hand. Stale numbers: re-scrape (`make scrape`, or `.venv/bin/python scraper/scrape.py --urls <file> --output output`, which merges into the existing index) then `make generate-data`. Path membership comes only from `data/path-membership.json` (verified inside Scrimba by lesson-title matching; re-verify when a path changes). A course's `category` is the `docs/courses/<folder>/` its page lives in. Other facts the scraper gets wrong (projects) go in `data/course-overrides.json`, verified on the live page. Then copy changed numbers into component props. The four path durations are hardcoded in the `PATHS` table in `build-data.mjs`.
- `src/content/relatedGuidesMap.ts` owns the auto-mounted "Related guides" block, keyed by route. Update it when you add or move a page. Prose mentions are still links (see Links).
- `src/utils/moneyPagePaths.ts` is the only list of money pages (they get the desktop sticky CTA). Read it; never restate it.
- `src/theme/DocItem/Layout` auto-injects a `PricingCTA` at the end of every doc except `/docs/pricing/*`, `/docs/courses/*` and comparison leaves. A page that authors its own end CTA sets `hideGlobalPricingCta: true`.
- `src/constants.ts` holds the affiliate id and demo-scrim URL for code that cannot use `<AffiliateLink>` (navbar, config).
- Docs URLs are the file path minus numeric prefixes unless frontmatter `slug:` overrides; blog files are `YYYY-MM-DD-name.mdx` with an explicit `slug:`. Sidebar order and category labels live in `sidebars.ts`.

## SEO invariants

- `trailingSlash: true`. Every canonical, og:url, JSON-LD URL, internal link and llms.txt entry ends in `/`.
- Sitemap exclusions go in `SITEMAP_EXCLUDED_PATHS` / `SITEMAP_EXCLUDED_DOC_ALIASES`, priority in `sitemapPriority()` (both in `docusaurus.config.ts`).
- Consolidate with a redirect (inline in the config, or `data/course-redirects.json` for courses) plus a `draft: true` stub. Pages are merged, never deleted; URLs and slugs never change without a redirect.
- Blog JSON-LD components (`ReviewSchema`, `HowToSchema`, `ItemListSchema`) sit below `{/* truncate */}`, or they duplicate onto every list page.
- `<FAQAccordion>` emits the page's only FAQPage schema. A page that also uses `DocFaqSchema` passes `emitSchema={false}`.
- Frontmatter `description` is 160 characters or fewer; set `last_update.date` to today on every page whose content you change.
- A red post-deploy step usually means a sitemap or canonical regression, not a build failure.

## Affiliate and pricing

- Every scrimba.com and docs.scrimba.com link goes through `<AffiliateLink>` (adds `?via=`, `rel="nofollow"`); write the bare URL. `CourseCard`, `ScrimPoster`, `PricingCTA`, `VerdictBox`, `ComparisonTable`, `CodePreview` do it for you. docs.scrimba.com links carry `location="companion-docs"`.
- Exception: `scrimba.com/explain` and `scrimba.com/explain/*` are plain links without `via`; embed explainers with `<ExplainerEmbed>` (scrimba-explain skill).
- Affiliate links point at a course, a path, the demo scrim or `/our-pricing`: pages where a reader can start. Scrimba's blog and articles are plain links, if linked at all.
- Never quote a Scrimba price; link `https://scrimba.com/our-pricing`. The discount travels with the link; the code never appears as text.
- Every Udemy link is an impact.com tracking link (`https://trk.udemy.com/<code>`) inside `<AffiliateLink>` or `ComparisonTable competitorUrl`, never a plain udemy.com URL. Reuse the existing code for that course (`git grep trk.udemy.com`); a course without one gets a new link from the impact.com dashboard (owner's Chrome session).

## Analytics

- GA4 runs from `plugins/analytics`: Consent Mode v2 defaults (denied in the EEA, UK and Switzerland until the banner's Accept), the hostname guard, and `content_group` from `src/utils/contentGroupRules.json`. Never re-add the preset `gtag` option or a consent plugin. A new top-level route family gets a rule there and a case in `scripts/__tests__/analytics.test.mjs`.
- `affiliate_link_clicked` carries `cta_type` (the format: CTA components pass `ctaType`, inline links fall back to `inline-<variant>`), `cta_location` (the placement: the `location` prop), and `destination_type` / `destination_slug` (parsed from the URL). A new CTA component passes its own `ctaType`; a monetised link that keeps its own markup calls `trackAffiliateClick`. On money pages every `<AffiliateLink>` gets a `location`.
- A new event parameter needs its GA4 custom dimension registered the day it ships (GA4 does not backfill). A PR that changes tracking adds or updates its epoch and its dimensions in `scripts/analytics/tracking.json` in the same PR.
- A PR that could move a metric carries an `analytics-note: <title>` line in its body (`analytics-note: skip` opts out). GA4 annotations are created only through `scripts/analytics/ga4admin.py`; Claude never edits or deletes one. Rules: `.claude/skills/site-analytics/references/annotation-rules.md`.
- Money figures stay in `secrets/ops` and chat, never in a committed file, PR, annotation or memory (the repo is public). Agents never run `npm run generate:data`.

## Voice

Write as the reviewer who has been inside every Scrimba course and path with a Pro account. Answer first, then the evidence: the module, the scrim count, the project, the instructor, the lesson you quote ("module 4 has you build a blackjack game in 55 scrims"). Short sentences, plain words, a verdict in every section, one next step at the end.

Two limits, both absolute: you reviewed the courses and never completed or graduated from one ("reviewed", "went through module 3"); every claim traces to the page's own screenshots and transcript quotes, `data/courses.json`, or a scrimba-browsing facts file. A fact you cannot trace is cut, not hedged. State provenance once per page.

Before writing prose, load `marketing-skills:copywriting`, `marketing-skills:copy-editing` and `humanizer`. The style guide with before/after examples is in the `scrimba-course-review` skill (Voice). No em-dashes.

## Links

- Every named Scrimba course or path in prose is a link: to our review page on first mention in a section, and to Scrimba through `<AffiliateLink>` where the reader decides. Headings, component props and the page's own course are exempt.
- Run `node scripts/audit-course-links.mjs --file <path>` on every page you touch; leave zero UNLINKED mentions and zero raw URLs.

## Sidebar labels

Every doc sets `sidebar_label`: 1 to 4 words, Title Case, no year, no "Scrimba", no question, no verdict. Course leaves use the course name as Scrimba lists it; paths are "<X> Path"; comparisons "vs <Competitor>"; category hub docs "Overview" at `sidebar_position: 0`. The frontmatter `title` stays the SERP title. Category labels live in `sidebars.ts` and match the navbar.

## CTA and component placement

One primary CTA where intent peaks, at most one secondary, at least two prose paragraphs between any two. Counted: button `AffiliateLink`, `PricingCTA`, `ScrimPoster`, `CourseCard`, `VerdictBox`, `ComparisonTable` with its CTA row. Not counted: inline text links, the sticky, RelatedGuides, screenshots, FAQ, schema.

| Page type | Primary | Secondary |
|---|---|---|
| Course leaf | start button closing "Who it's for" | `CourseCard` in the opening |
| Course hub | free-start button to the first course, end of "Where to start" | `PricingCTA ctaType="free"` at the end |
| Path page | path `CourseCard` after the verdict | `ScrimPoster` (free sample lesson) in the opening |
| Paths hub | button right after the comparison matrix | `PricingCTA` at the end |
| Comparison leaf | `PricingCTA` after "Bottom line" | `VerdictBox` near the top; `ComparisonTable hideCta` |
| Pricing pages | `PricingCTA` right after the decision section | one more, far from the primary |
| FAQ, help | demo button at the end (`hideGlobalPricingCta: true`) | none |
| How-it-works, for/*, intro, practice, roadmaps | one end CTA (auto or authored, never both) | `ScrimPoster` where the page shows a scrim |
| Blog | `PricingCTA` after the conclusion (`ctaType="free"` unless a money post) | one inline link on money posts |

Research-mode pages carry nothing in the first screen. `ScrimPoster` uses existing images only and links the lesson its frame shows.

## Gates before a commit

`npm run check:content` (em-dashes, Scrimba prices, stale Backend hours), `npm run typecheck`, the link audit on touched files, and `make build` when links changed (broken links fail the build).

## Skills

- `scrimba-course-review`: course leaves, hubs and path pages, and any voice/CTA rewrite of a docs page (loads `scrimba-browsing`).
- `scrimba-browsing`: anything that needs a fact or screenshot from inside Scrimba.
- `scrimba-explain`: creating, grading or embedding explainers.
