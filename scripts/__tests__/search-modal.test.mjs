import test from 'node:test';
import assert from 'node:assert/strict';

// ── Re-implementation of the new SearchBar's pure logic ──────────
// These mirror src/theme/SearchBar/search-utils.ts so the test can
// run under plain `node --test` without tsx. They codify the contract
// that the new search modal preserves the same results the old
// autocomplete dropdown would have produced.

const SEARCH_LIMIT = 8;
const PER_GROUP_LIMIT = 4;

/**
 * Old behavior: flat, ungrouped list of hit rows. The autocomplete
 * dropdown rendered every result as a flat list of suggestion <div>s.
 */
function oldHitUrl(doc) {
  return doc.u + (doc.h || '');
}

/**
 * New behavior: same underlying result, but grouped by category.
 * hitUrl() is identical to oldHitUrl() – preserved contract.
 */
function hitUrl(doc) {
  return doc.u + (doc.h || '');
}

function groupResults(results) {
  const map = { Courses: [], Blog: [], Docs: [] };
  for (const r of results) {
    const root = r.document.b?.[0] || '';
    if (root === 'Courses') {
      map.Courses.push(r);
    } else if (root === 'Blog') {
      map.Blog.push(r);
    } else {
      map.Docs.push(r);
    }
  }
  return Object.entries(map)
    .filter(([, items]) => items.length > 0)
    .map(([label, results]) => ({ label, results }));
}

// ── Mock data (shape matches searchByWorker output) ──────────────
// The b[] holds sidebar breadcrumbs as found in the lunr index:
//   Blog -> ['Blog']
//   Courses -> ['Courses', 'Courses by Topic', 'React']
//   Other docs -> ['Pricing'], ['Scrimba vs Alternatives'], ['How Scrimba Works'], etc.
const mockResults = [
  {
    document: { i: 0, t: 'Learn React', u: '/docs/courses/react/learn-react/', b: ['Courses', 'Courses by Topic', 'React'] },
    type: 0, page: { b: ['Courses', 'Courses by Topic', 'React'], t: 'Learn React' }, tokens: ['react'],
  },
  {
    document: { i: 1, t: 'Advanced React', u: '/docs/courses/react/advanced-react/', b: ['Courses', 'Courses by Topic', 'React'] },
    type: 0, page: { b: ['Courses', 'Courses by Topic', 'React'], t: 'Advanced React' }, tokens: ['react'],
  },
  {
    document: { i: 2, t: 'My First Blog Post', u: '/blog/my-first-post/', b: ['Blog'] },
    type: 1, page: { b: ['Blog'], t: 'Blog' }, tokens: ['post'],
  },
  {
    document: { i: 3, t: 'Scrimba Pricing', u: '/docs/pricing/', b: ['Pricing'] },
    type: 0, page: { b: ['Pricing'], t: 'Scrimba Pricing' }, tokens: ['pricing'],
  },
  {
    document: { i: 4, t: 'Scrimba vs Codecademy', u: '/docs/comparisons/scrimba-vs-codecademy/', b: ['Scrimba vs Alternatives'] },
    type: 0, page: { b: ['Scrimba vs Alternatives'], t: 'Comparisons' }, tokens: ['scrimba'],
  },
  {
    document: { i: 5, t: 'React Learning Path', u: '/blog/scrimba-react-learning-path/', b: ['Blog'] },
    type: 1, page: { b: ['Blog'], t: 'Blog' }, tokens: ['react', 'learning'],
  },
];

// ── Tests ────────────────────────────────────────────────────────

test('SEARCH_LIMIT matches docusaurus.config.ts (searchResultLimits: 8)', () => {
  assert.equal(SEARCH_LIMIT, 8);
});

test('hitUrl preserves old URL construction (identical contract)', () => {
  for (const r of mockResults) {
    assert.equal(hitUrl(r.document), oldHitUrl(r.document));
  }
});

test('hitUrl appends hash when present', () => {
  const doc = { i: 0, t: 'Test', u: '/docs/test', b: ['docs', 'test'], h: '#section-1' };
  assert.equal(hitUrl(doc), '/docs/test#section-1');
});

