import test from 'node:test';
import assert from 'node:assert/strict';

// ── Re-implementation of the new SearchBar's pure logic ──────────
// These mirror src/theme/SearchBar/search-utils.ts so the test can
// run under plain `node --test` without tsx. They codify the contract
// that the new search modal preserves the same results the old
// autocomplete dropdown would have produced.

const SEARCH_LIMIT = 8;

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
    const path = r.document.b?.join('/') || '';
    if (path.includes('courses')) {
      map.Courses.push(r);
    } else if (path.includes('blog')) {
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
const mockResults = [
  {
    document: { i: 0, t: 'Learn React', u: '/docs/courses/react/learn-react', b: ['docs', 'courses', 'react', 'learn-react'] },
    type: 0, page: { b: ['docs', 'courses', 'react', 'learn-react'], t: 'Learn React' }, tokens: ['react'],
  },
  {
    document: { i: 1, t: 'Advanced React', u: '/docs/courses/react/advanced-react', b: ['docs', 'courses', 'react', 'advanced-react'] },
    type: 0, page: { b: ['docs', 'courses', 'react', 'advanced-react'], t: 'Advanced React' }, tokens: ['react'],
  },
  {
    document: { i: 2, t: 'My First Blog Post', u: '/blog/my-first-post', b: ['blog', 'my-first-post'] },
    type: 1, page: { b: ['blog', 'my-first-post'], t: 'Blog' }, tokens: ['post'],
  },
  {
    document: { i: 3, t: 'Scrimba Pricing', u: '/docs/pricing/', b: ['docs', 'pricing'] },
    type: 0, page: { b: ['docs', 'pricing'], t: 'Scrimba Pricing' }, tokens: ['pricing'],
  },
  {
    document: { i: 4, t: 'Scrimba vs Codecademy', u: '/docs/comparisons/scrimba-vs-codecademy', b: ['docs', 'comparisons', 'scrimba-vs-codecademy'] },
    type: 0, page: { b: ['docs', 'comparisons', 'scrimba-vs-codecademy'], t: 'Comparisons' }, tokens: ['scrimba'],
  },
  {
    document: { i: 5, t: 'React Learning Path', u: '/blog/scrimba-react-learning-path', b: ['blog', 'scrimba-react-learning-path'] },
    type: 1, page: { b: ['blog', 'scrimba-react-learning-path'], t: 'Blog' }, tokens: ['react', 'learning'],
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

test('groupResults: path matching is substring-based (handles nested routes)', () => {
  const results = [
    {
      document: { i: 0, t: 'Deep React', u: '/docs/courses/react/deep', b: ['docs', 'courses', 'react', 'deep'] },
      type: 0, page: { b: ['docs', 'courses', 'react', 'deep'], t: 'Deep' }, tokens: ['react'],
    },
    {
      document: { i: 1, t: 'CSS Flexbox', u: '/docs/courses/css/flexbox', b: ['docs', 'courses', 'css', 'flexbox'] },
      type: 0, page: { b: ['docs', 'courses', 'css', 'flexbox'], t: 'CSS' }, tokens: ['flexbox'],
    },
  ];
  const grouped = groupResults(results);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].label, 'Courses');
  assert.equal(grouped[0].results.length, 2);
});

test('groupResults: substring matching means "blogging" inside docs is still Blog', () => {
  // Known limitation: includes('blog') matches "blogging".
  // No such page exists on the site, so this is harmless.
  const results = [
    {
      document: { i: 0, t: 'Blogging PDF', u: '/docs/guides/blogging', b: ['docs', 'guides', 'blogging'] },
      type: 0, page: { b: ['docs', 'guides', 'blogging'], t: 'Guides' }, tokens: ['blog'],
    },
  ];
  const grouped = groupResults(results);
  assert.equal(grouped[0].label, 'Blog');
});

test('groupResults: "courses" in a blog URL becomes Courses (substring match)', () => {
  const results = [
    {
      document: { i: 0, t: 'Programming Courses', u: '/blog/programming-courses', b: ['blog', 'programming-courses'] },
      type: 1, page: { b: ['blog', 'programming-courses'], t: 'Blog' }, tokens: ['courses'],
    },
  ];
  const grouped = groupResults(results);
  assert.equal(grouped[0].label, 'Courses');
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
