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
- `docs/courses/javascript/astro.mdx` (reviewed 2026-09-20, all 37
  transcripts read) ships **without images**: archetype items 3 and 5 are
  outstanding. The drafting run hit the same shared Chrome window problem
  (agent tab `visibilityState === "hidden"` for the whole session, scrim app
  never painted, every capture blank). The course has no chapter title cards
  (flat list, intro opens on a finished-site slide), so there is no grid to
  build. Retake when the window is free, 2 to 3 lesson moments: the scoped
  style rule doing nothing in "Adding styles" (`~02cd`, about 1:37), the empty
  projects grid before `.data` in "Querying content collections" (`~06hs`,
  about 1:17), and the finished post page at the end of "Displaying Blog
  Content" (`~05qi`). Save under `static/img/scrimba/intro-to-astro/`, then
  add the `Screenshot` import and remove this entry.
- `docs/courses/javascript/a-space-travel-website.mdx` (reviewed 2026-09-21,
  31 of 67 transcripts read) ships **without images**: archetype items 3 and 5
  are outstanding. Two capture attempts (drafting run and the review-fix run)
  hit the same shared-window problem: the agent's tab stayed
  `visibilityState === "hidden"` while three other agents' tabs were active,
  `slide-widget svg` never rendered and every screenshot was a blank frame.
  Retake when the window is free: title cards at `~01` (course intro, 1280x720
  slide at CSS rect 320,87), `~01f` (destination page intro) and `~01q` (tabs
  intro) for the grid, plus 2 to 4 lesson moments: the Color challenge at
  ~3:52 (`~08`, three alpha boxes), Setting up a grid container at ~9:49
  (`~0o`, yellow outlines on the tracks), Adding the functionality at ~6:51
  (`~016`, mobile menu sliding in), and The technology page at 0:20 (`~026`,
  the "on your own" brief). Then add the `Screenshot` import, the grid and the
  captioned moments, and remove this entry.
- `docs/courses/javascript/clean-code.mdx` (reviewed 2026-09-20, all 26
  transcripts read) ships **without images**: archetype items 3 and 5 are
  outstanding. Two capture attempts (drafting run and the review-fix run on
  2026-09-21) hit the same shared-window problem: the agent's tab stayed
  `visibilityState === "hidden"` while three other agents' tabs were active,
  the app never left `app-splash` and no `slide-widget svg` rendered. Retake
  when the window is free: title cards at `~00` (course intro, 1280x720 slide
  at CSS rect 320,86), `~0a` (functions intro) and `~0g` (comments intro) for
  the grid, plus 2 to 4 lesson moments: Clean Variables Challenge at ~3:30
  (`~05`, destructured solution), Magic Numbers at ~1:25 (`~07`, earthRadius
  and gravityMetric extracted), Encapsulating Conditionals at ~3:06 (`~0e`),
  and Avoiding Comments with Refactoring at ~0:05 (`~0h`, the commented
  original). Save under `static/img/scrimba/introduction-to-clean-code/`,
  then add the `Screenshot` import, the grid and the captioned moments, and
  remove this entry.
- `docs/courses/javascript/unit-testing.mdx` (reviewed 2026-09-20, all 23
  transcripts read) ships **without images**: archetype items 3 and 5 are
  outstanding. The drafting run hit the same shared-window problem: two tabs
  tried, both stayed `visibilityState === "hidden"` while three or four other
  agents' tabs were active, the scrim app never painted and every capture
  (including a zoom of the loaded 1280x720 `slide-widget svg` at `~00`) was a
  blank frame. Retake when the window is free: title card at `~00` (course
  intro, 1280x720 slide at CSS rect 320,87; `~01`, `~04`, `~05` and `~0l` also
  carry slides, `~0d` is a slideshow) for the grid, plus 2 to 3 lesson
  moments: Our first test at ~3:16 (`~08`, class broken on purpose, Jasmine
  reporter red), the Spy Challenge brief at 0:00 (`~0f`, comment-block brief
  with the `.and.returnValue` hint), and Mocks + Debug with me! at ~5:41
  (`~0g`, "Expected null to be 1" failure before the debug). Save under
  `static/img/scrimba/introduction-to-unit-testing/`, then add the
  `Screenshot` import, the grid and the captioned moments, and remove this
  entry.
- `docs/courses/javascript/cybersecurity.mdx` (reviewed 2026-09-20, 36 of 81
  transcripts read) ships **without images**: archetype items 3 and 5 are
  outstanding. Two capture attempts (drafting run and the review-fix run on
  2026-09-21) hit the same shared-window problem: the agent's tab stayed
  `visibilityState === "hidden"` while three other agents' tabs were active,
  the app never left `app-splash` and no `slide-widget svg` rendered. Retake
  when the window is free: title cards at `~0z3o` (module 1 intro), `~0jq`
  (module 2), `~0y6g` (module 3) and `~07yn` (module 4) for the grid (skip the
  module 4 outro slide, it carries a GIF), plus 2 to 4 lesson moments: XSS
  part 1 at ~3:00 (`~0zod`, the fake data-breach alert), SQL Injection part 2
  at ~3:48 (`~0xyp`, "Disaster dropping users table" with the user count at
  0), Fixed Window Counter "create the limiter" at ~5:04 (`~0xry`, 200s
  turning into 429s) and Final challenge part 2 at ~1:13 (`~07y4`,
  out-of-order results). Save under `static/img/scrimba/learn-cybersecurity/`,
  then add the `Screenshot` import, the grid and the captioned moments, and
  remove this entry.
