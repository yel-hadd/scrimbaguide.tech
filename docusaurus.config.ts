import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ScrimbaGuide',
  tagline: 'The unofficial guide to learning on Scrimba',
  favicon: 'img/favicon.ico',
  url: 'https://scrimbaguide.tech',
  baseUrl: '/',

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
          blogSidebarTitle: 'All Guides',
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'ScrimbaGuide Blog',
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
        name: 'ScrimbaGuide',
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
          name: 'ScrimbaGuide',
          url: 'https://scrimbaguide.tech',
          logo: {
            '@type': 'ImageObject',
            url: 'https://scrimbaguide.tech/img/logo.png',
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
        name: 'ScrimbaGuide',
        url: 'https://scrimbaguide.tech',
        description: 'The unofficial guide to Scrimba — courses, learning paths, pricing, and comparisons. Written by developers who have completed 40+ Scrimba courses.',
        logo: {
          '@type': 'ImageObject',
          url: 'https://scrimbaguide.tech/img/logo.png',
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
    ],
    navbar: {
      title: 'ScrimbaGuide',
      logo: {
        alt: 'ScrimbaGuide logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/docs/paths/', label: 'Learning Paths', position: 'left' },
        { to: '/docs/courses/', label: 'Courses', position: 'left' },
        { to: '/docs/pricing/', label: 'Pricing', position: 'left' },
        { to: '/docs/comparisons/', label: 'Comparisons', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://scrimba.com/?via=u42d4986',
          label: 'Try Scrimba Pro',
          position: 'right',
          className: 'navbar-cta',
          'aria-label': 'Try Scrimba Pro (opens in a new tab)',
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
            { label: 'Pricing Guide', to: '/docs/pricing' },
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
      copyright: `Copyright © ${new Date().getFullYear()} ScrimbaGuide. Not affiliated with Scrimba.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
