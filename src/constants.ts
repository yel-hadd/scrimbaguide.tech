/**
 * Central affiliate / Scrimba URL constants.
 *
 * Pure constants only — no React, no `@docusaurus/*` runtime imports — so this
 * module can be imported by `docusaurus.config.ts` (navbar hrefs cannot route
 * through the `<AffiliateLink>` component) as well as by React components.
 */

/** Scrimba affiliate id. Appears in the `via=` query param on outbound links. */
export const AFFILIATE_ID = 'u42d4986';

/** Query fragment appended to scrimba.com links for affiliate attribution. */
export const AFFILIATE_PARAM = `via=${AFFILIATE_ID}`;

/**
 * Public, no-signup interactive demo scrim ("Try Scrimba for free"). Mirrors
 * Scrimba's own hero CTA and opens a real lesson (with 20% off Pro applied).
 * Bare URL — components that render through `<AffiliateLink>` append `via=`
 * themselves; use `DEMO_SCRIM_URL_AFFILIATE` where the param must be inlined.
 */
export const DEMO_SCRIM_URL = 'https://scrimba.com/s0v687325e';

/** Demo scrim URL with the affiliate param inlined (for non-`<AffiliateLink>` hrefs, e.g. the navbar). */
export const DEMO_SCRIM_URL_AFFILIATE = `${DEMO_SCRIM_URL}?${AFFILIATE_PARAM}`;

/** Scrimba Pro pricing page with the affiliate param inlined. */
export const PRO_AFFILIATE_URL = `https://scrimba.com/home?pricing&${AFFILIATE_PARAM}`;
