---
name: scrimba-course-review
description: Write, rewrite, enrich or fact-check a docs page on scrimbaguide.tech, above all course leaves, course hubs and path pages (docs/courses/**, docs/paths/**). Use when reviewing a Scrimba course or path, adding screenshots or transcript detail, rewriting a page's voice, links or CTA placement (pricing, comparison, FAQ and how-it-works pages too), re-verifying a page against scrimba.com, or auditing course pages for drift.
---

# Scrimba review pages

A course leaf is a first-hand review, not a rewritten listing. Every number,
quote and screenshot traces to something seen inside the course with the
logged-in account (the `scrimba-browsing` skill) or to `data/courses.json`.
The author has been inside every module with a Pro account and writes like
it: answer first, specific, direct. The author reviewed the course; the words
are "reviewed" and "went through", never "completed" or "graduated".

Non-negotiables (the build's `check:content` enforces the first two):
no em-dashes; no Scrimba price anywhere (link to `/our-pricing` through
`<AffiliateLink>`); every scrimba.com link is an `<AffiliateLink>` except
`scrimba.com/explain` links; catalog numbers (duration, level, access, module
names and durations) are copied from `data/courses.json` into `CourseCard` /
`CourseCurriculum` props, and the prose refers to them loosely ("about 9.4
hours") rather than restating a second source; frontmatter `description` is
160 characters or fewer; `last_update.date` is the day of the content edit;
every named course or path in prose is a link (Links below); every page sets
a short `sidebar_label` (CLAUDE.md, Sidebar labels); CTAs follow the budget
in CLAUDE.md and the per-page placement in `references/archetype.md`.

## Pipeline

Run the steps in order. Each produces a file in the scratchpad that the next
step reads; the page is written from those files, not from memory.

1. **Baseline.** Read the existing MDX, its `data/courses.json` entry, and its
   `relatedGuidesMap.ts` entry. List every factual claim in the current page
   (instructor, versions, what is free, what you build) as a checklist. A
   rewrite that only changes voice, links and CTAs stops here and drafts from
   this checklist: it adds no fact that is not already on the page or in the
   JSON.
2. **Browse** with `scrimba-browsing`: full nested curriculum, 2 to 4 lessons
   (first, a mid-course challenge, one from the final project), transcript
   quotes with lesson names, dependencies, 2 to 3 screenshots plus chapter
   title cards where they exist. Output: a facts file (`references/facts-file.md`
   has the shape).
3. **Diff.** Compare the facts file against the baseline checklist and
   `data/courses.json`. Catalog numbers that differ get fixed in the JSON
   (re-scrape the one URL with `scraper/scrape.py --urls`, or edit the entry
   and say so in the commit), then mirrored into the page's component props.
   Prose claims that differ get corrected in the page.
4. **Draft** the page to the archetype in `references/archetype.md`, keeping
   the existing page's facts (not its hedges). Load `copywriting`,
   `copy-editing` and `humanizer` before writing prose, and write to the Voice
   section below.
5. **Fact-check pass** (a separate agent when possible): every sentence with a
   number, a name, a version or a "free/Pro" claim is checked against the facts
   file or the baseline checklist. Anything not there is removed or marked for
   a second browse. The checker returns a list; the writer fixes; nobody
   retouches images (crop only, never edit content).
6. **Gates.** `npm run check:content`, `npm run typecheck`,
   `node scripts/audit-course-links.mjs --file <page>` (zero UNLINKED, zero raw
   URLs), a CTA count against the budget, and the screenshot check
   (`<Screenshot>` `src` exists under `static/`, `width`/`height` match
   `identify`, file under 200 KB, alt text names product + lesson + what is
   visible). Update `relatedGuidesMap.ts` for new pages. Build if links changed
   (`onBrokenLinks: throw` makes the build the link gate).
7. **Report** what changed, which facts were corrected, which lessons were
   opened, and what was left unverified.

## Voice

Write for someone deciding whether to spend the hours. Lead with the answer,
back it with a named thing from inside the course, end each section on a
verdict or a fact. Short sentences. Plain words. Provenance once per page, as
one italic line under the opening paragraph:
`*Reviewed inside the course with a Pro account, September 2026.*`

| Instead of | Write |
|---|---|
| "I opened every module and worked through a sample of lessons from each one with a Pro account in September 2026; what follows is what is actually in there, not the listing page rewritten." | "Per Borgen's free Learn JavaScript runs about 9.4 hours across eight modules, and you build four things: a passenger counter, a blackjack game, a Chrome extension and a mobile app." Then the provenance line. |
| "*Method: I opened the path ..., expanded every one of its 62 groups ... I have not completed the path end-to-end; the module table below is Scrimba's own numbers ...*" | "*Reviewed inside the path with a Pro account, September 2026: all 13 modules and 62 groups expanded.*" Other method facts move to the section where they matter. |
| "The honest caveat is the level. This is labeled Intermediate, and it means it." | "It is labeled Intermediate and means it: by section three you are destructuring props and mapping arrays to components." |
| "The honest caveat is age. The scrims pin `openai@4.11.1`..." | "The code is old: the scrims pin `openai@4.11.1` and `langchain@0.0.167`." |
| "The two products optimise for different problems, so the question is not which platform is 'better.'" | "Scrimba wins if you are studying web development or AI for months; Udemy wins for a one-off course you want to own." |
| "This zero-setup format ... accelerates skill retention." | "You never just watch: pause any scrim and the instructor's code is yours to edit and run." |
| "the instructor is encouraging" | "the calculator challenge ends with 'if you found it a bit too hard...'" (name the lesson) |

Rules of thumb:
- The opening paragraph is the citable answer: 40 to 60 words naming the
  course, instructor, hours, what you build and the verdict.
- Cut "honest", "for fairness", "actually", "really", "generally", "tends to",
  "the short version". The caveat itself carries the honesty.
- Cut sentences about the page ("This page describes...", "How to use this
  page", "Most X vs Y pages..."). Headings name the reader's question, never
  the writing ("Backend depth: honest take" becomes "Is the backend coverage
  deep enough?").
- Numbers come from `data/courses.json` or the facts file; when Scrimba's
  counts differ, say once, in the curriculum section, which one you use.
- Praise and criticism each need an example from inside the course.
- A fact you cannot trace is left out. There is no hedged version, and no
  unsourced superlative ("the one reviewers mention most").
- "I" appears in the provenance line and in lesson-level observations; the
  rest states the course.

## Links

First mention of any other Scrimba course or path in a section links to our
review page (`/docs/courses/...`, `/docs/paths/...`). At the moment of
decision (the primary CTA, "Where it fits", the next-course line in the
opening) link Scrimba through `<AffiliateLink>`. `scrimba.com/explain` links
stay bare. Headings, component props and the page's own course are exempt.
