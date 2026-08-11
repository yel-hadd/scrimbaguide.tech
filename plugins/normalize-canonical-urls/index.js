/**
 * Docusaurus postBuild plugin: normalize canonical/og:url/twitter:url + JSON-LD
 * URLs in generated HTML so they match `trailingSlash: true`, then assert that
 * the normalization actually happened.
 *
 * Docusaurus 3.x emits `<link rel="canonical">` and `<meta property="og:url">`
 * without trailing slashes even when trailingSlash is true. That mismatch with
 * the sitemap and hreflang causes GSC "Alternate page with proper canonical" /
 * "Duplicate without user-selected canonical" warnings.
 *
 * Two responsibilities, in this order, per HTML file:
 *   1. REWRITE - normalize same-origin URLs to their trailing-slash form.
 *   2. ASSERT  - fail the build when a rendered page does not end up with
 *                exactly one canonical that is absolute and trailing-slash.
 *
 * Why the assertion exists (i18n plan invariant 12, issue C6, risk R4): the
 * rewrite used to be a regex that required `rel` to appear *before* `href`
 * (`<link[^>]*rel="canonical"[^>]*href="...">`). Docusaurus happens to emit
 * `<link data-rh="true" rel="canonical" href="...">`, so it matched - but if
 * react-helmet ever reorders those attributes the rewrite silently becomes a
 * no-op and NOTHING fails. Under i18n that is the hreflang-collapse vector: a
 * non-normalized canonical disagrees with the trailing-slash hreflang URLs
 * that `useAlternatePageUtils` emits, and Google drops the whole cluster's
 * annotations. So the rewrite below parses tags attribute-order-independently,
 * and the assertion proves the result instead of trusting the parser.
 *
 * SCOPE LIMIT - DO NOT ADD HREFLANG EMISSION HERE. This plugin must never emit,
 * rewrite, or remove `<link rel="alternate" hreflang>` tags. Plan section 4
 * Phase 2 ejects `theme-classic/SiteMetadata` as the *single* owner of hreflang
 * emission, driven by `i18n/coverage.json`. Two owners means two sources of
 * truth and guaranteed skew. Anything hreflang-related that belongs in this
 * file is assert-only.
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const SITE_ORIGIN = 'https://scrimbaguide.tech';

/** Cap on how many offending files a failure message names before summarizing. */
const MAX_REPORTED_FILES = 20;

function addTrailingSlash(url) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== SITE_ORIGIN) return url;
    if (/\.[a-z0-9]+$/i.test(parsed.pathname)) return url;
    if (!parsed.pathname.endsWith('/')) parsed.pathname += '/';
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Every `<link>`/`<meta>` tag in the document. Attribute values are entity
 * escaped by React (`<`, `>`, `"`, `'`, `&`), so `[^>]*` cannot run past the
 * end of a tag in Docusaurus-rendered output.
 */
const URL_TAG_PATTERN = '<(link|meta)\\b[^>]*>';

/**
 * Parses a single tag's attributes into a lowercase-keyed map. First occurrence
 * of a name wins, which is how browsers resolve duplicate attributes.
 */