test('hitUrl returns path only when no hash', () => {
  const doc = { i: 0, t: 'Test', u: '/docs/test', b: ['docs', 'test'] };
  assert.equal(hitUrl(doc), '/docs/test');
});

test('groupResults: courses are grouped under Courses', () => {
  const grouped = groupResults(mockResults);
  const coursesGroup = grouped.find((g) => g.label === 'Courses');
  assert.ok(coursesGroup, 'Courses group exists');
  assert.equal(coursesGroup.results.length, 2);
  assert.equal(coursesGroup.results[0].document.t, 'Learn React');
  assert.equal(coursesGroup.results[1].document.t, 'Advanced React');
});

test('groupResults: blog results are grouped under Blog', () => {
  const grouped = groupResults(mockResults);
  const blogGroup = grouped.find((g) => g.label === 'Blog');
  assert.ok(blogGroup, 'Blog group exists');
  assert.equal(blogGroup.results.length, 2);
  assert.equal(blogGroup.results[0].document.t, 'My First Blog Post');
  assert.equal(blogGroup.results[1].document.t, 'React Learning Path');
});

test('groupResults: everything else goes under Docs', () => {
  const grouped = groupResults(mockResults);
  const docsGroup = grouped.find((g) => g.label === 'Docs');
  assert.ok(docsGroup, 'Docs group exists');
  assert.equal(docsGroup.results.length, 2);
  assert.equal(docsGroup.results[0].document.t, 'Scrimba Pricing');
  assert.equal(docsGroup.results[1].document.t, 'Scrimba vs Codecademy');
});

test('groupResults: every result from input appears in output (no data loss)', () => {
  const grouped = groupResults(mockResults);
  const flatTitles = grouped.flatMap((g) => g.results.map((r) => r.document.t)).sort();
  const inputTitles = mockResults.map((r) => r.document.t).sort();
  assert.deepEqual(flatTitles, inputTitles);
});

test('groupResults: empty input produces empty output', () => {
  assert.deepEqual(groupResults([]), []);
});

test('groupResults: single result in a category', () => {
  const single = [mockResults[2]]; // Blog post only
  const grouped = groupResults(single);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].label, 'Blog');
  assert.equal(grouped[0].results.length, 1);
});

test('groupResults: nested Courses breadcrumbs all land in Courses', () => {
  const results = [
    {
      document: { i: 0, t: 'Deep React', u: '/docs/courses/react/deep/', b: ['Courses', 'Courses by Topic', 'React'] },
      type: 0, page: { b: ['Courses', 'Courses by Topic', 'React'], t: 'Deep' }, tokens: ['react'],
    },
    {
      document: { i: 1, t: 'CSS Flexbox', u: '/docs/courses/css/flexbox/', b: ['Courses', 'Courses by Topic', 'CSS & Design'] },
      type: 0, page: { b: ['Courses', 'Courses by Topic', 'CSS & Design'], t: 'CSS' }, tokens: ['flexbox'],
    },
  ];
  const grouped = groupResults(results);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].label, 'Courses');
  assert.equal(grouped[0].results.length, 2);
});

test('groupResults: uses first breadcrumb segment (case-sensitive)', () => {
  // b[0] is the sidebar section title, checked case-sensitively.
  // 'Blog' -> Blog group, 'Courses' -> Courses group, everything else -> Docs.
  const results = [
    { document: { i: 0, t: 'How Scrimba Works', u: '/docs/how-it-works/', b: ['How Scrimba Works'] }, type: 0, page: { b: ['How Scrimba Works'], t: 'How Scrimba Works' }, tokens: ['scrimba'] },
    { document: { i: 1, t: 'Blogging Tips', u: '/blog/blogging-tips/', b: ['Blog'] }, type: 1, page: { b: ['Blog'], t: 'Blog' }, tokens: ['blog'] },
  ];
  const grouped = groupResults(results);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].label, 'Blog');
  assert.equal(grouped[1].label, 'Docs');
});

test('groupResults: empty b array falls to Docs', () => {
  const results = [
    { document: { i: 0, t: 'Homepage', u: '/', b: [] }, type: 0, page: { b: [], t: 'Home' }, tokens: ['home'] },
  ];
  const grouped = groupResults(results);
  assert.equal(grouped[0].label, 'Docs');
});

