# Course Pages: SEO + GEO Template Audit

Scope: the 71 generated course pages under `docs/courses/{react,javascript,css,ai,typescript,python,backend}/`
(excluding the 7 `index.mdx` hub pages). Originally produced by
`scripts/generate-course-pages.mjs` from `data/courses.json`, but since hand-rewritten into a
much stronger review template.

## CRITICAL FINDING: the committed generator is STALE and would clobber the live pages

`scripts/generate-course-pages.mjs` does NOT produce the pages currently on disk. The live pages
diverge from the generator on nearly every axis:

| Aspect | Stale generator emits | Live pages actually have |
|---|---|---|
| Title | `"{title}: Scrimba Review"` | Hand-written review titles ("Learn CSS Grid", "Learn RAG") |
| Frontmatter | title/description/keywords only | adds `last_update: { date: 2026-05-27 }` and 5-token `keywords` |
| Verdict | none | `## Quick answer` 40-60 word TL;DR |
| Body | templated boilerplate (Prerequisites, Who Is This For) | bespoke prose: "Is it worth your time?", "Strengths and limits", "Who it's for and who should skip it" |
| FAQ | 3 generic Q&A | 4-5 tailored Q&A |
| Internal links | path + comparison stubs | hand-curated siblings, vs-freeCodeCamp, etc. |

**Implication:** "fix the generator" is the wrong framing for most gaps. Re-running it
(`make generate-pages`) would OVERWRITE all the hand-tuned content. The repo is in a dangerous
in-between state. Highest-priority action item:

> **S1 (do this first).** Either (a) upgrade the generator to emit the new template and move the
> per-course prose into `courses.json` fields, or (b) formally retire the generator and document
> these as authored pages in CLAUDE.md. Until then, regeneration is destructive.

---

## 1. Current live-page template state (verified by reading 8 pages + grep across all 71)

| Element | Present? | Coverage | Notes |
|---|---|---|---|
| `last_update` freshness date | Yes | 71/71 | strong freshness signal |
| H1 + intro sentence | Yes | 71/71 | |
| `## Quick answer` verdict (40-60w) | Yes | **70/71** | only `ai/openaiassistants` missing |
| `<CourseCard>` (duration/level/access/instructor) | Yes | 71/71 | |
| `<CourseSchema>` Course JSON-LD | Yes | **70/71** | only `ai/openaiassistants` missing |
| `<FAQAccordion>` (visual FAQ) | Yes | 70/71 | |
| **FAQPage JSON-LD** | **Yes (automatic)** | 70/71 | `FAQAccordion` emits it by default (`emitSchema=true`); no separate component needed |
| **Article JSON-LD** | **Yes (automatic)** | 71/71 | swizzled `src/theme/DocItem/Layout` emits an `Article` node (author Yassine El Haddad, dateModified) on every doc |
| **BreadcrumbList JSON-LD** | **No** | 0/71 | not emitted anywhere (no breadcrumb component/swizzle exists; config comment at line 438 describes intent only) |
| Bespoke worth-it / strengths-limits / who-for prose | Yes | ~70/71 | independent-reviewer voice |
| `<AffiliateLink>` / `<PricingCTA>` | Yes | 71/71 | end of page |
| no em-dashes, no exact prices (links `/our-pricing`) | Compliant | 71/71 | |

**Strengths.** This is already a strong review template: extractable `Quick answer` verdict near
the top, real freshness dates, honest independent-reviewer voice with "who should skip it"
caveats, Course JSON-LD + FAQPage JSON-LD on nearly every page, clean affiliate and pricing
hygiene. Well ahead of typical templated affiliate docs.

---

## 2. Real uniform gaps still present across the live pages

Note on schema already covered: `Course` (via `CourseSchema`), `FAQPage` (auto via `FAQAccordion`),
and `Article` (auto via the swizzled `src/theme/DocItem/Layout`) are ALL emitted already.
The remaining gaps are:

1. **No `BreadcrumbList` JSON-LD anywhere.** Confirmed: no breadcrumb component or swizzle exists
   (`src/theme` swizzles `DocItem` but NOT `DocBreadcrumbs`); zero `BreadcrumbList` hits in `src/`
   or `plugins/`. The config comment at line 438 says per-page `BreadcrumbList` is "emitted by
   their components" but no such component was ever built. Adding `BreadcrumbList`
   (Home > Courses > {Category} > {Course}) enables SERP breadcrumb display and helps AI engines
   place each page in the hierarchy. Best fixed once via a `DocBreadcrumbs` swizzle (lifts the
   whole docs tree, not just courses).

