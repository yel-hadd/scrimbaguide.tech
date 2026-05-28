# Content Audit: "Other" Doc Pages

Scope: doc pages NOT in paths / comparisons / faq / pricing / courses. Covers `help/`, `for/`, `how-it-works/`, `learn-react/`, `learn-nextjs/`, `practice/`, plus `docs/intro.mdx` and `docs/changelog.mdx`. Audited 2026-05-28.

Canonical URL pattern: `https://scrimbaguide.tech/docs/<path>/` (trailing slash). Consolidation must use `@docusaurus/plugin-client-redirects` + `SITEMAP_EXCLUDED_PATHS`, never deletions.

Total pages audited: **40**
- help/ = 3
- for/ = 5
- how-it-works/ = 7
- learn-react/ = 7
- learn-nextjs/ = 5
- practice/ = 11
- intro.mdx = 1
- changelog.mdx = 1

Verdict tally: **STRENGTHEN 14 / CONSOLIDATE-REDIRECT 22 / LEAVE 4**

---

## Cross-cutting summary

The site is in good shape on the "anchor" pages (intro, beginners, how-scrims-work, the `for/*` audience pages) which already carry quick-answer blocks, FAQ-with-schema, freshness dates, and proper `<AffiliateLink>` CTAs. The problem is the two **tutorial clusters**, `learn-react/*` and `learn-nextjs/*`, plus the **long tail of thin `practice/*` drill pages**. These are sub-500-word concept stubs that an independent affiliate review site has no authority to rank for, and they cannibalize the real `courses/*` review pages.

### Cannibalization map (the core finding)

