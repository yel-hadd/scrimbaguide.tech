# Where the scripts actually live

The plan sketched these under `.claude/skills/translate-content/scripts/`. They ship at the
**repo root** instead, because `prebuild`, the `Makefile` and CI all call them, and a build
step reaching into a skill directory for its tooling inverts the dependency:

| Script | Purpose |
|---|---|
| `scripts/new-locale.mjs` | scaffold a locale: directories and translation JSON only, never markdown |
| `scripts/build-glossary.mjs` | seed the global do-not-translate rows of `../references/glossary.csv` |
| `scripts/glossary-check.mjs` | per-file gate: do-not-translate compliance |
| `scripts/jsx-integrity.mjs` | per-file gate: components, frozen props, code fences, anchors |
| `scripts/mqm-wordcount.mjs` | the MQM denominator (English source words) |
| `scripts/translation-status.mjs` | sole reducer of `.status` sidecars into `i18n/translation-status.json` |
| `scripts/build-coverage-manifest.mjs` | owns `sourceHash` and `i18n/coverage.json` (Phase 2, not this skill) |

Tests: `scripts/__tests__/jsx-integrity.test.mjs`,
`scripts/__tests__/glossary-check.test.mjs`, and `__tests__/scaffold-and-status.test.mjs`
next to this file.
