import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { affiliateDestination } from '../../src/utils/affiliateDestination.ts';

const require = createRequire(import.meta.url);

function headScript() {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const plugin = require('../../plugins/analytics/index.js')();
    const tag = plugin.injectHtmlTags().headTags.find((t) => t.tagName === 'script');
    return tag.innerHTML;
  } finally {
    process.env.NODE_ENV = prev;
  }
}

/** Runs the <head> script in a fake browser and returns what it did. */
function runHead({ hostname = 'scrimbaguide.tech', pathname = '/', stored = null } = {}) {
  const appended = [];
  const window = {
    location: { hostname, pathname },
    localStorage: { getItem: () => stored },
    document: { head: { appendChild: (el) => appended.push(el) }, createElement: () => ({}) },
  };
  window.window = window;
  vm.runInNewContext(`with (window) { ${headScript()} }`, { window, Date, RegExp, JSON });
  const calls = window.dataLayer.map((args) => Array.from(args));
  return { calls, appended, config: calls.find((c) => c[0] === 'config') };
}

test('consent defaults: denied in the EEA/UK/CH, analytics granted elsewhere, ads denied everywhere', () => {
  const { calls } = runHead();
  const defaults = calls.filter((c) => c[0] === 'consent' && c[1] === 'default');
  assert.equal(defaults.length, 2);
  assert.equal(defaults[0][2].analytics_storage, 'denied');
  assert.ok(defaults[0][2].region.includes('DE') && defaults[0][2].region.includes('GB'));
  assert.equal(defaults[1][2].analytics_storage, 'granted');
  assert.equal(defaults[1][2].region, undefined);
  for (const d of defaults) assert.equal(d[2].ad_storage, 'denied');
});

test('a stored banner choice is replayed before config', () => {
  for (const stored of ['granted', 'denied']) {
    const { calls } = runHead({ stored });
    const update = calls.findIndex((c) => c[0] === 'consent' && c[1] === 'update');
    assert.ok(update > -1, stored);
    assert.equal(calls[update][2].analytics_storage, stored);
    assert.ok(update < calls.findIndex((c) => c[0] === 'config'));
  }
  assert.ok(!runHead({ stored: 'junk' }).calls.some((c) => c[1] === 'update'));
});

test('hostname guard: gtag.js loads only on the production host', () => {
  assert.equal(runHead().appended.length, 1);
  assert.match(runHead().appended[0].src, /gtag\/js\?id=G-03WS2KR7EX/);
  assert.equal(runHead({ hostname: 'localhost' }).appended.length, 0);
  assert.equal(runHead({ hostname: 'yel-hadd.github.io' }).appended.length, 0);
});

test('content_group labels the first page_view', () => {
  const cases = {
    '/': 'home',
    '/blog/': 'blog-index',
    '/blog/page/2/': 'blog-index',
    '/blog/tags/react/': 'blog-index',
    '/blog/scrimba-review/': 'blog',
    '/docs/courses/': 'course-hub',
    '/docs/courses/react/': 'course-hub',
    '/docs/courses/react/learn-react/': 'course',
    '/docs/learn-react/': 'course',
    '/docs/paths/frontend-developer-path/': 'path',
    '/docs/pricing/pro-vs-free/': 'pricing',
    '/docs/comparisons/scrimba-vs-udemy/': 'comparison',
    '/docs/how-it-works/scrims/': 'how-it-works',
    '/docs/practice/practice-react-projects/': 'practice',
    '/roadmaps/frontend/': 'roadmap',
    '/docs/for/beginners/': 'guide',
    '/docs/intro/': 'guide',
    '/docs/faq/': 'faq-help',
    '/docs/help/billing/': 'faq-help',
    '/docs/changelog/': 'other',
    '/about/': 'other',
    '/docs/paths': 'path',
  };
  for (const [pathname, group] of Object.entries(cases)) {
    assert.equal(runHead({ pathname }).config[2].content_group, group, pathname);
  }
});

test('affiliateDestination classifies Scrimba, Udemy and docs URLs', () => {
  const cases = [
    ['https://scrimba.com/learn-javascript-c0v?via=u42d4986', 'course', 'learn-javascript-c0v'],
    ['https://scrimba.com/learn-react-c0e/~0h?via=u42d4986', 'course', 'learn-react-c0e'],
    ['https://scrimba.com/frontend-path-c0j?via=u42d4986', 'path', 'frontend-path-c0j'],
    ['https://scrimba.com/backend-path-c0tbi0l98f', 'path', 'backend-path-c0tbi0l98f'],
    ['https://scrimba.com/our-pricing?via=u42d4986', 'pricing', 'our-pricing'],
    ['https://scrimba.com/home?pricing&via=u42d4986', 'pricing', 'home'],
    ['https://scrimba.com/home?via=u42d4986', 'home', 'home'],
    ['https://scrimba.com/?via=u42d4986', 'home', 'home'],
    ['https://scrimba.com/s0v687325e?via=u42d4986', 'demo', 's0v687325e'],
    ['https://docs.scrimba.com/javascript/introduction?via=u42d4986', 'docs', 'javascript'],
    ['https://trk.udemy.com/abc123', 'udemy', 'abc123'],
    ['https://www.udemy.com/course/react/', 'udemy', 'course'],
    ['https://scrimba.com/u0abc', 'instructor', 'u0abc'],
    ['https://scrimba.com/@bobziroll', 'instructor', '@bobziroll'],
    ['https://scrimba.com/allcourses', 'catalog', 'allcourses'],
    ['https://scrimba.com/articles/some-post', 'other', 'articles'],
    ['not a url', 'other', ''],
  ];
  for (const [url, type, slug] of cases) {
    assert.deepEqual(affiliateDestination(url), { type, slug }, url);
  }
});