2. **No `Review` / Rating schema, despite the component existing.** `src/components/ReviewSchema.tsx`
   exists, is purpose-built for this (independent named-author critic review, Yassine El Haddad,
   single Rating, deliberately NO aggregateRating), and is used by **0/71** course pages. This is
   a *review* site emitting only `Course` schema. Adding a first-party editor rating differentiates
   these pages from Scrimba's own course pages in SERPs and AI answers. Needs a per-course
   `editorRating` value (and is already compliant with the independent-reviewer constraint, since
   the author reviews the catalog, not a course he completed).

3. **`CourseSchema` is under-fed on keywords.** Live pages pass only 2 tokens
   (`keywords={["CSS","Frontend"]}`, `["AI","Databases"]`) which become schema `teaches`. The
   frontmatter already carries richer 5-token keyword sets; the schema should reuse them and the
   highest-volume intents (`learn {topic} free`, `best free {topic} course`, `{topic} review`).

4. **CTA is end-of-page only.** Primary `<AffiliateLink>`/`<PricingCTA>` sits at the bottom. No
   above-the-fold CTA and no secondary low-friction "try a lesson, no signup" link (the public
   demo scrim `https://scrimba.com/s0v687325e`, per project memory) routed through `<AffiliateLink>`.
   (Note: the global auto-injected PricingCTA in `DocItem/Layout` is deliberately suppressed on
   `/docs/courses/`, so each course page relies solely on its own end-of-page CTA.)

5. **Four pages miss the verdict, three miss `CourseSchema`, one misses `last_update`:**
   - No `## Quick answer`: `ai/openaiassistants`, `react/best-react-courses-and-tutorials`,
     `javascript/how-to-learn-javascript-complete-beginners-guide`,
     `python/best-python-courses-for-beginners` (the last three are roundup/guide pages, so a
     verdict matters less, but `openaiassistants` is a true stub).
   - No `<CourseSchema>`: `ai/openaiassistants`,
     `javascript/how-to-learn-javascript-complete-beginners-guide`,
     `python/best-python-courses-for-beginners` (the latter two are guide/listicle, not single
     courses, so this is defensible; `openaiassistants` should have it).
   - No `last_update`: `react/best-react-courses-and-tutorials` (add it).
   - `ai/openaiassistants.mdx` (465w) is the single true outlier: no verdict, no CourseSchema,
     placeholder duration. Bring it up to the template by hand. PRIORITY.

---

## 3. Competitive / SERP reality (WebSearch)

Representative queries and who actually ranks / gets cited:

- **"scrimba learn react review"**: Class Central's "17 Best React Courses 2026" roundup, a
  200-hour Medium comparison, Scrimba's own course + its own `/articles/best-react-courses` page,
  and GitHub. Independent review sites that get cited are *roundup/comparison* formats.
- **"best free react course"**: Class Central, Udemy free topic page, Codecademy, Mimo, DEV.to,
  Medium roundups, Scrimba.com itself. Again roundups dominate; AI answers synthesize from them.
- Realistic intent for `scrimba {course} review` and `learn {topic} free` is comparison/decision,
  not enrollment. Pages win citations by being the structured, opinionated, dated source AI can
  quote (rating + verdict + "who should skip it"), which is exactly the live template's strength.

**Takeaway:** the per-course review pages are well-built but compete in a roundup-dominated SERP.
The biggest GEO lever is (a) Review/Rating schema so the opinionated verdict is machine-readable,
and (b) tight linking from these pages into "best {topic} courses" hub pages (some already exist:
`react/best-react-courses-and-tutorials`, `python/best-python-courses-for-beginners`).

---

## 4. Recommendations by bucket

Each fix names the template change AND the source-of-truth implication (generator is stale, so
apply via authored edit or via the upgraded generator, not the current one).

### Ranking (organic SEO)
- **R1.** Emit `BreadcrumbList` JSON-LD via a `DocBreadcrumbs` swizzle (Home > Courses >
  {Category} > {Course}). One change lifts the whole docs tree. No new data.
- **R2.** Feed `CourseSchema` the full 5-token keyword set already in frontmatter, plus
  `timeRequired` and `instructor` consistently (currently only 2 keyword tokens). Data exists.
- **R3.** Normalize keyword intent (free/best/review variants) across all pages and surface them
  in the description.
- **R4.** Fix the `ai/openaiassistants` stub and add `last_update` to
  `react/best-react-courses-and-tutorials`.
- (FAQPage and Article schema already present, no action.)

