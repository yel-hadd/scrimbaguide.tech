/**
 * The ONLY locale roster in the codebase (I18N-PLAN.md section 4 Phase 1, section 17).
 *
 * Before this file existed the roster lived as prose in plan section 2, and six independent
 * work units each needed overlapping per-locale facts (direction, tier, coverage, script,
 * register). Six hardcoded copies of a 48-row table is failure mode R4: they drift, hreflang
 * clusters stop being reciprocal, and nothing fails loudly. So every consumer reads THIS file:
 *
 *   - `i18n.locales` in docusaurus.config.ts  (filter `status === 'live'`, i.e. LIVE_LOCALES)
 *   - `i18n.localeConfigs`                    (htmlLang / direction / calendar)
 *   - the Phase 3 CI build matrix             (tier)
 *   - the Phase 2 coverage manifest builder   (coverage -> i18n/tiers.json routeSets key)
 *   - the Phase 4 conditional font loading    (fontScript)
 *   - the Phase 8 language switcher grouping  (region)
 *   - the section 11.3 C indexer round-robin  (locale, tier)
 *
 * Hard constraints on this file, all load-bearing:
 *
 * 1. NO imports. Not from `src/`, not from `@docusaurus/*`, not even type-only. It is loaded
 *    both by app code (bundled TSX) and by `docusaurus.config.ts`, and it must stay loadable
 *    by plain Node type-stripping, so it uses erasable syntax only: no enums, no namespaces,
 *    no parameter properties, no decorators.
 * 2. `status: 'live'` is what actually ships a locale. Everything except `en` is `'draft'`
 *    until its coverage manifest is complete relative to i18n/tiers.json (plan invariant 4:
 *    a locale ships complete or not at all, never an English fallback under a foreign
 *    hreflang). Adding a locale to this file therefore costs nothing and is safe.
 * 3. `status: 'pruned'` is the section 7 kill criteria state: emits `<meta name="robots"
 *    content="noindex">`, drops out of every hreflang cluster and out of sitemap-index.xml,
 *    and keeps its files on disk. It is the ONLY noindex path in the whole program.
 */

/** Coverage tier from plan section 2.1. Drives the CI matrix and the launch gates. */
export type Tier = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Which route set a locale translates. This string is the KEY into `routeSets` in
 * i18n/tiers.json, so the two files must stay in lockstep; the Phase 2 manifest builder
 * looks the value up directly rather than switching on it.
 *
 * Plan section 4 Phase 1 wrote this union as `'full' | 'core'`, but section 2.1 defines FOUR
 * distinct route sets and section 18 decision 4 locks the third one. Enumerated here so no
 * consumer has to re-derive it:
 *
 *   full                      ~190 routes  Tier A + `en`
 *   full-minus-course-leaves  ~119 routes  Tier B (all 79 docs/courses leaves dropped,
 *                                          all 7 category hubs retained; decision 4)
 *   core                       40 routes   Tier C + Tier E  (Core-40)
 *   micro                      16 routes   Tier D            (Micro-16, a strict subset of
 *                                          Core-40, asserted in CI)
 */
export type Coverage = 'full' | 'full-minus-course-leaves' | 'core' | 'micro';

/** Publication state. See constraints 2 and 3 in the file header. */
export type LocaleStatus = 'draft' | 'live' | 'pruned';

/**
 * Writing-system bucket, NOT a language family. It exists to key the Phase 4 conditional font
 * loading, so a German visitor never downloads Arabic glyphs and a Japanese visitor never
 * downloads a multi-megabyte CJK webfont (CJK and Indic get system stacks; see plan section 4
 * Phase 4 and risk R8).
 *
 * Buckets are split by the STACK they need, not by script relatedness: `fa` is written in
 * Arabic script and shares the Arabic stack, but `ur` needs Noto Nastaliq Urdu and `he` needs
 * Noto Sans Hebrew, so those are separate buckets.
 *
 * `thai` is not in the plan's Phase 4 script table, which simply omits `th` (Tier E2). It is
 * added here rather than mis-filing Thai as Latin or as one of the Indic buckets, both of
 * which would drive a wrong `:lang(th)` rule. Thai belongs with the system-stack group: a
 * Thai webfont is large and Noto Sans Thai ships on all target platforms.
 */
