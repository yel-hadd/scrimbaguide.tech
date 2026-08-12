#!/usr/bin/env node
/**
 * Seeds the GLOBAL do-not-translate rows of the translation glossary from
 * data/courses.json (I18N-PLAN.md section 4 Phase 5, item 3 and the glossary.csv note).
 *
 * The glossary is the single highest-leverage input in the whole translation program: the
 * research cited in plan section 13.4 says glossary injection plus constrained decoding does
 * more for meaning preservation than any amount of prompt polish. It is therefore GENERATED,
 * never hand-typed. A hand-typed list of 74 course names drifts the first time the scraper
 * picks up a renamed course, and the failure is silent: the translator localizes a product
 * name, glossary-check has no row for it, and the page ships with an invented course title.
 *
 * FILE SHAPE: long-form RFC 4180, one row per term-locale pair.
 *
 *   term,category,locale,rendering,inflectable,source
 *
 *   locale '*' + empty rendering   global do-not-translate: emit the term verbatim.
 *   locale '<L>' + rendering       that locale must render the term exactly as `rendering`.
 *   inflectable                    'yes' means the frozen form may carry a case ending in
 *                                  this locale (pl/cs/lt/lv/et/hu/sk/hr/sl/sr/uk/ru...).
 *                                  Global rows are 'no' on purpose: tolerating a 4-letter
 *                                  suffix everywhere would let "React" pass as "Reactivo".
 *                                  A case-governed locale opts in with its own row.
 *
 * WHY LONG-FORM AND NOT ONE WIDE ROW PER TERM: 47 per-language agents run in parallel and each
 * appends only its own rows. A wide table would put all 47 of them on the same line of the same
 * file, which is a guaranteed merge conflict on every single term.
 *
 * MERGE SEMANTICS: this script owns the `locale: '*'` rows and rewrites them wholesale. Rows
 * with any other locale are agent-authored and are preserved byte-for-byte. Running it can
 * therefore never destroy a language agent's work.
 *
 * Usage:
 *   node scripts/build-glossary.mjs           # rewrite the global rows in place
 *   node scripts/build-glossary.mjs --check   # exit 1 if the committed file is out of date
 *   node scripts/build-glossary.mjs --json    # print the seeded global rows, write nothing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const GLOSSARY_PATH = path.join(
  ROOT, '.claude', 'skills', 'translate-content', 'references', 'glossary.csv',
);
export const COURSES_PATH = path.join(ROOT, 'data', 'courses.json');

export const COLUMNS = ['term', 'category', 'locale', 'rendering', 'inflectable', 'source'];

/**
 * Terms that are not in any data file: the platform vocabulary and the technology names
 * enumerated in plan section 4 Phase 5 item 3. They live here rather than in the CSV so the
 * CSV stays fully generated; editing this array is a code review, editing a CSV row is not.
 *
 * "scrim" is lowercase on purpose: it is Scrimba's product noun for an interactive screencast
 * and the single most-localized-by-accident word on the site ("grabacion", "Aufzeichnung").
 */
export const SEED_TERMS = [
  ['Scrimba', 'platform'],
  ['Scrimba Pro', 'platform'],
  ['scrim', 'platform'],
  ['scrims', 'platform'],
  ['Scrimba Guide', 'brand'],
  ['Trustpilot', 'brand'],
  ['MDN', 'brand'],
  ['React', 'technology'],
  ['React Router', 'technology'],
  ['Next.js', 'technology'],
  ['Node.js', 'technology'],
  ['TypeScript', 'technology'],
  ['JavaScript', 'technology'],
  ['Tailwind', 'technology'],
  ['Tailwind CSS', 'technology'],
  ['HTML', 'technology'],
  ['CSS', 'technology'],
  ['Python', 'technology'],
  ['SQL', 'technology'],
  ['RAG', 'technology'],
  ['MCP', 'technology'],
  ['Model Context Protocol', 'technology'],
  ['vibe coding', 'concept'],
];

/* ------------------------------------------------------------------ RFC 4180 */

/**
 * RFC 4180 reader. Handles quoted fields, embedded commas, embedded newlines and doubled
 * quotes, because course names legitimately contain commas ("Data Structures and Algorithms:
 * Binary Search" does not, but "Build Websites with Figma, HTML, and CSS" does) and a naive
 * `split(',')` would shear that row into three broken ones.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let i = 0;
  const src = text.replace(/\r\n/g, '\n');
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  while (i < src.length) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i += 1; continue;
      }
      field += ch; i += 1; continue;
    }
    if (ch === '"' && field === '') { quoted = true; i += 1; continue; }
    if (ch === ',') { pushField(); i += 1; continue; }
    if (ch === '\n') { pushRow(); i += 1; continue; }
    field += ch; i += 1;
  }
  if (field !== '' || row.length) pushRow();
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

const quoteField = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function serializeCsv(rows) {
  return rows.map((r) => r.map((v) => quoteField(v ?? '')).join(',')).join('\n') + '\n';
}

/** Parse glossary.csv into objects keyed by COLUMNS, ignoring the header line. */
export function parseGlossaryCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  const missing = COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new Error(`glossary.csv is missing column(s): ${missing.join(', ')}`);
  }
  return rows.slice(1).map((r) => {
    const rec = {};
    header.forEach((h, i) => { rec[h] = (r[i] ?? '').trim(); });
    return rec;
  });
}

