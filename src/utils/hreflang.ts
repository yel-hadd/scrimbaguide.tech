import { stripLocale } from './localePath';

/**
 * Which locales may appear in a page's hreflang cluster.
 *
 * Extracted from the ejected `SiteMetadata` so the rule is unit-testable against
 * fixture manifests. It has to be provable BEFORE a second locale exists,
 * because the failure it prevents (advertising alternates that 404 or serve an
 * English fallback) only becomes visible in production, and by then Google has
 * already discarded the whole cluster's annotations.
 *
 * See I18N-PLAN.md section 4 Phase 2 and invariant 3.
 */

export interface CoverageLocale {
  status?: string;
  entries?: { route: string }[];
}

export interface CoverageManifest {
  locales?: Record<string, CoverageLocale>;
}

/** Route key used for manifest lookups: locale-free, trailing slash, no query or hash. */
export function toManifestRoute(pathname: string): string {
  if (typeof pathname !== 'string' || pathname === '') return '/';
  const clean = stripLocale(pathname).split('#')[0].split('?')[0];
  return clean === '/' ? '/' : `/${clean.replace(/^\/+|\/+$/g, '')}/`;
}

/** Precompute locale -> covered routes. Cheap to build once, wasteful per render. */
export function indexManifest(manifest: CoverageManifest): {
  covered: Record<string, Set<string>>;
  pruned: Set<string>;
} {
  const locales = manifest?.locales ?? {};
  return {
    covered: Object.fromEntries(
      Object.entries(locales).map(([locale, data]) => [
        locale,
        new Set((data?.entries ?? []).map((e) => e.route)),
      ]),
    ),
    pruned: new Set(
      Object.entries(locales)
        .filter(([, data]) => data?.status === 'pruned')
        .map(([locale]) => locale),
    ),
  };
}

export interface AlternateSelection {
  /** Locale tags that get a `rel=alternate`, in the order given by `configuredLocales`. */
  alternates: string[];
  /** The single `x-default` target. Always the default locale (invariant 3). */
  xDefault: string;
}

/**
 * Decide the cluster for one route.
 *
 * Three rules, each guarding a different failure:
 *
 * 1. The DEFAULT locale always qualifies. It is the source; every route exists there.
 * 2. The CURRENT locale always self-references. A cluster without a self-reference is
 *    rejected by Google outright, so this must not depend on the manifest being
 *    up to date with the page currently rendering.
 * 3. Everything else must be present in the manifest and not pruned. Unknown
 *    locale, unknown route, or pruned all mean NO. This fails CLOSED on purpose:
 *    failing open advertises an alternate that serves English under a
 *    non-English hreflang, which is exactly invariant 4.
 */
export function selectAlternates(args: {
  route: string;
  currentLocale: string;
  defaultLocale: string;
  configuredLocales: string[];
  index: ReturnType<typeof indexManifest>;
}): AlternateSelection {
  const { route, currentLocale, defaultLocale, configuredLocales, index } = args;
  const serves = (locale: string): boolean => {
    if (locale === defaultLocale || locale === currentLocale) return true;
    if (index.pruned.has(locale)) return false;
    return index.covered[locale]?.has(route) ?? false;
  };
  return {
    alternates: configuredLocales.filter(serves),
    xDefault: defaultLocale,
  };
}
