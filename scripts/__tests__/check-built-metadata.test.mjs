import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  extractPage,
  isIndexable,
  checkPage,
  checkDuplicates,
  checkBuild,
  compareToAllowlist,
  toAllowlist,
  topLevelTypes,
  isBlogListRoute,
  routeFromFile,
  breadcrumbFacts,
} from '../check-built-metadata.mjs';

const ORIGIN = 'https://scrimbaguide.tech';

function html({
  title = 'Page | Scrimba Guide',
  ogTitle = title,
  twitterTitle = null,
  description = 'A short description.',
  canonical = `${ORIGIN}/docs/page/`,
  ogUrl = canonical,
  h1 = 1,
  jsonLd = [],
  extraHead = '',
  body = '',
} = {}) {
  const head = [
    title === null ? '' : `<title>${title}</title>`,
    description === null ? '' : `<meta name="description" content="${description}">`,
    ogTitle === null ? '' : `<meta property="og:title" content="${ogTitle}">`,
    twitterTitle === null ? '' : `<meta name="twitter:title" content="${twitterTitle}">`,
    ogUrl === null ? '' : `<meta property="og:url" content="${ogUrl}">`,
    canonical === null ? '' : `<link rel="canonical" href="${canonical}">`,
    ...jsonLd.map((block) => `<script type="application/ld+json">${typeof block === 'string' ? block : JSON.stringify(block)}</script>`),
    extraHead,
  ].join('');
  return `<!doctype html><html><head>${head}</head><body>${body}${'<h1>Heading</h1>'.repeat(h1)}</body></html>`;
}

const rules = (route, doc) => checkPage(route, extractPage(doc)).hard.map((f) => f.rule).sort();

test('a clean page has no hard findings', () => {
  assert.deepEqual(rules('/docs/page/', html()), []);
});

test('twitter:title may be absent or equal to og:title, never different', () => {
  assert.deepEqual(rules('/docs/page/', html({ twitterTitle: 'Page | Scrimba Guide' })), []);
  assert.deepEqual(rules('/docs/page/', html({ twitterTitle: 'Page...' })), ['twitter-title-mismatch']);
});

test('og:title must equal <title>', () => {
  assert.deepEqual(rules('/docs/page/', html({ ogTitle: 'Other' })), ['og-title-mismatch']);
  assert.deepEqual(rules('/docs/page/', html({ ogTitle: null })), ['og-title-mismatch']);
});

test('title missing or ending in an ellipsis fails; over 60 chars is advisory only', () => {
  assert.ok(rules('/docs/page/', html({ title: '', ogTitle: '' })).includes('title-missing'));
  assert.deepEqual(rules('/docs/page/', html({ title: 'Cut off...' })), ['title-ellipsis']);
  const long = 'x'.repeat(61);
  const result = checkPage('/docs/page/', extractPage(html({ title: long })));
  assert.deepEqual(result.hard, []);
  assert.deepEqual(result.advisory.map((f) => f.rule), ['title-over-60']);
});

test('description is required and capped at 160 characters', () => {
  assert.deepEqual(rules('/docs/page/', html({ description: null })), ['description-missing']);
  assert.deepEqual(rules('/docs/page/', html({ description: 'x'.repeat(160) })), []);
  assert.deepEqual(rules('/docs/page/', html({ description: 'x'.repeat(161) })), ['description-too-long']);
});

test('canonical and og:url must be one absolute site URL ending in a slash', () => {
  assert.deepEqual(rules('/docs/page/', html({ canonical: `${ORIGIN}/docs/page`, ogUrl: `${ORIGIN}/docs/page/` })), ['canonical-invalid']);
  assert.deepEqual(rules('/docs/page/', html({ ogUrl: '/docs/page/' })), ['og-url-invalid']);
  assert.deepEqual(rules('/docs/page/', html({ canonical: null, ogUrl: `${ORIGIN}/docs/page/` })), ['canonical-count']);
  const twoCanonicals = html({ extraHead: `<link rel="canonical" href="${ORIGIN}/other/">` });
  assert.deepEqual(rules('/docs/page/', twoCanonicals), ['canonical-count']);
});

test('exactly one h1', () => {
  assert.deepEqual(rules('/docs/page/', html({ h1: 0 })), ['h1-count']);
  assert.deepEqual(rules('/docs/page/', html({ h1: 2 })), ['h1-count']);
});

