#!/usr/bin/env node
/**
 * Compare two production builds (a baseline and a PR head).
 *
 *   node scripts/visual/diff-builds.mjs <baseBuildDir> <headBuildDir> [--json out.json]
 *
 * Reports four things, with up to 20 examples per category:
 *   V2  full HTML of every index.html, with /assets/(js|css)/ hashes normalized,
 *       plus pages only in one build
 *   V3  per-page head: <title>, meta name/property, canonical, and each JSON-LD
 *       block as its @types and a stable hash (keys sorted before hashing)
 *   V4  llms.txt, llms-full.txt and sitemap.xml byte equality
 *   total JS and CSS bytes under assets/js and assets/css
 *
 * Always exits 0 (2 on a usage error): it reports, the reader judges. A PR
 * that should not change HTML (CSS, perf, refactor) expects V2 = 0; a PR that
 * changes one page expects that page and nothing else.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { topLevelTypes, routeFromFile } from '../check-built-metadata.mjs';

export const MAX_EXAMPLES = 20;
export const EQUALITY_FILES = ['llms.txt', 'llms-full.txt', 'sitemap.xml'];

/** Routes of every index.html in a build, mapped to the file path. */
export function listPages(buildDir) {
  const pages = new Map();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'assets') walk(full);
      } else if (entry.name === 'index.html') {
        pages.set(routeFromFile(buildDir, full), full);
      }
    }
  };
  walk(buildDir);
  return pages;
}

/** Content hashes in asset URLs change on any bundle edit; hide them. */
export function normalizeHtml(html) {
  return html.replace(/\/assets\/(js|css)\/[^"'\s)]+/g, '/assets/$1/__HASH__');
}

/** JSON with object keys sorted, so key order never changes the hash. */
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

const shortHash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);

/** The head facts V3 compares. */
export function headFacts(html) {
  const $ = load(html);
  const meta = [];
  $('head meta').each((_, el) => {
    const a = el.attribs || {};
    const key = a.name ? `name:${a.name}` : a.property ? `property:${a.property}` : null;
    if (key) meta.push(`${key}=${a.content ?? ''}`);
  });
  meta.sort();
  const canonical = $('head link[rel="canonical"]')
    .toArray()
    .map((el) => el.attribs.href);
  const jsonLd = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => {
      const text = $(el).text();
      try {
        const parsed = JSON.parse(text);
        return `${topLevelTypes(parsed).join('+') || '(no @type)'}#${shortHash(stableStringify(parsed))}`;
      } catch {
        return `(invalid JSON)#${shortHash(text)}`;
      }
    });
  return { title: $('head > title').text(), meta, canonical, jsonLd };
}

/** Field-level differences between two headFacts results. */
export function diffHead(a, b) {
  const changes = [];
  if (a.title !== b.title) changes.push({ field: 'title', base: a.title, head: b.title });
  for (const field of ['meta', 'canonical', 'jsonLd']) {
    const setA = new Set(a[field]);
    const setB = new Set(b[field]);
    const removed = a[field].filter((x) => !setB.has(x));
    const added = b[field].filter((x) => !setA.has(x));
    if (removed.length || added.length || a[field].length !== b[field].length) {
      changes.push({ field, removed, added });
    }
  }
  return changes;
}

/** Where two strings first differ, with some context on each side. */
function firstDifference(a, b, radius = 80) {
  let i = 0;
  const len = Math.min(a.length, b.length);
  while (i < len && a[i] === b[i]) i++;
  const from = Math.max(0, i - radius);
  return { offset: i, base: a.slice(from, i + radius), head: b.slice(from, i + radius) };
}

function compareFile(baseDir, headDir, name) {
  const pa = path.join(baseDir, name);
  const pb = path.join(headDir, name);
  const ea = fs.existsSync(pa);
  const eb = fs.existsSync(pb);
  if (!ea || !eb) return { file: name, status: !ea && !eb ? 'missing in both' : !ea ? 'missing in base' : 'missing in head' };
  const a = fs.readFileSync(pa, 'utf8');
  const b = fs.readFileSync(pb, 'utf8');
  if (a === b) return { file: name, status: 'equal' };
  const la = a.split('\n');
  const lb = b.split('\n');
  let line = 0;
  while (line < la.length && line < lb.length && la[line] === lb[line]) line++;
  const { base, head } = firstDifference(la[line] ?? '', lb[line] ?? '', 60);
  const result = { file: name, status: 'differs', lines: { base: la.length, head: lb.length }, firstDiffLine: line + 1, base, head };
  if (name === 'sitemap.xml') {
    const locs = (xml) => new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const sa = locs(a);
    const sb = locs(b);
    result.urls = { onlyInBase: [...sa].filter((u) => !sb.has(u)).sort(), onlyInHead: [...sb].filter((u) => !sa.has(u)).sort() };
  }
  return result;
}

/** Total bytes of .js and .css files under assets/js and assets/css. */
export function assetBytes(buildDir) {
  const total = { js: 0, css: 0 };
  for (const kind of ['js', 'css']) {
    const dir = path.join(buildDir, 'assets', kind);
    if (!fs.existsSync(dir)) continue;
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(`.${kind}`)) total[kind] += fs.statSync(full).size;
      }
    };
    walk(dir);
  }
  return total;
}

