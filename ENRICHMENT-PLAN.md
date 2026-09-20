# Content enrichment program (started 2026-09-20)

Goal (user, verbatim intent): have the best Scrimba course reviews on the
internet. Improve existing content, add new where warranted, add first-hand
screenshots, aim for #1 on Google and for AI-search citations, and raise
conversion to Scrimba (affiliate). Start with the docs pages.

Method: `SCRIMBA-BROWSING-GUIDE.md` (logged-in Pro access via Claude in
Chrome: nested curriculum, transcripts, code, chapter title cards, seeked
screenshots). House rules in `CLAUDE.md` still apply.

## Why course leaves first

GSC, 90 days to 2026-09-20: hubs get the impressions (`/docs/courses/` 5.6k,
`/docs/courses/ai/` 4.6k, `/react/` 2.7k, `/javascript/` 2.4k) while flagship
leaves (`learn-javascript`, `learn-react`, `html-and-css`) show ~0 and sit in the
"crawled, not indexed" set. The leaves read like the Scrimba listing page
rewritten; nothing in them required taking a lesson. First-hand detail
(lesson sequence, transcript quotes, what Pro gates, real time to complete,
screenshots) is what makes them index-worthy and citable.

## Per-page archetype (what "enriched" means)

1. Title: `<Course> on Scrimba: 2026 Review`; short
   `sidebar_label`; `toc_max_heading_level: 2`; `last_update` = day reviewed.
