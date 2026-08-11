import { stripLocale } from '../utils/localePath';

const SITE_ORIGIN = 'https://scrimbaguide.tech';

export function toAbsoluteUrl(urlOrPath: string): string {
  if (!urlOrPath) return SITE_ORIGIN;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  const normalizedPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
}

/**
 * The page's own path, KEEPING any locale prefix.
 *
 * Used to build canonical/`@id`/`mainEntityOfPage` URLs, so the locale must
 * survive: the canonical URL of `/de/docs/pricing/` is the German one, never
 * the English one. Canonicalising a translation to English is the single
 * fastest way to deindex an entire locale.
 */
export function toCanonicalPath(pathname: string): string {
  if (!pathname) return '/';
  const stripped = pathname.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

/**
 * The page's path with the locale prefix REMOVED, for matching against
 * hardcoded route literals like `/blog/tags`.
 *
 * Deliberately separate from `toCanonicalPath`: route predicates must compare
 * locale-free (`/de/blog/tags` is still the tags page) while URL construction
 * must not. Collapsing the two breaks one or the other.
 */
export function toRoutePath(pathname: string): string {
  return toCanonicalPath(stripLocale(pathname));
}

export function schemaScriptId(type: string, pathname: string, suffix?: string): string {
  const cleanPath = toCanonicalPath(pathname)
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-');
  const cleanSuffix = suffix ? suffix.replace(/[^a-zA-Z0-9-_]/g, '-') : '';
  const pathPart = cleanPath || 'home';
  return cleanSuffix
    ? `schema-${type}-${pathPart}-${cleanSuffix}`
    : `schema-${type}-${pathPart}`;
}

export function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
