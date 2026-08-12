#!/usr/bin/env node

/**
 * Assert that required URLs exist in a sitemap (or in a sitemap index's children).
 *
 * This is the post-deploy canary: it runs against the LIVE site, so it catches a build that
 * shipped but dropped pages. Under the multi-locale roster it also has to catch a locale that
 * built to an empty tree, which is why `--locales` exists (C12).
 *
 * Usage:
 *   node scripts/assert-sitemap-url.mjs --sitemap-url https://scrimbaguide.tech/sitemap.xml \
 *     --require-url https://scrimbaguide.tech/docs/paths/
 *
 *   # One assertion per locale, against the root sitemap index:
 *   node scripts/assert-sitemap-url.mjs \
 *     --sitemap-url https://scrimbaguide.tech/sitemap-index.xml \
 *     --site-url https://scrimbaguide.tech --locales en,de,ja --require-path /docs/paths/
 *
 *   node scripts/assert-sitemap-url.mjs --sitemap build/sitemap.xml --require-url https://scrimbaguide.tech/docs/paths/
 *
 * Options:
 *   --sitemap-url <url>     live sitemap or sitemap index (children are fetched, one level)
 *   --sitemap <path>        local sitemap file (no recursion; children are not on disk yet)
 *   --require-url <url>     repeatable; every occurrence must be present
 *   --require-path <path>   locale-stripped route asserted for each `--locales` entry
 *   --locales <list>        comma-separated LIVE locales (default: en)
 *   --default-locale <l>    locale served at the bare root (default: en)
 *   --site-url <url>        origin used to build the per-locale required URLs
 *   --retries <n>           fetch attempts per URL (default 8, matching the CDN wait loop)
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSitemapPath = path.resolve(__dirname, '..', 'build', 'sitemap.xml');
const DEFAULT_SITE_URL = 'https://scrimbaguide.tech';
const DEFAULT_LOCALE = 'en';
const RETRY_DELAY_MS = 15_000;

const args = process.argv.slice(2);

function parseArgValue(name) {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
}

function parseList(value) {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const sitemapUrlArg = parseArgValue('--sitemap-url');
const sitemapPathArg = parseArgValue('--sitemap') ?? defaultSitemapPath;
const siteUrl = (parseArgValue('--site-url') ?? DEFAULT_SITE_URL).replace(/\/+$/, '');
const defaultLocale = parseArgValue('--default-locale') ?? DEFAULT_LOCALE;
const locales = parseList(parseArgValue('--locales'));
const requirePath = parseArgValue('--require-path');
const retries = Number(parseArgValue('--retries') ?? 8);

// Repeatable flag: `args.indexOf` would only ever see the first one, so a second locale
// assertion would be dropped without a word.
const explicitRequiredUrls = args.reduce((acc, arg, index) => {
  if (arg === '--require-url' && args[index + 1]) acc.push(args[index + 1]);
  return acc;
}, []);

function normalizeUrlForCompare(url) {
  return url.replace(/\/+$/, '') || '/';
}

function extractLocs(xml) {
  const urls = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(xml);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchOnce(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          // A 404 body used to be handed to the regex as if it were XML, which then reported
          // "URL not found in sitemap" for what is really a missing sitemap. Separate the two.
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          resolve(data);
        });
      })
      .on('error', reject);
  });
}

/** Retry on the CDN propagation window, same shape as the key-file wait loop in deploy.yml. */
async function fetchUrl(url, attempts = retries) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchOnce(url);
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        console.log(`  ${err.message}; retry ${attempt}/${attempts - 1} in ${RETRY_DELAY_MS / 1000}s`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

/** All page URLs behind `sitemapUrl`, following a `<sitemapindex>` exactly one level down. */
async function collectUrlsFromLiveSitemap(sitemapUrl) {
  console.log(`Fetching sitemap from ${sitemapUrl}`);
  const xml = await fetchUrl(sitemapUrl);
  if (!isSitemapIndex(xml)) {
    return extractLocs(xml);
  }

  const children = extractLocs(xml);
  console.log(`Sitemap index lists ${children.length} child sitemap(s)`);
  const collected = [];
  for (const child of children) {
    // A child sitemap that 404s means a locale shipped without a sitemap. That is a deploy
    // regression, not something to shrug off, so let the rejection propagate and exit 1.
    const childXml = await fetchUrl(child);
    collected.push(...extractLocs(childXml));
  }
  return collected;
}

function localeRequiredUrls() {
  if (!requirePath) return [];
  const suffix = requirePath.startsWith('/') ? requirePath : `/${requirePath}`;
  const roster = locales.length > 0 ? locales : [defaultLocale];
  return roster.map((locale) => {
    const prefix = locale === defaultLocale ? '' : `/${locale}`;
    return `${siteUrl}${prefix}${suffix}`;
  });
}

async function main() {
  const requiredUrls = [...explicitRequiredUrls, ...localeRequiredUrls()];

  if (requiredUrls.length === 0) {
    console.error('Missing required argument: --require-url <absolute-url> (or --require-path with --locales)');
    process.exit(1);
  }

  let urls;
  if (sitemapUrlArg) {
    urls = await collectUrlsFromLiveSitemap(sitemapUrlArg);
  } else if (fs.existsSync(sitemapPathArg)) {
    const xml = fs.readFileSync(sitemapPathArg, 'utf8');
    if (isSitemapIndex(xml)) {
      console.error(`${sitemapPathArg} is a sitemap index; pass --sitemap-url so its children can be fetched.`);
      process.exit(1);
    }
    urls = extractLocs(xml);
  } else {
    console.error(`Sitemap not found at ${sitemapPathArg}`);
    process.exit(1);
  }

  const present = new Set(urls.map(normalizeUrlForCompare));
  const missing = requiredUrls.filter((url) => !present.has(normalizeUrlForCompare(url)));

  if (missing.length > 0) {
    console.error(`Required URL(s) not found among ${urls.length} sitemap entries:`);
    for (const url of missing) console.error(`  ${url}`);
    process.exit(1);
  }

  console.log(`Verified ${requiredUrls.length} required sitemap URL(s) against ${urls.length} entries:`);
  for (const url of requiredUrls) console.log(`  ${url}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
