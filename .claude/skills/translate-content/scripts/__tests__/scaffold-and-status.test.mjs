/**
 * Coverage for the three pipeline scripts that are not the two per-file gates:
 * new-locale.mjs, translation-status.mjs and mqm-wordcount.mjs.
 *
 * It lives here rather than in scripts/__tests__/ only because of the file-ownership split in
 * the work unit that authored it (I18N-PLAN.md section 15). Wire it into `npm test` alongside
 * scripts/__tests__/*.test.mjs:
 *
 *   node --test .claude/skills/translate-content/scripts/__tests__/scaffold-and-status.test.mjs
 *
 * The load-bearing assertion is the first one: a scaffolder that copies English markdown turns
 * an interrupted run into a green build that publishes English under a foreign hreflang.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..', '..');
const SCRIPTS = path.join(ROOT, 'scripts');

const { scaffoldLocale, LOCALE_DIRS, TRANSLATION_JSON } = await import(path.join(SCRIPTS, 'new-locale.mjs'));
const { validateSidecar, shardName } = await import(path.join(SCRIPTS, 'translation-status.mjs'));
const { countSourceWords, stripForCount, mqmScore } = await import(path.join(SCRIPTS, 'mqm-wordcount.mjs'));

const ROSTER = [
  { locale: 'en', tier: 'A', coverage: 'full', status: 'live' },
  { locale: 'es', tier: 'A', coverage: 'full', status: 'draft' },
];

function fixtureRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'new-locale-'));
  fs.mkdirSync(path.join(dir, 'docs', 'courses', 'react'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs', 'paths'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'intro.mdx'), '---\ntitle: Intro\n---\n\nHello.\n');
  fs.writeFileSync(path.join(dir, 'docs', 'courses', 'react', 'learn-react.mdx'), '# Learn React\n');
  return dir;
}

test('new-locale creates directories and JSON but NEVER copies English markdown', () => {
  const root = fixtureRoot();
  const result = scaffoldLocale('es', { root, roster: ROSTER });

  for (const d of LOCALE_DIRS) {
    assert.ok(fs.existsSync(path.join(root, 'i18n', 'es', ...d.split('/'))), `missing dir ${d}`);
  }
  for (const f of TRANSLATION_JSON) {
    const file = path.join(root, 'i18n', 'es', ...f.split('/'));
    assert.ok(fs.existsSync(file), `missing translation JSON ${f}`);
    assert.equal(fs.readFileSync(file, 'utf8').trim(), '{}');
  }
  // The English docs subtree is mirrored as EMPTY directories.
  assert.ok(fs.existsSync(path.join(root, 'i18n', 'es', 'docusaurus-plugin-content-docs', 'current', 'courses', 'react')));
  assert.equal(result.markdown.length, 0, 'the scaffold must contain zero markdown files');
  assert.equal(result.sidecars, 0);

  fs.rmSync(root, { recursive: true, force: true });
});

test('new-locale rejects a locale that is not in the roster, and rejects en', () => {
  const root = fixtureRoot();
  assert.throws(() => scaffoldLocale('xx', { root, roster: ROSTER }), /not in i18n\/locales.config.ts/);
  assert.throws(() => scaffoldLocale('en', { root, roster: ROSTER }), /source locale/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('new-locale never overwrites translation JSON that already has content', () => {
  const root = fixtureRoot();
  scaffoldLocale('es', { root, roster: ROSTER });
  const codeJson = path.join(root, 'i18n', 'es', 'code.json');
  fs.writeFileSync(codeJson, '{"homepage.title":{"message":"Aprende a programar"}}\n');
  scaffoldLocale('es', { root, roster: ROSTER });
  assert.match(fs.readFileSync(codeJson, 'utf8'), /Aprende a programar/);
  fs.rmSync(root, { recursive: true, force: true });
});

/* ------------------------------------------------------------ sidecars */

const GOOD_SIDECAR = {
  sourcePath: 'docs/comparisons/scrimba-vs-codecademy.mdx',
  route: '/docs/comparisons/scrimba-vs-codecademy/',
  locale: 'de',
  sourceHash: 'a'.repeat(64),
  translatedAt: '2026-08-12T09:00:00.000Z',
  tier: 'faithful',
  mqm: { score: 3.2, sourceWords: 1840, majorAccuracy: 0, terminology: 0, judgeModel: 'cold-judge', verdict: 'pass' },
  jsd: 0.041,
  state: 'current',
  attempts: 1,
};

test('a sidecar in the Phase 5 item 10 shape validates', () => {
  const file = shardName(GOOD_SIDECAR.sourcePath);
  assert.deepEqual(validateSidecar(GOOD_SIDECAR, { fileName: file, locale: 'de' }), []);
  assert.match(file, /^[0-9a-f]{64}\.json$/);
});

