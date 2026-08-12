import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  CATEGORIES,
  MODAL_FETCH_LIMIT,
  PAGE_FETCH_LIMIT,
  PER_GROUP_LIMIT,
  SPECIFIC_GROUP_LIMIT,
  buildSearchUrl,
  categorize,
  categoryFromSearch,
  countByCategory,
  formatBreadcrumb,
  groupHits,
  groupHitsByCategory,
  parseExcerpt,
  queryFromSearch,
  titleFor,
  titleize,
  toHit,
  toRoutePath,
} from '../../src/theme/SearchBar/searchUtils.mjs';

const require = createRequire(import.meta.url);
const pagefindPlugin = require('../../plugins/pagefind/index.js');

/**
 * Search is Pagefind now (I18N-PLAN.md section 12), so this suite was rewritten
 * with it. Two structural changes from the version it replaces:
 *
 * 1. It imports `src/theme/SearchBar/searchUtils.mjs` instead of re-implementing
 *    the component's logic inline. The old file carried its own private copies of
 *    `groupResults`, `hitUrl` and the filter arithmetic and asserted against
 *    them, so it could pass while the components did something else entirely.
 *    That is also why the shared module is `.mjs`: `engines.node` is `>=20`,
 *    which cannot strip types, so a `.ts` module would be unimportable here.
 * 2. Grouping is derived from the ROUTE, not from lunr sidebar breadcrumbs
 *    (`document.b[0]`), which Pagefind does not have. The equivalence is exact
 *    because every course page lives under `/docs/courses/` and every post under
 *    `/blog/`, and the tests below pin that mapping in both directions.
 *
 * Everything here is pure. The Pagefind runtime itself is loaded from
 * `/pagefind/pagefind.js` at runtime and is out of scope for a unit test.
 */

// ── Mock data: Pagefind fragments, i.e. what `(await result.data())` returns ──
const fragments = [
  { url: '/docs/courses/react/learn-react/', meta: { title: 'Learn React' }, excerpt: 'A <mark>React</mark> course.' },
  { url: '/docs/courses/react/advanced-react/', meta: { title: 'Advanced React' }, excerpt: 'More <mark>React</mark>.' },
  { url: '/blog/my-first-post/', meta: { title: 'My First Blog Post' }, excerpt: 'A <mark>post</mark>.' },
  { url: '/docs/pricing/', meta: { title: 'Scrimba Pricing' }, excerpt: 'About <mark>pricing</mark>.' },
  { url: '/docs/comparisons/scrimba-vs-codecademy/', meta: { title: 'Scrimba vs Codecademy' }, excerpt: '<mark>Scrimba</mark> vs.' },
  { url: '/blog/scrimba-react-learning-path/', meta: { title: 'React Learning Path' }, excerpt: 'A <mark>React</mark> path.' },
];

const hits = fragments.map((fragment) => toHit(fragment));

// ── Route arithmetic ─────────────────────────────────────────────

test('toRoutePath returns the path unchanged at the root baseUrl', () => {
  assert.equal(toRoutePath('/docs/pricing/'), '/docs/pricing/');
  assert.equal(toRoutePath('/'), '/');
});

test('toRoutePath strips a locale baseUrl so route predicates stay locale-blind', () => {
  // Pagefind indexes the merged tree, so its URLs carry the locale prefix.
  assert.equal(toRoutePath('/de/docs/courses/react/learn-react/', '/de/'), '/docs/courses/react/learn-react/');
  assert.equal(toRoutePath('/de/blog/my-first-post/', '/de/'), '/blog/my-first-post/');
  assert.equal(toRoutePath('/de/', '/de/'), '/');
  assert.equal(toRoutePath('/de', '/de/'), '/');
});

test('toRoutePath leaves a foreign prefix alone rather than corrupting it', () => {
  assert.equal(toRoutePath('/docs/pricing/', '/de/'), '/docs/pricing/');
});

test('toRoutePath drops origin, query and hash', () => {
  assert.equal(toRoutePath('https://scrimbaguide.tech/docs/pricing/?a=1#top'), '/docs/pricing/');
  assert.equal(toRoutePath('/docs/pricing/index.html'), '/docs/pricing/');
});

test('toRoutePath is total: junk input never throws', () => {
  assert.equal(toRoutePath(''), '/');
  assert.equal(toRoutePath(undefined), '/');
});

