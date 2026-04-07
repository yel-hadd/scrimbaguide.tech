import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractLocUrls,
  normalizeCanonicalUrl,
  renderLlmsTxt,
  renderLlmsFullTxt,
  stripMdxAndJsxFromLlmsText,
  escapeMarkdownLinkTitle,
} from '../generate-llms-from-sitemap.mjs';

test('normalizeCanonicalUrl strips trailing slash except root', () => {
  assert.equal(normalizeCanonicalUrl('https://scrimbaguide.tech/docs/learn-react/'), 'https://scrimbaguide.tech/docs/learn-react');
  assert.equal(normalizeCanonicalUrl('https://scrimbaguide.tech/'), 'https://scrimbaguide.tech/');
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

test('renderLlmsFullTxt lists all canonical URLs', () => {
  const urls = [
    'https://scrimbaguide.tech/',
    'https://scrimbaguide.tech/docs/paths',
    'https://scrimbaguide.tech/blog/post-a',
  ];

  const full = renderLlmsFullTxt(urls, { siteName: 'Scrimba Guide' });

  assert.match(full, /## All Canonical URLs/);
  assert.match(full, /https:\/\/scrimbaguide\.tech\/docs\/paths/);
  assert.match(full, /https:\/\/scrimbaguide\.tech\/blog\/post-a/);
});

test('renderLlmsFullTxt omits /blog/blog redirect stub URLs', () => {
  const urls = [
    'https://scrimbaguide.tech/blog/canonical-post',
    'https://scrimbaguide.tech/blog/blog/canonical-post/',
  ];

  const full = renderLlmsFullTxt(urls, { siteName: 'Scrimba Guide' });

  assert.match(full, /blog\/canonical-post/);
  assert.doesNotMatch(full, /blog\/blog\//);
});

test('renderLlmsFullTxt omits /docs/docs redirect stub URLs', () => {
  const urls = [
    'https://scrimbaguide.tech/docs/paths',
    'https://scrimbaguide.tech/docs/docs/paths/',
  ];

  const full = renderLlmsFullTxt(urls, { siteName: 'Scrimba Guide' });

  assert.match(full, /docs\/paths/);
  assert.doesNotMatch(full, /docs\/docs\//);
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
