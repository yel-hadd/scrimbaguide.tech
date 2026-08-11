import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractLocUrls,
  normalizeCanonicalUrl,
  renderLlmsTxt,
  renderLlmsFullTxt,
  selectFullTxtUrls,
  htmlToLlmsMarkdown,
  stripMdxAndJsxFromLlmsText,
  escapeMarkdownLinkTitle,
  LOW_VALUE_PATTERNS,
  isLowValuePath,
} from '../generate-llms-from-sitemap.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

test('normalizeCanonicalUrl ensures trailing slash on every path (matches site canonicals)', () => {
  assert.equal(normalizeCanonicalUrl('https://scrimbaguide.tech/docs/learn-react'), 'https://scrimbaguide.tech/docs/learn-react/');
  assert.equal(normalizeCanonicalUrl('https://scrimbaguide.tech/docs/learn-react/'), 'https://scrimbaguide.tech/docs/learn-react/');
  assert.equal(normalizeCanonicalUrl('https://scrimbaguide.tech/'), 'https://scrimbaguide.tech/');
  assert.equal(normalizeCanonicalUrl('https://scrimbaguide.tech'), 'https://scrimbaguide.tech/');
});

test('extractLocUrls reads canonical URLs from sitemap xml', () => {
  const xml = `<?xml version="1.0"?><urlset>
    <url><loc>https://scrimbaguide.tech/</loc></url>
    <url><loc>https://scrimbaguide.tech/docs/paths</loc></url>
    <url><loc>https://scrimbaguide.tech/blog/post-a</loc></url>
  </urlset>`;

  assert.deepEqual(extractLocUrls(xml), [
    'https://scrimbaguide.tech/',
    'https://scrimbaguide.tech/docs/paths',
    'https://scrimbaguide.tech/blog/post-a',
  ]);
});

