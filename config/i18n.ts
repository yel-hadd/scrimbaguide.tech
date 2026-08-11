import type { Config } from '@docusaurus/types';
import { DEFAULT_LOCALE, LIVE_LOCALES } from '../i18n/locales.config';

/**
 * Locale roster for the site.
 *
 * Extracted from `docusaurus.config.ts` so the i18n rollout owns exactly one
 * file here: adding locales (and later `localeConfigs`, which carries the
 * per-locale `baseUrl`) never collides with unrelated config edits.
 *
 * The locale list is DERIVED from `i18n/locales.config.ts`, never retyped.
 * That file is the single roster the whole program reads (the CI build matrix,
 * the coverage manifest, the indexer round-robin, the locale switcher), so a
 * second hand-maintained copy here is exactly the drift failure the roster
 * exists to prevent: flipping a locale to `status: 'live'` would update every
 * other consumer while silently never producing a build for it.
 *
 * Still English-only, because `en` is the only roster entry with
 * `status: 'live'`. Promoting a locale is a one-word edit THERE, and it must
 * not happen until that locale's coverage manifest is complete.
 */
/**
 * Per-locale `baseUrl` (I18N-PLAN.md B5). Read the next paragraph before editing.
 *
 * `docusaurus build --locale de` ALONE silently drops the `/de/` prefix:
 * `isAutomaticBaseUrlLocalizationDisabled()` returns true when exactly one
 * `--locale` is passed, so baseUrl becomes `/` and outDir becomes `build/`. A
 * naive CI matrix would therefore publish every locale on top of English.
 * Setting baseUrl explicitly here wins, because
 * core/lib/server/i18n.js checks `typeof localeConfigInput.baseUrl !==
 * 'undefined'` BEFORE consulting the automatic-localization flag.
 *
 * The default locale keeps the bare root. `localeConfigs.en.baseUrl = '/en/'`
 * would relocate every currently-indexed English URL to /en/... and write
 * build/en/, because server/site.js derives outDir from baseUrl. That is the
 * single most destructive edit available in this file, so it is asserted below
 * rather than left to reviewer attention.
 */
const localeConfigs = Object.fromEntries(
  LIVE_LOCALES.map((locale) => [
    locale,
    { baseUrl: locale === DEFAULT_LOCALE ? '/' : `/${locale}/` },
  ]),
);

if (localeConfigs[DEFAULT_LOCALE]?.baseUrl !== '/') {
  throw new Error(
    `i18n.localeConfigs.${DEFAULT_LOCALE}.baseUrl must be '/' but is ` +
    `'${localeConfigs[DEFAULT_LOCALE]?.baseUrl}'. Any other value relocates every ` +
    `indexed English URL under /${DEFAULT_LOCALE}/ and moves the build output.`,
  );
}

export const i18n: Config['i18n'] = {
  defaultLocale: DEFAULT_LOCALE,
  // Docusaurus types `locales` as a non-empty tuple; LIVE_LOCALES is a plain
  // readonly array, so it needs the spread plus the assertion.
  locales: [...LIVE_LOCALES] as [string, ...string[]],
  localeConfigs,
};
