#!/usr/bin/env node

/**
 * Submit site URLs to IndexNow after a build/deploy.
 *
 * Reads URLs either from a sitemap (built file or live URL) or from an explicit newline-
 * delimited file, filters out low-value pages (tags, archive, pagination), and submits them in
 * batches of 10,000 (the IndexNow API limit per request).
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs                   # reads build/sitemap.xml
 *   node scripts/submit-indexnow.mjs --sitemap-url https://scrimbaguide.tech/sitemap.xml
 *   node scripts/submit-indexnow.mjs --sitemap-url https://scrimbaguide.tech/de/sitemap.xml
 *   node scripts/submit-indexnow.mjs --urls /tmp/changed-urls.txt
 *   node scripts/submit-indexnow.mjs --dry-run
 *
 * MULTI-LOCALE (C12): call it once per locale with that locale's own sitemap. A
 * `<sitemapindex>` is rejected on purpose, see readSitemapUrls below.
 *
 * `--urls <file>` exists for section 11.3 D: `notify.mjs` writes the changed set to a temp file
 * and shells out to this script, so IndexNow batching, endpoint list, retries and the
 * INDEXNOW_REQUIRE_BING policy live in exactly one place.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_HOST = 'scrimbaguide.tech';
const DEFAULT_KEY = '04a47dc50a7a4b528f9fa0aa65c489ff';
const HOST = process.env.INDEXNOW_HOST ?? DEFAULT_HOST;
const KEY = process.env.INDEXNOW_KEY ?? DEFAULT_KEY;
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION ?? `https://${HOST}/${KEY}.txt`;
const BATCH_SIZE = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10_000;
const REQUIRE_BING = process.env.INDEXNOW_REQUIRE_BING === 'true';
const SUBMIT_TO_ALL_ENDPOINTS = process.env.INDEXNOW_SUBMIT_ALL_ENDPOINTS !== 'false';

// Endpoints to submit to.
// Default order prioritizes the shared IndexNow endpoint and includes Bing explicitly.
const ENDPOINTS = (process.env.INDEXNOW_ENDPOINTS ?? 'api.indexnow.org,www.bing.com,yandex.com')
  .split(',')
  .map((endpoint) => endpoint.trim())
  .filter(Boolean);

// Pages that don't need indexing
const EXCLUDE_PATTERNS = [
  /\/tags(\/|$)/,
  /\/archive\/?$/,
  /\/authors\/?$/,
  /\/page\/\d+/,
  /\/search\/?$/,
];

// ── CLI args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sitemapUrlIdx = args.indexOf('--sitemap-url');
const sitemapUrlArg = sitemapUrlIdx !== -1 ? args[sitemapUrlIdx + 1] : null;
const sitemapIdx = args.indexOf('--sitemap');
const sitemapPathArg = sitemapIdx !== -1 ? args[sitemapIdx + 1] : null;
const sitemapPath = sitemapPathArg ?? path.resolve(__dirname, '..', 'build', 'sitemap.xml');
const urlsFileIdx = args.indexOf('--urls');
const urlsFileArg = urlsFileIdx !== -1 ? args[urlsFileIdx + 1] : null;
// Every `--require-url` occurrence is collected: one deploy asserts one required URL per
// locale, and a silently ignored second flag would turn a missing locale into a green run.
const requiredUrls = args.reduce((acc, arg, index) => {
  if (arg === '--require-url' && args[index + 1]) acc.push(args[index + 1]);
  return acc;
}, []);

// ── Helpers ─────────────────────────────────────────────────────
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
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

/**
 * Reject a `<sitemapindex>` loudly.
 *
 * `<loc>` appears in BOTH sitemap shapes, so the flat extractor above happily "succeeds" on
 * sitemap-index.xml and submits ~48 child-sitemap URLs to IndexNow instead of the ~4,400 pages,
 * exiting 0 with a plausible-looking log. Since Phase 3 publishes a sitemap index at the root,
 * that mistake is now one copy-paste away.
 */
function assertNotSitemapIndex(xml, source) {
  if (/<sitemapindex[\s>]/i.test(xml)) {
    console.error(`${source} is a <sitemapindex>, not a <urlset>.`);
    console.error('Submit one locale sitemap per invocation (e.g. .../de/sitemap.xml), or pass --urls <file>.');
    process.exit(1);
  }
}

function filterUrls(urls) {
  return urls.filter((url) =>
    !EXCLUDE_PATTERNS.some((p) => p.test(url))
  );
}

