import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildRedirectLines,
  collectRoutes,
  routeForFile,
  stubTarget,
  withSlash,
} from '../cloudflare/build-redirects.mjs';

const stub = (url) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${url}"><link rel="canonical" href="${url}" /></head></html>`;

test('routeForFile maps index files to slash routes and ignores other files', () => {
  assert.equal(routeForFile('/b', '/b/index.html'), '/');
  assert.equal(routeForFile('/b', '/b/docs/pricing/index.html'), '/docs/pricing/');
  assert.equal(routeForFile('/b', '/b/downloads/plan.html'), null);
});

test('stubTarget reads the meta refresh url and resolves relative targets', () => {
  assert.equal(stubTarget(stub('/docs/paths/'), '/old/'), '/docs/paths/');
  assert.equal(stubTarget(stub('../new/'), '/blog/old/'), '/blog/new/');
  assert.equal(stubTarget(stub('https://example.com/x'), '/old/'), 'https://example.com/x');
  assert.equal(stubTarget('<html><head><title>Page</title></head></html>', '/a/'), null);
});

test('withSlash adds the trailing slash to paths but not files, queries or external urls', () => {
  assert.equal(withSlash('/docs/paths'), '/docs/paths/');
  assert.equal(withSlash('/docs/paths/'), '/docs/paths/');
  assert.equal(withSlash('/docs/paths?x=1#h'), '/docs/paths/?x=1#h');
  assert.equal(withSlash('/blog/rss.xml'), '/blog/rss.xml');
  assert.equal(withSlash('https://example.com/x'), 'https://example.com/x');
});

test('buildRedirectLines: stubs 301 from both forms, pages 301 to the slash form, stubs first', () => {
  const routes = new Map([
    ['/', null],
    ['/docs/paths/', null],
    ['/tools/old/', '/docs/paths/'],
  ]);
  assert.deepEqual(buildRedirectLines(routes), [
    '/tools/old /docs/paths/ 301',
    '/tools/old/ /docs/paths/ 301',
    '/docs/paths /docs/paths/ 301',
  ]);
});

test('buildRedirectLines follows stub chains to the final page', () => {
  const routes = new Map([
    ['/a/', '/b'],
    ['/b/', '/c/'],
    ['/c/', null],
  ]);
  const lines = buildRedirectLines(routes);
  assert.ok(lines.includes('/a/ /c/ 301'));
  assert.ok(lines.includes('/b /c/ 301'));
});

test('buildRedirectLines rejects loops', () => {
  const routes = new Map([
    ['/a/', '/b/'],
    ['/b/', '/a/'],
  ]);
  assert.throws(() => buildRedirectLines(routes), /chain|itself/);
});

test('collectRoutes reads a build directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirects-'));
  const write = (rel, body) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), body);
  };
  write('index.html', '<html></html>');
  write('docs/paths/index.html', '<html><title>Paths</title></html>');
  write('blog/old-post/index.html', stub('/docs/paths/'));
  write('downloads/plan.html', '<html></html>');

  const routes = collectRoutes(dir);
  assert.deepEqual(
    [...routes.entries()].sort(),
    [
      ['/', null],
      ['/blog/old-post/', '/docs/paths/'],
      ['/docs/paths/', null],
    ],
  );
  fs.rmSync(dir, { recursive: true });
});
