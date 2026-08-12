# The JSX contract

What a translator may and may not change inside MDX. Enforced by
`node scripts/jsx-integrity.mjs <englishSource> <translatedFile>`, which is a per-file gate.

Nothing here is stylistic. Every rule below exists because breaking it produces a defect that
**reads perfectly to a native speaker** and fails in production: a dead link, a lost affiliate
parameter, a build that throws at the locale barrier, or a code sample that teaches broken code.

## The allowlist

**Translatable props, and nothing else:**

| Prop | Appears on |
|---|---|
| `question`, `answer` | `<FAQAccordion>` |
| `title` | `<CourseCard>`, `<CourseCurriculum>`, callouts |
| `label` | `<AffiliateLink>`, `<PricingCTA>` |
| `verdict` | `<PricingCTA>`, comparison summaries |
| `alt` | images |
| children | every component |

**Never touch:**

- `href`, `to`, `slug`, `courseSlug`, `id`
- component names (`<AffiliateLink>` stays `<AffiliateLink>`)
- `import` statements, including the imported binding name
- anything inside a `{...}` expression, including `{' '}` and template literals
- fenced code blocks: byte-identical, including comments, string literals and the info string
- inline code, CLI commands, file paths, URLs

## Worked example

```mdx
<AffiliateLink
  href="https://scrimba.com/learn-react-c0e"     {/* frozen: URL + affiliate param */}
  label="Start Learn React"                       {/* translatable */}
>
  See the course on Scrimba                       {/* translatable (children) */}
</AffiliateLink>
```

Spanish:

```mdx
<AffiliateLink
  href="https://scrimba.com/learn-react-c0e"
  label="Empieza Learn React"
>
  Ver el curso en Scrimba
</AffiliateLink>
```

`Learn React` stays in the label because it is a frozen course name (see `glossary.csv`); only
the surrounding words move.

## Why each rule is load-bearing

| Rule | What breaking it costs |
|---|---|
| `href` frozen | The affiliate param stops being sent, or the URL 404s. Silent lost revenue with a green build. This is risk R6. |
| `to` frozen | Internal link to a route that does not exist. `onBrokenLinks: 'throw'` fails the whole locale build, not the page. |
| frontmatter `slug` frozen | hreflang alternates are computed by swapping the locale segment of the current pathname. One translated slug points every alternate in the cluster at a 404. |
| `{#id}` anchors frozen | `onBrokenAnchors: 'throw'`. Also breaks every deep link into the page from other pages and from search results. |
| component names frozen | The component does not exist. MDX compile error, at best. |
| imports frozen | Same, plus the error message points at a line the translator never thought they edited. |
| `{...}` expressions frozen | It is code. A translated identifier is a `ReferenceError`; a translated string inside a template literal silently changes a computed URL. |
| fenced code frozen | A localized identifier teaches broken code, and the reader copies it. |
| inline code frozen | `data/courses.json` is a path, not a phrase. |

## Anchors

Translate the heading text, keep the id:

```md
English:  ## What you get {#what-you-get}
Spanish:  ## Qué incluye {#what-you-get}
Japanese: ## 何が使えるようになるか {#what-you-get}
```

The id set of the translation must be **exactly** the id set of the source: no additions, no
removals, no renames. If a translated page genuinely needs a new section, that is a Phase 7
per-market content page, not a translation.

## Affiliate integrity

Every `scrimba.com` URL either goes through `<AffiliateLink>` or carries `via=` explicitly.
Never hand-write a bare `https://scrimba.com/...` anchor in a translated file, and never
"clean up" a query string. `npm run check:content` enforces this under `i18n/**`.

## What the checker actually compares

`scripts/jsx-integrity.mjs` compares, between source and translation:

1. frozen frontmatter keys, value by value
2. fenced code blocks: same count, same order, same info string, same bytes
3. multiset of component names
4. multiset of `href|to|slug|courseSlug|id` prop values
5. multiset of `import` lines
6. the set of `{#id}` anchors, both directions
7. the set of inline code spans (source spans must all survive)

It says nothing about prose quality. That is MQM's job (`mqm-rubric.md`).

## The one thing it cannot see

A component that is **present, correct and pointed at the wrong market**: an
`<AffiliateLink>` in a transcreated page whose surrounding copy now promises something the
linked page does not offer. Structure checks pass; the cold judge catches it. Transcreation
(SKILL.md section 9) is where this risk lives.