test('renderLlmsTxt includes blog and docs sections with canonical URLs', () => {
  const urls = [
    'https://scrimbaguide.tech/',
    'https://scrimbaguide.tech/docs/paths',
    'https://scrimbaguide.tech/docs/pricing',
    'https://scrimbaguide.tech/blog/post-a',
    'https://scrimbaguide.tech/search',
  ];

  const llms = renderLlmsTxt(urls, { siteName: 'Scrimba Guide' });

  assert.match(llms, /## Key Pages/);
  assert.match(llms, /## Docs/);
  assert.match(llms, /## Blog/);
  assert.match(llms, /https:\/\/scrimbaguide\.tech\/docs\/paths/);
  assert.match(llms, /https:\/\/scrimbaguide\.tech\/blog\/post-a/);
  assert.doesNotMatch(llms, /\/search/);
  assert.doesNotMatch(llms, /\.md\)/);
});

test('renderLlmsFullTxt inlines each page content under its title and source URL', () => {
  const pages = [
    { url: 'https://scrimbaguide.tech/docs/paths/', title: 'Scrimba Paths', content: '## Overview\n\nFour career paths.' },
    { url: 'https://scrimbaguide.tech/blog/post-a/', title: 'Post A', content: 'Body of post A.' },
  ];

  const full = renderLlmsFullTxt(pages, { siteName: 'Scrimba Guide' });

  assert.match(full, /# Scrimba Guide \(Full Content\)/);
  assert.match(full, /Source: https:\/\/scrimbaguide\.tech\/docs\/paths\//);
  assert.match(full, /Four career paths\./);
  assert.match(full, /Body of post A\./);
});

test('selectFullTxtUrls drops low-value and redirect-stub paths, dedupes and sorts', () => {
  const urls = [
    'https://scrimbaguide.tech/docs/paths',
    'https://scrimbaguide.tech/docs/docs/paths/',
    'https://scrimbaguide.tech/blog/blog/canonical-post/',
    'https://scrimbaguide.tech/blog/canonical-post',
    'https://scrimbaguide.tech/search',
  ];

  const kept = selectFullTxtUrls(urls);

  assert.ok(kept.includes('https://scrimbaguide.tech/docs/paths/'));
  assert.ok(kept.includes('https://scrimbaguide.tech/blog/canonical-post/'));
  assert.ok(!kept.some((u) => /docs\/docs\//.test(u)));
  assert.ok(!kept.some((u) => /blog\/blog\//.test(u)));
  assert.ok(!kept.some((u) => /\/search/.test(u)));
});

test('htmlToLlmsMarkdown extracts main content, drops chrome, converts headings and links', () => {
  const html = `<!doctype html><html><head><title>Demo | Scrimba Guide</title></head>
    <body><nav>SKIP NAV</nav><main><div class="markdown">
      <h1>Demo Page</h1>
      <p>Intro paragraph with a <a href="/docs/pricing/">pricing link</a>.</p>
      <h2>Section</h2>
      <ul><li>First</li><li>Second</li></ul>
      <script>console.log('drop me')</script>
    </div></main><footer>SKIP FOOTER</footer></body></html>`;

  const { title, markdown } = htmlToLlmsMarkdown(html);

  assert.equal(title, 'Demo Page');
  // The page h1 is captured as `title` and dropped from the body to avoid a
  // duplicate heading when renderLlmsFullTxt prints the title above the content.
  assert.doesNotMatch(markdown, /# Demo Page/);
  assert.match(markdown, /## Section/);
  assert.match(markdown, /\[pricing link\]\(https:\/\/scrimbaguide\.tech\/docs\/pricing\/\)/);
  assert.match(markdown, /- First/);
  assert.doesNotMatch(markdown, /SKIP NAV|SKIP FOOTER|drop me/);
});

test('PAGE_ANNOTATIONS carry no exact prices or stale free-course counts (regression guard)', () => {
  const src = readFileSync(fileURLToPath(new URL('../generate-llms-from-sitemap.mjs', import.meta.url)), 'utf8');
  const start = src.indexOf('const PAGE_ANNOTATIONS');
  const end = src.indexOf('export function stripMdxAndJsxFromLlmsText');
  const block = src.slice(start, end);
  assert.doesNotMatch(block, /\$\s?\d/, 'no exact dollar prices in llms annotations');
  assert.doesNotMatch(block, /\b19\+?\s+courses?\b/i, 'stale "19 courses" free-tier count must not return');
});

test('stripMdxAndJsxFromLlmsText removes component-like markup and import lines but keeps brace literals', () => {
  const raw =
    "import Foo from 'bar'\nSee <PricingCTA /> and {/* hide */} plus use {foo} and {bar_baz} in code.";
  assert.equal(
    stripMdxAndJsxFromLlmsText(raw),
    'See and plus use {foo} and {bar_baz} in code.',
  );
});

test('escapeMarkdownLinkTitle escapes brackets for markdown links', () => {
  assert.equal(escapeMarkdownLinkTitle('Title with ] bracket'), 'Title with \\] bracket');
});

/**
 * `[raw sitemap pathname, stripLocale(raw)]` pairs.
 * These pin both halves of the isLowValuePath call-site contract: under a localized sitemap
 * the raw pathname carries a locale prefix, and the raw form is a silent pass-through because
 * every low-value pattern is anchored at `^/`. Consumers must strip the prefix first.
 * The stripped column is written out literally rather than computed, so this file never has to
 * duplicate the locale roster (and cannot drift from it).
 */
const LOCALE_PREFIXED_LOW_VALUE = [
  ['/de/tags/', '/tags/'],
  ['/ja/blog/page/2/', '/blog/page/2/'],
  ['/ar/search/', '/search/'],
];

test('isLowValuePath does NOT match locale-prefixed junk paths (callers must stripLocale first)', () => {
  for (const [raw] of LOCALE_PREFIXED_LOW_VALUE) {
    assert.equal(
      isLowValuePath(raw),
      false,
      `${raw} is expected to slip through the raw filter; call isLowValuePath(stripLocale(path)) instead`,
    );
  }
});

test('isLowValuePath matches those same junk paths once the locale prefix is stripped', () => {
  for (const [raw, stripped] of LOCALE_PREFIXED_LOW_VALUE) {
    assert.equal(isLowValuePath(stripped), true, `stripLocale('${raw}') === '${stripped}' must be filtered out`);
  }
});

test('isLowValuePath keeps real content paths in both raw and locale-stripped form', () => {
  assert.equal(isLowValuePath('/docs/paths/'), false);
  assert.equal(isLowValuePath('/de/docs/paths/'), false);
});

test('every LOW_VALUE_PATTERNS entry stays ^/-anchored (the reason stripLocale is mandatory)', () => {
  for (const pattern of LOW_VALUE_PATTERNS) {
    assert.ok(
      pattern.source.startsWith('^\\/'),
      `${pattern} must stay anchored at ^/; an unanchored pattern would match substrings mid-path and silently over-filter`,
    );
  }
});