function normalizeUrlForCompare(url) {
  return url.replace(/\/+$/, '') || '/';
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Submit to IndexNow ──────────────────────────────────────────
function submitBatch(hostname, urls) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    });

    const options = {
      hostname,
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
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  if (!KEY) {
    console.error('INDEXNOW_KEY is empty. Provide INDEXNOW_KEY in env or set a default key.');
    process.exit(1);
  }
  if (ENDPOINTS.length === 0) {
    console.error('No IndexNow endpoints configured. Set INDEXNOW_ENDPOINTS.');
    process.exit(1);
  }

  // `--urls` is mutually exclusive with the sitemap flags: silently preferring one over the
  // other would let a typo submit the whole site when the caller meant a 12-URL delta.
  if (urlsFileArg && (sitemapUrlArg || sitemapPathArg)) {
    console.error('--urls is mutually exclusive with --sitemap and --sitemap-url. Pass exactly one source.');
    process.exit(1);
  }

  let allUrls;
  let sourceLabel;
  if (urlsFileArg) {
    if (!fs.existsSync(urlsFileArg)) {
      console.error(`URL list not found at ${urlsFileArg}`);
      process.exit(1);
    }
    sourceLabel = `URL list ${urlsFileArg}`;
    allUrls = fs.readFileSync(urlsFileArg, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      // `#` comments keep a hand-edited reindex list readable.
      .filter((line) => line && !line.startsWith('#'));
    const malformed = allUrls.filter((url) => !/^https?:\/\//i.test(url));
    if (malformed.length > 0) {
      console.error(`--urls entries must be absolute URLs. First offender: ${malformed[0]}`);
      process.exit(1);
    }
  } else {
    let xml;
    if (sitemapUrlArg) {
      console.log(`Fetching sitemap from ${sitemapUrlArg}...`);
      xml = await fetchUrl(sitemapUrlArg);
      sourceLabel = sitemapUrlArg;
    } else if (fs.existsSync(sitemapPath)) {
      xml = fs.readFileSync(sitemapPath, 'utf8');
      sourceLabel = sitemapPath;
    } else {
      console.error(`Sitemap not found at ${sitemapPath}`);
      console.error('Run "npm run build" first, pass --sitemap <path>, --sitemap-url <url>, or --urls <file>');
      process.exit(1);
    }
    assertNotSitemapIndex(xml, sourceLabel);
    allUrls = extractUrlsFromSitemap(xml);
  }

  const urls = filterUrls(allUrls);

  for (const requiredUrl of requiredUrls) {
    const normalizedRequired = normalizeUrlForCompare(requiredUrl);
    const hasRequired = urls.some((url) => normalizeUrlForCompare(url) === normalizedRequired);
    if (!hasRequired) {
      console.error(`Required URL is missing from IndexNow submission set: ${requiredUrl}`);
      process.exit(1);
    }
  }

  console.log(`Found ${allUrls.length} URLs in ${sourceLabel}`);
  console.log(`After filtering: ${urls.length} URLs to submit`);
  console.log(`Excluded: ${allUrls.length - urls.length} low-value pages`);
  console.log(`Submitting to endpoints: ${ENDPOINTS.join(', ')}`);
  console.log(`IndexNow host=${HOST} keyLocation=${KEY_LOCATION}`);

  if (dryRun) {
    console.log('\n[DRY RUN] URLs that would be submitted:');
    urls.forEach((u) => console.log(`  ${u}`));
    return;
  }

  if (urls.length === 0) {
    console.log('No URLs to submit.');
    return;
  }

  // Submit in batches, trying all endpoints with retries
  const endpointSuccesses = new Map(ENDPOINTS.map((endpoint) => [endpoint, 0]));
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} URLs)`);

    let submittedToAtLeastOne = false;

    for (const endpoint of ENDPOINTS) {
      let endpointSucceeded = false;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`  Trying ${endpoint} (attempt ${attempt}/${MAX_RETRIES})...`);
          const { status, body } = await submitBatch(endpoint, batch);

          if (status === 200 || status === 202) {
            console.log(`  OK (HTTP ${status} from ${endpoint})`);
            endpointSucceeded = true;
            submittedToAtLeastOne = true;
            endpointSuccesses.set(endpoint, endpointSuccesses.get(endpoint) + 1);
            break;
          } else if (status === 403) {
            console.warn(`  HTTP 403 from ${endpoint}: ${body}`);
            if (attempt < MAX_RETRIES) {
              console.log(`  Retrying in ${RETRY_DELAY_MS / 1000}s...`);
              await sleep(RETRY_DELAY_MS);
            }
          } else {
            console.error(`  HTTP ${status} from ${endpoint}: ${body}`);
            break; // Don't retry non-403 errors on same endpoint
          }
        } catch (err) {
          console.error(`  Error with ${endpoint}: ${err.message}`);
          break;
        }
      }

      if (!SUBMIT_TO_ALL_ENDPOINTS && endpointSucceeded) break;
    }

    if (!submittedToAtLeastOne) {
      console.error(`\nFailed to submit batch ${batchNum} to any endpoint after all retries.`);
      process.exit(1);
    }
  }

  const bingSuccessCount = endpointSuccesses.get('www.bing.com') ?? 0;
  if (bingSuccessCount === 0) {
    // Bing can return 403 transiently after large deployments while its
    // verification cache refreshes (typically clears in 24-48 h).
    // Emit a GHA warning annotation so it's visible without failing the job.
    const bingWarning = 'Bing IndexNow returned 403 for all batches. '
      + 'This is a known transient Bing issue — resubmit after 24-48 h or '
      + 'wait for Bing to re-crawl via the sitemap. '
      + 'Set INDEXNOW_REQUIRE_BING=true to treat this as a hard failure.';
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.log(`::warning::${bingWarning}`);
    } else {
      console.warn(`\nWARNING: ${bingWarning}`);
    }
    if (REQUIRE_BING) {
      console.error('INDEXNOW_REQUIRE_BING=true, failing.');
      process.exit(1);
    }
  }

  console.log('\nEndpoint acceptance summary:');
  for (const endpoint of ENDPOINTS) {
    console.log(`  ${endpoint}: ${endpointSuccesses.get(endpoint)} accepted batch(es)`);
  }

  console.log(`\nDone — ${urls.length} URLs submitted to IndexNow`);
}

main();
