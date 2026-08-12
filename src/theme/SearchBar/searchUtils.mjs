/**
 * Pure helpers shared by the search modal (`@theme/SearchBar`) and the search
 * page (`@theme/SearchPage`), plus the unit tests.
 *
 * WHY `.mjs` AND NOT `.ts`: `scripts/__tests__/search-modal.test.mjs` runs under
 * plain `node --test` with no loader, and `engines.node` is `>=20`, which cannot
 * strip types. The previous test therefore re-implemented the component's logic
 * inline and asserted against its own copy, which proves nothing. Keeping the
 * logic in one dependency-free ESM module lets the test exercise the code the
 * browser actually runs. `allowJs` is on in `@docusaurus/tsconfig`, so the TSX
 * side gets inferred types from the JSDoc below.
 *
 * Everything here is pure and SSR-safe: no `window`, no imports. Pagefind's
 * runtime lives in `./pagefind.ts`; this file only shapes what it returns.
 *
 * @typedef {'Courses' | 'Blog' | 'Docs'} Category
 *
 * @typedef {Object} PagefindFragment  What `(await result.data())` returns.
 * @property {string} url
 * @property {string} [excerpt]
 * @property {{title?: string}} [meta]
 *
 * @typedef {Object} SearchHit  One normalized, renderable result.
 * @property {string} url       Site-absolute, baseUrl included, ready for `history.push`.
 * @property {string} title
 * @property {string} excerpt   Pagefind excerpt markup (plain text plus `<mark>`).
 * @property {Category} category
 * @property {string} path      Human-readable breadcrumb line, possibly empty.
 */

/** Filter chips, in display order. `All` is the pseudo-category. */
export const CATEGORIES = ['All', 'Courses', 'Blog', 'Docs'];

/** Per-group cap in the modal while the `All` chip is active. */
export const PER_GROUP_LIMIT = 4;

/** Per-group cap in the modal once a single category is selected. */
export const SPECIFIC_GROUP_LIMIT = 8;

/**
 * How many results the modal loads fragment data for per query.
 *
 * Pagefind returns the full ranked result list immediately but defers each
 * result's content to a per-result `data()` fetch (~3 KB gzipped). Grouping and
 * the chip counts both need that data, so this is the real network cost of a
 * keystroke. Twenty comfortably fills the modal (four groups x eight rows) while
 * keeping a debounced query to ~60 KB.
 */
export const MODAL_FETCH_LIMIT = 20;

/**
 * Same trade-off on `/search`, where the user has committed to the query and
 * expects a fuller list. Anything beyond this is reported as a truncation
 * notice rather than silently dropped.
 */
export const PAGE_FETCH_LIMIT = 60;

/**
 * Segments that read wrong when naively capitalized. Deliberately short: this
 * is a display nicety on a breadcrumb line, not a content system.
 */
const ACRONYMS = new Set(['ai', 'api', 'css', 'faq', 'html', 'js', 'seo', 'sql', 'ui', 'ux']);

/**
 * Strip the site baseUrl off a Pagefind URL.
 *
 * Pagefind indexes the MERGED tree, so its `url` values are site-root-absolute
 * and already carry the locale prefix (`/de/docs/paths/`). `siteConfig.baseUrl`
 * is `/de/` in that build, so subtracting it yields the locale-independent path
 * every predicate below wants. Doing it this way rather than through
 * `stripLocale()` keeps this module dependency-free and correct even for a
 * locale that is not yet in the roster.
 */
