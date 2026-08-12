# `data/i18n/<locale>/` schema

The catalog strings that no other part of the translation system can reach
(I18N-PLAN.md section 4 Phase 5 item 11).

## The problem this exists to solve

`data/courses.json` is scraper output and stays English forever: it is the catalog of record,
and CLAUDE.md owns it. But it carries prose that renders on every course page:

| Field | Rendered by | Example |
|---|---|---|
| `modules[].name` | `CourseCurriculum.tsx` | "Asynchronous JavaScript & APIs" |
| `modules[].duration` | `CourseCurriculum.tsx` | "84 min" |
| `level` | `CourseCard`, `scrimbaFacts` | "Intermediate" |
| `access` | `CourseCard`, `scrimbaFacts` | "Pro" |

These are **data, not `<Translate>` call sites**, so the Phase 1 extraction sweep and the
`code.json` job never see them. The JSX policy also (correctly) forbids the translator from
editing `{...}` expressions, which is how the data reaches the page.

Left unaddressed, every translated course page renders an English curriculum table **and the
cold MQM judge scores that as an Accuracy/Untranslated error**, failing the page for a defect
the translator was told not to fix. That is a pipeline deadlock, not a cosmetic gap.

## Files

```
data/i18n/<locale>/courses-strings.json   per-course module names
data/i18n/<locale>/units.json             shared units, level and access labels
```

Both are **committed** translation targets with their own `.status` sidecar, and both are
translated **before** any course page in that locale is judged.

Module names ARE translated. They are Scrimba UI copy describing a section of a course, not
course proper names, so they are deliberately out of scope for `glossary.csv`.

## `courses-strings.json`

```jsonc
{
  "locale": "es",
  "translatedAt": null,            // ISO 8601 once a translator has filled it in
  "courses": {
    "<docSlug>": {                 // the key used by every course page
      "modules": {
        "<English module name>": "<translated name>"   // null = not yet translated
      }
    }
  }
}
```

**Keyed by the English module name, not by array index.** The catalog is re-scraped: a module
inserted at position 2 would silently shift every translation down by one under positional
alignment, and nothing would fail. Keying on the English string makes a re-scrape produce a
visible new `null` key instead of 9 silently wrong rows.

A `null` value means untranslated. It is a **visible gap**, which is the whole point: the
resolver falls back to English only for locales that are not live, so a live locale with a
`null` fails its barrier rather than shipping a half-English table.

## `units.json`

```jsonc
{
  "locale": "es",
  "units":  { "min": null, "hrs": null, "modules": null, "lessons": null, "curriculumTitle": null },
  "level":  { "Beginner": null, "Intermediate": null, "Advanced": null },
  "access": { "Free": null, "Pro": null }
}
```

`units.min` / `units.hrs` are the suffixes in `"84 min"` and `"9.8 hrs"`. The NUMBER is never
translated and never reformatted here; number formatting is `Intl.NumberFormat`'s job in
`localizedCatalog.ts`, keyed on the locale.

`curriculumTitle` is the `CourseCurriculum` default heading ("Course curriculum"), which is a
component default rather than catalog data and therefore also invisible to the extraction sweep.

The key sets are exhaustive over `data/courses.json` as of 2026-08-12: 3 levels, 2 access
tiers, 2 duration units. A new value appearing in the catalog must appear here too, which is
what the generator stub in `build-data.mjs` is for.

## Who writes these files

| File | Writer |
|---|---|
| the stub (all values `null`) | `scripts/build-data.mjs`, once per live locale |
| the filled values | the translating agent for that locale |
| the resolver | `src/utils/localizedCatalog.ts` |

`es` was stubbed by hand in the Phase 5 unit as the reference; `build-data.mjs` takes over as
the stub writer. Regenerating a stub must never clobber a non-null value.
