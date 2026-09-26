/**
 * Classifies an outbound affiliate URL for GA4 `destination_type` and
 * `destination_slug` on `affiliate_link_clicked`. The slug is the first path
 * segment, so `?via=` and other query noise never reach GA.
 */
export type DestinationType =
  | 'course'
  | 'path'
  | 'pricing'
  | 'demo'
  | 'home'
  | 'docs'
  | 'udemy'
  | 'instructor'
  | 'catalog'
  | 'other';

const DEMO_SCRIM_ID = 's0v687325e';
/** Scrimba course and path slugs end in an id that starts with `c0`. */
const SCRIMBA_ID = /-c0[a-z0-9]+$/i;

export function affiliateDestination(href: string): { type: DestinationType; slug: string } {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { type: 'other', slug: '' };
  }
  const host = url.hostname.replace(/^www\./, '');
  const slug = url.pathname.split('/').filter(Boolean)[0] ?? '';

  if (host === 'udemy.com' || host.endsWith('.udemy.com')) return { type: 'udemy', slug };
  if (host === 'docs.scrimba.com') return { type: 'docs', slug };
  if (host !== 'scrimba.com') return { type: 'other', slug };

  if (slug === DEMO_SCRIM_ID) return { type: 'demo', slug };
  if (/pricing/.test(slug) || url.search.includes('pricing')) return { type: 'pricing', slug: slug || 'pricing' };
  if (slug === '' || slug === 'home') return { type: 'home', slug: slug || 'home' };
  if (SCRIMBA_ID.test(slug)) return { type: /-path-/.test(slug) ? 'path' : 'course', slug };
  if (slug.startsWith('@') || /^u0[a-z0-9]+$/i.test(slug)) return { type: 'instructor', slug };
  if (slug === 'allcourses' || slug === 'learn' || slug === 'topics') return { type: 'catalog', slug };
  return { type: 'other', slug };
}