// ── Categorisation (replaces the lunr breadcrumb rule) ───────────

test('categorize maps course routes to Courses', () => {
  assert.equal(categorize('/docs/courses/react/learn-react/'), 'Courses');
  assert.equal(categorize('/docs/courses/'), 'Courses');
});

test('categorize maps blog routes to Blog', () => {
  assert.equal(categorize('/blog/my-first-post/'), 'Blog');
  assert.equal(categorize('/blog/'), 'Blog');
  assert.equal(categorize('/blog/tags/react/'), 'Blog');
});

test('categorize sends every other route to Docs', () => {
  assert.equal(categorize('/docs/pricing/'), 'Docs');
  assert.equal(categorize('/docs/comparisons/scrimba-vs-codecademy/'), 'Docs');
  assert.equal(categorize('/'), 'Docs');
  // src/pages routes had no sidebar breadcrumb at all under lunr and landed in
  // Docs by accident. Now they land there by rule.
  assert.equal(categorize('/tools/which-scrimba-path/'), 'Docs');
});

test('categorize is locale-blind once toRoutePath has run', () => {
  assert.equal(categorize(toRoutePath('/de/blog/my-first-post/', '/de/')), 'Blog');
  assert.equal(categorize(toRoutePath('/de/docs/courses/css/flexbox/', '/de/')), 'Courses');
});

// ── Titles and breadcrumbs ───────────────────────────────────────

test('titleize humanises a slug and preserves acronyms', () => {
  assert.equal(titleize('learn-react'), 'Learn React');
  assert.equal(titleize('css-grid'), 'CSS Grid');
  assert.equal(titleize('ai-engineering'), 'AI Engineering');
  assert.equal(titleize('faq'), 'FAQ');
});

test('titleFor prefers the indexed page title', () => {
  assert.equal(titleFor({ meta: { title: 'Learn React' } }, '/docs/courses/react/learn-react/'), 'Learn React');
});

test('titleFor falls back to the slug when a page has no h1 to index', () => {
  assert.equal(titleFor({}, '/docs/courses/react/learn-react/'), 'Learn React');
  assert.equal(titleFor({ meta: { title: '   ' } }, '/docs/pricing/'), 'Pricing');
  assert.equal(titleFor({}, '/'), 'Untitled');
});

test('formatBreadcrumb drops the routing root and the page slug', () => {
  assert.equal(formatBreadcrumb('/docs/courses/react/learn-react/'), 'Courses / React');
  assert.equal(formatBreadcrumb('/docs/comparisons/scrimba-vs-codecademy/'), 'Comparisons');
});

test('formatBreadcrumb keeps a single segment rather than going blank', () => {
  assert.equal(formatBreadcrumb('/docs/pricing/'), 'Pricing');
});

test('formatBreadcrumb is empty for blog posts, whose slug is the title again', () => {
  assert.equal(formatBreadcrumb('/blog/my-first-post/'), '');
  assert.equal(formatBreadcrumb('/'), '');
});

// ── toHit: the fragment -> renderable-result contract ────────────

test('toHit preserves the URL verbatim so navigation stays in-locale', () => {
  // The URL is what `history.push` receives, so it must keep the baseUrl that
  // Pagefind indexed it with, even though the CATEGORY is computed without it.
  const hit = toHit({ url: '/de/blog/my-first-post/', meta: { title: 'Post' } }, '/de/');
  assert.equal(hit.url, '/de/blog/my-first-post/');
  assert.equal(hit.category, 'Blog');
});

test('toHit fills every field the UIs render', () => {
  const hit = toHit(fragments[0]);
  assert.deepEqual(hit, {
    url: '/docs/courses/react/learn-react/',
    title: 'Learn React',
    excerpt: 'A <mark>React</mark> course.',
    category: 'Courses',
    path: 'Courses / React',
  });
});

test('toHit tolerates a fragment with no excerpt', () => {
  assert.equal(toHit({ url: '/docs/pricing/' }).excerpt, '');
});

// ── Grouping ─────────────────────────────────────────────────────

test('groupHits: courses are grouped under Courses, in relevance order', () => {
  const grouped = groupHits(hits);
  const courses = grouped.find((group) => group.label === 'Courses');
  assert.ok(courses, 'Courses group exists');
  assert.equal(courses.results.length, 2);
  assert.equal(courses.results[0].title, 'Learn React');
  assert.equal(courses.results[1].title, 'Advanced React');
});