test('JSON-LD must parse and carry at most one FAQPage node', () => {
  assert.deepEqual(rules('/docs/page/', html({ jsonLd: ['{not json'] })), ['jsonld-parse']);
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] };
  assert.deepEqual(rules('/docs/page/', html({ jsonLd: [faq] })), []);
  assert.deepEqual(rules('/docs/page/', html({ jsonLd: [faq, faq] })), ['faqpage-count']);
  const nested = { '@graph': [faq, { '@type': 'WebPage', mainEntity: faq }] };
  assert.deepEqual(rules('/docs/page/', html({ jsonLd: [nested] })), ['faqpage-count']);
});

test('blog list routes are /blog/, /blog/page/N/ and /blog/tags/**', () => {
  assert.equal(isBlogListRoute('/blog/'), true);
  assert.equal(isBlogListRoute('/blog/page/3/'), true);
  assert.equal(isBlogListRoute('/blog/tags/career/'), true);
  assert.equal(isBlogListRoute('/blog/tags/career/page/2/'), true);
  assert.equal(isBlogListRoute('/blog/scrimba-review/'), false);
  assert.equal(isBlogListRoute('/blog/archive/'), false);
});

test('list pages reject top-level post schema but allow BlogPosting nested under Blog.blogPost', () => {
  const stockBlogList = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    blogPost: [{ '@type': 'BlogPosting', headline: 'Post' }],
  };
  assert.deepEqual(rules('/blog/', html({ jsonLd: [stockBlogList] })), []);
  assert.deepEqual(rules('/blog/page/2/', html({ jsonLd: [{ '@type': 'Review' }] })), ['list-page-schema']);
  assert.deepEqual(rules('/blog/tags/x/', html({ jsonLd: [{ '@graph': [{ '@type': 'BreadcrumbList' }] }] })), ['list-page-schema']);
  assert.deepEqual(rules('/blog/', html({ jsonLd: [{ '@type': ['ItemList', 'Thing'] }] })), ['list-page-schema']);
  // The same schema on a post page is fine.
  assert.deepEqual(rules('/blog/scrimba-review/', html({ jsonLd: [{ '@type': 'Review' }] })), []);
});

const crumbList = (url = `${ORIGIN}/blog/post/`) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${url}#breadcrumb`,
  itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` }],
});
const docsNav = '<nav class="theme-doc-breadcrumbs breadcrumbsContainer_x" aria-label="Breadcrumbs"><ul class="breadcrumbs"><li class="breadcrumbs__item"><a href="/">Home</a></li></ul></nav>';
const blogNav = '<nav class="blog-post-breadcrumbs container_y" aria-label="Breadcrumbs"><ul class="breadcrumbs"><li class="breadcrumbs__item"><a href="/blog/">Blog</a></li></ul></nav>';

test('one BreadcrumbList is fine; a second one anywhere fails', () => {
  assert.deepEqual(rules('/blog/post/', html({ jsonLd: [crumbList()], body: blogNav })), []);
  assert.deepEqual(rules('/blog/post/', html({ jsonLd: [crumbList(), crumbList()] })), ['breadcrumblist-count']);
  assert.deepEqual(rules('/docs/a/', html({ jsonLd: [crumbList(), { '@graph': [crumbList()] }] })), ['breadcrumblist-count']);
});

test('a breadcrumb property may reference the BreadcrumbList by @id, never restate it', () => {
  const byRef = { '@type': 'WebPage', breadcrumb: { '@id': `${ORIGIN}/blog/post/#breadcrumb` } };
  assert.deepEqual(rules('/blog/post/', html({ jsonLd: [crumbList(), byRef] })), []);
  const inlineList = { '@type': 'WebPage', breadcrumb: crumbList() };
  assert.deepEqual(rules('/blog/post/', html({ jsonLd: [inlineList] })), []);
  assert.deepEqual(rules('/blog/post/', html({ jsonLd: [crumbList(), inlineList] })), [
    'breadcrumb-property-duplicate',
    'breadcrumblist-count',
  ]);
  const text = { '@type': 'WebPage', breadcrumb: 'Home > Blog > Post' };
  assert.deepEqual(rules('/blog/post/', html({ jsonLd: [text] })), []);
  assert.deepEqual(rules('/blog/post/', html({ jsonLd: [crumbList(), text] })), ['breadcrumb-property-duplicate']);
});

test('breadcrumbFacts counts nodes and inline properties across blocks', () => {
  assert.deepEqual(breadcrumbFacts([crumbList(), { '@graph': [{ '@type': 'WebPage', breadcrumb: crumbList() }] }]), {
    listNodes: 2,
    inlineProps: 1,
    inlineLists: 1,
  });
});

