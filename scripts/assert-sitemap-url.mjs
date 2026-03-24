#!/usr/bin/env node

/**
 * Assert that a required URL exists in a sitemap XML.
 *
 * Usage:
 *   node scripts/assert-sitemap-url.mjs --sitemap-url https://scrimbaguide.tech/sitemap.xml --require-url https://scrimbaguide.tech/docs/paths/
 *   node scripts/assert-sitemap-url.mjs --sitemap build/sitemap.xml --require-url https://scrimbaguide.tech/docs/paths/
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSitemapPath = path.resolve(__dirname, '..', 'build', 'sitemap.xml');

const args = process.argv.slice(2);
const sitemapUrlIdx = args.indexOf('--sitemap-url');
const sitemapUrlArg = sitemapUrlIdx !== -1 ? args[sitemapUrlIdx + 1] : null;
const sitemapIdx = args.indexOf('--sitemap');
const sitemapPathArg = sitemapIdx !== -1 ? args[sitemapIdx + 1] : defaultSitemapPath;
const requireUrlIdx = args.indexOf('--require-url');
const requiredUrl = requireUrlIdx !== -1 ? args[requireUrlIdx + 1] : null;

function normalizeUrlForCompare(url) {
  return url.replace(/\/+$/, '') || '/';
}

function extractUrlsFromSitemap(xml) {
  const urls = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

async function main() {
  if (!requiredUrl) {
    console.error('Missing required argument: --require-url <absolute-url>');
    process.exit(1);
  }

  let xml;
  if (sitemapUrlArg) {
    console.log(`Fetching sitemap from ${sitemapUrlArg}`);
    xml = await fetchUrl(sitemapUrlArg);
  } else if (fs.existsSync(sitemapPathArg)) {
    xml = fs.readFileSync(sitemapPathArg, 'utf8');
  } else {
    console.error(`Sitemap not found at ${sitemapPathArg}`);
    process.exit(1);
  }

  const urls = extractUrlsFromSitemap(xml);
  const normalizedRequired = normalizeUrlForCompare(requiredUrl);
  const exists = urls.some((url) => normalizeUrlForCompare(url) === normalizedRequired);

  if (!exists) {
    console.error(`Required URL was not found in sitemap: ${requiredUrl}`);
    process.exit(1);
  }

  console.log(`Verified required sitemap URL: ${requiredUrl}`);
}

main();