export function readGlossary(file = GLOSSARY_PATH) {
  if (!fs.existsSync(file)) return [];
  return parseGlossaryCsv(fs.readFileSync(file, 'utf8'));
}

/* ---------------------------------------------------------------- seeding */

/**
 * A course name that IS the product name, derived from the catalog.
 *
 * `cleanName` is always a name and is always seeded. `title` is the scraped Scrimba SEO title
 * ("Advanced JavaScript Tutorial: Learn to master complex concepts ... with Tom Chant"), which
 * is marketing prose, not a name; freezing all of it would force a Spanish page to carry an
 * English sentence and would fire glossary-check on generic fragments. So `title` is seeded
 * ONLY when it contains no ':' separator, i.e. when the title IS the bare product name
 * ("The Fullstack Developer Path"). That rule is derived and deterministic, so re-running this
 * script on a re-scraped catalog produces the same rows.
 */
export function seedRows(courses) {
  const seen = new Set();
  const out = [];
  const add = (term, category, source) => {
    const t = (term ?? '').trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push({ term: t, category, locale: '*', rendering: '', inflectable: 'no', source });
  };

  for (const [term, category] of SEED_TERMS) add(term, category, 'I18N-PLAN.md#4-phase-5-item-3');

  for (const c of courses) {
    const category = c.isPath ? 'path-name' : 'course-name';
    // cleanName is normally a real product name, but a handful of catalog entries
    // are listicle headings ("Best React Courses and Tutorials Compared [2026]").
    // Freezing those would require a translator to leave an English sentence,
    // bracketed year and all, sitting inside Spanish prose.
    if (c.cleanName && !c.cleanName.includes('[')) {
      add(c.cleanName, category, 'data/courses.json#cleanName');
    }
    // Path names appear in prose both with and without the leading article
    // ("the Frontend Developer Path"), and the article is the part a translator localizes.
    if (c.isPath && /^The\s+/i.test(c.cleanName ?? '')) {
      add(c.cleanName.replace(/^The\s+/i, ''), 'path-name', 'data/courses.json#cleanName-no-article');
    }
    // Only PRODUCT NAMES get frozen. Scraped titles also come in marketing-sentence
    // form ("CSS Variables Tutorial - Learn CSS variables in this free course"),
    // sometimes carrying a scraper typo ("Free Botstrap Tutorial ..."). Freezing
    // those as do-not-translate forces a translator to reproduce an English
    // sentence, typo included, verbatim in Spanish prose. Excluding ':' alone did
    // not catch the dash-separated and dated-listicle forms.
    if (
      c.title &&
      !c.title.includes(':') &&
      !c.title.includes(' - ') &&
      !c.title.includes('[') &&
      c.title.trim().split(/\s+/).length <= 6
    ) {
      add(c.title, category, 'data/courses.json#title');
    }
  }

  // Sort by category then term so a re-run never produces a diff from ordering alone.
  out.sort((a, b) => a.category.localeCompare(b.category) || a.term.localeCompare(b.term));
  return out;
}

/**
 * Global rows come from `seeded`; every other row is carried over untouched, in its original
 * order. Agent-authored per-locale rows are the compounding asset here, so the merge is
 * deliberately asymmetric: this script may only ever ADD or REPLACE `locale: '*'` rows.
 */
export function mergeRows(existing, seeded) {
  const preserved = existing.filter((r) => r.locale !== '*');
  return [...seeded, ...preserved];
}

export function rowsToCsv(rows) {
  return serializeCsv([COLUMNS, ...rows.map((r) => COLUMNS.map((c) => r[c] ?? ''))]);
}

export function buildGlossaryCsv({
  coursesPath = COURSES_PATH,
  glossaryPath = GLOSSARY_PATH,
} = {}) {
  const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
  const seeded = seedRows(Array.isArray(courses) ? courses : []);
  const existing = readGlossary(glossaryPath);
  return rowsToCsv(mergeRows(existing, seeded));
}

function main() {
  const args = process.argv.slice(2);
  const csv = buildGlossaryCsv();

  if (args.includes('--json')) {
    const courses = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf8'));
    console.log(JSON.stringify(seedRows(courses), null, 2));
    return;
  }

  if (args.includes('--check')) {
    const current = fs.existsSync(GLOSSARY_PATH) ? fs.readFileSync(GLOSSARY_PATH, 'utf8') : '';
    if (current !== csv) {
      console.error('glossary.csv is out of date with data/courses.json.');
      console.error('Run: node scripts/build-glossary.mjs');
      process.exit(1);
    }
    console.log('glossary.csv is current.');
    return;
  }

  fs.mkdirSync(path.dirname(GLOSSARY_PATH), { recursive: true });
  fs.writeFileSync(GLOSSARY_PATH, csv);
  const rows = parseGlossaryCsv(csv);
  console.log(
    `glossary.csv: ${rows.filter((r) => r.locale === '*').length} global rows, ` +
    `${rows.filter((r) => r.locale !== '*').length} per-locale rows.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
