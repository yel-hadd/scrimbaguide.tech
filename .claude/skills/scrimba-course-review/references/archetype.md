# Course leaf archetype

Reference implementation: `docs/courses/javascript/learn-javascript.mdx`.
Hubs (`docs/courses/<category>/index.mdx`) use the "Where to start / All
courses table / Inside the courses (title cards + one first-hand line per
course) / A sensible order / Where it fits / Related" shape instead.

## Frontmatter

```yaml
title: "<Course> on Scrimba: 2026 Review"
sidebar_position: <n>
toc_max_heading_level: 2
sidebar_label: "<short course name>"
description: "<instructor>'s <course> reviewed from inside: <runtime>, <n> scrims, <what you build>, what Pro gates, and how long it really takes."   # <= 160 chars
keywords: [...]
last_update:
  date: <YYYY-MM-DD, day reviewed>
```

## Imports

`CourseCard`, `CourseCurriculum`, `CourseSchema`, `FAQAccordion`,
`AffiliateLink`, `Screenshot` from `@site/src/components/...`.

## Body, in order

1. `# <Course>` then one paragraph: what it is, who teaches it, runtime, what
   you build, and the method sentence ("I opened every module and worked
   through a sample of lessons from each one with a Pro account in <Month
   Year>; what follows is what is actually in there").
2. `## Quick answer`: the whole verdict in one paragraph, ending with who it
   is for and the natural next course (internal link).
3. `<CourseCard title duration difficulty access modules instructor instructorUrl href description />`.
   `duration`, `difficulty`, `access` and `modules` are copied from the course's
   entry in `data/courses.json` (same strings), so the card and the site-wide
   counts in `scrimbaFacts.ts` never disagree.
4. Chapter title-card grid, only where chapters have title cards:
   `<div className="screenshot-grid">` with `<Screenshot ... source="" />` on
   all but the last card.
5. `## Is it worth your time?`: three or four paragraphs, the trade-offs.
6. `## What you'll learn`: `<CourseCurriculum modules={[{ name, duration, lessons }]} />`
   with module names and durations from `data/courses.json` and `lessons`
   counted from the expanded TOC, then one line saying how the
   counts were taken and why they differ from Scrimba's.
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
11. `## Who it's for, and who should skip it`, `## Prerequisites`,
    `## Where it fits` (paths + prerequisite chain, internal links),
    `## Strengths and limits` (one paragraph each, examples from inside).
12. `## Related courses and comparisons`: bullet list with a reason per link
    (hub, follow-up, alternative, comparison page).
13. `<FAQAccordion items={[...]} />`: 6 to 9 first-hand answers (free?,
    beginners?, who teaches?, what you build?, transcripts?, how long?, install
    needs?, prerequisite?).
14. `<AffiliateLink href="https://scrimba.com/<slug>-<id>" variant="button">Start
    <course> for free</AffiliateLink>` (or "Start <course> on Scrimba" for Pro).
15. `<CourseSchema ... />` with `timeRequired` as ISO 8601, `modules` from
    the curriculum, `access` Free or Pro.
