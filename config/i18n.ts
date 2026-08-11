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
export const i18n: Config['i18n'] = {
  defaultLocale: DEFAULT_LOCALE,
  // Docusaurus types `locales` as a non-empty tuple; LIVE_LOCALES is a plain
  // readonly array, so it needs the spread plus the assertion.
  locales: [...LIVE_LOCALES] as [string, ...string[]],
};
