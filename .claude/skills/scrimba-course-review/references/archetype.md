# Page archetypes: course leaf, course hub, path page

Reference implementation for a leaf: `docs/courses/javascript/learn-javascript.mdx`.
CTA counting and the per-page-type budget are in CLAUDE.md (CTA and component
placement); this file says exactly where each CTA sits on the three course-side
page types.

## Course leaf

### Frontmatter

```yaml
title: "<Course> on Scrimba: 2026 Review"
sidebar_position: <n>
toc_max_heading_level: 2
sidebar_label: "<course name as Scrimba lists it, 1 to 4 words>"
description: "<instructor>'s <course> reviewed from inside: <runtime>, <n> scrims, <what you build>, what Pro gates, and how long it really takes."   # <= 160 chars
keywords: [...]
last_update:
  date: <YYYY-MM-DD, day of the content edit>
```

### Imports

`CourseCard`, `CourseCurriculum`, `CourseSchema`, `FAQAccordion`,
`AffiliateLink`, `Screenshot` from `@site/src/components/...`.

### Body, in order

1. `# <Course>` then one paragraph of 40 to 60 words that answers: what it is,
   who teaches it, runtime, what you build, and the verdict in one clause.
   Then the provenance line: `*Reviewed inside the course with a Pro account,
   <Month Year>.*` No other method statement anywhere on the page.
2. `## Quick answer`: two or three sentences. Who it is for, the one catch,
   and the natural next course (internal link). It never repeats the
   opening's facts (instructor, runtime, module count).
3. `<CourseCard title duration difficulty access modules instructor instructorUrl href description />`.
   `duration`, `difficulty`, `access` and `modules` are copied from the course's
   entry in `data/courses.json` (same strings), so the card and the site-wide
   counts in `scrimbaFacts.ts` never disagree. This is the page's secondary CTA.
4. Chapter title-card grid, only where chapters have title cards:
   `<div className="screenshot-grid">` with `<Screenshot ... source="" />` on
   all but the last card. Where a course has none, say nothing about it.
5. `## Is it worth your time?`: three or four short paragraphs, the trade-offs,
   each ending on a verdict.
6. `## What you'll learn`: `<CourseCurriculum modules={[{ name, duration, lessons }]} />`
   with module names and durations from `data/courses.json` and `lessons`
   counted from the expanded TOC, then one line saying which count is used.
7. `## Inside the course, module by module`: `### <n>. <Module> (<runtime>,
   <n> scrims)` per module, lesson-level sequence, concept order, at least one
   attributed transcript quote per major module. 2 to 4 `<Screenshot>`s at
   transcript-chosen moments: alt names product + lesson + what is visible,
   caption says what to notice and the timestamp.
8. `## What a lesson actually feels like`: format, scrim length, challenge
   loop, captions/transcript/speed, the instructor's habits with an example.
9. `## Free or Pro: exactly what is gated`: named Solo Projects, certificate,
   paths, "Pro-only channels on Scrimba's Discord" (basic Discord is free).
   Link `/our-pricing` via `<AffiliateLink>`; never a price.
10. `## How long it really takes`: runtime x 2 to 3 with the reasoning.
11. `## Who it's for, and who should skip it`, closed by the primary CTA:
    `<AffiliateLink href="https://scrimba.com/<slug>-<id>" variant="button">Start
    <course> for free</AffiliateLink>` ("Start <course> on Scrimba" for Pro).
12. `## Prerequisites`, `## Where it fits` (paths + prerequisite chain, internal
    links), `## Strengths and limits` (one paragraph each, examples from
    inside; no separate pros/cons list that repeats it).
13. `## Related courses and comparisons`: bullet list with a reason per link.
14. `<FAQAccordion items={[...]} />`: 6 to 9 first-hand answers (free?,
    beginners?, who teaches?, what you build?, transcripts?, how long?, install
    needs?, prerequisite?).
15. `<CourseSchema ... />` with `timeRequired` as ISO 8601, `modules` from
    the curriculum, `access` Free or Pro.

No button, PricingCTA or poster after the FAQ; `DocItem/Layout` adds no
automatic CTA under `/docs/courses/`.

## Course hub (docs/courses/<category>/index.mdx)

Frontmatter: `sidebar_label: "Overview"`, `sidebar_position: 0`,
`hideGlobalPricingCta: true`.

Body: an opening paragraph that names the number of courses, the hour range
and the course to start with; then `## Where to start` / `## All <category>
courses` (a table where every course name links to its leaf) / `## Inside the
courses` (title cards, one first-hand line per course) / `## The order to take
them in` / `## Where it fits` / `## Related`.

CTAs: primary is one free-start `<AffiliateLink variant="button">` to the
recommended first course at the end of "Where to start". Optional secondary:
`<PricingCTA ctaType="free">` at page end. Nothing clickable above the table.

## Path page (docs/paths/*.mdx)

Frontmatter: `sidebar_label: "<X> Path"`, `hideGlobalPricingCta: true`.

Body, in order:
1. Opening paragraph that answers: hours, modules, what you build, who it is
   for, the verdict. Then the provenance line
   (`*Reviewed inside the path with a Pro account, <Month Year>: all <n>
   modules expanded.*`).
2. Secondary CTA: one `<ScrimPoster>` on a free sample lesson, with its own
   `location="path-<name>-poster"`. Existing images only; the href is the
   lesson the frame shows. No button pair and no `CourseCard` in the opening.
3. The module table and module-by-module sections, instructors, time budget,
   pros and cons, the comparison with the other paths.
4. `## Choose this path if` (the verdict), closed by the primary CTA: the path
   `<CourseCard>` (facts plus its start button).
5. FAQ, sources, `CourseSchema`. No closing `PricingCTA` (the desktop sticky
   covers pricing on money pages) and no second demo link.

## Counting CTAs

`AffiliateLink variant="button"`, `PricingCTA`, `ScrimPoster`, `CourseCard`,
`VerdictBox` and a `ComparisonTable` with its CTA row each count as one; inline
text `AffiliateLink`s, `Screenshot`, `FAQAccordion`, RelatedGuides, the sticky
and schema components do not. Two counted components need at least two prose
paragraphs between them.