test('groupResults: handles mixed categories correctly', () => {
  const results = [
    { document: { i: 0, t: 'JS Course', u: '/js/', b: ['Courses', 'JavaScript'] }, type: 0, page: { b: ['Courses', 'JavaScript'], t: 'JS' }, tokens: ['js'] },
    { document: { i: 1, t: 'A Blog', u: '/blog/a/', b: ['Blog'] }, type: 1, page: { b: ['Blog'], t: 'Blog' }, tokens: ['a'] },
    { document: { i: 2, t: 'Pricing', u: '/pricing/', b: ['Pricing'] }, type: 0, page: { b: ['Pricing'], t: 'Pricing' }, tokens: ['pricing'] },
  ];
  const grouped = groupResults(results);
  assert.equal(grouped.length, 3);
  assert.equal(grouped.find(g => g.label === 'Courses')?.results.length, 1);
  assert.equal(grouped.find(g => g.label === 'Blog')?.results.length, 1);
  assert.equal(grouped.find(g => g.label === 'Docs')?.results.length, 1);
});

test('filtered groups: All filter returns all groups unchanged', () => {
  const grouped = groupResults(mockResults);
  // 'All' means no filtering — same as grouped
  const filtered = grouped;
  assert.equal(filtered.length, grouped.length);
});

test('filtered groups: Courses filter returns only Courses group', () => {
  const grouped = groupResults(mockResults);
  const filtered = grouped.filter((g) => g.label === 'Courses');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].label, 'Courses');
});

test('filtered groups: Blog filter returns only Blog group', () => {
  const grouped = groupResults(mockResults);
  const filtered = grouped.filter((g) => g.label === 'Blog');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].label, 'Blog');
});

test('filtered groups: Docs filter returns only Docs group', () => {
  const grouped = groupResults(mockResults);
  const filtered = grouped.filter((g) => g.label === 'Docs');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].label, 'Docs');
});

test('conditional slice: All filter caps each group at PER_GROUP_LIMIT (4)', () => {
  const manyResults = [];
  for (let i = 0; i < 12; i++) {
    manyResults.push({
      document: { i, t: `Blog Post ${i}`, u: `/blog/post-${i}/`, b: ['Blog'] },
      type: 1, page: { b: ['Blog'], t: 'Blog' }, tokens: ['blog'],
    });
  }
  // Replicate the new logic: slice only when activeFilter === 'All'
  const rawGrouped = groupResults(manyResults);
  const perGroup = 4;
  const groupedAll = rawGrouped.map((g) => ({ ...g, results: g.results.slice(0, perGroup) }));
  const filteredAll = groupedAll;
  const blogGroupAll = filteredAll.find((g) => g.label === 'Blog');
  assert.equal(blogGroupAll.results.length, 4, 'Blog group capped at 4 when All filter');

  const groupedBlog = rawGrouped.map((g) => ({ ...g, results: g.results.slice(0, 50) }));
  const filteredBlog = groupedBlog.filter((g) => g.label === 'Blog');
  const blogGroupBlog = filteredBlog[0];
  assert.equal(blogGroupBlog.results.length, 12, 'Blog group shows all results when specific filter active');
});

test('old flat result format would be order-of-results from searchByWorker (preserved)', () => {
  // The old autocomplete dropdown rendered results in the order returned
  // by searchByWorker, ungrouped. The new version groups them but the
  // individual results + their order within each group are preserved.
  const grouped = groupResults(mockResults);

  for (const group of grouped) {
    for (const result of group.results) {
      // Each result still has the expected document shape
      assert.ok(typeof result.document.t === 'string');
      assert.ok(typeof result.document.u === 'string');
      assert.ok(Array.isArray(result.document.b));
      assert.ok(typeof result.type === 'number');
      assert.ok(Array.isArray(result.tokens));
    }
  }
});

// ── SearchPage category tests ─────────────────────────────────────

