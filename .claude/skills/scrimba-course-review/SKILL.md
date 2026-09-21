---
name: scrimba-course-review
description: Write, enrich or fact-check a first-hand course review page on scrimbaguide.tech (docs/courses/**, and the same archetype for path and hub pages). Use when asked to review a Scrimba course, enrich a course leaf, add screenshots or transcript detail to a course page, re-verify a course page against scrimba.com, or audit course pages for drift. Covers the page archetype, the facts-first pipeline (browse, draft, fact-check, fix) and the house rules the page must pass.
---

# Scrimba course review pages

A course leaf is a first-hand review, not a rewritten listing. Every number,
quote and screenshot traces to something seen inside the course with the
logged-in account (the `scrimba-browsing` skill) or to `data/courses.json`.
The author is an independent reviewer who opened every module and worked
through a sample of lessons; never a graduate, never "I completed".

Non-negotiables (the build's `check:content` enforces the first two):
no em-dashes; no Scrimba price anywhere (link to `/our-pricing` through
`<AffiliateLink>`); every scrimba.com link is an `<AffiliateLink>`; catalog
numbers (duration, level, access, module names and durations) are copied from
`data/courses.json` into `CourseCard` / `CourseCurriculum` props, and the prose
refers to them loosely ("about 9.4 hours") rather than restating a second
source; frontmatter `description`
is 160 characters or fewer; `last_update.date` is the day reviewed.

## Pipeline

Run the steps in order. Each produces a file in the scratchpad that the next
step reads; the page is written from those files, not from memory.

1. **Baseline.** Read the existing MDX, its `data/courses.json` entry, and its
   `relatedGuidesMap.ts` entry. Note every factual claim in the current page
   (instructor, versions, what is free, what you build) as a checklist.
2. **Browse** with `scrimba-browsing`: full nested curriculum, 2 to 4 lessons
   (first, a mid-course challenge, one from the final project), transcript
   quotes with lesson names, dependencies, 2 to 3 screenshots plus chapter
   title cards where they exist. Output: a facts file (`references/facts-file.md`
   has the shape).
3. **Diff.** Compare the facts file against the baseline checklist and
   `data/courses.json`. Catalog numbers that differ get fixed in the JSON
   (re-scrape the one URL with `scraper/scrape.py --urls`, or edit the entry
   and say so in the commit), then mirrored into the page's component props. Prose claims that differ get corrected in the page.
4. **Draft** the page to the archetype in `references/archetype.md`, reusing the
   existing page's good paragraphs. Load the `copywriting`, `copy-editing` and
   `humanizer` skills before writing prose (memory: drafting-skill-stack).
5. **Fact-check pass** (a separate agent when possible): every sentence with a
   number, a name, a version or a "free/Pro" claim is checked against the facts
   file. Anything not in the facts file is either removed or marked for a
   second browse. The checker returns a list; the writer fixes; nobody retouches
   images (crop only, never edit content).
6. **Gates.** `npm run check:content`, `npm run typecheck`, and the screenshot
   check (`<Screenshot>` `src` exists under `static/`, `width`/`height` match
   `identify`, file under 200 KB, alt text names product + lesson + what is
   visible). Update `relatedGuidesMap.ts` for new links. Build if links changed
   (`onBrokenLinks: throw` makes the build the link gate).
7. **Report** what changed, which facts were corrected, which lessons were
   opened, and what was left unverified.

## Voice

Concrete over evaluative: "the calculator challenge ends with 'if you found it
a bit too hard...'" beats "the instructor is encouraging". Name the lesson
when quoting. Say which number you are using when Scrimba's own counts differ
(module headers vs listing vs your count). Praise and criticism both need an
example from inside the course. Write for someone deciding whether to spend
the hours, not for someone who already enrolled.