/** The full comparison as one JSON-serializable object. */
export function diffBuilds(baseDir, headDir) {
  const basePages = listPages(baseDir);
  const headPages = listPages(headDir);
  const onlyInBase = [...basePages.keys()].filter((r) => !headPages.has(r)).sort();
  const onlyInHead = [...headPages.keys()].filter((r) => !basePages.has(r)).sort();
  const common = [...basePages.keys()].filter((r) => headPages.has(r)).sort();

  const htmlDiffs = [];
  const headDiffs = [];
  for (const route of common) {
    const rawA = fs.readFileSync(basePages.get(route), 'utf8');
    const rawB = fs.readFileSync(headPages.get(route), 'utf8');
    const a = normalizeHtml(rawA);
    const b = normalizeHtml(rawB);
    if (a === b) continue;
    htmlDiffs.push({ route, ...firstDifference(a, b) });
    const changes = diffHead(headFacts(rawA), headFacts(rawB));
    if (changes.length) headDiffs.push({ route, changes });
  }

  const bytesBase = assetBytes(baseDir);
  const bytesHead = assetBytes(headDir);
  return {
    base: path.resolve(baseDir),
    head: path.resolve(headDir),
    pages: { base: basePages.size, head: headPages.size, common: common.length, onlyInBase, onlyInHead },
    v2_html: { diffCount: htmlDiffs.length, diffs: htmlDiffs },
    v3_head: { diffCount: headDiffs.length, diffs: headDiffs },
    v4_files: EQUALITY_FILES.map((f) => compareFile(baseDir, headDir, f)),
    bytes: {
      base: bytesBase,
      head: bytesHead,
      delta: { js: bytesHead.js - bytesBase.js, css: bytesHead.css - bytesBase.css },
    },
  };
}

const clip = (s, n = 120) => (s.length > n ? `${s.slice(0, n)}...` : s);
const fmtBytes = (n) => `${(n / 1024 / 1024).toFixed(2)} MB (${n.toLocaleString('en-US')} B)`;
const fmtDelta = (n) => `${n >= 0 ? '+' : ''}${n.toLocaleString('en-US')} B`;

/** Human summary with up to MAX_EXAMPLES examples per category. */
export function formatSummary(r, max = MAX_EXAMPLES) {
  const out = [];
  const list = (items, fmt) => {
    for (const x of items.slice(0, max)) out.push(`  ${fmt(x)}`);
    if (items.length > max) out.push(`  ... ${items.length - max} more (see --json)`);
  };
  out.push(`Pages: base ${r.pages.base}, head ${r.pages.head}, common ${r.pages.common}`);
  out.push(`Only in base: ${r.pages.onlyInBase.length}`);
  list(r.pages.onlyInBase, (x) => x);
  out.push(`Only in head: ${r.pages.onlyInHead.length}`);
  list(r.pages.onlyInHead, (x) => x);
  out.push(`V2 full HTML (asset hashes normalized): ${r.v2_html.diffCount} of ${r.pages.common} pages differ`);
  list(r.v2_html.diffs, (d) => `${d.route} @${d.offset}\n      base: ${JSON.stringify(d.base)}\n      head: ${JSON.stringify(d.head)}`);
  out.push(`V3 head (title, meta, canonical, JSON-LD): ${r.v3_head.diffCount} pages differ`);
  list(r.v3_head.diffs, (d) =>
    `${d.route}\n` +
    d.changes
      .map((c) =>
        c.field === 'title'
          ? `      title: ${JSON.stringify(c.base)} -> ${JSON.stringify(c.head)}`
          : `      ${c.field}: -${JSON.stringify(c.removed.map((x) => clip(x)))} +${JSON.stringify(c.added.map((x) => clip(x)))}`,
      )
      .join('\n'),
  );
  out.push('V4 files:');
  for (const f of r.v4_files) {
    if (f.status !== 'differs') {
      out.push(`  ${f.file}: ${f.status}`);
      continue;
    }
    out.push(`  ${f.file}: differs (lines ${f.lines.base} -> ${f.lines.head}, first at line ${f.firstDiffLine})`);
    out.push(`      base: ${JSON.stringify(f.base)}`, `      head: ${JSON.stringify(f.head)}`);
    if (f.urls) {
      out.push(`      <loc> only in base: ${f.urls.onlyInBase.length}, only in head: ${f.urls.onlyInHead.length}`);
      list([...f.urls.onlyInBase.map((u) => `- ${u}`), ...f.urls.onlyInHead.map((u) => `+ ${u}`)], (x) => `    ${x}`);
    }
  }
  out.push(`Bytes JS:  base ${fmtBytes(r.bytes.base.js)}, head ${fmtBytes(r.bytes.head.js)}, delta ${fmtDelta(r.bytes.delta.js)}`);
  out.push(`Bytes CSS: base ${fmtBytes(r.bytes.base.css)}, head ${fmtBytes(r.bytes.head.css)}, delta ${fmtDelta(r.bytes.delta.css)}`);
  return out.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const jsonIdx = args.indexOf('--json');
  const jsonOut = jsonIdx !== -1 ? args[jsonIdx + 1] : null;
  const positional = jsonIdx === -1 ? args : args.filter((_, i) => i !== jsonIdx && i !== jsonIdx + 1);
  const [baseDir, headDir] = positional;
  if (!baseDir || !headDir || (jsonIdx !== -1 && !jsonOut) || !fs.existsSync(baseDir) || !fs.existsSync(headDir)) {
    console.error('usage: node scripts/visual/diff-builds.mjs <baseBuildDir> <headBuildDir> [--json out.json]');
    process.exit(2);
  }
  const result = diffBuilds(baseDir, headDir);
  console.log(formatSummary(result));
  if (jsonOut) {
    fs.writeFileSync(jsonOut, `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Full report: ${jsonOut}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
