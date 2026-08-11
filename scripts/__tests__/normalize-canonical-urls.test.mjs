import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The plugin is CommonJS (Docusaurus loads it from the `plugins` array), and its
// `module.exports` is the plugin factory with the helpers attached. `createRequire`
// gets at those helpers without depending on Node's CJS named-export detection,
// which does not see properties attached after a `module.exports = fn` assignment.
const require = createRequire(import.meta.url);
const normalizeCanonicalUrlsPlugin = require('../../plugins/normalize-canonical-urls/index.js');
const {
  addTrailingSlash,
  rewriteHtml,
  assertNormalizedUrls,
  classifyDocument,
  collectUrlTags,
  formatViolations,
} = require('../../plugins/normalize-canonical-urls/index.js');

const ORIGIN = 'https://scrimbaguide.tech';

/** A Docusaurus-rendered page: the `__docusaurus` root is what marks it as one. */
function page(head, body = '') {
  return `<!DOCTYPE html><html lang="en"><head>${head}</head><body><div id="__docusaurus">${body}</div></body></html>`;
}

/** A `plugin-client-redirects` stub, verbatim in shape from its own template. */
function redirectStub(to) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}" /></head></html>`;
}

// ---------------------------------------------------------------------------
// rewrite: attribute-order independence (the actual bug this unit fixes)
// ---------------------------------------------------------------------------

test('rewrites a canonical emitted in Docusaurus current order (rel before href)', () => {
  const html = page(`<link data-rh="true" rel="canonical" href="${ORIGIN}/docs/pricing">`);
  assert.match(rewriteHtml(html), /href="https:\/\/scrimbaguide\.tech\/docs\/pricing\/"/);
});

test('rewrites a canonical emitted with href before rel (the silent-failure case)', () => {
  const html = page(`<link data-rh="true" href="${ORIGIN}/docs/pricing" rel="canonical">`);
  const out = rewriteHtml(html);
  assert.match(out, /href="https:\/\/scrimbaguide\.tech\/docs\/pricing\/"/);
  // The old regex required rel-before-href and would have left this untouched.
  assert.doesNotMatch(out, /docs\/pricing"/);
});

test('rewrites single-quoted attributes and keeps the quote style', () => {
  const html = page(`<link href='${ORIGIN}/blog/scrimba-review' rel='canonical'>`);
  const out = rewriteHtml(html);
  assert.match(out, /href='https:\/\/scrimbaguide\.tech\/blog\/scrimba-review\/'/);
});

test('preserves surrounding attributes and the self-closing slash', () => {
  const html = page(
    `<link data-rh="true" rel="canonical" href="${ORIGIN}/docs/paths" data-test="keep" />`,
  );
  const out = rewriteHtml(html);
  assert.match(out, /<link data-rh="true" rel="canonical" href="https:\/\/scrimbaguide\.tech\/docs\/paths\/" data-test="keep" \/>/);
});

test('matches a canonical inside a multi-token rel list', () => {
  const html = page(`<link rel="alternate canonical" href="${ORIGIN}/docs/faq">`);
  assert.match(rewriteHtml(html), /href="https:\/\/scrimbaguide\.tech\/docs\/faq\/"/);
});

test('rewrites og:url and twitter:url regardless of attribute order', () => {
  const html = page(
    `<meta data-rh="true" property="og:url" content="${ORIGIN}/blog/a">` +
      `<meta data-rh="true" content="${ORIGIN}/blog/b" name="twitter:url">`,
  );
  const out = rewriteHtml(html);
  assert.match(out, /content="https:\/\/scrimbaguide\.tech\/blog\/a\/"/);
  assert.match(out, /content="https:\/\/scrimbaguide\.tech\/blog\/b\/"/);
});

test('leaves foreign origins, extension paths and unrelated tags alone', () => {
  const html = page(
    `<link rel="canonical" href="${ORIGIN}/404.html">` +
      `<link rel="preconnect" href="https://fonts.googleapis.com">` +
      `<meta property="og:image" content="${ORIGIN}/img/card">` +
      `<meta property="article:publisher" content="https://scrimba.com/blog">`,
  );
  assert.equal(rewriteHtml(html), html);
});

test('normalizes JSON-LD url/@id/item/mainEntityOfPage as before', () => {
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', item: `${ORIGIN}/docs/courses` }],
    mainEntityOfPage: `${ORIGIN}/docs/courses/react`,
    '@id': `${ORIGIN}/#organization`,
    sameAs: `${ORIGIN}/about`,
  });
  const out = rewriteHtml(page(`<script type="application/ld+json">${ld}</script>`));
  assert.match(out, /"item":"https:\/\/scrimbaguide\.tech\/docs\/courses\/"/);
  assert.match(out, /"mainEntityOfPage":"https:\/\/scrimbaguide\.tech\/docs\/courses\/react\/"/);
  assert.match(out, /"@id":"https:\/\/scrimbaguide\.tech\/#organization"/);
  // `sameAs` is not in the rewrite list and must stay untouched.
  assert.match(out, /"sameAs":"https:\/\/scrimbaguide\.tech\/about"/);
});

