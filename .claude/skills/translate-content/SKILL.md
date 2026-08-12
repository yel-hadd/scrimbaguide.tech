---
name: translate-content
description: The repo contract for translating scrimbaguide.tech into another locale. Use whenever translating or transcreating any docs page, blog post, MDX page, catalog string or UI string file into a non-English locale, and whenever scaffolding a new locale. Covers frontmatter policy, JSX and anchor integrity, the do-not-translate glossary, the transcreation tier, the two-tier QA gate and the status sidecar. Language-agnostic: always load exactly one translate-<lang> profile alongside it.
---

# Translating this repo

> **NOT YET ACTIVE (2026-08-12).** The producer and consumer of these files do not exist:
> `src/utils/localizedCatalog.ts` has not been written and `scripts/build-data.mjs` emits no
> per-locale stub. Nothing in `src/`, `config/`, `scripts/` or `plugins/` reads either JSON
> file today, so a translated `courses-strings.json` renders nowhere. Do NOT spend translation
> effort on it until those two land; translated course pages will show an English curriculum
> table in the meantime, and the cold MQM judge must NOT score that as an Accuracy error.

This file is **repo mechanics only**. It is language-agnostic on purpose, so it stays the one
thing to update when the repo changes.

**A translation job loads TWO skills: this one plus exactly one `translate-<lang>`.**
Language knowledge (register, typography, search behaviour, morphology, failure modes) lives
there and **nowhere here**. If the two ever seem to conflict about language, the per-language
skill wins; if they seem to conflict about the repo, this file wins.

Skill directory names are lowercased with the region retained (`translate-pt-br`,
`translate-zh-hans`), because skill names must match `^[a-z0-9-]+$`. The Docusaurus locale tag
keeps canonical casing (`pt-BR`, `zh-Hans`) everywhere else.

## What you are translating into

Locale roster, tier, coverage and skill path: `references/locales.md`.
Route scope per tier: `i18n/tiers.json`. Never translate a route outside your tier's set.

Target paths, named once so nobody guesses. The relative path under each root mirrors the
English source **exactly**:

```
docs/<path>.mdx      ->  i18n/<L>/docusaurus-plugin-content-docs/current/<path>.mdx
blog/<file>.mdx      ->  i18n/<L>/docusaurus-plugin-content-blog/<file>.mdx   (same filename, date included)
src/pages/<f>.mdx    ->  i18n/<L>/docusaurus-plugin-content-pages/<f>.mdx     (markdown pages only)
```

`src/pages/*.tsx` routes are NOT translated as files. They are translated through `code.json`.

Scaffold a locale with `node scripts/new-locale.mjs <locale>` (or `make i18n-scaffold
LOCALE=<locale>`). It creates directories and the `write-translations` JSON only.
**Never copy English markdown into `i18n/`.** Coverage is derived from disk, so an untranslated
copy is indistinguishable from a finished translation: an interrupted run would read as
covered, earn hreflang plus a self-canonical, and ship English pages under a non-English
hreflang with a green build. Docusaurus already falls back per file, so the copy buys nothing.

## 1. Frontmatter policy

| Key | Action |
|---|---|
| `title` | **Translate.** See the course-name rule below. |
| `description` | **Translate.** Rewrite for the market, do not calque. |
| `image_alt` | **Translate.** |
| `sidebar_label` | **Translate the value, keep the key.** |
| `keywords` | **RE-RESEARCH. Never translate.** |
| `slug`, `id` | **Never touch.** |
| `sidebar_position`, `authors`, `tags`, `date`, `last_update`, `image`, `hideFooterPricingCta` | **Never touch.** |

### `slug` parity is a hard invariant

The hreflang engine computes a page's alternates by **swapping the locale segment of the
current pathname**. It does not look up a translation table. So `/es/docs/precios/` produces an
`en` alternate of `/docs/precios/`, which does not exist: one renamed slug points **every**
alternate in that cluster at a 404, the cluster stops being reciprocal, and Google drops the
whole group. Localized URLs are a real SEO tactic; they are not available to this architecture,
and re-litigating that is a Phase 2 change, not a translation decision.

