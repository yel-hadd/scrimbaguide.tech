import type { HtmlTagObject } from '@docusaurus/types';
import { DEFAULT_LOCALE } from '../i18n/locales.config';

/**
 * The locale this build is producing, for the `SearchAction` target below.
 *
 * `DOCUSAURUS_CURRENT_LOCALE` is set by the CLI, but under a bare
 * `docusaurus start` it is assigned the JS value `undefined`, which `process.env`
 * coerces to the LITERAL STRING "undefined". That string is truthy, so both
 * `process.env.DOCUSAURUS_CURRENT_LOCALE ?? 'en'` and `|| 'en'` sail straight
 * past it and produce `/undefined/search/`. Hence the explicit comparison.
 */
const rawCurrentLocale = process.env.DOCUSAURUS_CURRENT_LOCALE;
const currentLocale = rawCurrentLocale && rawCurrentLocale !== 'undefined'
  ? rawCurrentLocale
  : DEFAULT_LOCALE;

/** The default locale is served at the bare root; every other one is prefixed. */
const localePrefix = currentLocale === DEFAULT_LOCALE ? '' : `/${currentLocale}`;

/**
 * Sitewide social card. Per-page `image` frontmatter overrides it; this is the
 * fallback for every page that does not ship its own card.
 */
export const image = 'img/social-card.png';

/**
 * Sitewide `<meta>` tags (`themeConfig.metadata`). Page-level tags emitted by
 * Docusaurus win over these, so keep this list to genuinely sitewide values.
 */
export const metadata: { [key: string]: string }[] = [
  { name: 'keywords', content: 'scrimba, scrimba review, scrimba courses, learn to code, scrimba pro, scrimba pricing, scrimba guide' },
  { name: 'description', content: 'The unofficial guide to Scrimba courses, learning paths, pricing, and more. Find the best Scrimba course for your goals.' },
  { name: 'twitter:site', content: '@scrimbaguide' },
];

/**
 * Sitewide JSON-LD. Lives in a `headTags` entry rather than a component so it
 * is present on every route, including ones with no MDX of their own.
 */
export const siteSchemaHeadTag: HtmlTagObject = {
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
          //
          // Locale-aware per plan 12.4: `/de/search/?q=` is the German search
          // page. A hardcoded root target would send every localized searcher to
          // the English index, which under Pagefind's per-language indexes means
          // searching a corpus in a language they are not reading.
          target: `https://scrimbaguide.tech${localePrefix}/search/?q={search_term_string}`,
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
};
