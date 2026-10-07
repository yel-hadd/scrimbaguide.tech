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

### Body

A leaf is built from the course, not from a skeleton. Until October 2026 all 70
leaves shared the same eleven H2s in the same order, and Google indexed 19 of 73
of them as near-duplicates ("crawled, currently not indexed"). The roles below
are required; their headings, order and grouping are not.

Fixed frame (same on every leaf):

1. `# <Course>`, `<DisclosureNotice />`, the 40 to 60 word opening (what it is,
   who teaches it, runtime, what you build, the verdict in one clause), then
   `<Provenance subject="course" date={frontMatter.reviewed} />`.
2. The first section answers "should I take it?" in two or three sentences
   (who it is for, the one catch, the next course) and is followed by
   `<CourseCard title duration difficulty access modules instructor instructorUrl href description />`
   (values copied from `data/courses.json`; the page's secondary CTA), then the
   chapter title-card grid where chapters have title cards.
3. The page ends with `<FAQAccordion items={[...]} />` (6 to 9 first-hand
   answers that add a detail the body does not repeat word for word) and
   `<CourseSchema ... />`. No button, PricingCTA or poster after the FAQ.

Roles every leaf covers, in the order that suits the course:

- **Verdict and trade-offs**: worth it or not, each trade-off ending on a
  verdict, with strengths and limits folded in (no separate "Strengths and
  limits" section that restates it).
- **Curriculum**: `<CourseCurriculum modules={[{ name, duration, lessons }]} />`
  with module names and durations from `data/courses.json`, then one line
  saying which lesson count is used.
- **Walkthrough**: `### ` per module (or per group of scrims), lesson-level
  sequence, at least one attributed transcript quote per major module, 2 to 4
  `<Screenshot>`s. Usually the longest section.
- **The lesson experience**: format, scrim length, the challenge loop, the
  instructor's habits with an example. Time to finish (runtime x 2 to 3 with
  the reasoning) can live here or in the verdict.
- **Free or Pro**: what is gated, with `/our-pricing` through
  `<AffiliateLink>`; never a price. When nothing inside the course is gated,
  two or three sentences inside another section are enough.
- **Audience**, closed by the primary CTA:
  `<AffiliateLink href="https://scrimba.com/<slug>-<id>" variant="button">Start
  <course> for free</AffiliateLink>` ("Start <course> on Scrimba" for Pro).
- **Before and after**: prerequisites and where it fits (paths, the course
  before and after) in one section, then a short related list where every
  bullet gives a reason specific to this course (never "the full category
  hub").

Headings:

- Every H2 names this course's content: a project, a tool, a number, an
  instructor habit, or the reader's question in this course's terms
  ("Five CHALLENGE.md tasks in a real Node sandbox", "Is 39 minutes enough to
  stop treating Vite as magic?"). Never a generic label: "Quick answer",
  "Is it worth your time?", "What you'll learn", "What a lesson feels like",
  "How long it takes", "Prerequisites", "Where it fits",
  "Strengths and limits", "Related courses and comparisons",
  "Free or Pro: exactly what is gated", "Who it's for, and who should skip it".
- No H2 string may appear on more than two leaves.
  `scripts/check-heading-uniqueness.mjs` (part of `npm run check:content`)
  enforces both rules.
- Lead with what is distinctive. A course whose best material is its project
  can put the walkthrough before the verdict; a course with a big Free/Pro
  catch can surface it in the first section.
- Seven to ten H2s. Merge a section that would be two sentences.

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