### `keywords`: re-research, never translate

Literal keyword translation is the single most common way multilingual SEO produces zero
traffic. German developers search **"Scrimba Erfahrungen"**, not "Scrimba Bewertung", and never
"Scrimba review". Take the query patterns from your `translate-<lang>` skill section 5, and
where that is thin, do the research (the `ai-seo` and `content-strategy` skills compose here).
Keywords are the one frontmatter field where the English is an input, not a source text.

### The `title` vs course-name collision

Course titles are frozen product names (section 3 below). On 79 course leaves and 6 path pages
the `title` **is** the product name (`title: "Learn React"`, `# Learn React`). Both rules are
real, so the construction rule resolves them:

> **A proper name is never translated as a name, and a `title`/H1 is never left bare English.**

Emit the English name **character-for-character** (so `glossary-check.mjs` passes) plus a
localized descriptor that carries the market's own keyword from your section 5:

```yaml
es:    title: '“Learn React”: ¿vale la pena?'
de:    title: '"Learn React": Kurs im Test'
ja:    title: 「Learn React」コースレビュー
pt-BR: title: '"Learn React": vale a pena?'
```

The quote glyphs and the descriptor keyword are NOT chosen here. They come from the
language profile: `translate-<lang>` section 2 (typography) fixes the quote marks, and
section 5 (search behaviour) fixes which phrase real users actually search. For `es`
that is `“ ”` and `vale la pena`; writing `"` and `merece la pena` would violate both,
and `merece la pena` is Spain-leaning where the profile is LatAm-neutral.

