/**
 * GA4 `search` event (the built-in Search term dimension reads `search_term`).
 * Fires once per settled query, from the search modal or the /search/ page.
 * `search_outcome` separates the searches that found nothing, which are the
 * content gaps.
 */
let lastTracked = '';

export function trackSearch(term: string, resultCount: number, ui: 'modal' | 'page'): void {
  const searchTerm = term.trim().toLowerCase().slice(0, 100);
  if (searchTerm.length < 3 || searchTerm === lastTracked) return;
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  lastTracked = searchTerm;
  window.gtag('event', 'search', {
    search_term: searchTerm,
    search_outcome: resultCount > 0 ? 'results' : 'no-results',
    search_ui: ui,
  });
}

/** How long a query must sit unchanged before it counts as a search. */
export const SEARCH_SETTLE_MS = 1500;
