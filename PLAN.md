# scrimbaguide.tech Ranking Program — Execution Plan (Phase 2) (claude code session id : bfa4c060-ed84-43ae-a01f-ed46991e395a)

## Completed (as of 2026-05-28)

✅ **Phase 1 audit** — 5 detailed audit documents in `content-audit/`:
- `comparisons.md` (14 pages, highest-intent)
- `paths-faq-pricing.md` (12 pages, critical data bugs)
- `site-wide.md` (technical SEO, schema, AI surfaces)
- `courses.md` (79 generated pages + template)
- `other-pages.md` (40 pages, cannibalization map)
- `README.md` (executive summary + wave order)
- `EXECUTION-PLAN.md` (detailed Wave 0-6 steps)

✅ **Wave 0 — Shared infrastructure (MOSTLY DONE)**
- [x] AffiliateLink component: added `rel="nofollow"` for scrimba.com links (fixes affiliate link hygiene across all pages)
- [x] static/pricing.md: verified correct (links to scrimba.com/our-pricing, no prices)
- [x] Comparisons freshness dates: all 14 pages now have `last_update: { date: 2026-05-28 }` ← **HIGHEST-LEVERAGE FRESHNESS WIN**
- [ ] BreadcrumbList JSON-LD swizzle (deferred to Wave 3; not blocking)
- [ ] ReviewSchema + editorRating field (deferred to Wave 3; not blocking)

**Status:** Ready for `npm run build` (edits are correct; format fix applied). Next: continue build, commit, then Wave 2.

---

## Remaining Waves (2-6)

### Wave 2 — Paths (6) + FAQ
**Goal:** Fix data bugs, add schema, add freshness signals

**Critical blocker:** Backend path hours discrepancy
1. **Re-scrape** the live Scrimba backend course page to confirm 30.1h vs 39.4h
2. **If 30.1h is canonical:** update `data/courses.json` + all 6 occurrences in `backend-developer-path.mdx`
3. **Else:** add reconciling footnote explaining the difference (bundled standalone courses vs path-only runtime)
4. **AI path module count:** fix inconsistency (9 on CourseCard vs 8 on paths/index) — verify against live page, pick one
5. **Add `last_update` to:**
   - `docs/paths/index.mdx` (missing)
   - `docs/faq/index.mdx` (missing)
6. **FAQ page (thinnest, 814w):**
   - Add "is Scrimba legit/scam/worth it for beginners" framing
   - Add sourced trust signals (Trustpilot/Class Central links)
   - Link named internal references ("How Interactive Scrims Work" → `/docs/how-it-works/how-scrims-work`)
   - Add in-body `<AffiliateLink>` to a free course
7. **paths/index:** replace "roughly $200 a year" price language with link to pricing page
8. **Course schema** on all path pages (`timeRequired` matching committed figure)
9. **Module counts:** move from prose to `data/courses.json` or add build-time assert

**Files:** `docs/paths/*.mdx`, `docs/faq/index.mdx`, `data/courses.json`

---

### Wave 3 — Course generator + 79 pages
**Goal:** Template-level improvements that lift all 79 course pages at once

**FIRST: resolve STALE GENERATOR blocker**
- Live course pages were hand-rewritten into a stronger template than `scripts/generate-course-pages.mjs` produces
- Running `make generate-pages` would clobber the improvements
- **Action:** Move prose improvements into `data/courses.json` OR retire/rework the generator. **Do NOT regenerate yet.**

**Then, via generator + data (lifts all 79):**
1. Add `<ReviewSchema>` with `editorRating` field (author: Yassine, independent) — requires `editorRating` in `data/courses.json`
2. Add `BreadcrumbList` JSON-LD via swizzle
3. Feed `CourseSchema` full keywords (currently ~2 tokens vs 5 in frontmatter)
4. Make comparison/pricing links **category-aware** (course → relevant path + relevant comparison + pricing hub; currently hardcoded Codecademy/Udemy regardless of topic)
5. Fix thin stub: `docs/courses/ai/openaiassistants.mdx` (465w, no verdict/CourseSchema, placeholder duration)

**Files:** `scripts/generate-course-pages.mjs`, `data/courses.json`, `src/theme/` (BreadcrumbList swizzle), `src/components/ReviewSchema/`

---

### Wave 4 — Pricing + thin-page wins
**Goal:** Deepen pages that compete on low-competition intent

1. **Add `last_update` to:**
   - `docs/pricing/index.mdx` (missing)
   - `docs/pricing/pro-vs-free.mdx` (missing)

2. **pricing/refund-policy.mdx:**
   - Add HowTo schema for refund steps
   - Add refund-vs-cancellation comparison table
   - Add sourced real-experience note (Trustpilot/Reddit quote)
   - Frame 7-day window as risk-reducer