Where the English title is **only** the product name, the descriptor is **mandatory**. The
first body mention uses the English name; later mentions may paraphrase ("el curso", "der
Kurs"). The same rule applies to the H1, which must match the title's treatment.

Title length: every locale keeps the `" | Scrimba Guide"` suffix and is capped at **44 content
characters** (CJK locales sit at 30). That cap is uniform by decision; a per-language skill may
lower its own budget, never raise it.

## 2. JSX policy

The MDX carries 308 `<AffiliateLink>`, 173 `<FAQAccordion>`, 137 `<PricingCTA>`, 94
`<DisclosureNotice>`, 83 `<CourseCard>` and 72 `<CourseSchema>` usages. Full rules and worked
examples: `references/jsx-contract.md`.

**Translatable props (allowlist, nothing else):** `question`, `answer`, `title`, `label`,
`verdict`, `alt`, and element **children**.

**Never touch:** `href`, `to`, `slug`, `courseSlug`, `id`; component names; `import`
statements; anything inside `{...}` expressions.

**Never translate:** fenced code blocks (byte-identical, including comments and string
literals), inline code, CLI commands, file paths, URLs.

Every outbound Scrimba link must keep its affiliate parameter. `check:content` enforces this
under `i18n/**`: a link that lost `via=` is silent lost revenue with a green build.

## 3. Do-not-translate glossary

Machine-readable: `references/glossary.csv` (long-form RFC 4180:
`term,category,locale,rendering,inflectable,source`). Checked by `scripts/glossary-check.mjs`.

Frozen globally: **Scrimba**, **scrim** / **scrims**, **Scrimba Pro**, every course title,
every path name ("Frontend Developer Path"), React, Next.js, TypeScript, Tailwind, RAG, MCP,
**"vibe coding"**, Trustpilot, Mozilla MDN.

`scrim` is the one most often lost: it is Scrimba's product noun for an interactive screencast,
not a generic word for "recording", and localizing it detaches the page from the product.

Case-governed languages (pl, cs, sk, sl, hr, sr, lt, lv, et, hu, uk, ru...) may inflect a
frozen term. That is **opt-in per locale**: append your own rows with `inflectable: yes` rather
than editing the global rows. Regenerate the global rows with
`node scripts/build-glossary.mjs`; it preserves every per-locale row.

Module names in `data/i18n/<L>/courses-strings.json` ARE translated and are deliberately out of
glossary scope (see section 8).

## 4. Register

**Not defined here.** Your `translate-<lang>/SKILL.md` section 1 is the only normative source.
Both skills load into the same job, so a second definition would put two conflicting
instructions in one prompt for the highest-leverage line in the file.
`references/locales.md` carries roster, tier, status and skill path **only**.

## 5. Voice

Inherited from `CLAUDE.md`: **an independent reviewer, never a course graduate.**

Never introduce "when I finished the course", "as a graduate of the path", "durante mi
formación". This drift is common in languages whose reviewer register defaults to a personal
testimonial, and it is a factual claim the site does not make. Keep the English stance:
observed, compared, researched. Where the English says "I looked at" or "we compared", the
translation says the same thing in the market's natural reviewer voice.

## 6. Editorial guardrails

- **No em-dashes** in Latin-script locales. Use the locale's own punctuation.
- **Never quote an exact Scrimba price, in any currency.** Not in euros, yen, reais or zloty.
  Prices vary by region and drift. Link to `https://scrimba.com/our-pricing` instead. Relative
  statements ("cheaper than a bootcamp") are fine; a number attached to a Scrimba plan is not.
- Competitor and bootcamp prices may stay, since they are cited facts about someone else.
- Localize numbers, dates and currencies per CLDR for your locale; never localize a version
  number, a duration inside a code sample, or a figure that sits beside code.

`npm run check:content` enforces the first two under `i18n/**`.

## 7. Anchors

Every heading anchor is frozen with an explicit `{#id}` in English and `onBrokenAnchors` is
`'throw'`. **Translate the heading text, keep the id byte-identical:**

```md
## Qué incluye Scrimba Pro {#what-you-get}
```

A translated id breaks every in-page link, every cross-page deep link, and the locale build.

## 8. Catalog strings (`data/i18n/<L>/`)

`data/courses.json` stays English. Its `modules[].name`, `duration`, `level` and `access` render
on every course page through `CourseCurriculum`, are invisible to the `code.json` sweep, and are
inside `{...}` expressions the JSX policy forbids you to touch.

Translate them in `data/i18n/<L>/courses-strings.json` and `data/i18n/<L>/units.json`
**before any course page in that locale is judged**, or the cold judge scores the English
curriculum table as an Accuracy/Untranslated error and fails a page for a defect you were told
not to fix. Schema and rules: `data/i18n/schema/courses-strings.md`.

## 9. Transcreation tier

**Money pages are transcreated, not translated:**

- the homepage hero
- `/docs/paths/*`
- `/docs/comparisons/*`
- `/docs/pricing/*`
- the three money blog posts: `scrimba-review`, `is-scrimba-worth-it`,
  `scrimba-pro-pricing-explained-2026`

Transcreation means: the **local competitor set** (Platzi, OpenClassrooms, Alura, Rocketseat,
not Codecademy-by-default), **local job-market framing**, **local social proof**, and a CTA
rewritten for the market. Claims, structure, headings, anchors, components and links stay.
Everything else on the site is faithful translation.

The `copywriting`, `customer-research`, `copy-editing` and `humanizer` skills compose here.
A transcreated page records `"tier": "transcreation"` in its status sidecar.

## 10. The QA gate, in two tiers

Full checklist: `references/qa-checklist.md`. Scoring: `references/mqm-rubric.md`.
Loop and failure ladder: `references/workflow.md`.

### Per-file, on every translated file (cheap, deterministic, no model judgment)

```bash
npm run check:content
node scripts/jsx-integrity.mjs  <englishSource> <translatedFile>
node scripts/glossary-check.mjs <englishSource> <translatedFile>
# plus: the MDX compiles
```

Affiliate-param integrity is already part of `check:content` under `i18n/**`. Do not build a
second checker for it.

**There is no `docusaurus build` in the per-file gate.** Under the Phase 2 exclusion rule a
Core-set locale cannot build until its entire route set exists, so a per-file build gate is
unsatisfiable mid-run.

### Per-locale barrier, once, at the end

```bash
node scripts/translation-status.mjs --check
node scripts/build-coverage-manifest.mjs --check
npx docusaurus build --locale <L>     # onBrokenLinks + onBrokenAnchors both 'throw'
```

plus a back-translation spot check on a 10% sample, a native-register critic pass, and the
assertion that no `message` in the four `write-translations` JSON files is byte-identical to
its English baseline (unless the string is a glossary term).

The disk-derived coverage manifest is authoritative **only at the barrier**, never mid-run.

## 11. Recording that a page is done

Every completed page writes its own sidecar. **Sidecars are committed; the reduced
`i18n/translation-status.json` is generated and gitignored.** One file per page per locale,
because 47 agents appending to one ledger is a guaranteed write conflict.

Path: `i18n/<locale>/.status/<sha256(sourcePath)>.json`

```json
{ "sourcePath": "docs/comparisons/scrimba-vs-codecademy.mdx",
  "route": "/docs/comparisons/scrimba-vs-codecademy/",
  "locale": "de", "sourceHash": "<sha256>",
  "translatedAt": "<ISO8601 UTC>",
  "tier": "faithful",
  "mqm": { "score": 3.2, "sourceWords": 1840, "majorAccuracy": 0,
           "terminology": 0, "judgeModel": "...", "verdict": "pass" },
  "jsd": 0.041,
  "state": "current",
  "attempts": 1 }
```

- `sourcePath` is repo-relative and is the sidecar's identity: the filename must be
  `sha256(sourcePath)`.
- `sourceHash` is computed **after** stripping the frontmatter keys `last_update`, `date` and
  `image` and normalizing line endings. Hashing raw bytes would mass-staleize all 47 locales on
  one `last_update` bump. There is exactly one implementation, exported by
  `scripts/build-coverage-manifest.mjs`; never write a second one.
- `sourceWords` comes from `node scripts/mqm-wordcount.mjs <englishSource>` (English source
  words, identical for every locale).
- `state` is `current` or `blocked`. `blocked` is set by the failure ladder after three failed
  attempts and drops the route from the manifest, hreflang and the sitemap.

Reduce and report:

```bash
node scripts/translation-status.mjs            # write i18n/translation-status.json
node scripts/translation-status.mjs --report   # per-locale table (make i18n-status)
```

Authoring a new English page automatically enqueues it for every live locale: it appears as
`missing` in the next reduction. Editing an English page makes every locale's copy `stale`.

## 12. UI strings

All four `write-translations` surfaces are translated, not just `code.json`:

| File | Carries |
|---|---|
| `i18n/<L>/code.json` | React component strings |
| `i18n/<L>/docusaurus-theme-classic/navbar.json` + `footer.json` | nav and footer labels |
| `i18n/<L>/docusaurus-plugin-content-docs/current.json` | sidebar category labels from `sidebars.ts` |
| `i18n/<L>/docusaurus-plugin-content-blog.json` | blog sidebar title and tag labels |

Translate `message` values only, **never keys**. Nothing in the coverage manifest or the
per-file gate can catch a miss here, which is why the barrier asserts on byte-identical
messages.

## Order of work for a locale

1. `node scripts/new-locale.mjs <L>`, then `npx docusaurus write-translations --locale <L>`.
2. The four UI-string files.
3. `data/i18n/<L>/units.json` and `courses-strings.json`.
4. The 9 chrome-floor routes (navbar, footer and MegaMenu link to them from every page, so the
   locale cannot build without them).
5. The rest of the tier's route set: money pages transcreated, everything else translated.
6. The per-locale barrier.

## References

| File | What it holds |
|---|---|
| `references/locales.md` | roster, tier, coverage, status, skill path |
| `references/glossary.csv` | do-not-translate terms, generated |
| `references/jsx-contract.md` | translatable props, worked examples, what breaks |
| `references/qa-checklist.md` | the gate, as a runnable list |
| `references/mqm-rubric.md` | error categories, weights, the ship threshold |
| `references/workflow.md` | translate / reflect / refine / verify / cold-judge, and the failure ladder |