test('rewriting is idempotent', () => {
  const html = page(
    `<link rel="canonical" href="${ORIGIN}/docs/pricing">` +
      `<meta property="og:url" content="${ORIGIN}/docs/pricing">`,
  );
  const once = rewriteHtml(html);
  assert.equal(rewriteHtml(once), once);
});

test('SCOPE LIMIT: hreflang alternates are never rewritten by this plugin', () => {
  // Plan section 4 Phase 2 makes the ejected SiteMetadata the single owner of
  // hreflang emission. A slashless hreflang here must survive untouched.
  const html = page(
    `<link rel="canonical" href="${ORIGIN}/docs/pricing/">` +
      `<link rel="alternate" hreflang="de" href="${ORIGIN}/de/docs/pricing">` +
      `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/docs/pricing">`,
  );
  assert.equal(rewriteHtml(html), html);
});

test('addTrailingSlash keeps query strings and hashes intact', () => {
  assert.equal(addTrailingSlash(`${ORIGIN}/docs/a?x=1#h`), `${ORIGIN}/docs/a/?x=1#h`);
  assert.equal(addTrailingSlash('/docs/relative'), '/docs/relative');
  assert.equal(addTrailingSlash('https://scrimba.com/pricing'), 'https://scrimba.com/pricing');
});

// ---------------------------------------------------------------------------
// assert: invariant 12 (asserted, not assumed)
// ---------------------------------------------------------------------------

test('a clean page passes the assertion', () => {
  const html = page(
    `<link data-rh="true" rel="canonical" href="${ORIGIN}/docs/pricing/">` +
      `<meta data-rh="true" property="og:url" content="${ORIGIN}/docs/pricing/">` +
      `<meta data-rh="true" name="twitter:url" content="${ORIGIN}/docs/pricing/">` +
      `<link rel="alternate" hreflang="de" href="${ORIGIN}/de/docs/pricing/">`,
  );
  assert.deepEqual(assertNormalizedUrls(html), []);
});

test('two canonicals on one page fail', () => {
  const html = page(
    `<link rel="canonical" href="${ORIGIN}/docs/pricing/">` +
      `<link rel="canonical" href="${ORIGIN}/docs/pricing/">`,
  );
  const problems = assertNormalizedUrls(html);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /exactly 1 rel=canonical link, found 2/);
});