export type FontScript =
  | 'latin'
  | 'cyrillic'
  | 'greek'
  | 'arabic'
  | 'hebrew'
  | 'urdu'
  | 'devanagari'
  | 'bengali'
  | 'tamil'
  | 'telugu'
  | 'thai'
  | 'cjk';

/**
 * Display grouping for the Phase 8 language switcher (`type: 'localeDropdown'` is unusable at
 * 15+ locales, so the switcher is custom, searchable and grouped by this field). These are
 * market groupings chosen to make a 48-item list scannable, not geopolitical claims:
 * `es`/`pt-BR`/`pt-PT` share one group because a reader looking for one is plausibly looking
 * for another, and `tr` sits with Southeast Europe rather than MENA because Turkish is neither
 * Arabic-script nor an Arab market.
 */
export type Region =
  | 'Global'
  | 'Iberia & Latin America'
  | 'Western Europe'
  | 'Northern Europe'
  | 'Southern Europe'
  | 'Central Europe'
  | 'Southeast Europe'
  | 'Eastern Europe'
  | 'Baltics'
  | 'Middle East & North Africa'
  | 'South Asia'
  | 'Southeast Asia'
  | 'East Asia';

export interface LocaleConfig {
  /** Docusaurus locale directory name and URL prefix (`/de/docs/...`). */
  locale: string;
  /**
   * Value of `<html lang>`, in canonical BCP 47 casing (`pt-BR`, `zh-Hans`).
   *
   * This is not cosmetic. Pagefind builds ONE INDEX PER DISTINCT `lang` VALUE at index time
   * and loads only the matching index at query time (plan section 12.2). Two spellings of the
   * same language (`en` vs `en-US`) therefore silently fragment that language's search index
   * in half, with a green build and no error anywhere. It is also the hreflang value, and
   * Google discards a whole cluster's annotations on invalid or non-reciprocal codes.
   * Keep every value a valid BCP 47 tag and keep exactly one spelling per language.
   *
   * `pt-BR` and `pt-PT` are deliberately distinct: the copy differs (section 2 Tier E4
   * derives `pt-PT` from `pt-BR`), so two Portuguese indexes is the correct outcome.
   */
  htmlLang: string;
  /** `dir` on `<html>`. `rtl` for exactly `ar`, `he`, `fa`, `ur`. */
  direction: 'ltr' | 'rtl';
  /** Docusaurus `localeConfigs[].calendar`. Only set where it differs from Gregorian. */
  calendar?: string;
  tier: Tier;
  coverage: Coverage;
  status: LocaleStatus;
  region: Region;
  fontScript: FontScript;
  /**
   * CONVENIENCE MIRROR ONLY, NOT THE SOURCE OF TRUTH.
   *
   * Plan section 4 Phase 5 item 4 is explicit: `translate-<lang>/SKILL.md` section 1 is the
   * only normative statement of register, because both skills load into the same job and two
   * definitions of the same instruction is two conflicting prompts on the highest-leverage
   * line in the program. This field exists so tooling (dashboards, the switcher, coverage
   * reports) can show the intended register without parsing skill markdown. If it ever
   * disagrees with the per-language SKILL.md, the SKILL.md wins and this value is the bug.
   *
   * Left undefined wherever the plan does not state a value; do not invent one here.
   */
  register?: string;
}

/**
 * The 48-locale roster (47 translation targets + `en`), exactly as enumerated in plan
 * section 2. Order is: `en`, then tier A -> E, and within a tier the plan's own order, so a
 * diff against section 2 stays readable.
 *
 * `en` carries `tier: 'A'` because the tier union is closed at A-E and `en` is the full-
 * coverage source locale. Consumers that mean "locales to translate" must use
 * TRANSLATION_LOCALES (or filter `locale !== DEFAULT_LOCALE`), NOT `tier === 'A'`, or they
 * will schedule a translation job against English.
 */
