import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { fontHeadTags } from './config/fonts';
import { i18n } from './config/i18n';
import { image, metadata, siteSchemaHeadTag } from './config/metadata';
import { footer, navbar } from './config/navigation';
import { clientRedirectsPlugin } from './config/redirects';
import { searchThemes } from './config/search';
import { sitemapOptions } from './config/sitemap';

/**
 * This file is assembly only. Every block that a work unit is likely to edit
 * lives in its own module under `config/`, so concurrent changes (locales,
 * metadata, fonts, sitemap, search, redirects, navigation) never contend for
 * the same file. Keep new cross-cutting blocks out of here for the same reason.
 */
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

  /**
   * Docusaurus defaults this to 'warn'. Under a multi-locale matrix a warning is
   * one line inside a huge log, so anchor drift would ship silently: heading ids
   * are derived from heading TEXT, and a translated heading yields a different
   * id, breaking every in-page `#...` link in that locale.
   *
   * Every h2-h6 in `docs/` and `blog/` now carries an explicit `{#id}` frozen at
   * its previously-generated value, which makes ids independent of the prose.
   * i18n invariant 6: never remove an explicit `{#id}`. Translating one is the
   * same bug as deleting it.
   */
  onBrokenAnchors: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n,

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
        sitemap: sitemapOptions,
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
    clientRedirectsPlugin,
  ],

  themes: searchThemes,

  headTags: [
    siteSchemaHeadTag,
    ...fontHeadTags,
  ],

  themeConfig: {
    image,
    colorMode: {
      respectPrefersColorScheme: true,
    },
    metadata,
    navbar,
    footer,
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