function parseTagAttributes(tagSource) {
  const attrs = {};
  const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g;
  let match;
  while ((match = attrPattern.exec(tagSource)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (!(name in attrs)) attrs[name] = value;
  }
  return attrs;
}

/** `rel` is a space-separated token list (`rel="alternate canonical"` is legal). */
function hasRelToken(relValue, token) {
  if (typeof relValue !== 'string') return false;
  return relValue.trim().toLowerCase().split(/\s+/).includes(token);
}

/**
 * Decides whether a tag carries a URL this plugin owns, and which attribute
 * holds it. Returns null for every other tag.
 *
 * `og:url` is emitted with `property=` and `twitter:url` with `name=`, but both
 * spellings are accepted for both: the entire point of this pass is to stop
 * depending on one exact serialization of a tag we do not control.
 */
function classifyUrlTag(tagName, attrs) {
  if (tagName.toLowerCase() === 'link') {
    return hasRelToken(attrs.rel, 'canonical') ? { kind: 'canonical', attr: 'href' } : null;
  }
  // meta
  const key = (attrs.property ?? attrs.name ?? '').toLowerCase();
  if (key === 'og:url') return { kind: 'og:url', attr: 'content' };
  if (key === 'twitter:url') return { kind: 'twitter:url', attr: 'content' };
  return null;
}

/**
 * Rewrites one attribute's value in place, preserving the original quote style
 * so the diff against Docusaurus' own output is limited to the URL itself.
 * `attrName` is always a literal from this file, never user input, so building
 * a RegExp from it is safe.
 */
function rewriteTagAttribute(tagSource, attrName, transform) {
  const pattern = new RegExp(
    `(\\s${attrName}\\s*=\\s*)(?:"([^"]*)"|'([^']*)'|([^\\s"'\`=<>]+))`,
    'i',
  );
  return tagSource.replace(pattern, (match, prefix, doubleQuoted, singleQuoted, unquoted) => {
    const value = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
    const quote = singleQuoted !== undefined ? "'" : '"';
    return `${prefix}${quote}${transform(value)}${quote}`;
  });
}

/** All canonical/og:url/twitter:url values in the document, in source order. */
function collectUrlTags(html) {
  const found = [];
  for (const [tagSource, tagName] of html.matchAll(new RegExp(URL_TAG_PATTERN, 'gi'))) {
    const attrs = parseTagAttributes(tagSource);
    const target = classifyUrlTag(tagName, attrs);
    if (target) found.push({ kind: target.kind, value: attrs[target.attr] ?? '' });
  }
  return found;
}

function rewriteHtml(html) {
  let out = html;

  out = out.replace(new RegExp(URL_TAG_PATTERN, 'gi'), (tagSource, tagName) => {
    const target = classifyUrlTag(tagName, parseTagAttributes(tagSource));
    if (!target) return tagSource;
    return rewriteTagAttribute(tagSource, target.attr, addTrailingSlash);
  });

  out = out.replace(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (match, body) => {
      const trimmed = body.trim();
      if (!trimmed.includes(SITE_ORIGIN)) return match;
      try {
        const parsed = JSON.parse(trimmed);
        const fixed = fixJsonLdUrls(parsed);
        return match.replace(body, JSON.stringify(fixed));
      } catch {
        return match;
      }
    },
  );

  return out;
}

function fixJsonLdUrls(node) {
  if (Array.isArray(node)) return node.map(fixJsonLdUrls);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (
        (k === 'item' || k === 'url' || k === '@id' || k === 'mainEntityOfPage' || k === 'contentUrl' || k === 'target') &&
        typeof v === 'string'
      ) {
        out[k] = addTrailingSlash(v);
      } else {
        out[k] = fixJsonLdUrls(v);
      }
    }
    return out;
  }
  return node;
}

/**
 * Not every `.html` file in `outDir` is a rendered page, and the three classes
 * carry different guarantees:
 *
 *  - `page`     a Docusaurus-rendered route (has the `__docusaurus` SSR root).
 *               Full invariant 12 applies.
 *  - `redirect` a `plugin-client-redirects` stub. Its markup comes from
 *               `plugin-client-redirects/lib/templates/redirectPage.template.html.js`,
 *               which emits a *root-relative* canonical (`href="/blog/x/"`) that
 *               we deliberately do not rewrite - making it absolute would be a
 *               head-tag change outside the allowed-delta list, and the stub is
 *               never an indexable destination anyway. The trailing slash still
 *               matters (a slashless target means an extra 301 hop), so that
 *               half of the invariant is enforced.
 *  - `asset`    hand-authored HTML copied verbatim from `static/` (the
 *               `/downloads/*.html` printables, which are `noindex, nofollow`).
 *               No canonical by design, so it is skipped entirely rather than
 *               being reported as a missing canonical every build.
 *
 * The page check runs first: a real page could legitimately quote a
 * `http-equiv="refresh"` snippet in its prose, and misclassifying it would
 * silently weaken the assertion.
 */
