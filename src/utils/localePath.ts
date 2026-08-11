import {
  DEFAULT_LOCALE,
  isKnownLocale,
  type Locale,
} from '@site/i18n/locales.config';

/**
 * Locale-prefix arithmetic on site pathnames. The single source of truth for
 * "is this leading path segment a locale, and what is the path without it".
 *
 * Every path predicate on the site (money pages, related-guides lookup, FAQ
 * schema, the GA4 blog slug in AffiliateLink) compares a raw
 * `window.location.pathname` against a hardcoded `/docs/...` or `/blog/...`
 * prefix. Under i18n those comparisons all silently return the wrong answer
 * for `/de/docs/paths/`: the sticky CTA disappears on the highest-intent
 * pages, related guides go blank, and GA4 reports `de/blog/x` as a blog slug.
 * Rather than teach ten call sites the same string surgery (which is how the
 * ten copies drift apart), they all route through here.
 *
 * Three properties are load-bearing:
 *
 * 1. The locale set comes from `i18n/locales.config.ts` and nowhere else. A
 *    `/^\/[a-z]{2}\//` regex would look right and be wrong: it eats the real
 *    routes `/docs/...` has under it and would happily strip a future
 *    top-level two-letter slug. Membership is checked against the roster.
 * 2. Matching is EXACT, never case-insensitive. `pt-BR` and `zh-Hans` are the
 *    Docusaurus locale directory names and the URL prefixes it actually
 *    generates; a case-folded match that hands back `pt-br` produces a URL
 *    that 404s and an hreflang value that is not reciprocal with the one in
 *    the emitted HTML.
 * 3. Pure and SSR-safe. No `window`, no `process.env`, no imports beyond the
 *    roster, so these run identically in the static render and in the browser.
 *    Every function is total: ordinary input never throws, and unrecognised
 *    input is returned unchanged rather than guessed at.
 *
 * CONTRACT: these take a PATHNAME (`window.location.pathname`, a Docusaurus
 * `permalink`, a route string), not a full URL. An input that does not start
 * with `/` is returned untouched, which is what makes passing an absolute URL
 * a visible no-op instead of a corrupted string. A `?query` or `#hash` suffix
 * is tolerated rather than mangled: it is split off, the pathname part is
 * transformed, and the suffix is re-appended verbatim. That is defence in
 * depth for a stray call site, not a licence to pass search params around.
 *
 * NOTE ON NAMING: `i18n/locales.config.ts` also exports a `getLocale`, but it
 * is a roster lookup keyed by TAG (`getLocale('de') -> LocaleConfig`). This
 * module's `getLocale` is keyed by PATHNAME. They are deliberately not
 * imported into the same scope; if a call site needs both, alias one.
 */

/** Where a pathname stops and an accidental `?query` / `#hash` begins. */
const PATHNAME_SUFFIX_PATTERN = /[?#]/;

/**
 * Split `/de/docs/x/?a=1#top` into `['/de/docs/x/', '?a=1#top']`.
 *
 * Only the first `?` or `#` matters: everything from there on is opaque to us
 * and must survive byte-for-byte, including a `#` that appears inside a query
 * value.
 */
function splitPathnameSuffix(value: string): [string, string] {
  const index = value.search(PATHNAME_SUFFIX_PATTERN);
  return index === -1
    ? [value, '']
    : [value.slice(0, index), value.slice(index)];
}

/**
 * The locale prefix of a pathname, or `null` when there is none.
 *
 * `en` is excluded on purpose even though it IS in the roster: it is the
 * default locale, Docusaurus serves it at the bare root, and no `/en/` prefix
 * is ever emitted. Treating a literal `/en/foo/` as a prefixed path would
 * therefore strip a segment off a real (if hypothetical) route.
 */
function leadingLocaleSegment(pathname: string): Locale | null {
  if (!pathname.startsWith('/')) return null;
  const end = pathname.indexOf('/', 1);
  const segment = end === -1 ? pathname.slice(1) : pathname.slice(1, end);
  if (segment === DEFAULT_LOCALE || !isKnownLocale(segment)) return null;
  return segment;
}

/**
 * Drop the locale prefix so a pathname can be compared against the English
 * route table: `/de/docs/paths/` -> `/docs/paths/`.
 *
 * Paths that carry no locale prefix come back identical, which is what lets
 * every call site wrap unconditionally without branching on the current
 * locale. Trailing-slash convention is preserved (`trailingSlash: true` is a
 * site invariant, and a predicate comparing `/docs/pricing` to
 * `/docs/pricing/` is the bug class this whole unit exists to kill). The one
 * unavoidable exception is a bare `/de`, whose remainder is the empty string:
 * it normalises to `/`, because `''` is not a pathname.
 */
export function stripLocale(pathname: string): string {
  if (typeof pathname !== 'string' || pathname === '') return pathname;

  const [path, suffix] = splitPathnameSuffix(pathname);
  const locale = leadingLocaleSegment(path);
  if (!locale) return pathname;

  const rest = path.slice(locale.length + 1);
  return `${rest === '' ? '/' : rest}${suffix}`;
}

/**
 * Which locale a pathname belongs to. Unprefixed paths are the default
 * locale, so this returns `'en'` for `/docs/paths/` and for anything it does
 * not recognise, and never `undefined`: callers get a usable locale tag in
 * every branch.
 *
 * Casing is whatever the roster says (`pt-BR`, `zh-Hans`), so the result can
 * be fed straight back into `localize()` or into a Docusaurus route lookup.
 */
export function getLocale(pathname: string): Locale {
  if (typeof pathname !== 'string' || pathname === '') return DEFAULT_LOCALE;
  return leadingLocaleSegment(splitPathnameSuffix(pathname)[0]) ?? DEFAULT_LOCALE;
}

/**
 * Move a pathname into `locale`: `('/docs/paths/', 'de')` -> `/de/docs/paths/`.
 *
 * It STRIPS FIRST, so it is idempotent and re-targetable: passing an already
 * prefixed path swaps the prefix rather than nesting it (`/de/docs/` + `fr` ->
 * `/fr/docs/`, never `/fr/de/docs/`). That is exactly what the Phase 8
 * language switcher needs, and it means a call site that forgets to strip
 * still produces a valid URL instead of a 404.
 *
 * The default locale has no prefix, so `localize(p, 'en')` returns the
 * unprefixed path — identity for the ordinary case where `p` was already
 * unprefixed. An unknown locale tag is treated the same way rather than
 * throwing or emitting a `/xx/` prefix that no build produces: a wrong link
 * to a page that exists beats a link to one that cannot.
 */
export function localize(path: string, locale: string): string {
  // Same non-string guard as stripLocale/getLocale. Without it this is the one
  // function of the three that throws on a momentarily-undefined pathname,
  // which would take down the locale switcher during SSR rather than
  // degrading to an unprefixed link.
  if (typeof path !== 'string' || path === '') return path;
  const base = stripLocale(path);
  if (!base.startsWith('/')) return base;
  if (locale === DEFAULT_LOCALE || !isKnownLocale(locale)) return base;
  return `/${locale}${base}`;
}