2. Intro states the method in one sentence ("opened every module, worked
   through a sample of lessons with a Pro account in <month year>").
3. Chapter title-card grid (`<div className="screenshot-grid">` + `<Screenshot>`),
   only where chapters have title cards.
4. `CourseCurriculum` with `lessons:` counts from the expanded TOC, plus a
   one-line note on how counts were taken.
5. "Inside the course, module by module": H3 per module with lesson-level
   sequence, concept order, and at least one transcript quote per major module.
   2 to 4 `<Screenshot>`s at transcript-chosen moments, each with alt text that
   names the product + lesson + what is visible, and a caption that says what
   to notice and the timestamp.
6. "What a lesson actually feels like" (format, scrim length, challenge loop,
   captions/transcript/speed).
7. "Free or Pro: exactly what is gated" (named Solo Projects, certificate).
8. "How long it really takes" (runtime × 2–3 with reasoning).
9. FAQ expanded with first-hand answers (transcripts, AI challenges, install
   needs, time), CTA button, `CourseSchema`.

Done (2026-09-20): `docs/courses/javascript/learn-javascript.mdx`,
`docs/courses/react/learn-react.mdx`, `docs/courses/css/html-and-css.mdx`,
`docs/courses/ai/ai-engineering.mdx`. Images under `static/img/scrimba/<course>/`
(17 WebP files, all visually checked via a contact sheet). New component
`src/components/Screenshot.tsx` (+ `.screenshot`, `.screenshot-grid`,
`.screenshot--narrow` in custom.css). Not yet committed.

Factual corrections made on the way: Intro to AI Engineering is a build-along
(Gift Genie + PollyGlot solo project), not "fundamentals only"; its page title on
scrimba.com still credits Tom Chant but the teacher is Arsala Khan; Learn React
mixes a React 19 RC (Chef Claude) with React 18.3 (capstones) and needs an
Anthropic SDK upgrade; Learn HTML and CSS's final solo project is free.

Site-wide correction found on the way: 47 pages call the Discord a Pro perk;
scrimba.com/our-pricing lists "basic access to Discord community" as free and
"Pro Discord channels" as Pro. Fix wording when touching those pages.

## Accepted exceptions (follow-ups)

- `docs/courses/ai/serverless-ai-agents-with-langbase.mdx` (reviewed
  2026-09-20, all 13 transcripts read) ships **without images**: archetype
  items 3 and 5 are outstanding. Two capture attempts (drafting run and the
  review-fix run) hit a shared Chrome window where the agent's tab stayed
  `visibilityState === "hidden"` while other agents' tabs were active, so the
  scrim app never rendered and every capture was a blank frame. Retake when the
  window is free: intro title card at `~03uk` (960x540 slide, Google-hosted
  background image) for the grid, plus 2 to 4 lesson moments: the Create a
  Memory challenge pause (`~0235`), the Langbase Studio retrieval-testing panel
  (`~02nq`), and the final `npx tsx index.ts` console output with the cited
  source (`~05qr`). Then re-add the `Screenshot` import and remove this entry.

## Queue (priority = hub impressions × page importance)

1. ~~learn-react, html-and-css, ai-engineering~~ done
4. `docs/courses/javascript/nextjs.mdx` (leaf already ranks pos 7.7, 473 impr)
5. `docs/courses/javascript/expressjs.mdx` (528 impr, pos 20.6, needs depth)
6. Path pages `docs/paths/*` (money pages; extract nested curriculum + hours)
7. Category hubs: add one first-hand line + title card per course, link to
   enriched leaves; keep them pillar length.
8. `docs/how-it-works/how-scrims-work.mdx`: transcript panel, Explain, AI
   challenges screenshots (feature coverage; also feeds comparison pages).
9. Remaining 46 course leaves without `CourseCurriculum` (see inventory).

## Component inventory (2026-09-20) and review to-do

Usage across `docs/`, `blog/`, `src/pages` + auto-mounted swizzles. Counts are
files using the component.

| Component | docs | blog | pages/theme | Notes / review items |
|---|---|---|---|---|
| AffiliateLink | 113 | 36 | 3 | Core. Check `variant="button"` contrast + focus ring in dark mode. |
| FAQAccordion | 128 | 49 | 0 | Emits FAQ schema? verify vs `DocFaqSchema` duplication on 24 blog posts. |
| PricingCTA | 63 | 74 | 2 | 9 course leaves carry it; CLAUDE.md says research pages stay CTA-light. Audit which 63 docs. |
| DisclosureNotice | 24 | 74 | 0 | Blog has it on every post; docs only 24. Decide a rule. |
| CourseCard | 76 | 1 | 0 | Add optional `image` (chapter title card) prop? Review mobile stacking. |
| CourseSchema | 72 | 0 | 0 | OK. Consider `image` from title card. |
| CourseCurriculum | 25 | 0 | 0 | **46 course leaves lack it.** Bars use module duration; add `lessons`. |
| DocFaqSchema | 1 | 24 | 0 | See FAQAccordion. |
| VerdictBox | 13 | 3 | 0 | Contrast fixed in PR #93; re-check dark mode. |
| ComparisonTable | 15 | 1 | 0 | Mobile: horizontal scroll affordance? |
| CodePreview | 2 | 0 | 0 | Practice pages only. |
| HowToSchema | 4 | 7 | 0 | |
| ItemListSchema | 2 | 6 | 0 | |
| ReviewSchema | 0 | 3 | 0 | Only 3 blog posts; course pages could carry editor rating (Wave 3 item in PLAN.md). |
| VideoSchema | 0 | 1 | 0 | |
| PersonSchema | 0 | 0 | 1 | About page. |
| LearningTimeCalculator | 0 | 2 | 0 | Candidate for path pages. |
| PathAdvisor | 1 | 0 | 0 | Tools page. |
| ScrimSandbox | 0 | 0 | 1 | Homepage demo scrim. |
| ScrimbaBlocksArt | 0 | 0 | 1 | Homepage art. |
| Screenshot | 1 | 0 | 0 | New (this program). |
| WhyScrimba | 0 | 0 | 0 | **Unused.** Delete or mount. |

Swizzles (auto-mounted on every page of their type): `DocItem/Layout` (RelatedGuides,
sticky CTA on money pages), `DocItem/Metadata`, `BlogPostItem/{Header,Footer}`,
`BlogPostPage`, `BlogListPage`, `BlogTagsListPage`, `BlogTagsPostsPage`,
`BlogArchivePage`, `Navbar/Content`, `NavbarItem/DropdownNavbarItem`, `SearchBar`,
`SearchPage`.

UI/UX review pass (not started): open one page per component in light and dark
mode at 390px and 1280px, check contrast, tap targets, focus states, and whether
each component earns its place on the page type it is on. Deliver as a table of
findings + fixes.