test('malformed sidecars are rejected, one message per defect', () => {
  const cases = [
    [{ ...GOOD_SIDECAR, tier: 'literal' }, /tier must be one of/],
    [{ ...GOOD_SIDECAR, state: 'done' }, /state must be one of/],
    [{ ...GOOD_SIDECAR, attempts: 0 }, /attempts must be a number/],
    [{ ...GOOD_SIDECAR, jsd: 'low' }, /jsd must be a number/],
    [{ ...GOOD_SIDECAR, mqm: { ...GOOD_SIDECAR.mqm, sourceWords: 0 } }, /sourceWords must be > 0/],
    [(() => { const s = { ...GOOD_SIDECAR }; delete s.translatedAt; return s; })(), /missing key 'translatedAt'/],
    [(() => { const s = { ...GOOD_SIDECAR, mqm: { ...GOOD_SIDECAR.mqm } }; delete s.mqm.verdict; return s; })(), /missing key 'mqm.verdict'/],
  ];
  for (const [obj, rx] of cases) {
    const errors = validateSidecar(obj, { fileName: shardName(GOOD_SIDECAR.sourcePath), locale: 'de' });
    assert.ok(errors.some((e) => rx.test(e)), `expected ${rx} in ${JSON.stringify(errors)}`);
  }
});

test('a sidecar copied from another page is rejected by its filename', () => {
  const errors = validateSidecar(GOOD_SIDECAR, { fileName: shardName('docs/intro.mdx'), locale: 'de' });
  assert.ok(errors.some((e) => /filename must be sha256\(sourcePath\)/.test(e)));
});

test('a sidecar whose locale contradicts its directory is rejected', () => {
  const errors = validateSidecar(GOOD_SIDECAR, { fileName: shardName(GOOD_SIDECAR.sourcePath), locale: 'fr' });
  assert.ok(errors.some((e) => /does not match its directory/.test(e)));
});

test('translation-status imports sourceHash instead of defining a second one', () => {
  // Two implementations of that hash would disagree on the first edge case and every page in
  // every locale would then read as permanently stale. Asserted on the source text because the
  // property being defended is "there is only one definition", not "they agree today".
  const src = fs.readFileSync(path.join(SCRIPTS, 'translation-status.mjs'), 'utf8');
  assert.match(src, /import\s*\{[\s\S]*sourceHash[\s\S]*\}\s*from\s*'\.\/build-coverage-manifest\.mjs'/);
  assert.doesNotMatch(src, /createHash\('sha256'\)\.update\(\s*fs\.readFileSync/);
});

/* ------------------------------------------------------- MQM denominator */

test('the MQM denominator strips frontmatter, code, JSX and attribute values', () => {
  const mdx = `---
title: Is Scrimba Worth It?
description: A long frontmatter line that must not be counted at all
---

import PricingCTA from '@site/src/components/PricingCTA';

## Verdict {#verdict}

Scrimba is worth it for hands-on learners.

<PricingCTA to="/docs/pricing/" label="See the plans and their yearly discount" />

\`\`\`bash
npm install --save-dev some-package-with-many-words
\`\`\`

See the [pricing page](/docs/pricing/) for details.
`;
  const stripped = stripForCount(mdx);
  assert.ok(!stripped.includes('frontmatter line'));
  assert.ok(!stripped.includes('npm install'));
  assert.ok(!stripped.includes('See the plans'), 'attribute values are not source words');
  assert.ok(!stripped.includes('/docs/pricing/'), 'link targets are not source words');
  assert.ok(stripped.includes('pricing page'), 'link TEXT is source words');

  // "Verdict" (1) + "Scrimba is worth it for hands-on learners." (7)
  // + "See the pricing page for details." (6) = 14.
  assert.equal(countSourceWords(mdx), 14);
});

test('the denominator ignores table pipes and bullet markers', () => {
  // Feature, Scrimba, one, two. The "---" separator row holds no letters or digits.
  assert.equal(countSourceWords('| Feature | Scrimba |\n| --- | --- |\n- one\n- two\n'), 4);
});

test('MQM scoring uses the section 13.3 weights', () => {
  const errors = [
    { severity: 'minor' }, { severity: 'minor' }, { severity: 'major' }, { severity: 'negligible' },
  ];
  // 1 + 1 + 5 + 0.1 = 7.1 points over 1000 source words.
  assert.equal(mqmScore(errors, 1000), 7.1);
  assert.equal(mqmScore([{ severity: 'non-translation' }], 2000), 12.5);
  assert.equal(mqmScore([], 500), 0);
});