### GEO (AI citation)
- **G1.** Add `<ReviewSchema>` (component exists) to every course page with a first-party
  `editorRating` (1-5) and short `reviewBody`. Single biggest GEO differentiator. Needs new
  `editorRating` field in `courses.json`.
- **G2.** Add the `Quick answer` block to `openaiassistants` so 71/71 have an extractable verdict.
- **G3.** Strengthen links from each course page into the matching "best {topic} courses" hub
  (roundups are what AI engines cite); add the hub link to the "Related courses and comparisons"
  list uniformly.
- **G4.** FAQPage + Course schema already present, keep them. CourseCard key-value facts stay as
  clean structured data.

### Conversion
- **C1.** Add a secondary "try a free lesson, no signup" CTA using the demo scrim
  `https://scrimba.com/s0v687325e` via `<AffiliateLink>`.
- **C2.** Add an above-the-fold CTA right after `Quick answer`, in addition to the end-of-page one.
- **C3.** The "who should skip it" lines already pre-qualify clicks; ensure all 71 have one.

### Suggested new `courses.json` fields (if keeping/upgrading the generator)
- `editorRating` (1-5) and `editorTake`/`reviewBody` (powers G1).
- `quickAnswer`, `worthIt`, `strengthsLimits`, `customFaq` (to capture the hand-written prose so
  regeneration is non-destructive). Reuse existing `instructor`, `timeRequired`, `teaches`,
  frontmatter `keywords`.

All recommended copy: em-dash-free, never quote exact prices (link `/our-pricing`),
independent-reviewer voice (author did NOT complete the course), scrimba.com via `<AffiliateLink>`.

---

## 5. Sampled pages (8, measured)

Article schema is auto-emitted site-wide; Breadcrumb and Review schema are absent everywhere.

| Page | Words | Quick answer | FAQ+FAQPage schema | Freshness | Course schema | Breadcrumb schema | Review schema | Affiliate CTA |
|---|---|---|---|---|---|---|---|---|
| react/learn-react | 1115 | Yes (5 Q FAQ) | Yes / Yes | 2026-05-27 | Yes | No | No | Yes |
| javascript/learn-javascript | 1103 | Yes | Yes / Yes | Yes | Yes | No | No | Yes |
| css/css-grid | 858 | Yes | Yes / Yes | 2026-05-27 | Yes | No | No | Yes |
| css/responsive-web-design | 1123 | Yes | Yes / Yes | Yes | Yes | No | No | Yes |
| ai/rag | 864 | Yes | Yes / Yes | 2026-05-27 | Yes | No | No | Yes |
| typescript/learn-typescript | 973 | Yes | Yes / Yes | Yes | Yes | No | No | Yes |
| python/learn-python | 921 | Yes | Yes / Yes | Yes | Yes | No | No | Yes |
| backend/sql | 932 | Yes | Yes / Yes | Yes | Yes | No | No | Yes |

Consistent pattern: bodies healthy (820-1200w); verdict + freshness + Course schema + FAQPage
schema + Article schema universal; Breadcrumb and Review/Rating schema universally ABSENT.

---

## 6. Thin-course risk list

Body word counts are healthy site-wide (the hand-rewrite padded short courses with real prose).
Lowest-content non-index pages:

| Page | Words | Note |
|---|---|---|
| ai/openaiassistants | 465 | Lowest. Stub that escaped the rewrite (no verdict/FAQ/schema). PRIORITY. |
| react/best-react-courses-and-tutorials | 499 | Listicle/hub, borderline thin but serves a roundup intent. |
| css/css-variables | 820 | OK. |
| javascript/clean-code | 834 | OK. |
| ai/dall-e-and-gpt-vision | 849 | OK. |

Hub `index.mdx` pages are out of scope, but `typescript/index.mdx` (291w) and `python/index.mdx`
(313w) are thin hubs worth padding later.

**Latent data risk (from `courses.json`):** many records have `modules: []` and very short
scraped `description` (truncated ~145 chars): `openaiassistants`, `react-19` (1-min duration),
`model-context-protocol-mcp`, `clean-code`, `markdown`, `imba`, and the sub-1hr `Intro to X`
micro-courses. The hand-rewrite masked this on the live bodies, but it means any regeneration
from the STALE generator would reintroduce thin/boilerplate pages for these courses.

**Bottom line on thin content:** NOT a risk on the live pages today (only `openaiassistants` needs
work). It IS a latent risk because the source data is thin and the generator that would rebuild
from it is stale and out of sync.
