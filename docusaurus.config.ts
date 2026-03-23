import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

/** Set to `false` to show the newsletter / path-guide lead magnet (`EmailCapture`). */
const hideNewsletterLeadMagnetDefault = true;

const config: Config = {
  title: 'Scrimba Guide',
  tagline: 'The unofficial guide to learning on Scrimba',
  favicon: 'img/favicon.ico',
  url: 'https://scrimbaguide.tech',
  baseUrl: '/',

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
          ignorePatterns: ['/tags/**', '/search', '/blog/page/**', '/blog/authors', '/blog/archive', '/blog/tags/**'],
          filename: 'sitemap.xml',
          async createSitemapItems(params) {
            const items = await params.defaultCreateSitemapItems(params);
            return items.map((item) => {
              const pathname = new URL(item.url).pathname.replace(/\/$/, '') || '/';
              let priority = 0.7;
              if (pathname === '/') priority = 1.0;
              else if (
                pathname.startsWith('/docs/pricing') ||
                pathname.startsWith('/docs/comparisons') ||
                pathname.startsWith('/docs/paths')
              ) {
                priority = 0.9;
              } else if (pathname === '/docs/intro' || pathname === '/about' || pathname === '/blog') {
                priority = 0.8;
              } else if (pathname.startsWith('/blog/')) {
                priority = 0.7;
              } else if (pathname.startsWith('/docs/courses/')) {
                priority = 0.6;
              }
              return { ...item, priority };
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
    '@signalwire/docusaurus-plugin-llms-txt',
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
        { to: '/tools/which-scrimba-path', label: 'Path quiz', position: 'left' },
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
