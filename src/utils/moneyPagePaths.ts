/**
 * Routes where the desktop sticky discount affiliate CTA should appear.
 *
 * Scope is intentionally narrow: pricing pages, comparison leaves, the
 * dedicated review post, and learning path docs. FAQs, course catalog pages,
 * and most blog posts stay research-mode, not buy-mode, and aggressive
 * stickies on those pages compete with content instead of converting.
 *
 * The worth-it analysis (`/blog/is-scrimba-worth-it`) was merged into the
 * review post (2026-09-26 blog health consolidation) and no longer has its
 * own entry; `/blog/scrimba-review` below covers both.
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
    // Comparison leaves (not the hub): a reader on "Scrimba vs X" is choosing
    // between two subscriptions, which is buy-mode. Added 2026-09-20 after GA
    // showed zero comparison pages in the top affiliate-click list despite
    // the section being the highest-intent cluster on the site.
    /^\/docs\/comparisons\/scrimba-vs-[^/]+\/?$/.test(path) ||
    path === '/blog/scrimba-review' ||
    path === '/blog/scrimba-review/'
  );
}
