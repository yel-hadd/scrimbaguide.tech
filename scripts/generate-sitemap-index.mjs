#!/usr/bin/env node

/**
 * Emit the root `sitemap-index.xml` for the merged multi-locale tree
 * (I18N-PLAN.md section 4 Phase 3).
 *
 * Every locale build produces its own `sitemap.xml` (Docusaurus writes one per `outDir`, so
 * English lands at `build/sitemap.xml` and `de` at `build/de/sitemap.xml`). Search engines are
 * only told about ONE file, so the assemble job stitches the per-locale sitemaps into a
 * `<sitemapindex>` at the root. `/sitemap.xml` stays published and listed in robots.txt for
 * continuity: it is still the English sitemap, and dropping it would retire a URL that Search
 * Console has been fed for months.
 *
 * Usage:
 *   node scripts/generate-sitemap-index.mjs --build-dir merged --locales en,de,fr
 *   node scripts/generate-sitemap-index.mjs --build-dir build --locales en --out build/sitemap-index.xml
 *
 * Options:
 *   --build-dir <dir>      merged tree to scan            (default: build)
 *   --site-url <url>       absolute site origin           (default: https://scrimbaguide.tech)
 *   --locales <list>       comma-separated LIVE locales   (default: en)
 *   --default-locale <l>   locale served at the bare root (default: en)
 *   --out <file>           output path                    (default: <build-dir>/sitemap-index.xml)
 *   --allow-missing        warn instead of failing when a child sitemap is absent
 *
 * The locale list is passed in rather than read from `i18n/locales.config.ts`, because that
 * file is TypeScript and this script runs under plain `node` on the repo's Node 20 floor. The
 * caller (deploy.yml) derives the list from the roster once and hands the same list to every
 * step, so there is still exactly one source of truth per run.
 *
 * A locale whose roster `status` is `pruned` must NOT be passed in: dropping out of
 * sitemap-index.xml is half of what "pruned" means (plan section 5 invariant 8).
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_SITE_URL = 'https://scrimbaguide.tech';
const DEFAULT_BUILD_DIR = 'build';
const DEFAULT_LOCALE = 'en';

/** Minimal XML text escaping. URLs rarely need it; a stray `&` in a future origin would. */
export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Where each locale's sitemap lives, both on disk (relative to the merged tree) and as a URL.
 *
 * The default locale keeps the bare root because `i18n.localeConfigs.en.baseUrl` is `/`
 * (plan B5); every other locale is prefixed. Order follows the caller's locale list so the
 * index stays diffable against the roster.
 */
export function childSitemapEntries({
  locales = [DEFAULT_LOCALE],
  defaultLocale = DEFAULT_LOCALE,
  siteUrl = DEFAULT_SITE_URL,
} = {}) {
  const origin = siteUrl.replace(/\/+$/, '');
  return locales.map((locale) => {
    const prefix = locale === defaultLocale ? '' : `/${locale}`;
    return {
      locale,
      relativePath: prefix === '' ? 'sitemap.xml' : `${locale}/sitemap.xml`,
      loc: `${origin}${prefix}/sitemap.xml`,
    };
  });
}

/** `<sitemapindex>` document. `entries` is `[{ loc, lastmod? }]`; lastmod is optional per spec. */
export function renderSitemapIndex(entries) {
  const body = entries
    .map(({ loc, lastmod }) => {
      const lines = [`    <loc>${escapeXml(loc)}</loc>`];
      if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
      return `  <sitemap>\n${lines.join('\n')}\n  </sitemap>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

/** `YYYY-MM-DD`, matching `sitemapOptions.lastmod: 'date'` so both files agree in granularity. */
function fileLastmod(filePath) {
  return fs.statSync(filePath).mtime.toISOString().split('T')[0];
}

export function generateSitemapIndex({
  buildDir = DEFAULT_BUILD_DIR,
  siteUrl = DEFAULT_SITE_URL,
  locales = [DEFAULT_LOCALE],
  defaultLocale = DEFAULT_LOCALE,
  outPath = null,
  allowMissing = false,
} = {}) {
  const entries = [];
  const missing = [];

  for (const entry of childSitemapEntries({ locales, defaultLocale, siteUrl })) {
    const absolute = path.join(buildDir, entry.relativePath);
    if (!fs.existsSync(absolute)) {
      missing.push(entry);
      continue;
    }
    entries.push({ ...entry, lastmod: fileLastmod(absolute) });
  }

  // A missing child sitemap means that locale's build silently produced nothing, which is the
  // exact failure the fail-closed coverage rule exists to make loud. Default to exit 1 rather
  // than shipping an index that quietly drops a locale.
  if (missing.length > 0 && !allowMissing) {
    throw new Error(
      `Missing child sitemap(s) under ${buildDir}: ${missing.map((m) => m.relativePath).join(', ')}. ` +
      'Pass --allow-missing only when a locale is deliberately absent from this build.',
    );
  }

  if (entries.length === 0) {
    throw new Error(`No child sitemaps found under ${buildDir}; refusing to write an empty sitemap index.`);
  }

  const target = outPath ?? path.join(buildDir, 'sitemap-index.xml');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, renderSitemapIndex(entries), 'utf8');

  return { outPath: target, entries, missing };
}

function parseArgValue(args, name) {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
}

function parseList(value) {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const buildDir = parseArgValue(args, '--build-dir') ?? DEFAULT_BUILD_DIR;
  const siteUrl = parseArgValue(args, '--site-url') ?? DEFAULT_SITE_URL;
  const defaultLocale = parseArgValue(args, '--default-locale') ?? DEFAULT_LOCALE;
  const locales = parseList(parseArgValue(args, '--locales'));
  const outPath = parseArgValue(args, '--out');
  const allowMissing = args.includes('--allow-missing');

  let result;
  try {
    result = generateSitemapIndex({
      buildDir,
      siteUrl,
      locales: locales.length > 0 ? locales : [defaultLocale],
      defaultLocale,
      outPath,
      allowMissing,
    });
  } catch (err) {
    // A stack trace here is noise in a CI log; the message is the whole diagnosis.
    console.error(`::error::${err.message}`);
    process.exit(1);
  }

  for (const entry of result.missing) {
    console.warn(`Skipped missing child sitemap: ${entry.relativePath}`);
  }
  console.log(`Generated ${result.outPath} with ${result.entries.length} child sitemap(s):`);
  for (const entry of result.entries) {
    console.log(`  ${entry.locale}: ${entry.loc} (lastmod ${entry.lastmod})`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