- `docs/courses/javascript/vue.mdx` (reviewed 2026-09-20, all 27 transcripts
  read) ships **without images**: archetype items 3 and 5 are outstanding. Two
  capture attempts (drafting run and the review-fix run on 2026-09-21) hit the
  same shared-window problem: the agent's tab stayed
  `visibilityState === "hidden"` while three other agents' tabs were active,
  the app never left `app-splash` (no `editor-widget`, no `browser-widget`)
  and every capture was a blank frame. The course has no chapter title cards
  (no `slide-widget svg` in any Vue scrim; only the generic certificate clip
  has a slide), so there is no grid to build. Retake when the window is free,
  2 to 4 lesson moments: the three facts rendered from `facts[0..2]` at ~5:13
  (`~07cp`), the header vanishing from the preview before the import at ~3:15
  (`~05kv`), the 404 challenge brief at ~1:10 (`~05zy`), and the finished Vue
  Facts part 1 at ~3:40 (`~0xt3`). Save under `static/img/scrimba/learn-vue/`,
  then add the `Screenshot` import and the captioned moments, and remove this
  entry.
- `docs/courses/javascript/frontend-interview-tips.mdx` (reviewed 2026-09-21,
  all 24 transcripts read) ships **without images**: archetype items 3 and 5
  are outstanding. The drafting run hit the same shared-window problem (agent
  tab `visibilityState === "hidden"` for the whole session, the app never left
  `app-splash`, every capture black; a reload and two fresh tabs did not help).
  The course is a flat list with no chapter title cards, so there is no grid to
  build. Retake when the window is free, 2 to 4 lesson moments: the promises
  console printing `1, 3, 2` at ~3:16 (`~0d`), the "assignment to constant
  variable" error at ~3:33 (`~02`), the `#red:hover` rule with the preview at
  ~2:11 (`~0a`), and one slide from the talking-head scrims (`~0f`, `~0h` or
  `~0k`). Save under `static/img/scrimba/frontend-interview-tips/`, then add
  the `Screenshot` import and the captioned moments, and remove this entry.
- `docs/courses/javascript/firebase.mdx` (reviewed 2026-09-21, all 39
  transcripts read) ships **without images**: archetype items 3 and 5 are
  outstanding. Two capture attempts (drafting run and the review-fix run on
  2026-09-21) hit the same shared-window problem: the agent's tab stayed
  `visibilityState === "hidden"` while three other agents' tabs were active,
  and every capture (including a zoom on the loaded `slide-widget svg`) came
  back a blank frame. Retake when the window is free: title cards at `~01`
  (welcome, 1280x720 slide at CSS rect 320,86), `~0h` (Firestore intro) and
  `~0s` (security rules intro) for the grid (skip `~03`, photos of IBM and
  Corbato, and the `~0j` end slide, a GIF), plus 2 to 4 lesson moments: Adding
  a document at ~9:05 (`~0j`, the post does nothing because the call is still
  commented out), onSnapshot at ~5:22 (`~0r`, the red "cannot read properties
  of null (reading toDate)" error), the first security rules scrim at ~4:05
  (`~0t`, "Missing or insufficient permissions" after rules set to false) and
  Add date filters at ~18:45 (`~012`, the filter buttons with backdated
  posts). Save under `static/img/scrimba/learn-firebase/`, then add the
  `Screenshot` import, the grid and the captioned moments, and remove this
  entry.
- `docs/courses/javascript/imba.mdx` (reviewed 2026-09-20, all 43
  transcripts read) ships **without images**: archetype items 3 and 5 are
  outstanding. Two capture attempts (drafting run and the review-fix run on
  2026-09-21) hit the same shared-window problem: the agent's tab stayed
  `visibilityState === "hidden"` while four other agents' tabs were active,
  the app never left `app-splash` after two loads and no `slide-widget svg`
  rendered. Retake when the window is free: title card at `~00` (course
  intro, 1280x720 slide at CSS rect 320,86; `~018` also has a slide, `~0f3` is
  generic) for the grid, plus 2 to 4 lesson moments: the Conditionals
  challenge brief at ~5:23 (`~02`), the checkbox `bind` fix at ~1:25 (`~0j`),
  the icon drawer at ~2:56 (`~0v`) and the finished app resetting after the
  celebration at ~2:10 (`~017`). Save under `static/img/scrimba/learn-imba/`,
  then add the `Screenshot` import, the grid and the captioned moments, and
  remove this entry. Note for future audits: the course is a flat list
  (`modules: []` in courses.json), so the page's `CourseCurriculum` uses an
  editorial six-part grouping, disclosed in its `summary` prop.
- `docs/courses/react/a-react-project-movie-search-app.mdx` (reviewed
  2026-09-20, all 13 transcripts read) ships **without images**: archetype
  items 3 and 5 are outstanding. The drafting run hit the same shared-window
  problem: the agent's tab stayed `visibilityState === "hidden"` for the whole
  session while other agents' tabs were active; the DOM loaded (transcripts,
  Monaco, dependency panel readable) but every capture was a blank frame.
  Only one real title card exists (course intro `~00`, slide-widget; `~0b`,
  `~0c` and `~0yjj` are generic outro slides), so the grid is that card plus a
  "what you build" shot. Retake when the window is free, 2 to 4 lesson
  moments: the results array logged in the console at ~4:28 (`~06`), the live
  "Step Up" results at ~4:06 (`~07`), posters rendering with some missing
  before the filter at ~3:10 or the full card with title, date, rating and
  overview at ~6:46 (`~08`), and the finished app via MovieCard with no key
  warning at ~4:59 (`~0a`). Save under
  `static/img/scrimba/build-a-react-project-movie-search-app/`, then add the
  `Screenshot` import, the grid and the captioned moments, and remove this
  entry. Note for future audits: Scrimba shows a flat list (no modules), so
  the page's `CourseCurriculum` uses an editorial five-part grouping.

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