function classifyDocument(html) {
  if (/<div[^>]+id=["']__docusaurus["']/i.test(html)) return 'page';
  if (/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?/i.test(html)) return 'redirect';
  return 'asset';
}

/**
 * Returns a human-readable reason when `url` is not an absolute, same-origin,
 * trailing-slash URL, or null when it is fine. The file-extension exemption
 * mirrors `addTrailingSlash` exactly, so the assertion can never demand a shape
 * the rewrite refuses to produce (e.g. Docusaurus' own `/404.html`).
 */
function checkNormalizedUrl(url) {
  if (!url) return 'is empty';
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return 'is not an absolute URL';
  }
  if (parsed.origin !== SITE_ORIGIN) return `points at a foreign origin (${parsed.origin})`;
  if (/\.[a-z0-9]+$/i.test(parsed.pathname)) return null;
  if (!parsed.pathname.endsWith('/')) return 'is missing its trailing slash';
  return null;
}

/** Same trailing-slash rule, but tolerant of the root-relative stub canonicals. */
function checkRedirectTargetUrl(url) {
  if (!url) return 'is empty';
  const pathname = url.split(/[?#]/)[0];
  if (/\.[a-z0-9]+$/i.test(pathname)) return null;
  if (!pathname.endsWith('/')) return 'is missing its trailing slash';
  return null;
}

/**
 * Invariant 12: exactly one canonical per page, absolute, trailing-slash - and
 * the same absolute+trailing-slash shape for og:url / twitter:url where present.
 * Returns a list of problem strings (empty means the file is clean).
 *
 * Assert-only for hreflang: `<link rel="alternate" hreflang>` is owned by
 * `SiteMetadata`, so it is never touched here. See the scope limit at the top.
 */
function assertNormalizedUrls(html) {
  const documentKind = classifyDocument(html);
  if (documentKind === 'asset') return [];

  const tags = collectUrlTags(html);
  const problems = [];

  const canonicalCount = tags.filter((tag) => tag.kind === 'canonical').length;
  if (canonicalCount !== 1) {
    problems.push(`expected exactly 1 rel=canonical link, found ${canonicalCount}`);
  }

  const check = documentKind === 'redirect' ? checkRedirectTargetUrl : checkNormalizedUrl;
  for (const tag of tags) {
    const reason = check(tag.value);
    if (reason) problems.push(`${tag.kind} ${reason}: ${tag.value || '(empty)'}`);
  }

  return problems;
}

function formatViolations(violations) {
  const shown = violations.slice(0, MAX_REPORTED_FILES);
  const lines = shown.map(
    ({ file, problems }) => `  ${file}\n${problems.map((p) => `    - ${p}`).join('\n')}`,
  );
  const omitted = violations.length - shown.length;
  if (omitted > 0) lines.push(`  ...and ${omitted} more file(s)`);
  return [
    `[normalize-canonical-urls] canonical invariant violated in ${violations.length} file(s).`,
    'Every rendered page needs exactly one rel=canonical link, absolute and trailing-slash,',
    'and the same shape for og:url / twitter:url. Offenders:',
    ...lines,
  ].join('\n');
}

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

module.exports = function normalizeCanonicalUrlsPlugin() {
  return {
    name: 'normalize-canonical-urls',
    async postBuild({ outDir }) {
      const htmlFiles = await walk(outDir);
      let rewritten = 0;
      let asserted = 0;
      const violations = [];

      for (const file of htmlFiles) {
        const input = await fs.readFile(file, 'utf8');
        const output = rewriteHtml(input);
        if (output !== input) {
          await fs.writeFile(file, output, 'utf8');
          rewritten += 1;
        }
        // Assert against what was actually written to disk, not against the
        // input: the point is to prove the emitted HTML is correct.
        if (classifyDocument(output) !== 'asset') asserted += 1;
        const problems = assertNormalizedUrls(output);
        if (problems.length) {
          violations.push({ file: path.relative(outDir, file), problems });
        }
      }

      console.log(
        `[normalize-canonical-urls] rewrote ${rewritten}/${htmlFiles.length} HTML files`,
      );
      console.log(
        `[normalize-canonical-urls] canonical invariant checked on ${asserted}/${htmlFiles.length} HTML files`,
      );

      if (violations.length > 0) {
        throw new Error(formatViolations(violations));
      }
    },
  };
};

// Named exports for the unit tests (scripts/__tests__/normalize-canonical-urls.test.mjs).
// The plugin entry point stays the default CommonJS export so the `plugins`
// array in docusaurus.config.ts keeps working unchanged.
module.exports.addTrailingSlash = addTrailingSlash;
module.exports.rewriteHtml = rewriteHtml;
module.exports.assertNormalizedUrls = assertNormalizedUrls;
module.exports.classifyDocument = classifyDocument;
module.exports.collectUrlTags = collectUrlTags;
module.exports.formatViolations = formatViolations;
module.exports.SITE_ORIGIN = SITE_ORIGIN;
module.exports.MAX_REPORTED_FILES = MAX_REPORTED_FILES;
