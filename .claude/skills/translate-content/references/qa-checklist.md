# QA checklist

Two tiers. The per-file gate runs on **every** translated file. The barrier runs **once** per
locale, at the end.

The split is not bureaucracy: under the Phase 2 exclusion rule, a Core-set locale cannot build
at all until its whole route set exists, so a `docusaurus build` in the per-file gate would be
unsatisfiable for the entire run.

---

## Per-file gate (cheap, deterministic, no model judgment)

```bash
npm run check:content
node scripts/jsx-integrity.mjs  <englishSource> <translatedFile>
node scripts/glossary-check.mjs <englishSource> <translatedFile>
```

- [ ] `check:content` green (em-dashes, prices in any currency, affiliate params under `i18n/**`)
- [ ] `jsx-integrity` green (components, frozen props, code fences, anchors, imports, inline code)
- [ ] `glossary-check` green (do-not-translate terms present and byte-identical)
- [ ] the MDX compiles
- [ ] frontmatter: `title` / `description` / `image_alt` / `sidebar_label` translated
- [ ] frontmatter: `keywords` **re-researched**, not translated
- [ ] frontmatter: `slug`, `id`, `sidebar_position`, `authors`, `tags`, `date`, `last_update`,
      `image`, `hideFooterPricingCta` untouched
- [ ] `title` and H1 carry the English product name verbatim **plus** a localized descriptor
      wherever the English title is only a course or path name
- [ ] title within the 44-content-character budget, `" | Scrimba Guide"` suffix intact
- [ ] every `{#id}` anchor identical to the source
- [ ] no graduate/testimonial voice introduced ("when I finished the course")
- [ ] no exact Scrimba price in any currency; `/our-pricing` linked instead
- [ ] numbers, dates and currencies formatted per CLDR for the locale
- [ ] typographic assertions from `translate-<lang>` section 2 all hold
- [ ] status sidecar written at `i18n/<L>/.status/<sha256(sourcePath)>.json`

Mechanical failures are fixed and re-run. They do **not** consume an attempt on the failure
ladder.

---

## Per-locale barrier (once, at the end)

```bash
node scripts/translation-status.mjs --check
node scripts/build-coverage-manifest.mjs --check
npx docusaurus build --locale <L>
```

- [ ] every status sidecar well-formed; no page recorded as `current` with a failing verdict
- [ ] coverage complete relative to `i18n/tiers.json` for this locale's tier
- [ ] **no more than 10%** of declared routes auto-dropped (`blocked`)
- [ ] locale build green with `onBrokenLinks: 'throw'` **and** `onBrokenAnchors: 'throw'`
- [ ] all four `write-translations` surfaces translated: `code.json`,
      `docusaurus-theme-classic/navbar.json` + `footer.json`,
      `docusaurus-plugin-content-docs/current.json`, `docusaurus-plugin-content-blog.json`
- [ ] **no `message` value in those four files is byte-identical to its English baseline**,
      unless the string is a glossary do-not-translate term. Nothing in the coverage manifest
      or the per-file gate can catch a miss here, because these are not content files.
- [ ] `data/i18n/<L>/units.json` and `courses-strings.json` have no `null` values left
- [ ] back-translation spot check on a 10% sample
- [ ] native-register critic pass over the money pages
- [ ] median JSD from the translationese check has not risen more than 20% versus the previous
      run for this locale
- [ ] the 9 chrome-floor routes exist (the build proves this, but check it first: it is the
      most common reason a locale build fails for a reason unrelated to the page being worked on)

The disk-derived coverage manifest is authoritative **only here**, never mid-run.

---

## Flip to live

Only after the barrier is green: set `status: 'live'` in `i18n/locales.config.ts`. That single
word is what puts the locale into `i18n.locales`, the sitemap and every hreflang cluster. A
locale ships complete or not at all.
