import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

/** Set to `false` to show the newsletter / path-guide lead magnet (`EmailCapture`). */
const hideNewsletterLeadMagnetDefault = true;

/**
 * Legacy blog URLs that only exist as client-redirect stubs — omit from sitemap (canonical = `to` targets).
 */
const SITEMAP_EXCLUDED_PATHS = new Set<string>([
  '/blog/scrimba-vs-odin-project',
  '/blog/scrimba-vs-bootcamps-cost-comparison',
  '/blog/scrimba-for-cs-students',
]);

/**
 * Malformed scrapes or duplicate alias URLs — canonical pages stay indexed under hyphenated slugs.
 */
const SITEMAP_EXCLUDED_DOC_ALIASES = new Set<string>([
  '/docs/courses/ai/claudeai',
  '/docs/courses/ai/deployaiwithcloudflare',
  '/docs/courses/ai/langchainjs',
  '/docs/courses/ai/openaiassistants',
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
    pathname === '/blog' ||
    pathname.startsWith('/docs/udemy')
  ) {
    return 0.8;
  }
  if (
    pathname === '/docs/faq/is-scrimba-free' ||
    pathname === '/docs/faq/how-to-use-scrimba'
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

  customFields: {
    /** Formspree/Mailchimp/etc. POST URL — set `NEWSLETTER_FORM_ACTION` in CI or `.env` for builds */
    newsletterFormAction: process.env.NEWSLETTER_FORM_ACTION ?? '',
    /**
     * When true, EmailCapture (path guide / newsletter) is not rendered.
     * Default: hidden (`hideNewsletterLeadMagnetDefault`). Set `HIDE_NEWSLETTER_LEAD_MAGNET=false` at build time to show it.
     */
    hideNewsletterLeadMagnet:
      process.env.HIDE_NEWSLETTER_LEAD_MAGNET === 'false'
        ? false
        : hideNewsletterLeadMagnetDefault,
  },

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
            to: '/docs/paths/scrimba-for-cs-students',
          },
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
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://scrimbaguide.tech/#website',
        name: 'Scrimba Guide',
        url: 'https://scrimbaguide.tech',
        description: 'The unofficial guide to Scrimba courses, learning paths, pricing, and more.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://scrimbaguide.tech/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
        publisher: {
          '@id': 'https://scrimbaguide.tech/#organization',
          '@type': 'Organization',
          name: 'Scrimba Guide',
          url: 'https://scrimbaguide.tech',
          logo: {
            '@type': 'ImageObject',
            url: 'https://scrimbaguide.tech/img/logo.svg',
          },
        },
      }),
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://scrimbaguide.tech/#organization',
        name: 'Scrimba Guide',
        url: 'https://scrimbaguide.tech',
        description: 'The unofficial guide to Scrimba — courses, learning paths, pricing, and comparisons. Written by developers who have completed 40+ Scrimba courses.',
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
      }),
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://scrimba.com' },
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
        { to: '/docs/paths/', label: 'Learning Paths', position: 'left' },
        { to: '/docs/courses/', label: 'Courses', position: 'left' },
        { to: '/docs/pricing/', label: 'Scrimba Pricing', position: 'left' },
        { to: '/docs/comparisons/', label: 'Comparisons', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        { to: '/docs/paths#path-advisor', label: 'Path advisor', position: 'left' },
        {
          href: 'https://scrimba.com/?via=u42d4986',
          label: 'Get 20% Off Pro',
          position: 'right',
          className: 'navbar-cta',
          'aria-label': 'Get 20% off Scrimba Pro (opens in a new tab)',
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
