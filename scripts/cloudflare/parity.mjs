#!/usr/bin/env node

/**
 * Compare two deployments of the site URL by URL: status, Location, canonical
 * and a body hash. Used before and after moving hosting from GitHub Pages to
 * Cloudflare Workers.
 *
 * URL set: every sitemap URL in both slash forms, every _redirects source,
 * /index.html variants of a sample, feeds, robots/llms/sitemap, the IndexNow
 * key file and a missing page.
 *
 * Usage:
 *   node scripts/cloudflare/parity.mjs <baseA> <baseB> [--build build] [--json out.json]
 *
 * Exit 1 when a difference is not in the expected list (see classify()).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const [baseA, baseB] = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
const opt = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const buildDir = path.resolve(opt('--build', path.join(__dirname, '..', '..', 'build')));
const jsonOut = opt('--json', null);

if (!baseA || !baseB) {
  console.error('Usage: node scripts/cloudflare/parity.mjs <baseA> <baseB> [--build build] [--json out.json]');
  process.exit(2);
}

function urlSet() {
  const paths = new Set(['/', '/robots.txt', '/llms.txt', '/llms-full.txt', '/sitemap.xml', '/blog/rss.xml', '/blog/atom.xml', '/this-page-does-not-exist-parity/']);
  const sitemap = fs.readFileSync(path.join(buildDir, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
  for (const p of locs) {
    paths.add(p);
    if (p !== '/') paths.add(p.replace(/\/$/, ''));
  }
  for (const p of locs.slice(0, 10)) paths.add(`${p}index.html`);
  const redirects = path.join(buildDir, '_redirects');
  if (fs.existsSync(redirects)) {
    for (const line of fs.readFileSync(redirects, 'utf8').split('\n')) {
      if (line && !line.startsWith('#')) paths.add(line.split(' ')[0]);
    }
  }
  for (const f of fs.readdirSync(buildDir)) if (/^[0-9a-f]{32}\.txt$/.test(f)) paths.add(`/${f}`);
  return [...paths].sort();
}

async function probe(base, p) {
  const res = await fetch(base + p, { redirect: 'manual', headers: { 'user-agent': 'scrimbaguide-parity/1.0' } });
  const body = res.status === 200 ? await res.text() : '';
  let location = res.headers.get('location') || '';
  if (location) location = new URL(location, base + p).pathname + new URL(location, base + p).search;
  const canonical = (/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/.exec(body) || [])[1] || '';
  return {
    status: res.status,
    location,
    canonical,
    hash: body ? crypto.createHash('sha1').update(body).digest('hex').slice(0, 12) : '',
  };
}

/** Differences we expect when B is Cloudflare and A is GitHub Pages. */
function classify(p, a, b) {
  if (a.status === b.status && a.location === b.location && a.canonical === b.canonical && a.hash === b.hash) return 'same';
  // Client-redirect stub (200 + meta refresh) is now a real 301 to the same target.
  if (a.status === 200 && b.status === 301 && a.canonical && new URL(a.canonical, 'https://x').pathname === b.location) return 'expected:stub-301';
  // Slashless stub: GitHub 301s to the slash form, Cloudflare goes straight to the target.
  if (a.status === 301 && b.status === 301 && a.location === `${p}/`) return 'expected:stub-one-hop';
  // /index.html duplicate now redirects to the folder URL.
  if (p.endsWith('/index.html') && a.status === 200 && [301, 307, 308].includes(b.status)) return 'expected:index-html';
  // 404 page markup is the same file but GitHub serves its own wrapper.
  if (a.status === 404 && b.status === 404) return 'expected:404-body';
  // Same status and target, but HTML bytes differ: Cloudflare email obfuscation etc. would show here.
  if (a.status === b.status && a.location === b.location && a.canonical === b.canonical) return 'body-differs';
  return 'DIFF';
}

async function main() {
  const paths = urlSet();
  const rows = [];
  const queue = [...paths];
  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      try {
        const [a, b] = await Promise.all([probe(baseA, p), probe(baseB, p)]);
        rows.push({ path: p, verdict: classify(p, a, b), a, b });
      } catch (err) {
        rows.push({ path: p, verdict: 'ERROR', error: String(err) });
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  rows.sort((x, y) => x.path.localeCompare(y.path));

  const counts = {};
  for (const r of rows) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  console.log(`${rows.length} URLs`, counts);
  for (const r of rows.filter((r) => ['DIFF', 'ERROR', 'body-differs'].includes(r.verdict)).slice(0, 60)) {
    console.log(r.verdict.padEnd(12), r.path, r.error || `A ${r.a.status} ${r.a.location} ${r.a.canonical} ${r.a.hash} | B ${r.b.status} ${r.b.location} ${r.b.canonical} ${r.b.hash}`);
  }
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1));
  process.exit(counts.DIFF || counts.ERROR ? 1 : 0);
}

main();
