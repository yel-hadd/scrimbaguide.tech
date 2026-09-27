import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeClass,
  normalizeSelector,
  loadKnownIssues,
  groupFindings,
  compareFindings,
  report,
} from '../visual/ratchet.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function tmpJson(value) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  const file = path.join(dir, 'known.json');
  fs.writeFileSync(file, JSON.stringify(value));
  return file;
}

const entry = (id, harness = 'matrix', extra = {}) => ({ id, harness, issue: 'A11Y-04', reason: 'test', ...extra });

test('strips Docusaurus CSS-module hashes but keeps BEM names', () => {
  assert.equal(normalizeClass('tag_zVej'), 'tag');
  assert.equal(normalizeClass('tagRegular_sFm0'), 'tagRegular');
  assert.equal(normalizeClass('lightbox__next'), 'lightbox__next');
  assert.equal(normalizeClass('code-preview__frame'), 'code-preview__frame');
  assert.equal(normalizeClass('footer__link-item'), 'footer__link-item');
  assert.equal(normalizeSelector('a.tag_zVej.tagRegular_sFm0'), 'a.tag.tagRegular');
});

test('strips hashes that contain an underscore', () => {
  assert.equal(normalizeClass('details_b_Ee'), 'details');
  assert.equal(normalizeClass('codeLine_lJS_'), 'codeLine');
  assert.equal(normalizeClass('breadcrumbsContainer_Z_bl'), 'breadcrumbsContainer');
  assert.equal(normalizeClass('sidebarItem__DBe'), 'sidebarItem');
  assert.equal(normalizeClass('item_a-9_'), 'item');
});

test('leaves BEM elements alone, including three-letter ones', () => {
  for (const c of ['lightbox__next', 'lightbox__bar', 'lightbox__nav', 'footer__col', 'cta__sub', 'menu__list-item', 'button--lg']) {
    assert.equal(normalizeClass(c), c);
  }
  assert.equal(normalizeSelector('div.lightbox__bar button.lightbox__nav--next'), 'div.lightbox__bar button.lightbox__nav--next');
});

test('a finding that is not listed fails the run', () => {
  const findings = groupFindings([{ id: 'tap-target:a.x', where: '/ @360x740 light' }]);
  const r = compareFindings({ findings, known: [], harness: 'matrix', fullRun: true });
  assert.equal(r.ok, false);
  assert.deepEqual(r.unlisted.map((f) => f.id), ['tap-target:a.x']);
});

test('a listed finding passes', () => {
  const findings = groupFindings([{ id: 'tap-target:a.x', where: '/' }]);
  const r = compareFindings({ findings, known: [entry('tap-target:a.x')], harness: 'matrix', fullRun: true });
  assert.equal(r.ok, true);
  assert.equal(r.listed.length, 1);
});

test('a listed entry that no longer reproduces fails as stale on a full run', () => {
  const r = compareFindings({ findings: [], known: [entry('focus-ring:a.gone')], harness: 'matrix', fullRun: true });
  assert.equal(r.ok, false);
  assert.deepEqual(r.stale.map((e) => e.id), ['focus-ring:a.gone']);
});

test('a subset run never reports stale entries', () => {
  const r = compareFindings({ findings: [], known: [entry('focus-ring:a.gone')], harness: 'matrix', fullRun: false });
  assert.equal(r.ok, true);
  assert.equal(r.stale.length, 0);
});

test('a volatile entry allowlists its finding but is never stale', () => {
  const known = [entry('overlap:a.x | a.y', 'matrix', { volatile: true })];
  const gone = compareFindings({ findings: [], known, harness: 'matrix', fullRun: true });
  assert.equal(gone.ok, true);
  assert.equal(gone.stale.length, 0);
  const seen = compareFindings({ findings: groupFindings([{ id: 'overlap:a.x | a.y', where: '/blog/' }]), known, harness: 'matrix', fullRun: true });
  assert.equal(seen.ok, true);
  assert.equal(seen.listed.length, 1);
});

test('entries of the other harness are ignored', () => {
  const r = compareFindings({
    findings: [],
    known: [entry('search:1280:typing-returns-results', 'interactions')],
    harness: 'matrix',
    fullRun: true,
  });
  assert.equal(r.ok, true);
});

test('grouping merges one id seen in many places', () => {
  const g = groupFindings([
    { id: 'b', where: '/x' },
    { id: 'a', where: '/y' },
    { id: 'b', where: '/z' },
    { id: 'b', where: '/x' },
  ]);
  assert.deepEqual(g.map((f) => [f.id, f.where]), [['a', ['/y']], ['b', ['/x', '/z']]]);
});

test('report returns 1 on failure and 0 on success', () => {
  const lines = [];
  const log = (l) => lines.push(l);
  const bad = compareFindings({ findings: [], known: [entry('x')], harness: 'matrix', fullRun: true });
  assert.equal(report({ harness: 'matrix', result: bad, fullRun: true, log }), 1);
  assert.ok(lines.some((l) => l.startsWith('STALE  x')));
  const good = compareFindings({ findings: [], known: [], harness: 'matrix', fullRun: true });
  assert.equal(report({ harness: 'matrix', result: good, fullRun: true, log }), 0);
});

test('known-issues validation rejects entries without harness, reason or with duplicates', () => {
  assert.throws(() => loadKnownIssues(tmpJson({ entries: [{ id: 'x', issue: 'A11Y-04', reason: 'r' }] })), /harness/);
  assert.throws(() => loadKnownIssues(tmpJson({ entries: [{ id: 'x', harness: 'matrix', issue: 'A11Y-04' }] })), /reason/);
  assert.throws(() => loadKnownIssues(tmpJson({ entries: [{ id: 'x', harness: 'matrix', reason: 'r' }] })), /issue/);
  assert.throws(() => loadKnownIssues(tmpJson({ entries: [entry('x', 'matrix', { issue: 'new, untriaged' })] })), /issue/);
  assert.throws(() => loadKnownIssues(tmpJson({ entries: [entry('x', 'matrix', { volatile: 'yes' })] })), /volatile/);
  assert.equal(loadKnownIssues(tmpJson({ entries: [entry('x', 'matrix', { issue: 'untriaged' })] })).length, 1);
  assert.throws(() => loadKnownIssues(tmpJson({ entries: [entry('x'), entry('x')] })), /duplicate/);
});

test('the committed known-issues.json is valid and every entry cites an issue or a reason', () => {
  const entries = loadKnownIssues(path.join(ROOT, 'scripts/visual/known-issues.json'));
  for (const e of entries) assert.ok(e.reason.length >= 10, `${e.id}: reason too short`);
});

test('pages.json slugs and urls are unique and urls end in a slash', () => {
  const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/visual/pages.json'), 'utf8'));
  const slugs = new Set();
  const urls = new Set();
  for (const p of pages) {
    assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`);
    assert.ok(!urls.has(p.url), `duplicate url ${p.url}`);
    assert.ok(p.url.startsWith('/') && p.url.endsWith('/'), `${p.url} must start and end with /`);
    slugs.add(p.slug);
    urls.add(p.url);
  }
});