export function toRoutePath(url, baseUrl = '/') {
  if (typeof url !== 'string' || url === '') return '/';
  // Pagefind hands back paths, but tolerate an absolute URL rather than mangle it.
  const withoutOrigin = url.replace(/^https?:\/\/[^/]+/i, '');
  const pathname = withoutOrigin.split(/[?#]/)[0].replace(/index\.html$/, '');
  if (!baseUrl || baseUrl === '/') return pathname || '/';
  if (pathname === baseUrl.replace(/\/$/, '')) return '/';
  if (!pathname.startsWith(baseUrl)) return pathname || '/';
  return `/${pathname.slice(baseUrl.length)}`;
}

/**
 * Which filter chip a result belongs under.
 *
 * The lunr index carried sidebar breadcrumbs (`b[0] === 'Courses'`); Pagefind
 * carries none, so the route decides. The mapping is identical in effect
 * because every course page lives under `/docs/courses/` and every post under
 * `/blog/`, and it has the advantage of also classifying the `src/pages` routes
 * (tools, roadmaps, legal), which the sidebar-based version dropped into Docs
 * by accident rather than by rule.
 */
export function categorize(routePath) {
  if (routePath.startsWith('/blog')) return 'Blog';
  if (routePath.startsWith('/docs/courses')) return 'Courses';
  return 'Docs';
}

/** `learn-react` -> `Learn React`, `css-grid` -> `CSS Grid`. */
export function titleize(segment) {
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word.toLowerCase())
      ? word.toUpperCase()
      : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

/**
 * The dimmed second line under a result title.
 *
 * It answers "where does this live", so it drops the page's own slug (the title
 * right above it already says that) and the routing root (`docs`, which is on
 * every result and carries no information). A page whose only segment IS the
 * slug keeps it, because `/docs/pricing/` should read `Pricing`, not blank.
 * Blog posts get an empty string: their date-stripped slug is the title again.
 */
export function formatBreadcrumb(routePath) {
  const segments = routePath.split('/').filter(Boolean);
  if (segments.length === 0) return '';

  const root = segments[0];
  if (root === 'blog') return segments.slice(1, -1).map(titleize).join(' / ');

  const rest = root === 'docs' ? segments.slice(1) : segments.slice();
  if (rest.length > 1) rest.pop();
  return rest.map(titleize).join(' / ');
}

/**
 * Fall back to the last route segment when a page has no `<h1>` for Pagefind to
 * read. Rare, but a blank result row is worse than a slug.
 */
export function titleFor(fragment, routePath) {
  const metaTitle = fragment && fragment.meta && fragment.meta.title;
  if (typeof metaTitle === 'string' && metaTitle.trim() !== '') return metaTitle.trim();
  const segments = routePath.split('/').filter(Boolean);
  return segments.length > 0 ? titleize(segments[segments.length - 1]) : 'Untitled';
}

/** Pagefind fragment -> the shape both UIs render. */
export function toHit(fragment, baseUrl = '/') {
  const routePath = toRoutePath(fragment.url, baseUrl);
  return {
    url: fragment.url,
    title: titleFor(fragment, routePath),
    excerpt: typeof fragment.excerpt === 'string' ? fragment.excerpt : '',
    category: categorize(routePath),
    path: formatBreadcrumb(routePath),
  };
}

/**
 * Group hits into the modal's ordered `[{label, results}]` shape, preserving
 * Pagefind's relevance order inside each group and omitting empty groups.
 */
export function groupHits(hits) {
  const map = { Courses: [], Blog: [], Docs: [] };
  for (const hit of hits) {
    (map[hit.category] || map.Docs).push(hit);
  }
  return Object.entries(map)
    .filter(([, items]) => items.length > 0)
    .map(([label, results]) => ({ label, results }));
}

/** The same grouping as a complete map, which is what `/search` filters on. */
export function groupHitsByCategory(hits) {
  const map = { Courses: [], Blog: [], Docs: [] };
  for (const hit of hits) {
    (map[hit.category] || map.Docs).push(hit);
  }
  return map;
}

/**
 * Chip counts. `All` counts every loaded hit, not the sum of the three groups
 * plus something else, so the chips can never disagree with the list.
 */
export function countByCategory(hits) {
  const grouped = groupHitsByCategory(hits);
  return {
    All: hits.length,
    Courses: grouped.Courses.length,
    Blog: grouped.Blog.length,
    Docs: grouped.Docs.length,
  };
}

/**
 * `?q=` (and `?category=`) for the modal's "See all results" link.
 *
 * `baseUrl` is prepended so the link stays inside the current locale. The old
 * implementation hardcoded `/search?...`, which under `/de/` would have thrown
 * the visitor back to the English search page.
 *
 * The trailing slash on `search/` is the site invariant (`trailingSlash: true`)
 * and matches the `SearchAction` target in `config/metadata.ts`. React Router
 * matches it against the registered `/search` route because Docusaurus routes
 * are not `strict`, so a copied URL costs no redirect hop.
 */
export function buildSearchUrl(query, category = 'All', baseUrl = '/') {
  const params = new URLSearchParams();
  params.set('q', query);
  if (category !== 'All') params.set('category', category);
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${prefix}search/?${params.toString()}`;
}

/** Read a chip name out of a query string, defaulting to `All`. */
export function categoryFromSearch(search) {
  const value = new URLSearchParams(search).get('category');
  return CATEGORIES.includes(value) ? value : 'All';
}

/** Read the query out of a query string. */
export function queryFromSearch(search) {
  return new URLSearchParams(search).get('q') || '';
}

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(text) {
  return text.replace(/&(?:amp|lt|gt|quot|nbsp|#39|#x27);/gi, (match) => ENTITIES[match.toLowerCase()] ?? match);
}

/**
 * Split a Pagefind excerpt into plain/highlighted runs.
 *
 * Pagefind returns the excerpt as a string of escaped text with `<mark>` wrapped
 * around the matched terms. The old UI passed the equivalent string to
 * `dangerouslySetInnerHTML`. Parsing it into segments instead means React does
 * the escaping, so a page whose prose contains markup cannot inject anything
 * into the results list, and it keeps `<mark>` as a real element for screen
 * readers rather than a styled span.
 *
 * Anything that is not a `<mark>` boundary is treated as text, including a
 * stray tag, which is why unmatched markup degrades to visible characters
 * instead of being rendered.
 */
export function parseExcerpt(excerpt) {
  if (typeof excerpt !== 'string' || excerpt === '') return [];
  const segments = [];
  const pattern = /<mark>([\s\S]*?)<\/mark>/gi;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(excerpt)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: decodeEntities(excerpt.slice(lastIndex, match.index)), mark: false });
    }
    segments.push({ text: decodeEntities(match[1]), mark: true });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < excerpt.length) {
    segments.push({ text: decodeEntities(excerpt.slice(lastIndex)), mark: false });
  }
  return segments.filter((segment) => segment.text !== '');
}