test('groupHits: blog results are grouped under Blog', () => {
  const blog = groupHits(hits).find((group) => group.label === 'Blog');
  assert.equal(blog.results.length, 2);
  assert.equal(blog.results[0].title, 'My First Blog Post');
  assert.equal(blog.results[1].title, 'React Learning Path');
});

test('groupHits: everything else goes under Docs', () => {
  const docs = groupHits(hits).find((group) => group.label === 'Docs');
  assert.equal(docs.results.length, 2);
  assert.equal(docs.results[0].title, 'Scrimba Pricing');
  assert.equal(docs.results[1].title, 'Scrimba vs Codecademy');
});

test('groupHits: no result is lost', () => {
  const flat = groupHits(hits).flatMap((group) => group.results.map((hit) => hit.title)).sort();
  assert.deepEqual(flat, hits.map((hit) => hit.title).sort());
});

test('groupHits: empty input produces empty output, and empty groups are omitted', () => {
  assert.deepEqual(groupHits([]), []);
  const grouped = groupHits([hits[2]]);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].label, 'Blog');
});

test('groupHits: group order is Courses, Blog, Docs regardless of hit order', () => {
  const shuffled = [hits[3], hits[2], hits[0]];
  assert.deepEqual(groupHits(shuffled).map((group) => group.label), ['Courses', 'Blog', 'Docs']);
});

test('groupHitsByCategory returns a complete map, not a sparse array', () => {
  const map = groupHitsByCategory(hits);
  assert.deepEqual(Object.keys(map), ['Courses', 'Blog', 'Docs']);
  assert.equal(map.Courses.length, 2);
  assert.equal(map.Blog.length, 2);
  assert.equal(map.Docs.length, 2);
  const empty = groupHitsByCategory([]);
  assert.deepEqual(empty, { Courses: [], Blog: [], Docs: [] });
});

// ── Filter chips ─────────────────────────────────────────────────

test('CATEGORIES is the chip list, All first', () => {
  assert.deepEqual(CATEGORIES, ['All', 'Courses', 'Blog', 'Docs']);
});

test('countByCategory: All is the total, never the sum of a subset', () => {
  assert.deepEqual(countByCategory(hits), { All: 6, Courses: 2, Blog: 2, Docs: 2 });
  assert.deepEqual(countByCategory([]), { All: 0, Courses: 0, Blog: 0, Docs: 0 });
});

test('filter chips: a specific chip narrows to exactly one group', () => {
  const grouped = groupHits(hits);
  for (const label of ['Courses', 'Blog', 'Docs']) {
    const filtered = grouped.filter((group) => group.label === label);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].label, label);
  }
});

test('modal caps: All shows PER_GROUP_LIMIT per group, a chip shows SPECIFIC_GROUP_LIMIT', () => {
  const many = Array.from({ length: 12 }, (_, i) => toHit({
    url: `/blog/post-${i}/`,
    meta: { title: `Blog Post ${i}` },
  }));
  const raw = groupHits(many);

  const underAll = raw.map((group) => ({ ...group, results: group.results.slice(0, PER_GROUP_LIMIT) }));
  assert.equal(underAll[0].results.length, 4, 'Blog group capped at 4 under the All chip');

  const underChip = raw
    .map((group) => ({ ...group, results: group.results.slice(0, SPECIFIC_GROUP_LIMIT) }))
    .filter((group) => group.label === 'Blog');
  assert.equal(underChip[0].results.length, 8, 'Blog group shows 8 under its own chip');
});

test('fetch limits are ordered: the modal loads fewer fragments than the page', () => {
  // Each loaded result is one ~3 KB network fetch, so these bound the cost of a
  // keystroke. The page is allowed to be greedier because the user committed.
  assert.ok(MODAL_FETCH_LIMIT > 0);
  assert.ok(PAGE_FETCH_LIMIT > MODAL_FETCH_LIMIT);
  assert.ok(MODAL_FETCH_LIMIT >= SPECIFIC_GROUP_LIMIT * 2);
});

// ── Query-string plumbing ────────────────────────────────────────

test('categoryFromSearch reads a valid chip and rejects anything else', () => {
  assert.equal(categoryFromSearch('?q=react'), 'All');
  assert.equal(categoryFromSearch('?q=react&category=Blog'), 'Blog');
  assert.equal(categoryFromSearch('?q=react&category=Courses'), 'Courses');
  assert.equal(categoryFromSearch('?category=Docs&q=test'), 'Docs');
  assert.equal(categoryFromSearch('?q=react&category=Invalid'), 'All');
  assert.equal(categoryFromSearch(''), 'All');
});

