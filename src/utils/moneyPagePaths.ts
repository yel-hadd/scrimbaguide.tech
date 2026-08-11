import { stripLocale } from './localePath';

/**
 * Routes where the desktop sticky discount affiliate CTA should appear.
 *
 * Scope is intentionally narrow: pricing pages, the dedicated review post,
 * the worth-it / pro-pricing analyses, and learning path docs. FAQs,
 * course catalog pages, and most blog posts stay research-mode, not
 * buy-mode, and aggressive stickies on those pages compete with content
 * instead of converting.
 *
 * Path docs are included because readers landing there have already passed
 * the "is this for me" filter and are evaluating a multi-month commitment,
 * which is the highest-intent state on the site outside of /docs/pricing/.
 *
 * The mobile sticky was removed entirely; mobile users get the inline
 * CTAs in the page body and nothing else.
 */
export function isMoneyPagePath(path: string): boolean {
  // Locale-stripped before matching. Every literal below is an English route,
  // so without this the sticky affiliate CTA silently disappears from
  // /de/docs/paths/..., /es/docs/pricing/... and every other localized money
  // page: the highest-intent pages on the site, in every market the
  // translation program exists to win. That is direct revenue loss, and it
  // fails silently because a missing CTA looks like a design choice.
  const route = stripLocale(path);
  return (
    route.includes('/pricing/') ||
    route.startsWith('/docs/paths/') ||
    route === '/blog/scrimba-review' ||
    route === '/blog/scrimba-review/' ||
    route === '/blog/is-scrimba-worth-it' ||
    route === '/blog/is-scrimba-worth-it/' ||
    route === '/blog/scrimba-pro-pricing-explained-2026' ||
    route === '/blog/scrimba-pro-pricing-explained-2026/'
  );
}
