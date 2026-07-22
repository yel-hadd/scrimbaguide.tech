import { themes as prismThemes } from 'prism-react-renderer';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { DEMO_SCRIM_URL_AFFILIATE } from './src/constants';

/**
 * 301 redirects for retired course pages (de-listed from Scrimba's catalogue).
 * Maintained in data/course-redirects.json so the old URLs redirect to the
 * category hub instead of 404ing.
 */
const courseRedirects: { from: string; to: string }[] = (() => {
  try {
    const p = path.join(process.cwd(), 'data', 'course-redirects.json');
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : [];
  } catch {
    return [];
  }
})();

/**
 * Legacy blog URLs that only exist as client-redirect stubs. Omit from sitemap (canonical = `to` targets).
 */
const SITEMAP_EXCLUDED_PATHS = new Set<string>([
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
const SITEMAP_EXCLUDED_DOC_ALIASES = new Set<string>([
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

function normalizeSitemapPathname(url: string): string {
  return new URL(url).pathname.replace(/\/$/, '') || '/';
}

function normalizeCanonicalUrl(url: string): string {
  const parsed = new URL(url);
  const pathname = parsed.pathname === '/'
    ? '/'
    : `${parsed.pathname.replace(/\/+$/, '')}/`;
  return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
}

function shouldIncludeInSitemap(pathname: string): boolean {
  if (SITEMAP_EXCLUDED_PATHS.has(pathname)) return false;
  if (SITEMAP_EXCLUDED_DOC_ALIASES.has(pathname)) return false;
  /** Client-redirect stubs only (canonical = `/blog/<slug>`). Never index duplicate paths. */
  if (pathname.startsWith('/blog/blog/')) return false;
  /** Same pattern as `/blog/blog/` for docs if slug ever double-prefixes `docs/`. */
  if (pathname.startsWith('/docs/docs/')) return false;
  return true;
}

function sitemapPriority(pathname: string): number {
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

const config: Config = {
  title: 'Scrimba Guide',
  tagline: 'The unofficial guide to learning on Scrimba',
  favicon: 'img/favicon.ico',
  url: 'https://scrimbaguide.tech',
  baseUrl: '/',
  trailingSlash: true,

  future: {
    v4: true,
  },

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All Blog Posts',
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Scrimba Guide Blog',
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        sitemap: {
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
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-03WS2KR7EX',
        },
      } satisfies Preset.Options,
    ],
    [
      'docusaurus-plugin-cookie-consent',
      {
        cookieName: 'scrimbaguide-consent',
        consentMode: true,
        links: [
          {
            title: 'Privacy Policy',
            url: 'https://scrimbaguide.tech/legal/privacy-policy',
            openInNewTab: true,
          },
        ],
      },
    ],
  ],

  clientModules: [
    './src/clientModules/a11yFixes.ts',
  ],

  plugins: [
    './plugins/normalize-canonical-urls',
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/blog/scrimba-vs-odin-project',
            to: '/docs/comparisons/scrimba-vs-odin-project',
          },
          {
            from: '/blog/scrimba-vs-bootcamps-cost-comparison',
            to: '/docs/pricing/scrimba-vs-bootcamps',
          },
          {
            from: '/blog/scrimba-for-cs-students',
            to: '/docs/for/cs-students/',
          },
          {
            from: '/blog/blog/javascript-roadmap-for-beginners-2026',
            to: '/docs/courses/javascript/',
          },
          {
            from: '/blog/blog/react-vs-nextjs-for-beginners-2026',
            to: '/docs/learn-nextjs/',
          },
          {
            from: '/blog/blog/frontend-portfolio-checklist-2026',
            to: '/blog/portfolio-projects-get-hired-2026',
          },
          {
            from: '/blog/blog/bootdev-vs-odin-vs-scrimba-2026',
            to: '/docs/comparisons/scrimba-vs-boot-dev/',
          },
          {
            from: '/blog/blog/best-coding-platforms-for-beginners-2026',
            to: '/docs/comparisons/',
          },
          {
            from: '/blog/blog/scrimba-pro-pricing-explained-2026',
            to: '/docs/pricing/',
          },
                  {
            from: '/blog/javascript-vs-python-beginners-2026',
            to: '/docs/courses/javascript/',
          },
          {
            from: '/blog/frontend-portfolio-checklist-2026',
            to: '/blog/portfolio-projects-get-hired-2026',
          },
          {
            from: '/blog/react-vs-nextjs-for-beginners-2026',
            to: '/docs/learn-nextjs/',
          },
          {
            from: '/blog/bootdev-vs-odin-vs-scrimba-2026',
            to: '/docs/comparisons/scrimba-vs-boot-dev/',
          },
          {
            from: '/blog/best-coding-platforms-for-beginners-2026',
            to: '/docs/comparisons/',
          },
          {
            from: '/blog/scrimba-pro-pricing-explained-2026',
            to: '/docs/pricing/',
          },
          {
            from: '/blog/how-to-learn-react-2026',
            to: '/docs/courses/react/',
          },
          {
            from: '/blog/how-to-become-frontend-developer-2026',
            to: '/docs/paths/frontend-developer-path/',
          },
          {
            from: '/blog/javascript-roadmap-for-beginners-2026',
            to: '/docs/courses/javascript/',
          },
          {
            from: '/blog/how-to-learn-javascript-2026',
            to: '/docs/courses/javascript/',
          },
          // Blog cluster consolidation (2026-05-28): cannibalizing posts merged
          // into pillars (tutorial hell, vibe coding, get hired).
          {
            from: '/blog/escape-tutorial-hell-scrimba',
            to: '/blog/how-to-escape-tutorial-hell-2026/',
          },
          {
            from: '/blog/vibe-coding-guide',
            to: '/blog/what-is-vibe-coding-2026/',
          },
          {
            from: '/blog/vibe-coding-javascript-survival-guide-2026',
            to: '/blog/what-is-vibe-coding-2026/',
          },
          {
            from: '/blog/how-to-get-hired-with-scrimba',
            to: '/blog/how-to-get-first-developer-job-2026/',
          },
          {
            from: '/blog/learn-to-code-full-time-job',
            to: '/blog/how-to-get-first-developer-job-2026/',
          },
          // Udemy guides moved from /docs/udemy/* to /blog/* (2026-05-24).
          {
            from: '/docs/udemy',
            to: '/blog/best-udemy-coding-courses/',
          },
          {
            from: '/docs/udemy/best-udemy-javascript-courses',
            to: '/blog/best-udemy-javascript-courses/',
          },
          {
            from: '/docs/udemy/best-udemy-react-courses',
            to: '/blog/best-udemy-react-courses/',
          },
          {
            from: '/docs/udemy/best-udemy-python-courses',
            to: '/blog/best-udemy-python-courses/',
          },
          {
            from: '/docs/udemy/best-udemy-web-development-courses',
            to: '/blog/best-udemy-web-development-courses/',
          },
          {
            from: '/docs/udemy/best-udemy-ai-courses',
            to: '/blog/best-udemy-ai-courses/',
          },
          // IA restructure (2026-05-27): FAQ split into How Scrimba Works + Help,
          // audience pages consolidated under /for/, discord merged into community.
          { from: '/docs/faq/how-scrims-work', to: '/docs/how-it-works/how-scrims-work/' },
          { from: '/docs/faq/how-to-use-scrimba', to: '/docs/how-it-works/using-scrimba/' },
          { from: '/docs/faq/is-scrimba-free', to: '/docs/how-it-works/is-scrimba-free/' },
          { from: '/docs/faq/scrimba-accreditation', to: '/docs/how-it-works/accreditation/' },
          { from: '/docs/faq/certificates', to: '/docs/how-it-works/certificates/' },
          { from: '/docs/faq/learning-speed', to: '/docs/how-it-works/learning-speed/' },
          { from: '/docs/faq/tutorial-hell', to: '/docs/how-it-works/tutorial-hell/' },
          { from: '/docs/faq/billing', to: '/docs/help/billing/' },
          { from: '/docs/faq/platform-issues', to: '/docs/help/troubleshooting/' },
          { from: '/docs/faq/community-and-events', to: '/docs/help/community-and-events/' },
          { from: '/docs/faq/discord-community', to: '/docs/help/community-and-events/' },
          { from: '/docs/faq/scrimba-for-busy-professionals', to: '/docs/for/busy-professionals/' },
          { from: '/docs/paths/scrimba-for-beginners', to: '/docs/for/beginners/' },
          { from: '/docs/paths/scrimba-for-cs-students', to: '/docs/for/cs-students/' },
          { from: '/docs/paths/scrimba-for-designers', to: '/docs/for/designers/' },
          { from: '/docs/paths/scrimba-for-marketers', to: '/docs/for/marketers/' },
          // Cannibalization cleanup (2026-05-29): thin React/Next.js concept
          // stubs consolidated into their roadmap index (one canonical owner
          // for "learn react free" / "learn next.js" intent).
          { from: '/docs/learn-react/quick-start', to: '/docs/learn-react/' },
          { from: '/docs/learn-react/describing-ui', to: '/docs/learn-react/' },
          { from: '/docs/learn-react/adding-interactivity', to: '/docs/learn-react/' },
          { from: '/docs/learn-react/managing-state', to: '/docs/learn-react/' },
          { from: '/docs/learn-react/escape-hatches', to: '/docs/learn-react/' },
          { from: '/docs/learn-react/server-components', to: '/docs/learn-react/' },
          { from: '/docs/learn-nextjs/getting-started', to: '/docs/learn-nextjs/' },
          { from: '/docs/learn-nextjs/routing', to: '/docs/learn-nextjs/' },
          { from: '/docs/learn-nextjs/rendering', to: '/docs/learn-nextjs/' },
          { from: '/docs/learn-nextjs/data-fetching', to: '/docs/learn-nextjs/' },
          ...courseRedirects,
        ],
      },
    ],
  ],

  themes: [
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
  ],

  headTags: [
    {
      // Sitewide schema graph: WebSite and Organization unified into one @graph,
      // cross-referenced by @id. Per-page entities (Course, Review, FAQPage,
      // BreadcrumbList) are emitted by their components and reference these nodes.
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://scrimbaguide.tech/#website',
            name: 'Scrimba Guide',
            url: 'https://scrimbaguide.tech',
            description: 'The unofficial guide to Scrimba courses, learning paths, pricing, and more.',
            potentialAction: {
              '@type': 'SearchAction',
              // Trailing slash is required: with trailingSlash:true, /search?q=…
              // 301s to /search/ and drops the query, landing on an empty page.
              target: 'https://scrimbaguide.tech/search/?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
            publisher: { '@id': 'https://scrimbaguide.tech/#organization' },
          },
          {
            '@type': 'Organization',
            '@id': 'https://scrimbaguide.tech/#organization',
            name: 'Scrimba Guide',
            url: 'https://scrimbaguide.tech',
            description: 'An independent guide to Scrimba: courses, learning paths, pricing, and honest comparisons with other coding platforms.',
            founder: {
              '@type': 'Person',
              name: 'Yassine El Haddad',
              url: 'https://scrimbaguide.tech/about',
            },
            sameAs: [
              'https://x.com/scrimbaguide',
              'https://www.linkedin.com/in/yassine-el-haddad/',
              'https://github.com/yel-hadd',
            ],
            logo: {
              '@type': 'ImageObject',
              url: 'https://scrimbaguide.tech/img/logo.svg',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              url: 'https://scrimbaguide.tech/about',
              availableLanguage: 'en',
            },
          },
        ],
      }),
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://scrimba.com' },
    },
    // Fonts: preconnect + non-blocking stylesheet beats the render-blocking
    // @import that used to live at the top of custom.css.
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap',
      },
    },
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    metadata: [
      { name: 'keywords', content: 'scrimba, scrimba review, scrimba courses, learn to code, scrimba pro, scrimba pricing, scrimba guide' },
      { name: 'description', content: 'The unofficial guide to Scrimba courses, learning paths, pricing, and more. Find the best Scrimba course for your goals.' },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:site', content: '@scrimbaguide' },
    ],
    navbar: {
      title: 'Scrimba Guide',
      logo: {
        alt: 'Scrimba Guide logo',
        src: 'img/logo.svg',
      },
      items: [
        // Paths and Courses are the two primary content pillars (and the main
        // conversion funnel), so they sit top-level rather than buried in a
        // dropdown. Secondary info pages stay grouped under "Learn".
        { to: '/docs/paths/', label: 'Paths', position: 'left' },
        { to: '/docs/courses/', label: 'Courses', position: 'left' },
        {
          type: 'dropdown',
          label: 'Learn',
          position: 'left',
          items: [
            { to: '/docs/intro', label: 'What is Scrimba?', icon: 'BookOpen', description: "How Scrimba's interactive scrims work and why they're different" },
            { to: '/docs/comparisons/', label: 'Comparisons', icon: 'Scale', description: 'How Scrimba stacks up against Codecademy, Udemy, and others' },
            { to: '/docs/pricing/', label: 'Pricing', icon: 'Tag', description: 'Compare Pro vs Free plans and find the best value' },
            { to: '/docs/faq/', label: 'FAQ', icon: 'CircleHelp', description: 'Answers to the most common questions about Scrimba' },
          ] as any,
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          type: 'dropdown',
          label: 'Tools',
          position: 'left',
          items: [
            { to: '/tools/', label: 'All Tools', icon: 'LayoutGrid', description: 'Browse every interactive tool and calculator' },
            { to: '/docs/paths/#path-advisor', label: 'Path Finder', icon: 'Compass', description: "Not sure where to start? Get a personalized recommendation" },
            { to: '/tools/bootcamp-cost-calculator', label: 'Cost Calculator', icon: 'Calculator', description: 'Compare bootcamp costs vs Scrimba Pro' },
            { to: '/roadmaps/frontend-roadmap-2026', label: 'Frontend Roadmap', icon: 'Map', description: 'Step-by-step frontend development learning path' },
          ] as any,
        },
        {
          // Same interactive demo scrim as the homepage hero CTA. Uses the shared
          // constant because navbar hrefs do not route through <AffiliateLink>.
          href: DEMO_SCRIM_URL_AFFILIATE,
          label: 'Try Scrimba for free',
          position: 'right',
          className: 'navbar-cta',
          rel: 'nofollow noopener noreferrer',
          'aria-label': 'Try Scrimba for free, opens a real interactive lesson in a new tab',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'All Courses', to: '/docs/courses' },
            { label: 'Learning Paths', to: '/docs/paths' },
            { label: 'Scrimba Pricing', to: '/docs/pricing' },
            { label: 'FAQ', to: '/docs/faq/' },
            { label: 'Changelog', to: '/docs/changelog' },
          ],
        },
        {
          title: 'Company',
          items: [
            { label: 'About Us', to: '/about' },
            { label: 'Contact', to: '/contact' },
            { label: 'Blog', to: '/blog' },
          ],
        },
        {
          title: 'Legal',
          items: [
            { label: 'Affiliate Disclosure', to: '/legal/affiliate-disclosure' },
            { label: 'Privacy Policy', to: '/legal/privacy-policy' },
            { label: 'Terms of Service', to: '/legal/terms-of-service' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Scrimba Guide. Not affiliated with Scrimba.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
