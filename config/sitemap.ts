import type * as Preset from '@docusaurus/preset-classic';

/**
 * Legacy blog URLs that only exist as client-redirect stubs. Omit from sitemap (canonical = `to` targets).
 */
export const SITEMAP_EXCLUDED_PATHS = new Set<string>([
  '/blog/scrimba-vs-odin-project',
  '/blog/scrimba-vs-bootcamps-cost-comparison',
  '/blog/scrimba-for-cs-students',
  // Udemy guides moved to /blog/*; these are now redirect stubs (canonical = /blog/* targets).
  '/docs/udemy',
  '/docs/udemy/best-udemy-javascript-courses',
  '/docs/udemy/best-udemy-react-courses',
  '/docs/udemy/best-udemy-python-courses',
  '/docs/udemy/best-udemy-web-development-courses',
  '/docs/udemy/best-udemy-ai-courses',
  // Blog cluster consolidation (2026-05-28): merged into pillars, now redirect stubs.
  '/blog/escape-tutorial-hell-scrimba',
  '/blog/vibe-coding-guide',
  '/blog/vibe-coding-javascript-survival-guide-2026',
  '/blog/how-to-get-hired-with-scrimba',
  '/blog/learn-to-code-full-time-job',
  // Cannibalization cleanup (2026-05-29): React/Next.js concept stubs merged
  // into their roadmap index; these are now redirect stubs (canonical = index).
  '/docs/learn-react/quick-start',
  '/docs/learn-react/describing-ui',
  '/docs/learn-react/adding-interactivity',
  '/docs/learn-react/managing-state',
  '/docs/learn-react/escape-hatches',
  '/docs/learn-react/server-components',
  '/docs/learn-nextjs/getting-started',
  '/docs/learn-nextjs/routing',
  '/docs/learn-nextjs/rendering',
  '/docs/learn-nextjs/data-fetching',
]);

/**
 * Malformed scrapes or duplicate alias URLs. Canonical pages stay indexed under hyphenated slugs.
 */
export const SITEMAP_EXCLUDED_DOC_ALIASES = new Set<string>([
  '/docs/courses/ai/claudeai',
  '/docs/courses/ai/deployaiwithcloudflare',
  '/docs/courses/ai/langchainjs',
  '/docs/courses/javascript/javascriptdeepd',
  '/docs/courses/javascript/alpinejs',
  '/docs/courses/javascript/learnsvelte',
  '/docs/courses/javascript/deploy-ai-apps-with-cloudflare',
  '/docs/courses/css/htmlandcss',
  '/docs/courses/css/bulma-css',
  '/docs/courses/react/styledcomponents',
]);

export function normalizeSitemapPathname(url: string): string {
  return new URL(url).pathname.replace(/\/$/, '') || '/';
}

export function normalizeCanonicalUrl(url: string): string {
  const parsed = new URL(url);
  const pathname = parsed.pathname === '/'
    ? '/'
    : `${parsed.pathname.replace(/\/+$/, '')}/`;
  return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
}

export function shouldIncludeInSitemap(pathname: string): boolean {
  if (SITEMAP_EXCLUDED_PATHS.has(pathname)) return false;
  if (SITEMAP_EXCLUDED_DOC_ALIASES.has(pathname)) return false;
  /** Client-redirect stubs only (canonical = `/blog/<slug>`). Never index duplicate paths. */
  if (pathname.startsWith('/blog/blog/')) return false;
  /** Same pattern as `/blog/blog/` for docs if slug ever double-prefixes `docs/`. */
  if (pathname.startsWith('/docs/docs/')) return false;
  return true;
}

export function sitemapPriority(pathname: string): number {
  if (pathname === '/') return 1.0;

  if (pathname === '/tools/which-scrimba-path') return 0.35;
  if (
    pathname.startsWith('/docs/pricing') ||
    pathname.startsWith('/docs/comparisons') ||
    pathname.startsWith('/docs/paths')
  ) {
    return 0.9;
  }

  if (
    pathname === '/docs/intro' ||
    pathname === '/about' ||
    pathname === '/blog'
  ) {
    return 0.8;
  }
  if (
    pathname === '/docs/how-it-works/is-scrimba-free' ||
    pathname === '/docs/how-it-works/using-scrimba'
  ) {
    return 0.8;
  }

  if (
    pathname.startsWith('/legal/') ||
    pathname === '/contact' ||
    pathname === '/docs/changelog'
  ) {
    return 0.35;
  }

  if (pathname.startsWith('/blog/')) return 0.7;

  if (
    pathname.startsWith('/docs/learn-react') ||
    pathname.startsWith('/docs/learn-nextjs')
  ) {
    return 0.7;
  }

  if (pathname.startsWith('/docs/practice/')) return 0.7;

  if (pathname.startsWith('/docs/faq')) return 0.7;

  if (pathname === '/docs/courses') return 0.7;
  if (/^\/docs\/courses\/[^/]+$/.test(pathname)) return 0.7;

  if (/^\/docs\/courses\/[^/]+\/.+/.test(pathname)) return 0.6;

  if (pathname.startsWith('/tools/') || pathname.startsWith('/roadmaps/')) return 0.55;

  if (pathname.startsWith('/docs/')) return 0.7;

  return 0.7;
}

/** `presets['classic'].sitemap` options. Assembled in `docusaurus.config.ts`. */
export const sitemapOptions: Exclude<Preset.Options['sitemap'], false | undefined> = {
  lastmod: 'date',
  changefreq: 'weekly' as const,
  priority: 0.8,
  ignorePatterns: [
    '/tags/**',
    '/search',
    '/search/**',
    '/blog/page/**',
    '/blog/authors',
    '/blog/authors/**',
    '/blog/archive',
    '/blog/archive/**',
    '/blog/tags/**',
    '/blog/blog/**',
    '/docs/docs/**',
  ],
  filename: 'sitemap.xml',
  async createSitemapItems(params) {
    const items = await params.defaultCreateSitemapItems(params);
    return items
      .filter((item) => shouldIncludeInSitemap(normalizeSitemapPathname(item.url)))
      .map((item) => {
        const pathname = normalizeSitemapPathname(item.url);
        return {
          ...item,
          url: normalizeCanonicalUrl(item.url),
          priority: sitemapPriority(pathname),
        };
      });
  },
};
