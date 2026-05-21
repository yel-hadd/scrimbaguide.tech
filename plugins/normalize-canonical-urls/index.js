/**
 * Docusaurus postBuild plugin: normalize canonical/og:url/twitter:url + JSON-LD
 * URLs in generated HTML so they match `trailingSlash: true`.
 *
 * Docusaurus 3.x emits `<link rel="canonical">` and `<meta property="og:url">`
 * without trailing slashes even when trailingSlash is true. That mismatch with
 * the sitemap and hreflang causes GSC "Alternate page with proper canonical" /
 * "Duplicate without user-selected canonical" warnings.
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const SITE_ORIGIN = 'https://scrimbaguide.tech';

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

function rewriteHtml(html) {
  let out = html;

  out = out.replace(
    /(<link[^>]*rel=["']canonical["'][^>]*href=["'])([^"']+)(["'])/gi,
    (_, a, url, c) => a + addTrailingSlash(url) + c,
  );

  out = out.replace(
    /(<meta[^>]*property=["']og:url["'][^>]*content=["'])([^"']+)(["'])/gi,
    (_, a, url, c) => a + addTrailingSlash(url) + c,
  );

  out = out.replace(
    /(<meta[^>]*name=["']twitter:url["'][^>]*content=["'])([^"']+)(["'])/gi,
    (_, a, url, c) => a + addTrailingSlash(url) + c,
  );

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
      for (const file of htmlFiles) {
        const input = await fs.readFile(file, 'utf8');
        const output = rewriteHtml(input);
        if (output !== input) {
          await fs.writeFile(file, output, 'utf8');
          rewritten += 1;
        }
      }
      console.log(
        `[normalize-canonical-urls] rewrote ${rewritten}/${htmlFiles.length} HTML files`,
      );
    },
  };
};
