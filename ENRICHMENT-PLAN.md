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

## Queue (priority = hub impressions × page importance)

Done 2026-09-20/21 (PR #96): every course leaf under `docs/courses/**` (66 pages)
plus the 8 category hubs, the Explain cluster (reference page and four posts,
skill under `.claude/skills/scrimba-explain/`), the Discord wording sweep, the
non-course docs sections (comparisons, pricing, for/*, FAQ, help, practice,
learn-react, learn-nextjs, intro, changelog) and the component UI/UX pass.

Remaining:

1. Path pages `docs/paths/*` (money pages; extract nested curriculum + hours,
   title cards and path-only scrims). Browser work; one tab at a time with the
   Chrome window in front.
2. `docs/how-it-works/how-scrims-work.mdx` and siblings: transcript panel,
   settings menu, AI-feedback challenge, EXPLAIN modal, dependencies,
   certificate item screenshots from a free Learn JavaScript lesson.
3. Re-check GSC four to six weeks after merge (baseline in memory) to see
   whether the leaves leave "crawled, not indexed".
