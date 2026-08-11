import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {PageMetadata, useThemeConfig} from '@docusaurus/theme-common';
import {
  DEFAULT_SEARCH_TAG,
  useAlternatePageUtils,
  keyboardFocusedClassName,
} from '@docusaurus/theme-common/internal';
import {useLocation} from '@docusaurus/router';
import {applyTrailingSlash} from '@docusaurus/utils-common';
import SearchMetadata from '@theme/SearchMetadata';
import {indexManifest, selectAlternates, toManifestRoute} from '@site/src/utils/hreflang';
import coverageManifest from '@site/i18n/coverage.json';

/**
 * EJECTED from @docusaurus/theme-classic (I18N-PLAN.md section 4 Phase 2).
 *
 * Ejected rather than wrapped, deliberately. The upstream `AlternateLangHeaders`
 * maps unconditionally over every entry in `localeConfigs`, so wrapping would
 * leave all of those `rel=alternate` tags in place and merely add duplicates
 * beside them. There is no way to REMOVE a tag from a wrapper.
 *
 * The one behavioural change is that hreflang is emitted from
 * `i18n/coverage.json` instead of from the raw locale list. Under tiered
 * coverage those differ enormously: a page translated into 6 locales but
 * configured alongside 47 would otherwise advertise 41 alternate URLs that
 * either 404 or serve an English fallback, and Google discards the whole
 * cluster's annotations when that happens (risk R4).
 *
 * Everything else below - CanonicalUrlHeaders, SearchMetadata, the
 * themeConfig.metadata block, the keyboard-focus body class - is upstream code
 * kept verbatim so future Docusaurus upgrades stay easy to diff against.
 */

/**
 * Indexed once at module scope: this runs on every page of every locale build,
 * and the manifest is static for the life of the process.
 */
const MANIFEST_INDEX = indexManifest(coverageManifest);

// Useful for i18n/SEO
// See https://developers.google.com/search/docs/advanced/crawling/localized-versions
// See https://github.com/facebook/docusaurus/issues/3317
function AlternateLangHeaders(): ReactNode {
  const {
    i18n: {currentLocale, defaultLocale, localeConfigs},
  } = useDocusaurusContext();
  const alternatePageUtils = useAlternatePageUtils();
  const {pathname} = useLocation();

  const currentHtmlLang = localeConfigs[currentLocale]!.htmlLang;
  const route = toManifestRoute(pathname);

  const {alternates: alternateLocales} = selectAlternates({
    route,
    currentLocale,
    defaultLocale,
    configuredLocales: Object.keys(localeConfigs),
    index: MANIFEST_INDEX,
  });
  const alternates = alternateLocales.map(
    (locale) => [locale, localeConfigs[locale]!] as const,
  );

  // HTML lang is a BCP 47 tag, but the Open Graph protocol requires
  // using underscores instead of dashes.
  // See https://ogp.me/#optional
  // See https://en.wikipedia.org/wiki/IETF_language_tag)
  const bcp47ToOpenGraphLocale = (code: string): string =>
    code.replace('-', '_');

  // Note: it is fine to use both "x-default" and "en" to target the same url
  // See https://www.searchviu.com/en/multiple-hreflang-tags-one-url/
  return (
    <Head>
      {alternates.map(([locale, {htmlLang}]) => (
        <link
          key={locale}
          rel="alternate"
          href={alternatePageUtils.createUrl({
            locale,
            fullyQualified: true,
          })}
          hrefLang={htmlLang}
        />
      ))}
      {/* Exactly one x-default, always the default locale. */}
      <link
        rel="alternate"
        href={alternatePageUtils.createUrl({
          locale: defaultLocale,
          fullyQualified: true,
        })}
        hrefLang="x-default"
      />

      <meta
        property="og:locale"
        content={bcp47ToOpenGraphLocale(currentHtmlLang)}
      />
      {alternates
        .filter(([, config]) => currentHtmlLang !== config.htmlLang)
        .map(([, config]) => (
          <meta
            key={`meta-og-${config.htmlLang}`}
            property="og:locale:alternate"
            content={bcp47ToOpenGraphLocale(config.htmlLang)}
          />
        ))}
    </Head>
  );
}

// Default canonical url inferred from current page location pathname
function useDefaultCanonicalUrl() {
  const {
    siteConfig: {url: siteUrl, baseUrl, trailingSlash},
  } = useDocusaurusContext();

  // TODO using useLocation().pathname is not a super idea
  // See https://github.com/facebook/docusaurus/issues/9170
  const {pathname} = useLocation();

  const canonicalPathname = applyTrailingSlash(useBaseUrl(pathname), {
    trailingSlash,
    baseUrl,
  });

  return siteUrl + canonicalPathname;
}

// TODO move to SiteMetadataDefaults or theme-common ?
function CanonicalUrlHeaders({permalink}: {permalink?: string}) {
  const {
    siteConfig: {url: siteUrl},
  } = useDocusaurusContext();
  const defaultCanonicalUrl = useDefaultCanonicalUrl();

  const canonicalUrl = permalink
    ? `${siteUrl}${permalink}`
    : defaultCanonicalUrl;
  return (
    <Head>
      <meta property="og:url" content={canonicalUrl} />
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}

export default function SiteMetadata(): ReactNode {
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();

  // TODO maybe move these 2 themeConfig to siteConfig?
  // These seems useful for other themes as well
  const {metadata, image: defaultImage} = useThemeConfig();

  return (
    <>
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        {/* The keyboard focus class name need to be applied when SSR so links
        are outlined when JS is disabled */}
        <body className={keyboardFocusedClassName} />
      </Head>

      {defaultImage && <PageMetadata image={defaultImage} />}

      <CanonicalUrlHeaders />

      <AlternateLangHeaders />

      <SearchMetadata tag={DEFAULT_SEARCH_TAG} locale={currentLocale} />

      {/*
        It's important to have an additional <Head> element here, as it allows
        react-helmet to override default metadata values set in previous <Head>
        like "twitter:card". In same Head, the same meta would appear twice
        instead of overriding.
      */}
      <Head>
        {/* Yes, "metadatum" is the grammatically correct term */}
        {metadata.map((metadatum, i) => (
          <meta key={i} {...metadatum} />
        ))}
      </Head>
    </>
  );
}