test('queryFromSearch reads q, defaulting to empty', () => {
  assert.equal(queryFromSearch('?q=react'), 'react');
  assert.equal(queryFromSearch('?q=react%20hooks'), 'react hooks');
  assert.equal(queryFromSearch('?category=Blog'), '');
  assert.equal(queryFromSearch(''), '');
});

test('buildSearchUrl includes category only when a chip is active', () => {
  assert.equal(buildSearchUrl('react', 'All'), '/search/?q=react');
  assert.equal(buildSearchUrl('react', 'Blog'), '/search/?q=react&category=Blog');
  assert.equal(buildSearchUrl('react', 'Courses'), '/search/?q=react&category=Courses');
});

test('buildSearchUrl keeps "See all" inside the current locale', () => {
  // The lunr version hardcoded `/search?...`, which under /de/ would have thrown
  // the visitor onto the English search page and, with per-language Pagefind
  // indexes, onto a corpus in a language they are not reading.
  assert.equal(buildSearchUrl('react', 'All', '/de/'), '/de/search/?q=react');
  assert.equal(buildSearchUrl('react', 'Blog', '/de/'), '/de/search/?q=react&category=Blog');
});

test('buildSearchUrl round-trips through the page readers', () => {
  const url = buildSearchUrl('react hooks', 'Blog', '/de/');
  const search = url.slice(url.indexOf('?'));
  assert.equal(queryFromSearch(search), 'react hooks');
  assert.equal(categoryFromSearch(search), 'Blog');
});

// ── Excerpt parsing (replaces highlightStemmed/getStemmedPositions/Mark) ──

test('parseExcerpt splits marked runs out of the excerpt', () => {
  assert.deepEqual(parseExcerpt('Learn <mark>React</mark> today'), [
    { text: 'Learn ', mark: false },
    { text: 'React', mark: true },
    { text: ' today', mark: false },
  ]);
});

test('parseExcerpt handles several marks and a leading mark', () => {
  assert.deepEqual(parseExcerpt('<mark>React</mark> and <mark>Vue</mark>'), [
    { text: 'React', mark: true },
    { text: ' and ', mark: false },
    { text: 'Vue', mark: true },
  ]);
});

test('parseExcerpt decodes the entities Pagefind escapes', () => {
  assert.deepEqual(parseExcerpt('HTML &amp; CSS &lt;div&gt;'), [
    { text: 'HTML & CSS <div>', mark: false },
  ]);
});

test('parseExcerpt is safe by construction: markup survives as text', () => {
  // The segments are rendered as React children, so a stray tag in the indexed
  // prose becomes visible characters instead of an injected element. That is the
  // whole reason this replaced the old dangerouslySetInnerHTML highlight path.
  const segments = parseExcerpt('before <img src=x onerror=alert(1)> after');
  assert.equal(segments.length, 1);
  assert.ok(segments[0].text.includes('<img'));
  assert.equal(segments[0].mark, false);
});

test('parseExcerpt returns nothing for an empty or missing excerpt', () => {
  assert.deepEqual(parseExcerpt(''), []);
  assert.deepEqual(parseExcerpt(undefined), []);
});

test('parseExcerpt drops empty runs so React renders no blank nodes', () => {
  assert.deepEqual(parseExcerpt('<mark>React</mark>'), [{ text: 'React', mark: true }]);
});

// ── The Pagefind build plugin ────────────────────────────────────

test('plugin registers /search under the locale baseUrl', async () => {
  const routes = [];
  const plugin = pagefindPlugin({ baseUrl: '/de/', siteDir: process.cwd() });
  await plugin.contentLoaded({ actions: { addRoute: (route) => routes.push(route) } });
  assert.deepEqual(routes, [{ path: '/de/search', component: '@theme/SearchPage', exact: true }]);
});

test('plugin registers /search at the root for the default locale', async () => {
  const routes = [];
  const plugin = pagefindPlugin({ baseUrl: '/', siteDir: process.cwd() });
  await plugin.contentLoaded({ actions: { addRoute: (route) => routes.push(route) } });
  assert.equal(routes[0].path, '/search');
});

