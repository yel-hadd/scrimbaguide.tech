# Content enrichment program (started 2026-09-20)

Phase 1 (first-hand facts, screenshots, PRs #95 to #99) is done history below.
Phase 2 (voice, links, CTA placement, sidebar labels) is at the end.

Goal (user, verbatim intent): have the best Scrimba course reviews on the
internet. Improve existing content, add new where warranted, add first-hand
screenshots, aim for #1 on Google and for AI-search citations, and raise
conversion to Scrimba (affiliate). Start with the docs pages.

Method: the `scrimba-browsing` skill (logged-in Pro access via Claude in
Chrome: nested curriculum, transcripts, code, chapter title cards, seeked
screenshots) and the `scrimba-course-review` skill (archetype + browse, draft,
fact-check pipeline), both under `.claude/skills/`. House rules in `CLAUDE.md`
still apply.

## Why course leaves first

GSC, 90 days to 2026-09-20: hubs get the impressions (`/docs/courses/` 5.6k,
`/docs/courses/ai/` 4.6k, `/react/` 2.7k, `/javascript/` 2.4k) while flagship
leaves (`learn-javascript`, `learn-react`, `html-and-css`) show ~0 and sit in the
"crawled, not indexed" set. The leaves read like the Scrimba listing page
rewritten; nothing in them required taking a lesson. First-hand detail
(lesson sequence, transcript quotes, what Pro gates, real time to complete,
screenshots) is what makes them index-worthy and citable.

## Per-page archetype

The archetype lives in `.claude/skills/scrimba-course-review/references/archetype.md`;
voice, links and CTA rules in `CLAUDE.md`. This file no longer restates them.

Done (2026-09-20): `docs/courses/javascript/learn-javascript.mdx`,
`docs/courses/react/learn-react.mdx`, `docs/courses/css/html-and-css.mdx`,
`docs/courses/ai/ai-engineering.mdx`. Images under `static/img/scrimba/<course>/`
(17 WebP files, all visually checked via a contact sheet). New component
`src/components/Screenshot.tsx` (+ `.screenshot`, `.screenshot-grid`,
`.screenshot--narrow` in custom.css). Merged in PR #95.

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
Merged to main 2026-09-21 (#95 then #96); QA on the way: 404 screenshots
verified against their files, 15 descriptions trimmed to 160 chars, two FAQ
schemas moved below the truncate marker, the Explain review title and one
contradiction on the reference page fixed. The browsing guide was converted
into the `scrimba-browsing` skill and the archetype into `scrimba-course-review`
(this branch).

Done 2026-09-21/22 (PR #98): the four path pages and the paths hub (every
module expanded with the Pro account; 8 screenshots under
`static/img/scrimba/paths/`; AI path Deployment corrected to Render),
how-scrims-work (ghosts, scribbles, transcript panel and settings menu from the
public demo scrim), the A1/A3 explainer slides fixed with Redo slide, and the
`ScrimPoster` component (homepage hero poster made reusable; on the four path
pages and how-scrims-work, each with its own GA `cta_location`).

Remaining:

1. how-it-works siblings still without screenshots: the AI-feedback challenge
   icon, the EXPLAIN modal, the DEPENDENCIES panel and the certificate row.
   These need the logged-in scrim IDE, which stopped booting in the Chrome
   profile on 2026-09-21 (see the browsing skill's tool-quirks); restart Chrome
   first. Optional: the pages read fine without them.
2. Compare `cta_location` clicks for the `*-poster` placements in GA4 after
   two to four weeks; if posters beat the text CTAs, add them to the remaining
   money pages (pricing, comparison verdicts).
3. Re-check GSC four to six weeks after 2026-09-21 (baseline in memory) to see
   whether the leaves leave "crawled, not indexed". Indexing API: 120 URLs on
   2026-09-21, 28 more on 2026-09-22 (paths, how-scrims-work, the rest of the
   day-2 list).

## Phase 2 (started 2026-09-22): voice, links, CTAs, sidebar

Pages had first-hand facts but a cautious-outsider voice, unlinked course
names, stacked CTAs on money pages and SEO titles leaking into the sidebar.
The rules are now in `CLAUDE.md` (Voice, Links, Sidebar labels, CTA and
component placement) and the `scrimba-course-review` skill (style guide,
archetypes). Link checklist: `node scripts/audit-course-links.mjs`.
Batches: instructions, components + sidebar, pricing and comparisons, paths
and top pages, hubs, course leaves by GSC impressions, remaining docs, blog
links. Branch `content/voice-cta-sidebar-2026-09`.