test('at most one visible breadcrumbs nav, and none on blog list pages', () => {
  assert.deepEqual(rules('/docs/a/', html({ body: docsNav })), []);
  assert.deepEqual(rules('/docs/a/', html({ body: docsNav + blogNav })), ['breadcrumb-nav-count']);
  const bareNav = '<nav><ul class="breadcrumbs"></ul></nav>';
  assert.deepEqual(rules('/docs/a/', html({ body: docsNav + bareNav })), ['breadcrumb-nav-count']);
  // Other navs (pagination, TOC) do not count.
  assert.deepEqual(rules('/docs/a/', html({ body: `${docsNav}<nav aria-label="Blog post page navigation"></nav>` })), []);
  assert.deepEqual(rules('/blog/', html({ body: blogNav })), ['list-page-breadcrumbs']);
  assert.deepEqual(rules('/blog/tags/career/', html({ body: blogNav })), ['list-page-breadcrumbs']);
});

test('topLevelTypes reads root objects, arrays and @graph members only', () => {
  assert.deepEqual(topLevelTypes({ '@type': 'Blog', blogPost: [{ '@type': 'BlogPosting' }] }), ['Blog']);
  assert.deepEqual(topLevelTypes([{ '@type': 'A' }, { '@graph': [{ '@type': 'B' }] }]), ['A', 'B']);
});

test('noindex pages and client-redirect stubs are not indexable', () => {
  assert.equal(isIndexable(extractPage(html())), true);
  assert.equal(isIndexable(extractPage(html({ extraHead: '<meta name="robots" content="noindex, follow">' }))), false);
  assert.equal(isIndexable(extractPage(html({ extraHead: '<meta http-equiv="refresh" content="0; url=/x/">' }))), false);
});

test('duplicate titles and descriptions are flagged on every page that shares them', () => {
  const pages = new Map([
    ['/a/', extractPage(html({ title: 'Same', description: 'One' }))],
    ['/b/', extractPage(html({ title: 'Same', description: 'Two' }))],
    ['/c/', extractPage(html({ title: 'Other', description: 'Two' }))],
  ]);
  const found = checkDuplicates(pages).map((f) => `${f.rule} ${f.route}`).sort();
  assert.deepEqual(found, [
    'duplicate-description /b/',
    'duplicate-description /c/',
    'duplicate-title /a/',
    'duplicate-title /b/',
  ]);
});

test('routeFromFile maps build paths to trailing-slash routes', () => {
  assert.equal(routeFromFile('/b', '/b/index.html'), '/');
  assert.equal(routeFromFile('/b', '/b/docs/intro/index.html'), '/docs/intro/');
});

test('ratchet: unlisted findings and stale allowlist entries both surface', () => {
  const findings = [
    { rule: 'h1-count', route: '/a/' },
    { rule: 'h1-count', route: '/b/' },
  ];
  const allowlist = toAllowlist([{ rule: 'h1-count', route: '/a/' }, { rule: 'faqpage-count', route: '/gone/' }]);
  const { unlisted, stale } = compareToAllowlist(findings, allowlist);
  assert.deepEqual(unlisted.map((f) => f.route), ['/b/']);
  assert.deepEqual(stale, ['faqpage-count /gone/']);
  assert.deepEqual(compareToAllowlist(findings, toAllowlist(findings)), { unlisted: [], stale: [] });
});

test('checkBuild walks a build directory and skips stubs and noindex pages', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'metadata-'));
  try {
    const write = (rel, doc) => {
      fs.mkdirSync(path.join(dir, rel), { recursive: true });
      fs.writeFileSync(path.join(dir, rel, 'index.html'), doc);
    };
    write('', html({ title: 'Home', canonical: `${ORIGIN}/` }));
    write('docs/a', html({ title: 'A', canonical: `${ORIGIN}/docs/a/`, h1: 0 }));
    write('old', html({ title: '', extraHead: '<meta http-equiv="refresh" content="0; url=/docs/a/">' }));
    write('search', html({ title: 'Search', extraHead: '<meta name="robots" content="noindex, follow">' }));
    const result = checkBuild(dir);
    assert.equal(result.total, 4);
    assert.equal(result.indexable, 2);
    assert.deepEqual(result.hard.map((f) => `${f.rule} ${f.route}`), [
      'duplicate-description /',
      'duplicate-description /docs/a/',
      'h1-count /docs/a/',
    ]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
