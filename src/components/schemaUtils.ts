const SITE_ORIGIN = 'https://scrimbaguide.tech';

export function toAbsoluteUrl(urlOrPath: string): string {
  if (!urlOrPath) return SITE_ORIGIN;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  const normalizedPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
}

export function toCanonicalPath(pathname: string): string {
  if (!pathname) return '/';
  const stripped = pathname.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
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

/**
 * True for the blog's list-style routes, where Docusaurus renders each post's
 * excerpt. A schema component mounted above a post's truncate marker
 * renders once per excerpt on these pages, so every such component must bail
 * out here or the list page ships one copy of the schema per post shown.
 */
export function isBlogListPath(pathname: string): boolean {
  const path = toCanonicalPath(pathname);
  return (
    path === '/blog' ||
    path.startsWith('/blog/page') ||
    path.startsWith('/blog/tags') ||
    path.startsWith('/blog/authors') ||
    path.startsWith('/blog/archive')
  );
}
