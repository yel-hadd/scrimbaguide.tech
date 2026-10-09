import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// worker/index.ts imports the gitignored, build-stamped llm-review-date.ts.
// Stamp it so the import works in any environment (CI stamps via pretypecheck,
// but this test must not depend on that ordering).
execFileSync('node', [path.resolve(__dirname, '..', 'stamp-llm-review-date.mjs')], { stdio: 'pipe' });

const { parseAccept, prefersMarkdown, markdownTwinUrl } = await import(
  '../../worker/index.ts'
);

test('prefersMarkdown is false for browser and crawler defaults', () => {
  assert.equal(prefersMarkdown(null), false);
  assert.equal(prefersMarkdown(''), false);
  assert.equal(prefersMarkdown('*/*'), false);
  // Chrome/Safari/Firefox default: text/html first, no text/markdown.
  assert.equal(
    prefersMarkdown(
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    ),
    false,
  );
  // curl default.
  assert.equal(prefersMarkdown('*/*'), false);
});

test('prefersMarkdown is true when text/markdown is requested and wins', () => {
  assert.equal(prefersMarkdown('text/markdown'), true);
  assert.equal(prefersMarkdown('text/markdown;q=1.0'), true);
  assert.equal(prefersMarkdown('text/markdown, text/html;q=0.8'), true);
  assert.equal(prefersMarkdown('text/html;q=0.5, text/markdown;q=0.9'), true);
  // Equal q-values: the client explicitly asked for markdown, serve it.
  assert.equal(prefersMarkdown('text/html;q=0.9, text/markdown;q=0.9'), true);
});

test('prefersMarkdown is false when markdown is present but loses to html', () => {
  assert.equal(prefersMarkdown('text/markdown;q=0.5, text/html;q=0.8'), false);
  // q=0 means "explicitly not acceptable".
  assert.equal(prefersMarkdown('text/markdown;q=0, text/html'), false);
});

test('parseAccept lowercases types and defaults q to 1', () => {
  assert.deepEqual(parseAccept('Text/HTML;q=0.8, text/markdown'), [
    { type: 'text/html', q: 0.8 },
    { type: 'text/markdown', q: 1 },
  ]);
  assert.deepEqual(parseAccept(null), []);
  assert.deepEqual(parseAccept(''), []);
});

test('markdownTwinUrl maps page paths to their .md twins like the generator and Layout', () => {
  assert.equal(markdownTwinUrl('/'), '/index.md');
  assert.equal(markdownTwinUrl(''), '/index.md');
  assert.equal(markdownTwinUrl('/blog/foo/'), '/blog/foo.md');
  assert.equal(markdownTwinUrl('/blog/foo'), '/blog/foo.md');
  assert.equal(markdownTwinUrl('/docs/courses/python/learn-python/'), '/docs/courses/python/learn-python.md');
  assert.equal(markdownTwinUrl('/blog/foo//'), '/blog/foo.md');
});