test('joinBaseUrl never doubles or drops the separating slash', () => {
  assert.equal(pagefindPlugin.joinBaseUrl('/', 'search'), '/search');
  assert.equal(pagefindPlugin.joinBaseUrl('/de/', 'search'), '/de/search');
  // Docusaurus always hands over a trailing slash, but a missing one must not
  // silently produce `/desearch`.
  assert.equal(pagefindPlugin.joinBaseUrl('/de', 'search'), '/de/search');
});

test('postBuild no-ops under SKIP_PAGEFIND=1 and writes nothing', async (t) => {
  // Without this gate every matrix build-locale job would leave its own
  // pagefind/ directory in the merged tree, on top of the merged index, which is
  // the size problem the whole migration exists to fix (plan Phase 0b).
  const previous = process.env.SKIP_PAGEFIND;
  process.env.SKIP_PAGEFIND = '1';
  t.after(() => {
    if (previous === undefined) delete process.env.SKIP_PAGEFIND;
    else process.env.SKIP_PAGEFIND = previous;
  });

  const outDir = await mkdtemp(path.join(tmpdir(), 'pagefind-gate-'));
  const plugin = pagefindPlugin({ baseUrl: '/', siteDir: process.cwd() });
  await plugin.postBuild({ outDir });
  assert.deepEqual(await readdir(outDir), [], 'no pagefind/ directory was created');
});

test('the CLI is located without ever reaching the network in CI', () => {
  const resolved = pagefindPlugin.resolvePagefindCommand(process.cwd());
  assert.notEqual(resolved.how, 'npx', 'pagefind must be resolvable from node_modules');
});

test('PAGEFIND_BIN overrides CLI resolution', () => {
  const previous = process.env.PAGEFIND_BIN;
  process.env.PAGEFIND_BIN = '/usr/local/bin/pagefind';
  try {
    assert.deepEqual(pagefindPlugin.resolvePagefindCommand(process.cwd()), {
      command: '/usr/local/bin/pagefind',
      args: [],
      how: 'PAGEFIND_BIN',
    });
  } finally {
    if (previous === undefined) delete process.env.PAGEFIND_BIN;
    else process.env.PAGEFIND_BIN = previous;
  }
});

test('the index is written to pagefind/, which is where the client loads it from', () => {
  // src/theme/SearchBar/pagefind.ts imports /pagefind/pagefind.js as a
  // SITE-ROOT-absolute path, never joined to baseUrl, because Pagefind runs once
  // over the merged tree and serves all 48 locales from that one directory.
  assert.equal(pagefindPlugin.PAGEFIND_DIR, 'pagefind');
  assert.equal(pagefindPlugin.SEARCH_ROUTE, 'search');
});

test('CLI args index the merged tree per language and strip page chrome', () => {
  const args = pagefindPlugin.pagefindArgs('/tmp/build');
  assert.deepEqual(args.slice(0, 2), ['--site', '/tmp/build']);
  // Per-language splitting is automatic from <html lang>. Forcing one language
  // would merge all 48 indexes and make every visitor download every language.
  assert.ok(!args.some((arg) => /force[-_]language/.test(arg)));
  const selectors = args[args.indexOf('--exclude-selectors') + 1];
  assert.match(selectors, /skipToContent/);
  assert.match(selectors, /table-of-contents/);
});

test('summarizePagefindOutput keeps the counts and drops the noise', () => {
  const output = [
    'Running Pagefind v1.5.2 (Extended)',
    '[Reading languages]',
    'Discovered 1 language: en',
    '[Building search indexes]',
    'Total: ',
    '  Indexed 1 language',
    '  Indexed 262 pages',
    '  Indexed 7571 words',
    '',
  ].join('\n');
  assert.equal(
    pagefindPlugin.summarizePagefindOutput(output),
    'Discovered 1 language: en, Indexed 1 language, Indexed 262 pages, Indexed 7571 words',
  );
  assert.equal(pagefindPlugin.summarizePagefindOutput(''), 'no summary reported');
});

test('formatBytes reports index size in readable units', () => {
  assert.equal(pagefindPlugin.formatBytes(512), '512 B');
  assert.equal(pagefindPlugin.formatBytes(2048), '2.0 KB');
  assert.equal(pagefindPlugin.formatBytes(2182963), '2.08 MB');
  assert.equal(pagefindPlugin.formatBytes(null), 'unknown');
});