export const LOCALES = [
  // ---------------------------------------------------------------- default (source) locale
  {
    locale: 'en',
    htmlLang: 'en',
    direction: 'ltr',
    tier: 'A',
    coverage: 'full',
    // The only live locale in this commit. Plan: "this commit adds ZERO locales".
    status: 'live',
    region: 'Global',
    fontScript: 'latin',
  },

  // ------------------------------------------------- Tier A: proof + infrastructure (6)
  // Ships the full site. Chosen so RTL and CJK are solved while the blast radius is small.
  {
    locale: 'es',
    htmlLang: 'es',
    direction: 'ltr',
    tier: 'A',
    coverage: 'full',
    status: 'draft',
    region: 'Iberia & Latin America',
    fontScript: 'latin',
    register: 'tú (LatAm-neutral vocabulary)',
  },
  {
    locale: 'pt-BR',
    htmlLang: 'pt-BR',
    direction: 'ltr',
    tier: 'A',
    coverage: 'full',
    status: 'draft',
    region: 'Iberia & Latin America',
    fontScript: 'latin',
    register: 'você',
  },
  {
    locale: 'fr',
    htmlLang: 'fr',
    direction: 'ltr',
    tier: 'A',
    coverage: 'full',
    status: 'draft',
    region: 'Western Europe',
    fontScript: 'latin',
    register: 'vous',
  },
  {
    locale: 'de',
    htmlLang: 'de',
    direction: 'ltr',
    tier: 'A',
    coverage: 'full',
    status: 'draft',
    region: 'Western Europe',
    fontScript: 'latin',
    register: 'du',
  },
  {
    // Validates CJK typography, search segmentation, and the system font stack.
    locale: 'ja',
    htmlLang: 'ja',
    direction: 'ltr',
    tier: 'A',
    coverage: 'full',
    status: 'draft',
    region: 'East Asia',
    fontScript: 'cjk',
    register: 'desu-masu',
  },
  {
    // Validates the entire RTL stack (Phase 4), which makes he/fa/ur near-free later.
    locale: 'ar',
    htmlLang: 'ar',
    direction: 'rtl',
    tier: 'A',
    coverage: 'full',
    status: 'draft',
    region: 'Middle East & North Africa',
    fontScript: 'arabic',
    register: 'MSA',
  },

  // ------------------------------------------------- Tier B: next-largest markets (8)
  // Section 18 decision 4: full site MINUS the docs/courses leaves, all 7 hubs retained.
  // Promotion trigger: a locale earns its course leaves once its category hubs clear
  // 500 impressions/month in GSC. Changing `coverage` here is how that promotion lands.
  {
    locale: 'it',
    htmlLang: 'it',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'Southern Europe',
    fontScript: 'latin',
  },
  {
    locale: 'nl',
    htmlLang: 'nl',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'Western Europe',
    fontScript: 'latin',
    register: 'je',
  },
  {
    locale: 'pl',
    htmlLang: 'pl',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'Central Europe',
    fontScript: 'latin',
  },
  {
    locale: 'tr',
    htmlLang: 'tr',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'Southeast Europe',
    fontScript: 'latin',
    register: 'sen',
  },
  {
    locale: 'ru',
    htmlLang: 'ru',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'Eastern Europe',
    fontScript: 'cyrillic',
  },
  {
    locale: 'uk',
    htmlLang: 'uk',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'Eastern Europe',
    fontScript: 'cyrillic',
  },
  {
    locale: 'ko',
    htmlLang: 'ko',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'East Asia',
    fontScript: 'cjk',
    register: 'haeyoche',
  },
  {
    locale: 'id',
    htmlLang: 'id',
    direction: 'ltr',
    tier: 'B',
    coverage: 'full-minus-course-leaves',
    status: 'draft',
    region: 'Southeast Asia',
    fontScript: 'latin',
  },

  // ------------------------------------------------- Tier C: remaining major European (10)
  // Core-40 only.
  {
    locale: 'sv',
    htmlLang: 'sv',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Northern Europe',
    fontScript: 'latin',
  },
  {
    locale: 'da',
    htmlLang: 'da',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Northern Europe',
    fontScript: 'latin',
  },
  {
    // Norwegian Bokmål. `nb` (not `no`) so the hreflang code is unambiguous.
    locale: 'nb',
    htmlLang: 'nb',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Northern Europe',
    fontScript: 'latin',
  },
  {
    locale: 'fi',
    htmlLang: 'fi',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Northern Europe',
    fontScript: 'latin',
  },
  {
    locale: 'cs',
    htmlLang: 'cs',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Central Europe',
    fontScript: 'latin',
  },
  {
    locale: 'el',
    htmlLang: 'el',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Southern Europe',
    fontScript: 'greek',
  },
  {
    locale: 'hu',
    htmlLang: 'hu',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Central Europe',
    fontScript: 'latin',
  },
  {
    locale: 'ro',
    htmlLang: 'ro',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Southeast Europe',
    fontScript: 'latin',
  },
  {
    locale: 'bg',
    htmlLang: 'bg',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Southeast Europe',
    fontScript: 'cyrillic',
  },
  {
    locale: 'sk',
    htmlLang: 'sk',
    direction: 'ltr',
    tier: 'C',
    coverage: 'core',
    status: 'draft',
    region: 'Central Europe',
    fontScript: 'latin',
  },

  // ------------------------------------------------- Tier D: European long tail (11)
  // Micro-16 only: 11 locales x 24 fewer routes than Core-40 is ~264 pages of R2 index-bloat
  // exposure removed, in exactly the tier nobody on the team can spot-check (R7).
  {
    locale: 'hr',
    htmlLang: 'hr',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Southeast Europe',
    // Croatian is Latin script; only `sr` in the Western Balkans set is Cyrillic here.
    fontScript: 'latin',
  },
  {
    locale: 'sl',
    htmlLang: 'sl',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Southeast Europe',
    fontScript: 'latin',
  },
  {
    locale: 'lt',
    htmlLang: 'lt',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Baltics',
    fontScript: 'latin',
  },
  {
    locale: 'lv',
    htmlLang: 'lv',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Baltics',
    fontScript: 'latin',
  },
  {
    locale: 'et',
    htmlLang: 'et',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Baltics',
    fontScript: 'latin',
  },
  {
    locale: 'ga',
    htmlLang: 'ga',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Western Europe',
    fontScript: 'latin',
  },
  {
    locale: 'mt',
    htmlLang: 'mt',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Southern Europe',
    // Maltese is Semitic but written in Latin script; it needs no Arabic stack.
    fontScript: 'latin',
  },
  {
    locale: 'is',
    htmlLang: 'is',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Northern Europe',
    fontScript: 'latin',
  },
  {
    locale: 'sq',
    htmlLang: 'sq',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Southeast Europe',
    fontScript: 'latin',
  },
  {
    // Serbian is digraphic; we publish the Cyrillic orthography, hence the Cyrillic stack.
    // If a Latin-script `sr-Latn` is ever added it is a separate row with `fontScript: 'latin'`
    // and its own htmlLang, never a reinterpretation of this one.
    locale: 'sr',
    htmlLang: 'sr',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Southeast Europe',
    fontScript: 'cyrillic',
  },
  {
    locale: 'mk',
    htmlLang: 'mk',
    direction: 'ltr',
    tier: 'D',
    coverage: 'micro',
    status: 'draft',
    region: 'Southeast Europe',
    fontScript: 'cyrillic',
  },

  // ------------------------------------------------- Tier E: strategic non-European (12)
  // Core-40 only. E1 (India) is gated on a `hi` pilot; see the India caveat in section 2.
  {
    locale: 'hi',
    htmlLang: 'hi',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'South Asia',
    fontScript: 'devanagari',
  },
  {
    locale: 'bn',
    htmlLang: 'bn',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'South Asia',
    fontScript: 'bengali',
  },
  {
    locale: 'ta',
    htmlLang: 'ta',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'South Asia',
    fontScript: 'tamil',
  },
  {
    locale: 'te',
    htmlLang: 'te',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'South Asia',
    fontScript: 'telugu',
  },
  {
    // Marathi shares Devanagari with Hindi and therefore shares its (system) stack.
    locale: 'mr',
    htmlLang: 'mr',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'South Asia',
    fontScript: 'devanagari',
  },
  {
    locale: 'vi',
    htmlLang: 'vi',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'Southeast Asia',
    // Latin script, but with heavy stacked diacritics: verify the Latin-ext subset covers
    // them before `vi` goes live (plan section 4 Phase 4, Latin row).
    fontScript: 'latin',
  },
  {
    locale: 'th',
    htmlLang: 'th',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'Southeast Asia',
    fontScript: 'thai',
  },
  {
    // Simplified Chinese. `zh-Hans` (script subtag, no region) so it does not collide with a
    // future `zh-Hant`, and so Pagefind builds one index for it (section 12.2).
    locale: 'zh-Hans',
    htmlLang: 'zh-Hans',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'East Asia',
    fontScript: 'cjk',
  },
  {
    locale: 'he',
    htmlLang: 'he',
    direction: 'rtl',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'Middle East & North Africa',
    fontScript: 'hebrew',
  },
  {
    // Persian: Arabic script, but a Persian (Solar Hijri) calendar. Section 2 Tier E3.
    locale: 'fa',
    htmlLang: 'fa',
    direction: 'rtl',
    calendar: 'persian',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'Middle East & North Africa',
    fontScript: 'arabic',
  },
  {
    // Urdu is Arabic script but needs a Nastaliq face, which is why it is its own bucket.
    locale: 'ur',
    htmlLang: 'ur',
    direction: 'rtl',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'South Asia',
    fontScript: 'urdu',
  },
  {
    // E4: DERIVED from pt-BR as an orthography + vocabulary pass, not a fresh translation.
    // Distinct htmlLang from pt-BR on purpose (section 12.2): the copy differs, so two
    // Portuguese search indexes is the correct outcome, not fragmentation.
    locale: 'pt-PT',
    htmlLang: 'pt-PT',
    direction: 'ltr',
    tier: 'E',
    coverage: 'core',
    status: 'draft',
    region: 'Iberia & Latin America',
    fontScript: 'latin',
  },
] as const satisfies readonly LocaleConfig[];

