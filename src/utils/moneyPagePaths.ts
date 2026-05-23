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
  return (
    path.includes('/pricing/') ||
    path.startsWith('/docs/paths/') ||
    path === '/blog/scrimba-review' ||
    path === '/blog/scrimba-review/' ||
    path === '/blog/is-scrimba-worth-it' ||
    path === '/blog/is-scrimba-worth-it/' ||
    path === '/blog/scrimba-pro-pricing-explained-2026' ||
    path === '/blog/scrimba-pro-pricing-explained-2026/'
  );
}