| Conflict | Pages involved | Stronger page (keep) | Action for weaker side |
|---|---|---|---|
| **learn-react/* concept stubs vs react.dev + courses/react** (WORST) | `learn-react/{quick-start, describing-ui, adding-interactivity, managing-state, escape-hatches, server-components}` (6 leaves) | `learn-react/index` (the docs-to-Scrimba roadmap hub) and `courses/react/*` | Redirect the 6 leaf stubs INTO `learn-react/index`; the hub already contains every concept as a table row |
| **learn-nextjs/* concept stubs vs nextjs.org + courses/javascript/nextjs** | `learn-nextjs/{getting-started, routing, rendering, data-fetching}` (4 leaves) | `learn-nextjs/index` (the roadmap hub) | Redirect the 4 leaves into the hub; same duplicated content |
| **practice/* micro-drills vs courses/* and each other** | `practice/{practice-api-calls, practice-css-grid, practice-flexbox, practice-javascript-arrays, practice-react-hooks, build-a-weather-app-interactively, react-portfolio-project-ideas}` | `practice/practice-react-projects`, `practice/practice-tailwind-css`, `practice/practice-typescript`, `practice/practice-ai-engineering` (the 600w+ ones) | Consolidate the 7 thin drills into the 4 substantial practice pages or into the matching `courses/css` / `courses/react` pages |
| **how-it-works/is-scrimba-free vs pricing + faq + intro** | `how-it-works/is-scrimba-free` (438w), `intro` Free-vs-Pro section, `docs/pricing` | `docs/pricing` / `pricing/pro-vs-free` | is-scrimba-free is thin and duplicates pricing; redirect or strengthen with a free-list table that pricing lacks |
| **how-it-works/using-scrimba vs how-scrims-work** | `using-scrimba` (552w) | `how-scrims-work` (1401w, the deep explainer) | Fold using-scrimba into how-scrims-work; near-identical intent |
| **how-it-works/certificates vs how-it-works/accreditation** | both cover "are Scrimba certificates worth it / recognized" | pick one (recommend `certificates`) | Redirect `accreditation` into `certificates`; same query, split equity |
| **intro.mdx (slug `/intro`) vs `src/pages/index.tsx` (`/`)** | `docs/intro.mdx` | React homepage owns `/` | No conflict: intro uses `slug: /intro`, not `/`. LEAVE. |

Single worst conflict: **`learn-react/*`**. Six near-duplicate concept stubs (quick-start, describing-ui, adding-interactivity, managing-state, escape-hatches, server-components) restate what `learn-react/index` already tabulates and what react.dev owns outright. None can rank; they split internal link equity and confuse AI crawlers about the canonical "Scrimba React" answer. The `learn-nextjs/*` cluster is the identical pattern at smaller scale.

---

## help/ (3 pages)

| Page | Primary query | Word ct | Verdict | Notes |
|---|---|---|---|---|
| `billing` | "Scrimba billing / cancel / refund" | 848 | **STRENGTHEN** | Bottom-of-funnel. Add a clear cancel/refund step list, freshness date, FAQ schema. Keep pricing links to scrimba.com/our-pricing, no exact figures. |
| `community-and-events` | "Scrimba Discord community / events" | 1360 | **LEAVE** | Solid length and scope. Low commercial intent but legitimate Pro-perk explainer; intro already links to it. Light refresh only. |
| `troubleshooting` | "Scrimba not working / login / playback issues" | 1517 | **LEAVE** | Long, genuinely useful support content with good long-tail capture. Add a freshness date; otherwise fine. |

## for/ (5 pages)

All five are strong: ~1100-1355 words, quick-answer block, "read this if / skip this if", FAQ with schema, freshness date, proper `<AffiliateLink>` CTA. This is the model the rest of the site should copy.

| Page | Primary query | Word ct | Verdict | Notes |
|---|---|---|---|---|
| `beginners` | "is Scrimba good for beginners" | 1101 | **STRENGTHEN** (light) | Best-in-class template. Highest-volume audience query. Add FAQ JSON-LD schema if not already emitted (currently uses FAQAccordion without `emitSchema`). |
| `busy-professionals` | "learn to code while working full time" | 1341 | **LEAVE** | Distinct intent, well executed. |
| `cs-students` | "Scrimba for CS students / supplement degree" | 1355 | **LEAVE** | Distinct intent, well executed. |
| `designers` | "learn to code for designers" | 1153 | **LEAVE** | Distinct intent, well executed. |
| `marketers` | "learn to code for marketers / no-code to code" | 1272 | **LEAVE** | Distinct intent, well executed. |

Note: confirm FAQ JSON-LD is emitted. `FAQAccordion` appears to emit schema by default (the `billing` page explicitly sets `emitSchema={false}` on secondary accordions to avoid duplicate schema, which implies the first/default accordion emits). Verify the `for/*` FAQ blocks are schema-eligible; if not, add `emitSchema={true}` to the first accordion on each.

## how-it-works/ (7 pages)

| Page | Primary query | Word ct | Verdict | Notes |
|---|---|---|---|---|
| `how-scrims-work` | "how does Scrimba work / what is a scrim" | 1401 | **STRENGTHEN** | Prime GEO target. Add a one-line verdict block + FAQ schema; absorb `using-scrimba`. |
| `tutorial-hell` | "how to escape tutorial hell" | 1336 | **STRENGTHEN** | Great non-brand informational query that pulls top-of-funnel traffic. Keep, add schema + CTA. |
| `learning-speed` | "how long to learn to code / front end" | 959 | **STRENGTHEN** | Good question-intent page. Expand with a realistic timeline table; add freshness date. |
| `certificates` | "are Scrimba certificates worth it" | 1078 | **STRENGTHEN** | High commercial-adjacent query. Make this the single canonical certificate page. |
| `accreditation` | "is Scrimba accredited / recognized" | 1047 | **CONSOLIDATE/REDIRECT** | Same searcher intent as `certificates` (recognition by employers). Redirect into `certificates` with an "Is it accredited?" section. |
| `using-scrimba` | "how to use Scrimba / getting started" | 552 | **CONSOLIDATE/REDIRECT** | Thin, duplicates `how-scrims-work`. Fold in and redirect. |
| `is-scrimba-free` | "is Scrimba free" | 438 | **CONSOLIDATE or STRENGTHEN** | Thinnest of the group and overlaps pricing + intro's Free-vs-Pro. Either redirect to `pricing/pro-vs-free`, or strengthen with the actual free-course list table (which pricing lacks). Recommend redirect unless the free-list table is added. |

## learn-react/ (7 pages) — WORST cannibalization cluster

| Page | Primary query | Word ct | Verdict | Notes |
|---|---|---|---|---|
| `index` | "learn React roadmap / learn React with Scrimba" | 623 | **STRENGTHEN** | Keep as the ONE hub. It already maps react.dev sections to scrims in tables. Add a verdict line + freshness date; absorb the 6 leaves. |
| `quick-start` | "React quick start / first component" | 401 | **CONSOLIDATE/REDIRECT** | Concept stub owned by react.dev; duplicates section 1 of the hub. |
| `describing-ui` | "React props / JSX / rendering lists" | 375 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 2. |
| `adding-interactivity` | "React state / events / useState" | 472 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 3. |
| `managing-state` | "React context / useReducer" | 438 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 4. |
| `escape-hatches` | "useEffect / useRef" | 482 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 5. |
| `server-components` | "React server components" | 532 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 6; directly overlaps `learn-nextjs/rendering` (both teach Server vs Client Components) AND it already cross-links `/docs/learn-nextjs/` and `courses/javascript/nextjs`, a self-admitted "short conceptual bridge". Redirect into the React hub or the Next.js hub. |

Rationale: an affiliate site cannot outrank react.dev / MDN / freeCodeCamp on pure-concept queries. Redirect all 6 leaves into `learn-react/index`; the hub captures the long-tail naturally through its tables and keeps all internal equity on one URL.

## learn-nextjs/ (5 pages) — same pattern

| Page | Primary query | Word ct | Verdict | Notes |
|---|---|---|---|---|
| `index` | "learn Next.js roadmap / App Router with Scrimba" | 499 | **STRENGTHEN** | Keep as the ONE hub. Add verdict + freshness; absorb the 4 leaves. |
| `getting-started` | "Next.js setup / first App Router page" | 397 | **CONSOLIDATE/REDIRECT** | Owned by nextjs.org; duplicates hub section 1. |
| `routing` | "Next.js routing / dynamic routes" | 435 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 2. |
| `rendering` | "server vs client components" | 486 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 3; overlaps `learn-react/server-components`. |
| `data-fetching` | "Next.js data fetching / server actions" | 432 | **CONSOLIDATE/REDIRECT** | Duplicates hub section 4. |

## practice/ (11 pages)

Keep the 4 substantial pages as topic hubs; consolidate the 7 thin micro-drills into them or into the matching course pages.

| Page | Primary query | Word ct | Verdict | Notes |
|---|---|---|---|---|
| `practice-react-projects` | "React project ideas / practice projects" | 701 | **STRENGTHEN** | Keep as React-practice hub; absorb `practice-react-hooks` and `react-portfolio-project-ideas`. |
| `practice-tailwind-css` | "Tailwind CSS practice / projects" | 645 | **STRENGTHEN** | Substantial. Keep; ensure CTA + freshness. |
| `practice-typescript` | "TypeScript practice / exercises" | 678 | **STRENGTHEN** | Substantial. Keep. |
| `practice-ai-engineering` | "AI engineering practice / projects" | 837 | **STRENGTHEN** | Substantial, distinct, on-trend. Keep. |
| `practice-react-hooks` | "React hooks practice / exercises" | 395 | **CONSOLIDATE/REDIRECT** | Thin; fold into `practice-react-projects` or `courses/react`. |
| `react-portfolio-project-ideas` | "React portfolio project ideas" | 527 | **CONSOLIDATE/REDIRECT** | Overlaps `practice-react-projects`; merge. |
| `build-a-weather-app-interactively` | "build a weather app tutorial" | 534 | **CONSOLIDATE/REDIRECT** | Single-project stub; fold into `practice-react-projects` or `practice-api-calls`. |
| `practice-css-grid` | "CSS grid practice" | 346 | **CONSOLIDATE/REDIRECT** | Thin; fold into `courses/css/css-grid` (a real review page). |
| `practice-flexbox` | "flexbox practice" | 350 | **CONSOLIDATE/REDIRECT** | Thin; fold into `courses/css/flexbox`. |
| `practice-javascript-arrays` | "JavaScript array practice" | 395 | **CONSOLIDATE/REDIRECT** | Thin; fold into a JS practice hub or `courses/javascript`. |
| `practice-api-calls` | "JavaScript fetch / API practice" | 299 | **CONSOLIDATE/REDIRECT** | Thinnest page in the whole audit. Fold into `build-a-weather-app` target or a JS practice hub. |

Note: there is no `practice/index` hub. Consider creating one canonical `/docs/practice/` landing that links the 4 kept hubs, then redirect the 7 thin drills there or into the relevant course.

## Root pages (2)

| Page | Slug | Verdict | Notes |
|---|---|---|---|
| `intro.mdx` | `/intro` | **LEAVE** | Strong: quick-answer, who-it-is-for table, Free-vs-Pro, comparison links, FAQ with `emitSchema={true}`. No root-slug collision (uses `/intro`, not `/`). This is the model GEO page. |
| `changelog.mdx` | `/changelog` | **LEAVE** | Short (296w) but a legitimate freshness/trust signal. Keep updated with dated entries. |

---

## Recommended fixes by bucket

### Ranking (SEO)
- Collapse the two tutorial clusters: redirect the 6 `learn-react/*` leaves into `learn-react/index` and the 4 `learn-nextjs/*` leaves into `learn-nextjs/index` via `@docusaurus/plugin-client-redirects`, and add the old paths to `SITEMAP_EXCLUDED_PATHS`. This concentrates equity on the two hubs that actually have a Scrimba-specific angle.
- Consolidate the 7 thin `practice/*` drills into the 4 substantial practice pages (or matching `courses/*` pages). Create one `/docs/practice/` hub.
- Merge `how-it-works/accreditation` into `certificates`, and `using-scrimba` into `how-scrims-work`. Resolve `is-scrimba-free` (redirect to pricing OR add the free-course-list table).
- Stop targeting pure-concept queries (useState, App Router, JSX). Reframe any kept concept content as "how Scrimba teaches X" inside the hub or course review, where the affiliate angle gives a reason to exist.

### GEO (AI citation)
- Add a one-sentence verdict/answer block to the top of every STRENGTHEN page (how-scrims-work, certificates, learning-speed, learn-react/index, learn-nextjs/index, the 4 practice hubs). The `for/*` and `intro` pages already do this well.
- Turn on `emitSchema={true}` on FAQAccordion across `for/*`, `beginners`, `how-scrims-work`, `certificates`. Currently only `intro.mdx` emits FAQ JSON-LD.
- Add a visible "Reviewed May 2026" freshness line to every kept page that lacks one (the `for/*` pages model this with `last_update`). AI engines and Google both favor explicit recency.
- Prefer specific checkable claims (free-course list, cancel steps, realistic timelines) over hedged "Scrimba offers..." phrasing.

### Conversion
- The `learn-react/*` and `learn-nextjs/*` hubs use `PricingCTA`/`CourseCard` correctly. Ensure every STRENGTHEN page ends with one clear `<AffiliateLink>` or `PricingCTA`.
- Reuse the no-signup demo scrim (`https://scrimba.com/s0v687325e`) as a "try it free, no signup" CTA on how-scrims-work, tutorial-hell, and beginners.
- Replace sideways links between thin help pages with contextual links to commercial pages (relevant course/path review).

### Copy constraints applied
- No em-dashes anywhere.
- Never quote exact Scrimba prices; link `https://scrimba.com/our-pricing` (note: several pages currently link `scrimba.com/home?pricing` which is acceptable as the affiliate pricing entry, but never inline a dollar figure). The `for/busy-professionals` FAQ says "the cost per month is low" which is fine; do not let any page state a number.
- Maintain independent-reviewer voice; do not imply course completion/graduation (note: `how-it-works/learning-speed` and others correctly say "many Scrimba graduates" about learners, not the author, which is fine).
- All scrimba.com links via `<AffiliateLink>` (the `?via=u42d4986` tag is already present throughout). The concept-stub pages use raw markdown `[...](https://scrimba.com/...?via=...)` links rather than the `<AffiliateLink>` component in several spots (e.g. the inline "Interactive Lesson" links in `learn-react/*` and `learn-nextjs/*`). If any of those pages are kept rather than redirected, route them through `<AffiliateLink>` so `rel="nofollow"` is applied consistently.

### Implementation note on redirects
Redirect infrastructure already exists and is the sanctioned path: `@docusaurus/plugin-client-redirects` is configured in `docusaurus.config.ts` (line 267), `SITEMAP_EXCLUDED_PATHS` (line 27) handles sitemap exclusion, and the repo already did exactly this kind of consolidation on 2026-05-28 for the blog cluster ("merged into pillars, now redirect stubs"). Follow that same pattern: add a `{ from, to }` entry per redirected leaf and add the old path to `SITEMAP_EXCLUDED_PATHS`. Do not delete the MDX files; turn the hub into the canonical target.
