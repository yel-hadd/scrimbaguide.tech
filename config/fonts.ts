import type { HtmlTagObject } from '@docusaurus/types';
import { DEFAULT_LOCALE, getLocale, type FontScript } from '../i18n/locales.config';

/**
 * Origin warm-up and webfont `headTags`, in emission order.
 *
 * The scrimba.com preconnect leads the list because it is the destination of
 * every affiliate CTA, so the TLS handshake is already done by the time a
 * visitor clicks. The font tags follow.
 *
 * The font tags are PER-SCRIPT and resolved from the locale being built
 * (I18N-PLAN.md section 4 Phase 4, C14). A German visitor must never download
 * Arabic glyphs, and a Japanese visitor must never download a CJK webfont at
 * all: CJK and Indic families are multi-megabyte, and shipping them would tank
 * LCP in exactly the markets this program targets (risk R8). Those scripts get
 * system stacks, declared in `src/css/custom.css` under `:lang()`, and no
 * `<link>` beyond the monospace family here.
 */

/**
 * The locale being built, guarded.
 *
 * `@docusaurus/core/lib/commands/start/start.js` assigns
 * `process.env.DOCUSAURUS_CURRENT_LOCALE = cliOptions.locale` unconditionally,
 * so a bare `docusaurus start` (i.e. `make dev`, no `--locale`) sets it to the
 * LITERAL STRING "undefined". That is a truthy string, which defeats both
 * `?? 'en'` and `|| 'en'` and would silently build every dev session against a
 * locale that is not in the roster. Hence the explicit comparison.
 *
 * NOTE: the plan wants exactly one such helper site-wide (Phase 1, C7). The
 * Phase 2 coverage work grew its own equivalent, `resolveCurrentLocale()` in
 * `config/locale-coverage.mjs`. The two agreeing by coincidence is exactly the
 * drift the plan warns about, so they must be deduped into one module once
 * both units have landed; this copy exists only because the units were built
 * in parallel and neither owns the other's file.
 */
const rawCurrentLocale = process.env.DOCUSAURUS_CURRENT_LOCALE;
export const CURRENT_LOCALE =
  !rawCurrentLocale || rawCurrentLocale === 'undefined'
    ? DEFAULT_LOCALE
    : rawCurrentLocale;

/** Google Fonts `css2` family clauses, spelled once so no two callers disagree. */
const FAMILY = {
  plusJakartaSans: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800',
  sora: 'family=Sora:wght@600;700;800',
  jetBrainsMono: 'family=JetBrains+Mono:wght@500;600;700',
  notoSans: 'family=Noto+Sans:wght@400;500;600;700;800',
  notoSansArabic: 'family=Noto+Sans+Arabic:wght@400;500;600;700',
  notoSansHebrew: 'family=Noto+Sans+Hebrew:wght@400;500;600;700',
  notoNastaliqUrdu: 'family=Noto+Nastaliq+Urdu:wght@400;700',
} as const;

/**
 * Which families a script downloads.
 *
 * Every non-Latin entry keeps JetBrains Mono and nothing else from the Latin
 * stack: code blocks, version numbers and CLI snippets stay Latin in every
 * locale (they are also force-isolated LTR in `custom.css`), while Plus Jakarta
 * Sans and Sora would be dead weight for a script neither of them covers.
 *
 * Google's `css2` endpoint splits each family into per-`unicode-range`
 * `@font-face` rules, so requesting `Noto Sans` for `ru` fetches the Cyrillic
 * subset file and not the Greek or Vietnamese ones. There is no `subset=`
 * parameter to pass; the range split does that work.
 *
 * `devanagari`, `bengali`, `tamil`, `telugu`, `thai` and `cjk` deliberately
 * request NO text webfont. See the header note on R8.
 */
const SCRIPT_FAMILIES: Record<FontScript, readonly string[]> = {
  latin: [FAMILY.plusJakartaSans, FAMILY.sora, FAMILY.jetBrainsMono],
  cyrillic: [FAMILY.notoSans, FAMILY.jetBrainsMono],
  greek: [FAMILY.notoSans, FAMILY.jetBrainsMono],
  arabic: [FAMILY.notoSansArabic, FAMILY.jetBrainsMono],
  hebrew: [FAMILY.notoSansHebrew, FAMILY.jetBrainsMono],
  urdu: [FAMILY.notoNastaliqUrdu, FAMILY.jetBrainsMono],
  devanagari: [FAMILY.jetBrainsMono],
  bengali: [FAMILY.jetBrainsMono],
  tamil: [FAMILY.jetBrainsMono],
  telugu: [FAMILY.jetBrainsMono],
  thai: [FAMILY.jetBrainsMono],
  cjk: [FAMILY.jetBrainsMono],
};

function stylesheetHref(script: FontScript): string {
  return `https://fonts.googleapis.com/css2?${SCRIPT_FAMILIES[script].join('&')}&display=swap`;
}

/**
 * The English (and every other Latin locale's) stylesheet URL, byte for byte
 * as it shipped before this file learned about scripts.
 *
 * Asserted rather than trusted: this file is the only place a stray edit could
 * change what an already-indexed English page downloads, and a font swap on the
 * highest-traffic locale is both a CLS and a brand regression that no test in
 * the repo would otherwise catch.
 */
const EXPECTED_LATIN_HREF =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap';

if (stylesheetHref('latin') !== EXPECTED_LATIN_HREF) {
  throw new Error(
    'config/fonts.ts: the Latin webfont URL changed. English output must stay ' +
    `byte-identical.\n  expected: ${EXPECTED_LATIN_HREF}\n  actual:   ${stylesheetHref('latin')}`,
  );
}

/**
 * Script for the locale being built. An unknown tag (nothing produces one
 * today, since `i18n.locales` is derived from the same roster) falls back to
 * Latin rather than throwing: a wrong-but-legible font beats a failed build.
 */
const currentScript: FontScript = getLocale(CURRENT_LOCALE)?.fontScript ?? 'latin';

export const fontHeadTags: HtmlTagObject[] = [
  {
    tagName: 'link',
    attributes: { rel: 'preconnect', href: 'https://scrimba.com' },
  },
  // Fonts: preconnect + non-blocking stylesheet beats the render-blocking
  // @import that used to live at the top of custom.css.
  {
    tagName: 'link',
    attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  },
  {
    tagName: 'link',
    attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
  },
  {
    tagName: 'link',
    attributes: {
      rel: 'stylesheet',
      href: stylesheetHref(currentScript),
    },
  },
];
