#!/usr/bin/env node

/**
 * Submit all site URLs to IndexNow after a build/deploy.
 *
 * Reads URLs from the built sitemap.xml, filters out low-value pages
 * (tags, archive, pagination), and submits them in batches of 10 000
 * (the IndexNow API limit per request).
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs                   # reads build/sitemap.xml
 *   node scripts/submit-indexnow.mjs --sitemap ./build/sitemap.xml
 *   node scripts/submit-indexnow.mjs --dry-run          # preview without submitting
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HOST = 'scrimbaguide.tech';
const KEY = '432904832';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const BATCH_SIZE = 10_000; // IndexNow max per request

// Pages that don't need indexing
const EXCLUDE_PATTERNS = [
  /\/tags\//,
  /\/tags$/,
  /\/archive$/,
  /\/authors$/,
  /\/page\/\d+/,
  /\/search$/,
];

// ── CLI args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sitemapIdx = args.indexOf('--sitemap');
const sitemapPath = sitemapIdx !== -1
  ? args[sitemapIdx + 1]
  : path.resolve(__dirname, '..', 'build', 'sitemap.xml');

// ── Parse sitemap ───────────────────────────────────────────────
function extractUrlsFromSitemap(xml) {
  const urls = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function filterUrls(urls) {
  return urls.filter((url) =>
    !EXCLUDE_PATTERNS.some((pattern) => pattern.test(url))
  );
}

// ── Submit to IndexNow ──────────────────────────────────────────
function submitBatch(urls) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    });

    const options = {
      hostname: 'api.indexnow.org',
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(sitemapPath)) {
    console.error(`Sitemap not found at ${sitemapPath}`);
    console.error('Run "npm run build" first, or pass --sitemap <path>');
    process.exit(1);
  }

  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const allUrls = extractUrlsFromSitemap(xml);
  const urls = filterUrls(allUrls);

  console.log(`Found ${allUrls.length} URLs in sitemap`);
  console.log(`After filtering: ${urls.length} URLs to submit`);
  console.log(`Excluded: ${allUrls.length - urls.length} low-value pages`);

  if (dryRun) {
    console.log('\n[DRY RUN] URLs that would be submitted:');
    urls.forEach((u) => console.log(`  ${u}`));
    return;
  }

  // Submit in batches
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

    console.log(`\nSubmitting batch ${batchNum}/${totalBatches} (${batch.length} URLs)...`);

    try {
      const { status, body } = await submitBatch(batch);
      if (status === 200 || status === 202) {
        console.log(`  OK (HTTP ${status})`);
      } else {
        console.error(`  Failed (HTTP ${status}): ${body}`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\nDone — ${urls.length} URLs submitted to IndexNow`);
}

main();
