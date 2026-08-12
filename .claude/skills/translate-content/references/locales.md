# Locale roster

**Roster, tier, coverage, status and skill path ONLY.**

Register is **not** defined here. Each `translate-<lang>/SKILL.md` section 1 is the only
normative source for its language (I18N-PLAN.md section 4 Phase 5 item 4). Both skills load
into the same job, so a second register definition would put two conflicting instructions into
one prompt for the line the plan itself calls the highest-leverage in the file. If you came
here looking for "which pronoun", open the language skill.

**This table is a rendering of `i18n/locales.config.ts`, which is the single source of truth.**
It is the file every consumer reads (`i18n.locales`, `localeConfigs`, the CI matrix, the
coverage manifest builder, the font loader, the language switcher, the indexer). When they
disagree, the TypeScript file is right and this table is stale; regenerate it rather than
patching it by hand.

Rendered 2026-08-12 from a 48-record roster (`en` plus 47 translation targets).

## What the columns mean

| Column | Meaning |
|---|---|
| Tier | Launch cohort (plan section 2). A ships first and alone; B..E are evidence-gated on the 90-day Tier A indexing verdict. |
| Coverage | Key into `routeSets` in `i18n/tiers.json`. It is the DECLARED scope; never translate outside it. |
| Status | `draft` = not in `i18n.locales`, does not build, ships nothing. `live` = shipping. `pruned` = kept on disk, noindexed, out of every hreflang cluster. |
| Dir | `ltr` / `rtl`. |
| Skill | Where that language's profile lives. Directory names are lowercased with the region retained, because skill names must match `^[a-z0-9-]+$`. |

## Route sets

| Coverage | Routes | Applies to |
|---|---|---|
| `full` | ~190 | Tier A |
| `full-minus-course-leaves` | ~119 | Tier B (all 71 `docs/courses/**` leaves dropped, all 7 category hubs retained) |
| `core` | 40 | Tier C and Tier E (Core-40) |
| `micro` | 16 | Tier D (Micro-16, a strict subset of Core-40) |

The first 9 routes of `micro` are the **chrome floor**: every route reachable from the navbar,
footer and MegaMenu. Under `onBrokenLinks: 'throw'` a locale cannot build without them, so they
are translated first in every locale regardless of tier.

`legal/**` is English-only in every locale and is subtracted from every route set, including
`full`. The five `.tsx` routes in `alwaysBuilt` are translated via `code.json` and are injected
into every locale's manifest so the locale homepage keeps its hreflang cluster.

## The roster

Every locale except `en` is `draft` until its coverage manifest is complete relative to its
tier. Adding a locale to the roster therefore costs nothing and ships nothing.

| Locale | Tier | Coverage | Status | Dir | Skill |
|---|---|---|---|---|---|
| `es` | A | `full` | draft | ltr | `.claude/skills/translate-es/` |
| `pt-BR` | A | `full` | draft | ltr | `.claude/skills/translate-pt-br/` |
| `fr` | A | `full` | draft | ltr | `.claude/skills/translate-fr/` |
| `de` | A | `full` | draft | ltr | `.claude/skills/translate-de/` |
| `ja` | A | `full` | draft | ltr | `.claude/skills/translate-ja/` |
| `ar` | A | `full` | draft | rtl | `.claude/skills/translate-ar/` |
| `it` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-it/` |
| `nl` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-nl/` |
| `pl` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-pl/` |
| `tr` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-tr/` |
| `ru` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-ru/` |
| `uk` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-uk/` |
| `ko` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-ko/` |
| `id` | B | `full-minus-course-leaves` | draft | ltr | `.claude/skills/translate-id/` |
| `sv` | C | `core` | draft | ltr | `.claude/skills/translate-sv/` |
| `da` | C | `core` | draft | ltr | `.claude/skills/translate-da/` |
| `nb` | C | `core` | draft | ltr | `.claude/skills/translate-nb/` |
| `fi` | C | `core` | draft | ltr | `.claude/skills/translate-fi/` |
| `cs` | C | `core` | draft | ltr | `.claude/skills/translate-cs/` |
| `el` | C | `core` | draft | ltr | `.claude/skills/translate-el/` |
| `hu` | C | `core` | draft | ltr | `.claude/skills/translate-hu/` |
| `ro` | C | `core` | draft | ltr | `.claude/skills/translate-ro/` |
| `bg` | C | `core` | draft | ltr | `.claude/skills/translate-bg/` |
| `sk` | C | `core` | draft | ltr | `.claude/skills/translate-sk/` |
| `hr` | D | `micro` | draft | ltr | `.claude/skills/translate-hr/` |
| `sl` | D | `micro` | draft | ltr | `.claude/skills/translate-sl/` |
| `lt` | D | `micro` | draft | ltr | `.claude/skills/translate-lt/` |
| `lv` | D | `micro` | draft | ltr | `.claude/skills/translate-lv/` |
| `et` | D | `micro` | draft | ltr | `.claude/skills/translate-et/` |
| `ga` | D | `micro` | draft | ltr | `.claude/skills/translate-ga/` |
| `mt` | D | `micro` | draft | ltr | `.claude/skills/translate-mt/` |
| `is` | D | `micro` | draft | ltr | `.claude/skills/translate-is/` |
| `sq` | D | `micro` | draft | ltr | `.claude/skills/translate-sq/` |
| `sr` | D | `micro` | draft | ltr | `.claude/skills/translate-sr/` |
| `mk` | D | `micro` | draft | ltr | `.claude/skills/translate-mk/` |
| `hi` | E | `core` | draft | ltr | `.claude/skills/translate-hi/` |
| `bn` | E | `core` | draft | ltr | `.claude/skills/translate-bn/` |
| `ta` | E | `core` | draft | ltr | `.claude/skills/translate-ta/` |
| `te` | E | `core` | draft | ltr | `.claude/skills/translate-te/` |
| `mr` | E | `core` | draft | ltr | `.claude/skills/translate-mr/` |
| `vi` | E | `core` | draft | ltr | `.claude/skills/translate-vi/` |
| `th` | E | `core` | draft | ltr | `.claude/skills/translate-th/` |
| `zh-Hans` | E | `core` | draft | ltr | `.claude/skills/translate-zh-hans/` |
| `he` | E | `core` | draft | rtl | `.claude/skills/translate-he/` |
| `fa` | E | `core` | draft | rtl | `.claude/skills/translate-fa/` |
| `ur` | E | `core` | draft | rtl | `.claude/skills/translate-ur/` |
| `pt-PT` | E | `core` | draft | ltr | `.claude/skills/translate-pt-pt/` |

`fa` additionally sets `calendar: 'persian'`.

## Which skills exist today

Only `translate-es` is written. Per plan section 13.6, a `translate-<lang>` skill is authored
**just before that locale's translation run**, never in bulk up front: a skill written 18
months before use is a skill nobody validated. Build order after `es`: `ja` and `ar` (they
stress the format hardest), then `pt-BR`, `fr`, `de` to complete Tier A.

Writing a new one: copy the eight-section shape from `translate-es/SKILL.md`, state the
canonical locale tag on the first body line, and validate the name with skill-creator's
`quick_validate.py` before committing.

## The India caveat, so nobody starts `hi` early

India's developer search is overwhelmingly English. The right India play is India-specific
content **in English** (INR payment context, campus placement reality,
`scrimba-vs-scaler`-style comparisons), which belongs in the normal English content roadmap,
not in this program. E1 stays gated on a `hi` pilot.
