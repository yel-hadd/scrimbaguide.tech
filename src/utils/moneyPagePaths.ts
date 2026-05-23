/**
 * Routes where the desktop sticky discount affiliate CTA should appear.
 *
 * Scope is intentionally narrow: pricing pages, the dedicated review post,
 * and the worth-it / pro-pricing analyses. Everything else (FAQs, course
 * pages, blog posts in general, learning paths) is research-mode, not
 * buy-mode, and aggressive stickies on those pages compete with content
 * instead of converting.
 *
 * The mobile sticky was removed entirely; mobile users get the inline
 * CTAs in the page body and nothing else.
 */
export function isMoneyPagePath(path: string): boolean {
  return (
    path.includes('/pricing/') ||
    path === '/blog/scrimba-review' ||
    path === '/blog/scrimba-review/' ||
    path === '/blog/is-scrimba-worth-it' ||
    path === '/blog/is-scrimba-worth-it/' ||
    path === '/blog/scrimba-pro-pricing-explained-2026' ||
    path === '/blog/scrimba-pro-pricing-explained-2026/'
  );
}
