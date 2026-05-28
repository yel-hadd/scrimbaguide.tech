# Phase 2 Execution Plan — scrimbaguide.tech ranking program

Consolidated, verified plan for executing fixes found in Phase 1. Read alongside `README.md` (exec summary), `comparisons.md`, `paths-faq-pricing.md`, `courses.md`, `other-pages.md`, `site-wide.md`.

## Ground-truth reconciliation (verified 2026-05-28, corrects subagent conflicts)
- **`/pricing.md` does NOT exist** (only `static/llms.txt`). Must add. (site-wide agent was wrong; README right.)
- **BreadcrumbList JSON-LD: confirmed absent** everywhere in `src/` and `scripts/`. Must add.
- **ReviewSchema: component EXISTS** (`src/components/ReviewSchema/`) but is **used by 0 pages**, and `courses.json` has **0 `editorRating` fields**. Wire it up + add the data field.
- **FAQPage schema already works** via `src/components/DocFaqSchema/` (wired in `src/theme/MDXComponents.tsx`). Comparison + path pages already emit it. Gap is consistency/expansion, NOT absence. (Corrects README Wave 0 framing — no need to "make FAQAccordion emit schema"; DocFaqSchema is the canonical emitter.)
- **VerdictBox + last_update + visible "Last reviewed" line already exist** as patterns on most pages. Wave 0 standardizes/extends existing components rather than building new ones.

## Non-negotiable rules (every wave)
No em-dashes. Never quote exact Scrimba prices (link `scrimba.com/our-pricing`). Author = independent reviewer, never a course graduate. All scrimba.com links via `<AffiliateLink>`. Trailing-slash canonical URLs. Edits enhance, not rewrite. Redirects (never deletions) for consolidation, via `@docusaurus/plugin-client-redirects` + `SITEMAP_EXCLUDED_PATHS`.

## Verification gate after every wave
`make typecheck` + `make build` (MDX compiles, sitemap + llms.txt regenerate). Browser spot-check edited pages. Grep edited files for em-dashes, hand-written `scrimba.com` anchors, exact-price strings. Confirm affiliate CTAs carry `?via=u42d4986` + `rel=nofollow`. Validate schema (Rich Results Test). Pause for user review before next wave.

---

## Wave 0 — Shared infrastructure (blocks Waves 1-3; highest leverage)
One change here lifts many pages at once.

1. **Affiliate-link hygiene (component-level).** Make `ComparisonTable` and `VerdictBox` route their `ctaHref` props through `<AffiliateLink>` internally (append `?via=u42d4986`, set `rel="nofollow"`, add tracking). This fixes all 13 comparison pages + others that pass raw `https://scrimba.com/?via=...` and raw `s0v687325e` hrefs. Files: `src/components/ComparisonTable/`, `src/components/VerdictBox/` (confirm exact paths), `src/components/AffiliateLink/`.
2. **BreadcrumbList JSON-LD.** Swizzle `@theme/DocBreadcrumbs` (or `DocItem`) to emit BreadcrumbList schema for the whole docs tree. Files: `src/theme/DocBreadcrumbs/` (new swizzle).
3. **Wire ReviewSchema + data field.** Add an `editorRating` (and `reviewBody`/`datePublished`) field to course + path entries in `data/courses.json`; render `<ReviewSchema>` (author Yassine, independent, NO prices) on course + path pages. Files: `src/components/ReviewSchema/`, `data/courses.json`, `scripts/generate-course-pages.mjs`, path MDX.
4. **Add `static/pricing.md`** for AI agents: structured plan summary that LINKS to `scrimba.com/our-pricing` and never quotes a number. Add to sitemap awareness if applicable.
5. **Verify `llms.txt` coverage** surfaces comparison + path pages prominently (`scripts/generate-llms-from-sitemap.mjs`).

Acceptance: build passes; one comparison page shows nofollow+tracked CTA; one course page emits Review + Breadcrumb + Course + FAQ schema in Rich Results Test; `/pricing.md` reachable.

---

## Wave 1 — Comparisons (13 head-to-heads + hub)
- **Freshness pass (3 pages only):** add `last_update: 2026-05-23` + visible "Last reviewed: May 2026" to `index.mdx`, `scrimba-vs-codecademy.mdx`, `scrimba-vs-odin-project.mdx`.
- **FAQ expansion:** +2-3 literal-match long-tail Qs per page ("Is [competitor] worth it in 2026?", "Can I get a job with Scrimba alone?", "Is [competitor] free?"). Align visible `FAQAccordion` set to the full `DocFaqSchema` set (codecademy has a 4-vs-3 mismatch).
- **Stat hygiene:** route all Scrimba facts through `scrimbaFacts` (fix "all 86 courses" drift in Udemy verdict); wrap external stats (Trustpilot, competitor prices, course counts) in dated sourced spans.
- **Intent reframing:** lead `scrimba-vs-youtube`, `scrimba-vs-freecodecamp`, `scrimba-vs-odin`, `scrimba-vs-fireship` into the higher-volume "is X enough to learn/get a job" informational question with a 50-word extractable answer. Explicitly split beginner-vs-advanced for boot-dev/FEM/pluralsight/educative.
- **Hub:** add `ItemList` schema enumerating the 13 comparisons + a 50-word "best Scrimba alternative depends on your goal" answer block.
- **Thin head-to-heads** to grow toward ~2000w: fireship (1645), freecodecamp (1660), educative (1686), pluralsight (1700), zerotomastery (1747).

