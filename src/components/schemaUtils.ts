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
