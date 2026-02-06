import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ScrimbAGuide',
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
        },
        blog: {
          showReadingTime: true,
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All Guides',
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'ScrimbAGuide Blog',
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        sitemap: {
          changefreq: 'weekly' as const,
          priority: 0.8,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
        theme: {
          customCss: './src/css/custom.css',
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

  plugins: [
    '@signalwire/docusaurus-plugin-llms-txt',
  ],

  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ScrimbAGuide',
        url: 'https://scrimbaguide.tech',
        description: 'The unofficial guide to Scrimba courses, learning paths, pricing, and more.',
        publisher: {
          '@type': 'Organization',
          name: 'ScrimbAGuide',
          url: 'https://scrimbaguide.tech',
        },
      }),
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
      title: 'ScrimbAGuide',
      logo: {
        alt: 'ScrimbAGuide logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/docs/paths/', label: 'Learning Paths', position: 'left' },
        { to: '/docs/courses/', label: 'Courses', position: 'left' },
        { to: '/docs/pricing/', label: 'Pricing', position: 'left' },
        { to: '/docs/comparisons/scrimba-vs-codecademy', label: 'Comparisons', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://scrimba.com/?via=u42d4986',
          label: 'Try Scrimba Pro',
          position: 'right',
          className: 'navbar-cta',
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
      copyright: `Copyright © ${new Date().getFullYear()} ScrimbAGuide. Not affiliated with Scrimba.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
