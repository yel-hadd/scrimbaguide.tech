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
  extractPageMeta,
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

test('extractPageMeta reads the published title (minus site suffix) and meta description', () => {
  const html = `<html><head><title data-rh="true">Scrimba Pricing 2026 | Scrimba Guide</title>
    <meta name="description" content="What Free includes and what Pro costs."></head><body></body></html>`;
  assert.deepEqual(extractPageMeta(html), {
    title: 'Scrimba Pricing 2026',
    description: 'What Free includes and what Pro costs.',
  });
});

test('renderLlmsTxt annotates every listed URL from live page metadata, falling back to the hand-written map', () => {
  const urls = [
    'https://scrimbaguide.tech/',
    'https://scrimbaguide.tech/docs/courses/backend/',
    'https://scrimbaguide.tech/docs/pricing/',
  ];
  const metaByPath = {
    '/docs/courses/backend': { title: 'Scrimba Backend Courses', description: 'SQL, Supabase, Firebase, regex.' },
    // Live metadata wins over the stale hand-written annotation for /docs/pricing.
    '/docs/pricing': { title: 'Scrimba Pricing 2026: Free vs Pro', description: 'Live description.' },
  };
  const out = renderLlmsTxt(urls, { metaByPath });
  assert.match(out, /- \[Scrimba Backend Courses\]\(https:\/\/scrimbaguide\.tech\/docs\/courses\/backend\/\): SQL, Supabase, Firebase, regex\./);
  assert.match(out, /- \[Scrimba Pricing 2026: Free vs Pro\]\(https:\/\/scrimbaguide\.tech\/docs\/pricing\/\): Live description\./);
  // Homepage has no live meta in this test but is in PAGE_ANNOTATIONS, so it is still annotated.
  assert.match(out, /- \[[^\]]+\]\(https:\/\/scrimbaguide\.tech\/\): /);
  assert.doesNotMatch(out, /^- https:\/\/scrimbaguide\.tech\/docs\/courses\/backend\/$/m);
});

test('renderLlmsTxt lists course leaves in their own section and does not cap the blog', () => {
  const urls = [
    'https://scrimbaguide.tech/docs/courses/',
    'https://scrimbaguide.tech/docs/courses/react/',
    'https://scrimbaguide.tech/docs/courses/react/learn-react/',
    'https://scrimbaguide.tech/docs/courses/javascript/learn-javascript/',
    ...Array.from({ length: 25 }, (_, i) => `https://scrimbaguide.tech/blog/post-${i}/`),
  ];
  const out = renderLlmsTxt(urls);

  // Course leaves (depth 4) get a ## Courses section; hubs stay under ## Docs.
  assert.match(out, /^## Courses$/m);
  const courses = out.split(/^## /m).find((s) => s.startsWith('Courses'));
  assert.match(courses, /\/docs\/courses\/react\/learn-react\//);
  assert.match(courses, /\/docs\/courses\/javascript\/learn-javascript\//);
  assert.doesNotMatch(courses, /\/docs\/courses\/react\/\)/);

  // Every blog post is listed, not just the first 20.
  for (const i of [0, 19, 20, 24]) {
    assert.match(out, new RegExp(`https://scrimbaguide\\.tech/blog/post-${i}/`));
  }
});

test('htmlToLlmsMarkdown keeps FAQ questions, which render as <button>', () => {
  const html = `<!doctype html><html><head><title>FAQ | Scrimba Guide</title></head>
    <body><main><div class="markdown"><h1>FAQ Page</h1>
      <div class="faq-accordion">
        <h2 class="faq-accordion__title">Common questions</h2>
        <div class="faq-accordion__item">
          <button class="faq-accordion__question">Is Scrimba free?<span class="faq-accordion__icon" aria-hidden="true">+</span></button>
          <div class="faq-accordion__answer"><p>There is a free tier with around 24 full courses.</p></div>
        </div>
      </div>
    </div></main></body></html>`;

  const { markdown } = htmlToLlmsMarkdown(html);

  assert.match(markdown, /\*\*Q: Is Scrimba free\?\*\*/);
  assert.match(markdown, /around 24 full courses/);
  // The decorative +/- glyph is aria-hidden and must not ride along.
  assert.doesNotMatch(markdown, /Is Scrimba free\?\+/);
});

test('htmlToLlmsMarkdown labels CourseCurriculum rows instead of running fields together', () => {
  const html = `<!doctype html><html><head><title>Course | Scrimba Guide</title></head>
    <body><main><div class="markdown"><h1>Course</h1>
      <ol class="curriculum__list">
        <li class="curriculum__item">
          <span class="curriculum__index" aria-hidden="true">1</span>
          <span class="curriculum__name">Getting started</span>
          <span class="curriculum__duration">12 min</span>
          <span class="curriculum__lessons">3 lessons</span>
        </li>
      </ol>
    </div></main></body></html>`;

  const { markdown } = htmlToLlmsMarkdown(html);

  assert.match(markdown, /- Module 1: Getting started \(12 min, 3 lessons\)/);
  assert.doesNotMatch(markdown, /started12 min/);
});

test('htmlToLlmsMarkdown emits tables as valid markdown with a header separator', () => {
  const html = `<!doctype html><html><head><title>Compare | Scrimba Guide</title></head>
    <body><main><div class="markdown"><h1>Compare</h1>
      <table><thead><tr><th>Feature</th><th>Scrimba</th></tr></thead>
      <tbody><tr><td>Free tier</td><td>Around 24 courses</td></tr></tbody></table>
    </div></main></body></html>`;

  const { markdown } = htmlToLlmsMarkdown(html);

  assert.match(markdown, /\| Feature \| Scrimba \|/);
  assert.match(markdown, /\| --- \| --- \|/);
  assert.match(markdown, /\| Free tier \| Around 24 courses \|/);
});

test('htmlToLlmsMarkdown keeps screenshot alt text and separates caption from source', () => {
  const html = `<!doctype html><html><head><title>Course | Scrimba Guide</title></head>
    <body><main><div class="markdown"><h1>Course</h1>
      <figure class="screenshot">
        <img src="/img/scrimba/demo.webp" alt="The React editor mid-lesson" width="800" height="450">
        <figcaption><span class="screenshot__caption">Module 4 at 2:15.</span><span class="screenshot__source">Screenshot of scrimba.com.</span></figcaption>
      </figure>
    </div></main></body></html>`;

  const { markdown } = htmlToLlmsMarkdown(html);

  assert.match(markdown, /!\[The React editor mid-lesson\]\(https:\/\/scrimbaguide\.tech\/img\/scrimba\/demo\.webp\)/);
  assert.match(markdown, /\*Module 4 at 2:15\.\*/);
  // Caption and source must not weld into "...2:15.Screenshot of scrimba.com."
  assert.doesNotMatch(markdown, /2:15\.Screenshot/);
});

test('htmlToLlmsMarkdown drops screen-reader-only chrome from link text', () => {
  const html = `<!doctype html><html><head><title>Demo | Scrimba Guide</title></head>
    <body><main><div class="markdown"><h1>Demo</h1>
      <p><a href="https://scrimba.com/?via=x">Try Scrimba free<span class="cta-link__external-icon" aria-hidden="true">↗</span><span class="sr-only">(opens in a new tab)</span></a></p>
    </div></main></body></html>`;

  const { markdown } = htmlToLlmsMarkdown(html);

  assert.match(markdown, /\[Try Scrimba free\]\(https:\/\/scrimba\.com\/\?via=x\)/);
  assert.doesNotMatch(markdown, /opens in a new tab/);
  assert.doesNotMatch(markdown, /↗/);
});