---

## Wave 2 — Paths (6) + FAQ
- **Backend hours (highest credibility fix):** re-scrape the live Scrimba backend course page. If 30.1h is the canonical path-only runtime, correct `data/courses.json` and all 6 occurrences in `backend-developer-path.mdx`; else add a footnote reconciling 39.4h (bundled standalone courses) vs the 30.1h Scrimba/Class Central figure. Do not silently keep a contradicted number.
- **AI path module count:** fix 8 (paths/index) vs 9 (ai-engineer CourseCard) sitewide; pick one, verify against live.
- **Data-source module counts:** store module counts in `data/courses.json` (`pathInfo.moduleCount` currently null for all) or add a build-time assert flagging page/data mismatch.
- **Course schema** on all path pages (`timeRequired` matching committed figure, educationalLevel).
- **Freshness:** add `last_update` to `paths/index.mdx` and `faq/index.mdx` (both missing).
- **paths/index:** replace "roughly $200 a year" price language with the pricing-page link (price rule); add `ItemList`/`Course` schema for the 4 paths; in-body `<AffiliateLink>` after the matrix.
- **FAQ page (thinnest, 814w):** add "is Scrimba legit/scam/worth it for beginners" framing + sourced trust signals (Trustpilot/Class Central with links); link named internal references; in-body `<AffiliateLink>` to a free course.
- Expand backend (1564) and fullstack (1688) toward 2000w with per-module hours + named capstone projects + realistic-calendar table.

---

## Wave 3 — Course generator + 79 pages
- **FIRST: reconcile the STALE generator.** Live course pages were hand-rewritten into a stronger template than `scripts/generate-course-pages.mjs` produces; running `make generate-pages` would clobber them. Move the improved prose into `data/courses.json` (or retire/rework the generator) BEFORE any regeneration. This is a blocker for the rest of Wave 3.
- Then via generator/data (lifts all 79 at once): add `<ReviewSchema>` (editorRating), `BreadcrumbList`, full keyword set into `CourseSchema` (currently ~2 tokens vs 5 in frontmatter), and **category-aware** interlinks (course -> relevant path + relevant comparison + pricing hub; current comparison links are hardcoded Codecademy/Udemy regardless of topic; `relatedGuidesMap.ts` has no course entries).
- **Thin stub:** fix `docs/courses/ai/openaiassistants.mdx` (465w, no verdict/CourseSchema, placeholder duration). Guard against `modules: []` / short-description records re-thinning if generator runs.

---

## Wave 4 — Pricing + thin-page wins
- `last_update` on `pricing/index.mdx` + `pro-vs-free.mdx`.
- **refund-policy:** HowTo schema for refund steps; refund-vs-cancellation table; sourced real-experience note (Trustpilot/Reddit). Frame 7-day window as risk-reducer.
- **student-discount:** 3-option comparison table (speed/duration/eligibility); sourced historical-promo patterns (no current prices).
- **study-plan:** link each module row to the actual course/path page; HowTo schema (steps = months); printable checklist; weekly deliverables; Fullstack variant or note; target 2000w.
- **pro-vs-free:** "how far can you get for free" walkthrough + decision flowchart; expand to 1500w.
- **scrimba-vs-bootcamps:** sourced named-bootcamp cost/duration/job-guarantee table vs Scrimba self-paced; cite each bootcamp's pricing page; expand to 1800w. Keep price rule (ranges for bootcamps, link for Scrimba).
- **pricing/index:** lean into "is Pro worth it" + "cheapest legit way to pay"; source the $10k-$20k bootcamp range; keep `freeCount` variable (drop "about 19 full courses" hardcode).

---

## Wave 5 — Cannibalization cleanup (redirects, never deletions)
Verdicts from `other-pages.md`: 22 CONSOLIDATE-REDIRECT.
- **learn-react/* (worst):** redirect 6 sub-500w concept stubs (quick-start, describing-ui, adding-interactivity, managing-state, escape-hatches, server-components) into `learn-react/index`.
- **learn-nextjs/*:** redirect 4 leaves into `learn-nextjs/index`.
- **practice/*:** fold 7 thin drills into the 4 substantial practice pages or matching `courses/*`.
- Smaller merges: `how-it-works/accreditation` -> `certificates`; `using-scrimba` -> `how-scrims-work`; `is-scrimba-free` -> pricing.
- Mechanism: add redirects in `docusaurus.config.ts` (`@docusaurus/plugin-client-redirects`) + add losers to `SITEMAP_EXCLUDED_PATHS`. Pick ONE canonical owner per intent. (Repo did this exact move for the blog cluster on 2026-05-28 — follow that pattern.)

---

## Wave 6 — help/ + for/ enrichment
Strengthen the 14 STRENGTHEN-verdict pages (`for/*`, `how-scrims-work`, `tutorial-hell`, `billing`, `troubleshooting`, `community-and-events`): add/confirm schema, freshness dates, depth, and cross-cluster links. These are already the model pages; bring the rest of their cohort up to match.

---

## Reality check
Literal #1 on 145 queries depends on off-site authority and indexing time we do not fully control. This program owns the on-page + structure + schema layer, where the biggest, fastest, controllable gains are. Realistic outcome: materially higher positions and a large jump in AI-citation share. Track movement post-deploy via Search Console (tooling: ~/use-apify/indexer).
