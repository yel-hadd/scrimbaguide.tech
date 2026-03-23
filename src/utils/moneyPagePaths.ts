/**
 * Doc/blog routes where affiliate CTAs (mobile footer, desktop floater) should appear.
 */
export function isMoneyPagePath(path: string): boolean {
  const isBlogPost =
    /^\/blog\/[^/]+\/?$/.test(path) && !path.startsWith('/blog/page');
  return (
    path.includes('/comparisons/') ||
    path.includes('/pricing/') ||
    path === '/docs/paths' ||
    path.startsWith('/docs/paths/') ||
    isBlogPost ||
    path.includes('review') ||
    path.includes('worth-it')
  );
}
