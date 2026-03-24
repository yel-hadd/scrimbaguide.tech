const MAX_SEO_TITLE_LENGTH = 60;
const SITE_SUFFIX_PATTERN = /\s\|\sScrimba Guide$/;

function trimOnWordBoundary(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const sliced = value.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace < Math.floor(maxLength * 0.55)) {
    return `${sliced.trimEnd()}...`;
  }
  return `${sliced.slice(0, lastSpace).trimEnd()}...`;
}

export function toSeoTitle(rawTitle: string): string {
  const title = rawTitle.trim();
  if (title.length <= MAX_SEO_TITLE_LENGTH) return title;

  const withoutSuffix = title.replace(SITE_SUFFIX_PATTERN, '').trim();
  if (withoutSuffix.length <= MAX_SEO_TITLE_LENGTH) return withoutSuffix;

  return trimOnWordBoundary(withoutSuffix, MAX_SEO_TITLE_LENGTH - 3);
}