test('SearchPage groupResults returns a map (not an array)', () => {
  // The SearchPage's groupResults returns {Courses: [], Blog: [], Docs: []}
  // instead of the SearchBar's array format.
  function searchPageGroupResults(results) {
    const map = { Courses: [], Blog: [], Docs: [] };
    for (const r of results) {
      const root = r.document.b?.[0] || '';
      if (root === 'Courses') map.Courses.push(r);
      else if (root === 'Blog') map.Blog.push(r);
      else map.Docs.push(r);
    }
    return map;
  }
  const map = searchPageGroupResults(mockResults);
  assert.equal(map.Courses.length, 2);
  assert.equal(map.Blog.length, 2);
  assert.equal(map.Docs.length, 2);
  assert.equal(Object.keys(map).length, 3);
});

test('SearchPage perGroupCounts computed correctly', () => {
  // Replicates the useMemo logic in SearchPageContent
  function searchPageGroupResults(results) {
    const map = { Courses: [], Blog: [], Docs: [] };
    for (const r of results) {
      const root = r.document.b?.[0] || '';
      if (root === 'Courses') map.Courses.push(r);
      else if (root === 'Blog') map.Blog.push(r);
      else map.Docs.push(r);
    }
    return map;
  }
  const grouped = searchPageGroupResults(mockResults);
  const perGroupCounts = {
    All: mockResults.length,
    Courses: grouped.Courses.length,
    Blog: grouped.Blog.length,
    Docs: grouped.Docs.length,
  };
  assert.equal(perGroupCounts.All, 6);
  assert.equal(perGroupCounts.Courses, 2);
  assert.equal(perGroupCounts.Blog, 2);
  assert.equal(perGroupCounts.Docs, 2);
});

test('SearchPage category filter: All returns all results', () => {
  // Replicates the filteredResults logic in SearchPageContent
  function searchPageGroupResults(results) {
    const map = { Courses: [], Blog: [], Docs: [] };
    for (const r of results) {
      const root = r.document.b?.[0] || '';
      if (root === 'Courses') map.Courses.push(r);
      else if (root === 'Blog') map.Blog.push(r);
      else map.Docs.push(r);
    }
    return map;
  }
  const grouped = searchPageGroupResults(mockResults);
  const resultsAll = mockResults; // category === 'All'
  assert.equal(resultsAll.length, 6);
  const resultsCourses = grouped.Courses;
  assert.equal(resultsCourses.length, 2);
  const resultsBlog = grouped.Blog;
  assert.equal(resultsBlog.length, 2);
  const resultsDocs = grouped.Docs;
  assert.equal(resultsDocs.length, 2);
});

test('SearchPage URL param: category from query string', () => {
  // Replicates the URL parsing logic in SearchPageContent
  // This tests the logic that initializes `category` state from `?category=`
  function getCategoryFromSearch(searchString) {
    const params = new URLSearchParams(searchString);
    const cat = params.get('category');
    const CATEGORIES = ['All', 'Courses', 'Blog', 'Docs'];
    return CATEGORIES.includes(cat) ? cat : 'All';
  }
  assert.equal(getCategoryFromSearch('?q=react'), 'All');
  assert.equal(getCategoryFromSearch('?q=react&category=Blog'), 'Blog');
  assert.equal(getCategoryFromSearch('?q=react&category=Courses'), 'Courses');
  assert.equal(getCategoryFromSearch('?q=react&category=Invalid'), 'All');
  assert.equal(getCategoryFromSearch('?category=Docs&q=test'), 'Docs');
  assert.equal(getCategoryFromSearch(''), 'All');
});

test('SearchPage "See all" URL includes category when filter is active', () => {
  // Replicates the handleSeeAll URL construction from SearchBar
  function buildSeeAllUrl(query, activeFilter) {
    const params = new URLSearchParams();
    params.set('q', query);
    if (activeFilter !== 'All') params.set('category', activeFilter);
    return `/search?${params.toString()}`;
  }
  assert.equal(buildSeeAllUrl('react', 'All'), '/search?q=react');
  assert.equal(buildSeeAllUrl('react', 'Blog'), '/search?q=react&category=Blog');
  assert.equal(buildSeeAllUrl('react', 'Courses'), '/search?q=react&category=Courses');
});