test('zero canonicals on a rendered page fail', () => {
  const problems = assertNormalizedUrls(page('<title>No canonical</title>'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /found 0/);
});

test('a canonical missing its trailing slash fails', () => {
  // Asserted on raw HTML on purpose: this is the safety net for the day the
  // rewrite stops matching, so it must not depend on the rewrite having run.
  const problems = assertNormalizedUrls(
    page(`<link rel="canonical" href="${ORIGIN}/docs/pricing">`),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /canonical is missing its trailing slash/);
});

test('a relative canonical on a rendered page fails', () => {
  const problems = assertNormalizedUrls(page('<link rel="canonical" href="/docs/pricing/">'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /canonical is not an absolute URL/);
});

test('a canonical pointing at a foreign origin fails', () => {
  const problems = assertNormalizedUrls(
    page('<link rel="canonical" href="https://scrimba.com/pricing/">'),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /foreign origin \(https:\/\/scrimba\.com\)/);
});

test('slashless og:url and twitter:url fail even when the canonical is fine', () => {
  const problems = assertNormalizedUrls(
    page(
      `<link rel="canonical" href="${ORIGIN}/blog/a/">` +
        `<meta property="og:url" content="${ORIGIN}/blog/a">` +
        `<meta name="twitter:url" content="${ORIGIN}/blog/a">`,
    ),
  );
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^og:url is missing its trailing slash/);
  assert.match(problems[1], /^twitter:url is missing its trailing slash/);
});

test('an extension path (Docusaurus /404.html) passes, mirroring addTrailingSlash', () => {
  assert.deepEqual(
    assertNormalizedUrls(page(`<link rel="canonical" href="${ORIGIN}/404.html">`)),
    [],
  );
});

test('an empty canonical href fails', () => {
  const problems = assertNormalizedUrls(page('<link rel="canonical" href="">'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /canonical is empty/);
});

test('a rewritten dirty page ends up clean', () => {
  const html = page(
    `<link data-rh="true" href="${ORIGIN}/docs/paths/frontend-developer-path" rel="canonical">` +
      `<meta data-rh="true" property="og:url" content="${ORIGIN}/docs/paths/frontend-developer-path">`,
  );
  assert.notDeepEqual(assertNormalizedUrls(html), []);
  assert.deepEqual(assertNormalizedUrls(rewriteHtml(html)), []);
});

// ---------------------------------------------------------------------------
// document classification: pages vs redirect stubs vs static assets
// ---------------------------------------------------------------------------

test('classifies rendered pages, redirect stubs and static assets', () => {
  assert.equal(classifyDocument(page('<title>x</title>')), 'page');
  assert.equal(classifyDocument(redirectStub('/blog/target/')), 'redirect');
  assert.equal(
    classifyDocument('<!DOCTYPE html><html><head><meta name="robots" content="noindex"></head><body>printable</body></html>'),
    'asset',
  );
  // A page that merely quotes a meta-refresh snippet is still a page, so it
  // keeps the strict absolute-canonical rule.
  assert.equal(
    classifyDocument(page('<title>x</title>', '<code>&lt;meta http-equiv="refresh"&gt;</code>')),
    'page',
  );
});

test('a redirect stub keeps its root-relative canonical but still needs the slash', () => {
  assert.deepEqual(assertNormalizedUrls(redirectStub('/blog/portfolio-projects-get-hired-2026/')), []);
  const problems = assertNormalizedUrls(redirectStub('/blog/portfolio-projects-get-hired-2026'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /canonical is missing its trailing slash/);
});

test('static passthrough HTML without a canonical is skipped, not reported', () => {
  const printable = '<!DOCTYPE html><html><head><meta name="robots" content="noindex, nofollow"><title>90-day plan</title></head><body><h1>Plan</h1></body></html>';
  assert.deepEqual(assertNormalizedUrls(printable), []);
});

// ---------------------------------------------------------------------------
// reporting
// ---------------------------------------------------------------------------

test('collectUrlTags reports every owned URL in source order', () => {
  const tags = collectUrlTags(
    page(
      `<link rel="canonical" href="${ORIGIN}/a/">` +
        `<meta property="og:url" content="${ORIGIN}/a/">` +
        `<meta name="twitter:url" content="${ORIGIN}/a/">` +
        `<link rel="alternate" hreflang="de" href="${ORIGIN}/de/a/">`,
    ),
  );
  assert.deepEqual(
    tags.map((t) => t.kind),
    ['canonical', 'og:url', 'twitter:url'],
  );
});

// ---------------------------------------------------------------------------
// postBuild wiring: rewrite to disk, then fail the build on a violation
// ---------------------------------------------------------------------------

/** Builds a throwaway `outDir` of HTML fixtures and returns its path. */
async function withOutDir(files, run) {
  const outDir = await mkdtemp(join(tmpdir(), 'normalize-canonical-'));
  try {
    for (const [relPath, contents] of Object.entries(files)) {
      const full = join(outDir, relPath);
      await mkdir(join(full, '..'), { recursive: true });
      await writeFile(full, contents, 'utf8');
    }
    return await run(outDir);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}

test('postBuild rewrites files on disk and passes on a clean tree', async () => {
  await withOutDir(
    {
      'docs/pricing/index.html': page(
        `<link data-rh="true" href="${ORIGIN}/docs/pricing" rel="canonical">` +
          `<meta data-rh="true" property="og:url" content="${ORIGIN}/docs/pricing">`,
      ),
      'blog/old-slug/index.html': redirectStub('/blog/new-slug/'),
      'downloads/plan.html': '<!DOCTYPE html><html><head><title>Plan</title></head><body>x</body></html>',
    },
    async (outDir) => {
      await normalizeCanonicalUrlsPlugin().postBuild({ outDir });
      const written = await readFile(join(outDir, 'docs/pricing/index.html'), 'utf8');
      assert.match(written, /rel="canonical"/);
      assert.match(written, /href="https:\/\/scrimbaguide\.tech\/docs\/pricing\/"/);
      assert.match(written, /content="https:\/\/scrimbaguide\.tech\/docs\/pricing\/"/);
    },
  );
});

test('postBuild throws when a page violates the canonical invariant', async () => {
  await withOutDir(
    {
      // Two canonicals: unfixable by the rewrite, so only the assertion catches it.
      'docs/faq/index.html': page(
        `<link rel="canonical" href="${ORIGIN}/docs/faq/">` +
          `<link rel="canonical" href="${ORIGIN}/docs/faq/">`,
      ),
    },
    async (outDir) => {
      await assert.rejects(
        () => normalizeCanonicalUrlsPlugin().postBuild({ outDir }),
        (error) => {
          assert.match(error.message, /canonical invariant violated in 1 file\(s\)/);
          assert.match(error.message, /docs\/faq\/index\.html/);
          return true;
        },
      );
    },
  );
});

test('the failure message names offenders and caps the list with a count', () => {
  const violations = Array.from({ length: 23 }, (_, i) => ({
    file: `docs/page-${i}/index.html`,
    problems: ['canonical is missing its trailing slash: https://scrimbaguide.tech/x'],
  }));
  const message = formatViolations(violations);
  assert.match(message, /violated in 23 file\(s\)/);
  assert.match(message, /docs\/page-0\/index\.html/);
  assert.match(message, /docs\/page-19\/index\.html/);
  assert.doesNotMatch(message, /docs\/page-20\/index\.html/);
  assert.match(message, /\.\.\.and 3 more file\(s\)/);
});
