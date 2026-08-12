/**
 * scripts/glossary-check.mjs must FAIL a deliberately corrupted translation, and
 * scripts/build-glossary.mjs must never destroy an agent's per-locale rows
 * (I18N-PLAN.md section 4 Phase 5 item 9, section 13.3 "terminology is binary").
 *
 * The corruptions below are the exact failure this check exists for: a model localizes the
 * product noun ("scrim" -> "grabacion"), invents a translated course name that matches nothing
 * in the catalog, or lowercases a technology name. None of them break the build; all of them
 * either mislead the reader or break the commercial claim on the page.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGlossary, effectiveTerms, countExact } from '../glossary-check.mjs';
import { parseCsv, parseGlossaryCsv, serializeCsv, seedRows, mergeRows, rowsToCsv } from '../build-glossary.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(HERE, '..', 'glossary-check.mjs');
const ROOT = path.resolve(HERE, '..', '..');

const CSV = [
  'term,category,locale,rendering,inflectable,source',
  'Scrimba,platform,*,,no,seed',
  'scrim,platform,*,,no,seed',
  'Scrimba Pro,platform,*,,no,seed',
  'React,technology,*,,no,seed',
  'Learn React,course-name,*,,no,data/courses.json#cleanName',
  '"Build Websites with Figma, HTML, and CSS",course-name,*,,no,data/courses.json#cleanName',
  // A case-governed locale opts its own terms into inflection, without touching global rows.
  'Scrimba,platform,pl,Scrimba,yes,translate-pl',
].join('\n') + '\n';

const rows = parseGlossaryCsv(CSV);
const esTerms = effectiveTerms(rows, 'es');
const plTerms = effectiveTerms(rows, 'pl');

const SOURCE = `# Learn React on Scrimba

Scrimba Pro unlocks every scrim in the catalog, including
"Build Websites with Figma, HTML, and CSS". React is taught interactively.`;

const GOOD_ES = `# Learn React en Scrimba

Scrimba Pro desbloquea cada scrim del catálogo, incluido
"Build Websites with Figma, HTML, and CSS". React se enseña de forma interactiva.`;

test('a compliant translation produces no violations', () => {
  assert.deepEqual(checkGlossary(SOURCE, GOOD_ES, esTerms), []);
});

test('the RFC 4180 reader keeps a comma inside a quoted course name', () => {
  const parsed = parseCsv(CSV);
  const row = parsed.find((r) => r[0].startsWith('Build Websites'));
  assert.equal(row[0], 'Build Websites with Figma, HTML, and CSS');
  assert.equal(row.length, 6);
  // round-trips
  assert.equal(parseCsv(serializeCsv(parsed)).length, parsed.length);
});

test('a term absent from the source is not required in the translation', () => {
  const violations = checkGlossary('Nothing to see here.', 'Nada que ver aquí.', esTerms);
  assert.deepEqual(violations, []);
});

const corruptions = [
  {
    name: 'the product noun is localized ("scrim" -> "grabación")',
    term: 'scrim',
    type: 'missing',
    mutate: (t) => t.replace('cada scrim', 'cada grabación'),
  },
  {
    name: 'the course name is translated (points at a product that does not exist)',
    term: 'Learn React',
    type: 'missing',
    mutate: (t) => t.replace('Learn React', 'Aprende React'),
  },
  {
    name: 'a technology name is lowercased',
    term: 'React',
    type: 'rendered-differently',
    mutate: (t) => t.replace(/React/g, 'react'),
  },
  {
    name: 'the plan name is half-translated',
    term: 'Scrimba Pro',
    type: 'missing',
    mutate: (t) => t.replace('Scrimba Pro', 'Scrimba Profesional'),
  },
  {
    name: 'a quoted course name loses a word',
    term: 'Build Websites with Figma, HTML, and CSS',
    type: 'missing',
    mutate: (t) => t.replace('with Figma, HTML, and CSS', 'con Figma, HTML y CSS'),
  },
];

for (const c of corruptions) {
  test(`FAILS a corrupted fixture: ${c.name}`, () => {
    const violations = checkGlossary(SOURCE, c.mutate(GOOD_ES), esTerms);
    const hit = violations.find((v) => v.term === c.term);
    assert.ok(hit, `expected a violation for "${c.term}", got ${JSON.stringify(violations)}`);
    assert.equal(hit.type, c.type);
  });
}

test('inflection is allowed only where the locale declared it', () => {
  // Polish inflects the stem-final vowel: locative of "Scrimba" is "Scrimbie", not "Scrimbaie".
  const polish = 'Kurs Learn React na Scrimbie. Każdy scrim jest interaktywny. React uczy praktycznie.';
  assert.deepEqual(
    checkGlossary('Learn React on Scrimba. Every scrim is interactive. React is taught.', polish, plTerms)
      .filter((v) => v.term === 'Scrimba'),
    [],
  );
  // Spanish declared nothing, so the same inflected form is a terminology violation there.
  const spanish = 'Learn React en Scrimbie. Cada scrim es interactivo. React se enseña.';
  const hit = checkGlossary('Learn React on Scrimba. Every scrim is interactive. React is taught.', spanish, esTerms)
    .find((v) => v.term === 'Scrimba');
  assert.ok(hit, 'a Spanish page that only ever writes "Scrimbie" must fail');
  assert.equal(hit.type, 'rendered-differently');
  assert.equal(hit.found, 'Scrimbie');
});

test('word boundaries: a hyphenated compound still counts, a substring does not', () => {
  assert.equal(countExact('Ein Scrimba-Kurs für Anfänger.', 'Scrimba'), 1);
  assert.equal(countExact('Un enfoque reactivo y Reactivo.', 'React'), 0);
});

test('a longer term never masks a shorter one in the report', () => {
  // "Scrimba Pro" is present and correct; only the product noun "scrim" was localized.
  const violations = checkGlossary(SOURCE, GOOD_ES.replace('cada scrim', 'cada grabación'), esTerms);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].term, 'scrim');
  assert.equal(violations[0].type, 'missing');
});

test('build-glossary preserves per-locale rows and rewrites only the global ones', () => {
  const existing = parseGlossaryCsv(CSV);
  const seeded = seedRows([
    { cleanName: 'Learn Vue', title: 'Learn Vue', isPath: false },
    { cleanName: 'The Frontend Developer Path', title: 'The Frontend Developer Path: learn it all', isPath: true },
  ]);
  const merged = mergeRows(existing, seeded);
  const csv = rowsToCsv(merged);
  const reparsed = parseGlossaryCsv(csv);

  const pl = reparsed.filter((r) => r.locale === 'pl');
  assert.equal(pl.length, 1, 'the agent-authored pl row survives regeneration');
  assert.equal(pl[0].inflectable, 'yes');
  assert.ok(reparsed.some((r) => r.term === 'Learn Vue' && r.locale === '*'));
  // The article-less path name is seeded too: prose says "the Frontend Developer Path".
  assert.ok(reparsed.some((r) => r.term === 'Frontend Developer Path' && r.category === 'path-name'));
  // A colon-bearing SEO title is marketing prose, not a name, so it is NOT frozen.
  assert.ok(!reparsed.some((r) => r.term.includes('learn it all')));
});

test('the committed glossary is in sync with data/courses.json', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-glossary.mjs'), '--check'], {
    encoding: 'utf8',
  });
});

test('the CLI exits non-zero on a corrupted file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'glossary-check-'));
  const src = path.join(dir, 'source.mdx');
  const bad = path.join(dir, 'bad.mdx');
  fs.writeFileSync(src, 'Learn React is a Scrimba course.\n');
  fs.writeFileSync(bad, 'Aprende React es un curso de Scrimba.\n');
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT, src, bad, '--locale', 'es'], { encoding: 'utf8', stdio: 'pipe' }),
    (err) => err.status === 1,
  );
  fs.rmSync(dir, { recursive: true, force: true });
});