3. **pricing/student-discount.mdx:**
   - Add 3-option comparison table (speed/duration/eligibility)
   - Add sourced historical-promo patterns (no current prices)

4. **pricing/study-plan.mdx:**
   - Link each module row to the actual course/path page
   - Add HowTo schema (steps = months)
   - Add downloadable/printable checklist
   - Add weekly deliverables
   - Fullstack variant or explicit note about Frontend-only scope
   - Target 2,000+ words

5. **pricing/pro-vs-free.mdx:**
   - Add "how far can you get for free" walkthrough
   - Add decision flowchart
   - Expand to 1,500+ words

6. **pricing/scrimba-vs-bootcamps.mdx:**
   - Add sourced named-bootcamp cost/duration/job-guarantee table vs Scrimba self-paced
   - Cite each bootcamp's pricing page
   - Keep price rule (ranges for bootcamps, link for Scrimba)
   - Expand to 1,800+ words

7. **pricing/index.mdx:**
   - Lean into "is Pro worth it" + "cheapest legit way to pay" angles
   - Source the $10k-$20k bootcamp range
   - Replace hardcoded "about 19 full courses" with `freeCount` variable

**Files:** `docs/pricing/*.mdx`

---

### Wave 5 — Cannibalization cleanup (redirects, never deletions)
**Goal:** Resolve intent conflicts via redirects (infrastructure already exists)

**Worst cannibalization:** `learn-react/*` — 6 sub-500w concept stubs
- Redirect all 6 (quick-start, describing-ui, adding-interactivity, managing-state, escape-hatches, server-components) into `learn-react/index`

**Similar:** `learn-nextjs/*`
- Redirect 4 leaves into `learn-nextjs/index`

**Practice drills:** `practice/*`
- Fold 7 thin drills into the 4 substantial practice pages or matching `courses/*`

**Smaller merges:**
- `how-it-works/accreditation` → `certificates`
- `how-it-works/using-scrimba` → `how-scrims-work`
- `how-it-works/is-scrimba-free` → pricing hub

**Mechanism:**
1. Add redirects in `docusaurus.config.ts` under `@docusaurus/plugin-client-redirects`
2. Add redirect sources to `SITEMAP_EXCLUDED_PATHS` in `docusaurus.config.ts`
3. Keep source files (never delete); redirect them

**Reference:** Repo did this exact move for blog cluster on 2026-05-28 (grep for `blog/` in config).

**Files:** `docusaurus.config.ts`

---

### Wave 6 — help/ + for/ enrichment (optional, long-tail)
**Goal:** Strengthen 14 STRENGTHEN-verdict pages to match quality of anchor pages

**Pages to strengthen:** `for/*`, `how-scrims-work`, `tutorial-hell`, `billing`, `troubleshooting`, `community-and-events`

**Actions per page:**
- Confirm/add schema (FAQPage, Article, HowTo where appropriate)
- Add/refresh `last_update` dates
- Add depth (1,500+ words minimum for competitive intent)
- Cross-link to paths/comparisons/pricing hubs

**Files:** `docs/for/*.mdx`, `docs/help/*.mdx`, `docs/how-it-works/*.mdx` (selective)

---

## Build & Verification Gate

After each wave:
1. `npm run build` (or `make build` if Makefile wrapper exists)
2. Browser spot-check: load one edited page from the wave, verify:
   - Freshness date displays
   - Schema validates (Rich Results Test for one page)
   - Affiliate links show correct `rel="nofollow"`
   - No em-dashes in edited text
   - No exact Scrimba prices (if pricing touched)
3. Grep edited files for violations:
   - Em-dashes: `grep -r -- '—' docs/`
   - Hand-written `scrimba.com` anchors: `grep -r 'href="https://scrimba.com' docs/ | grep -v AffiliateLink`
   - Exact prices: `grep -r '\$[0-9]' docs/pricing/` (should find only competitor prices, not Scrimba's)

---

## Key Constraints (every wave)
- No em-dashes (top AI-writing tell; project rule)
- Never quote exact Scrimba prices (link `scrimba.com/our-pricing` instead)
- Author = independent reviewer, never a course graduate
- All scrimba.com links via `<AffiliateLink>` component
- Trailing-slash canonical URLs (docusaurus.config.ts enforces)
- Edits enhance, never rewrite
- Redirects for consolidation (never deletions)

---

## Realistic Outcome
Literal #1 on 145 queries depends on off-site authority and indexing time we don't fully control. This program owns the on-page + structure + schema layer. Realistic outcome: **materially higher positions + large jump in AI-citation share**. Track post-deploy via Search Console (~/use-apify/indexer).

---

## Next Immediate Step
1. Complete and verify `npm run build` (Wave 0 edits are correct; format fix applied)
2. Commit Wave 0 + 1 changes
3. Start Wave 2 (paths + FAQ) with the critical backend hours re-scrape
