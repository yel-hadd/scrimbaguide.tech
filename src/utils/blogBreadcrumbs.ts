/**
 * Breadcrumb trail for a blog POST page: Home > Blog > post title.
 *
 * Docs pages already get stock Docusaurus breadcrumbs and a BreadcrumbList,
 * so this trail is for blog posts only; list, pagination, tag, author and
 * archive pages never render it (see BlogPostBreadcrumbs). Labels are copy
 * slot S24: "Home" and "Blog" match the navbar, the title is verbatim.
 *
 * Kept free of imports so the Node tests can load it directly.
 */

export const SITE_ORIGIN = 'https://scrimbaguide.tech';

export interface BreadcrumbCrumb {
  label: string;
  /** Site-relative path ending in "/". */
  path: string;
}

function withTrailingSlash(path: string): string {
  const leading = path.startsWith('/') ? path : `/${path}`;
  return leading.endsWith('/') ? leading : `${leading}/`;
}

export function blogBreadcrumbTrail(title: string, permalink: string): BreadcrumbCrumb[] {
  return [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog/' },
    { label: title, path: withTrailingSlash(permalink) },
  ];
}

/** BreadcrumbList JSON-LD for the trail. Every item is an absolute URL ending in "/". */
export function blogBreadcrumbSchema(trail: BreadcrumbCrumb[]): Record<string, unknown> {
  const postUrl = `${SITE_ORIGIN}${trail[trail.length - 1].path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${postUrl}#breadcrumb`,
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `${SITE_ORIGIN}${crumb.path}`,
    })),
  };
}
