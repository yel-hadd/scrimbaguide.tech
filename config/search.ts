import type { Config } from '@docusaurus/types';

/**
 * Client-side search. `@easyops-cn/docusaurus-search-local` builds a static
 * index at build time (no Algolia account, no network call at query time).
 *
 * `require.resolve` rather than the bare package name: the theme is resolved
 * relative to this file, which keeps it working under hoisted installs.
 */
export const searchThemes: Config['themes'] = [
  [
    require.resolve('@easyops-cn/docusaurus-search-local'),
    {
      hashed: true,
      language: ['en'],
      indexDocs: true,
      indexBlog: true,
      indexPages: true,
      docsRouteBasePath: '/docs',
      blogRouteBasePath: '/blog',
      searchResultLimits: 8,
      highlightSearchTermsOnTargetPage: true,
    },
  ],
];
