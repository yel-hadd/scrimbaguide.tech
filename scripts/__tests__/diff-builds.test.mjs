import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { diffBuilds, normalizeHtml, headFacts, diffHead, formatSummary } from '../visual/diff-builds.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(HERE, 'fixtures', 'diff-builds', 'base');
const HEAD = path.join(HERE, 'fixtures', 'diff-builds', 'head');
const SCRIPT = path.join(HERE, '..', 'visual', 'diff-builds.mjs');

test('normalizeHtml hides js and css asset hashes only', () => {
  const html = '<script src="/assets/js/main.abc123.js"></script><link href="/assets/css/styles.9f.css"><img src="/img/a.png">';
  assert.equal(
    normalizeHtml(html),
    '<script src="/assets/js/__HASH__"></script><link href="/assets/css/__HASH__"><img src="/img/a.png">',
  );
});

test('JSON-LD hash ignores key order but not content', () => {
  const a = headFacts('<head><script type="application/ld+json">{"@type":"WebSite","name":"x"}</script></head>');
  const b = headFacts('<head><script type="application/ld+json">{"name":"x","@type":"WebSite"}</script></head>');
  const c = headFacts('<head><script type="application/ld+json">{"name":"y","@type":"WebSite"}</script></head>');
  assert.deepEqual(a.jsonLd, b.jsonLd);
  assert.notDeepEqual(a.jsonLd, c.jsonLd);
  assert.match(a.jsonLd[0], /^WebSite#[0-9a-f]{12}$/);
  assert.deepEqual(diffHead(a, b), []);
});

test('fixture builds: pages, V2, V3, V4 and bytes', () => {
  const r = diffBuilds(BASE, HEAD);

  assert.deepEqual(r.pages.onlyInBase, ['/docs/gone/']);
  assert.deepEqual(r.pages.onlyInHead, ['/docs/new/']);
  assert.equal(r.pages.common, 3);

  // /docs/same/ differs only by asset hash; / only by JSON-LD key order.
  assert.deepEqual(r.v2_html.diffs.map((d) => d.route), ['/', '/docs/changed/']);

  // Key order is not a head change, so only /docs/changed/ is in V3.
  assert.equal(r.v3_head.diffCount, 1);
  const { route, changes } = r.v3_head.diffs[0];
  assert.equal(route, '/docs/changed/');
  assert.deepEqual(changes.find((c) => c.field === 'title'), { field: 'title', base: 'Old title', head: 'New title' });
  assert.deepEqual(changes.find((c) => c.field === 'meta'), { field: 'meta', removed: ['name:twitter:title=Old title'], added: [] });
  const ld = changes.find((c) => c.field === 'jsonLd');
  assert.match(ld.removed[0], /^Article\+BreadcrumbList#/);
  assert.match(ld.added[0], /^Article\+BreadcrumbList#/);
  assert.equal(changes.some((c) => c.field === 'canonical'), false);

  const files = Object.fromEntries(r.v4_files.map((f) => [f.file, f]));
  assert.equal(files['llms.txt'].status, 'equal');
  assert.equal(files['llms-full.txt'].status, 'differs');
  assert.equal(files['llms-full.txt'].firstDiffLine, 2);
  assert.deepEqual(files['sitemap.xml'].urls, {
    onlyInBase: ['https://scrimbaguide.tech/docs/gone/'],
    onlyInHead: ['https://scrimbaguide.tech/docs/new/'],
  });

  assert.deepEqual(r.bytes.delta, { js: 3, css: 0 });

  const summary = formatSummary(r);
  assert.match(summary, /V2 full HTML \(asset hashes normalized\): 2 of 3 pages differ/);
  assert.match(summary, /V3 head .*: 1 pages differ/);
});

test('summary caps examples per category', () => {
  const r = diffBuilds(BASE, HEAD);
  const summary = formatSummary(r, 1);
  assert.match(summary, /\.\.\. 1 more \(see --json\)/);
});

test('CLI writes --json and exits 0; usage error exits 2', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'diff-builds-')), 'r.json');
  const stdout = execFileSync(process.execPath, [SCRIPT, BASE, HEAD, '--json', out], { encoding: 'utf8' });
  assert.match(stdout, /Pages: base 4, head 4, common 3/);
  assert.equal(JSON.parse(fs.readFileSync(out, 'utf8')).v3_head.diffCount, 1);

  assert.throws(() => execFileSync(process.execPath, [SCRIPT, BASE], { stdio: 'pipe' }), (err) => err.status === 2);
});