/** Every known locale tag, as a literal union derived from LOCALES. */
export type Locale = (typeof LOCALES)[number]['locale'];

/** The source locale. Keeps the bare root (`/docs/...`, no prefix) and is never translated. */
export const DEFAULT_LOCALE = 'en';

/**
 * The locales that actually ship, i.e. the sole input to `i18n.locales`.
 *
 * This commit adds zero locales, so it is exactly `['en']`. Docusaurus types `i18n.locales` as
 * a non-empty tuple, so the config spreads this: `locales: [...LIVE_LOCALES]`.
 */
export const LIVE_LOCALES = LOCALES.filter((l) => l.status === 'live').map(
  (l) => l.locale,
) as Locale[];

/**
 * Everything except the source locale: the set a translation job may target.
 *
 * Exists because `en` occupies `tier: 'A'` (see the LOCALES doc comment), so any consumer that
 * fans out over "tier A" without excluding the default locale would queue English for
 * translation into English.
 */
export const TRANSLATION_LOCALES = LOCALES.filter(
  (l) => l.locale !== DEFAULT_LOCALE,
);

/** Lookup by tag. Returns undefined for unknown tags; callers decide whether that is fatal. */
export function getLocale(tag: string): LocaleConfig | undefined {
  return LOCALES.find((l) => l.locale === tag);
}

/**
 * Type guard for "is this string one of our locales".
 *
 * Used by `stripLocale()` and friends to decide whether a leading path segment is a locale
 * prefix or a real route segment. It must stay a pure membership test over LOCALES, because a
 * hand-maintained second list of prefixes is exactly the drift this file exists to prevent.
 */
export function isKnownLocale(tag: string): tag is Locale {
  return LOCALES.some((l) => l.locale === tag);
}

/** All locales in one tier, in roster order. Used by the Phase 3 CI build matrix. */
export function getLocalesByTier(tier: Tier): readonly LocaleConfig[] {
  return LOCALES.filter((l) => l.tier === tier);
}
