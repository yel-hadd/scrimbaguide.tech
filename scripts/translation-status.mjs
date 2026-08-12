#!/usr/bin/env node
/**
 * The SOLE reducer of the per-page translation status sidecars
 * (I18N-PLAN.md section 4 Phase 5 item 10, section 17 state-file registry).
 *
 *   i18n/<locale>/.status/<sha256(sourcePath)>.json   committed, one writer each (the agent
 *                                                     that translated that page)
 *   i18n/translation-status.json                      generated, gitignored, ONE writer: this
 *
 * Sharding is not a style choice. 47 concurrent locale agents appending to one JSON ledger is
 * a guaranteed write conflict, and the losing writer's page silently disappears from the
 * ledger while its markdown stays on disk. One file per page per locale means no two agents
 * ever open the same file.
 *
 * `sourceHash` is IMPORTED from scripts/build-coverage-manifest.mjs rather than reimplemented.
 * Two independent implementations of the same hash would disagree on the first edge case
 * (frontmatter block children, CRLF), and every page in every locale would then read as stale
 * forever. There is exactly one definition of that hash in this repo.
 *
 * Usage:
 *   node scripts/translation-status.mjs             # write i18n/translation-status.json
 *   node scripts/translation-status.mjs --report    # human table (make i18n-status)
 *   node scripts/translation-status.mjs --json      # print, write nothing
 *   node scripts/translation-status.mjs --check     # exit 1 on malformed or failing sidecars
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  loadRoster,
  buildSourceUniverse,
  resolveRouteSet,
  coverageForLocale,
  sourceHash,
} from './build-coverage-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Sidecar shape, verbatim from plan section 4 Phase 5 item 10. */
export const SIDECAR_REQUIRED = [
  'sourcePath', 'route', 'locale', 'sourceHash', 'translatedAt', 'tier', 'mqm', 'jsd',
  'state', 'attempts',
];
export const SIDECAR_TIERS = new Set(['faithful', 'transcreation']);
export const SIDECAR_STATES = new Set(['current', 'blocked']);
export const MQM_REQUIRED = [
  'score', 'sourceWords', 'majorAccuracy', 'terminology', 'judgeModel', 'verdict',
];

/** Repo-relative source path -> its sidecar filename. The identity a sidecar is keyed on. */
export const shardName = (sourcePath) =>
  `${crypto.createHash('sha256').update(sourcePath).digest('hex')}.json`;

/**
 * Structural validation only. A malformed sidecar is worse than a missing one: it claims a
 * page is done while carrying no evidence, and the coverage manifest reads `state` without
 * looking at anything else.
 */
export function validateSidecar(obj, { fileName = null, locale = null } = {}) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return ['sidecar is not an object'];
  for (const k of SIDECAR_REQUIRED) {
    if (obj[k] === undefined) errors.push(`missing key '${k}'`);
  }
  if (obj.tier !== undefined && !SIDECAR_TIERS.has(obj.tier)) {
    errors.push(`tier must be one of ${[...SIDECAR_TIERS].join('|')}, got '${obj.tier}'`);
  }
  if (obj.state !== undefined && !SIDECAR_STATES.has(obj.state)) {
    errors.push(`state must be one of ${[...SIDECAR_STATES].join('|')}, got '${obj.state}'`);
  }
  if (typeof obj.attempts !== 'number' || obj.attempts < 1) {
    errors.push('attempts must be a number >= 1');
  }
  if (typeof obj.jsd !== 'number') errors.push('jsd must be a number (section 13.5 score)');
  if (obj.mqm && typeof obj.mqm === 'object') {
    for (const k of MQM_REQUIRED) {
      if (obj.mqm[k] === undefined) errors.push(`missing key 'mqm.${k}'`);
    }
    if (typeof obj.mqm.sourceWords === 'number' && obj.mqm.sourceWords <= 0) {
      errors.push('mqm.sourceWords must be > 0 (it is the MQM denominator)');
    }
  } else if (obj.mqm !== undefined) {
    errors.push('mqm must be an object');
  }
  if (locale && obj.locale && obj.locale !== locale) {
    errors.push(`locale '${obj.locale}' does not match its directory (i18n/${locale}/)`);
  }
  // The filename IS the source path's hash. A mismatch means the sidecar was copied from
  // another page, which would report one page's quality under another page's name.
  if (fileName && obj.sourcePath && shardName(obj.sourcePath) !== fileName) {
    errors.push(`filename must be sha256(sourcePath) = ${shardName(obj.sourcePath)}`);
  }
  return errors;
}

/** Repo-relative source path for a universe entry. Mirrors build-coverage-manifest.mjs. */
function relSourceFor(entry) {
  const base = { docs: 'docs', blog: 'blog', pages: 'src/pages' }[entry.surface];
  return `${base}/${entry.sourceFile}`;
}

export function readSidecars(locale, root = ROOT) {
  const dir = path.join(root, 'i18n', locale, '.status');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const file = path.join(dir, f);
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return { file: path.relative(root, file), fileName: f, data, parseError: null };
      } catch (err) {
        return { file: path.relative(root, file), fileName: f, data: null, parseError: String(err.message) };
      }
    });
}

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 1000) / 1000;
};

export function buildStatus({ root = ROOT } = {}) {
  const tiers = JSON.parse(fs.readFileSync(path.join(root, 'i18n', 'tiers.json'), 'utf8'));
  const roster = loadRoster(path.join(root, 'i18n', 'locales.config.ts'));
  const universe = buildSourceUniverse();
  const bySource = new Map(universe.map((e) => [relSourceFor(e), e]));

  const out = { version: 1, generatedAt: new Date().toISOString(), locales: {} };

  for (const rec of roster) {
    if (rec.locale === 'en') continue;
    const sidecars = readSidecars(rec.locale, root);
    // Skip locales that have never been touched, so the report stays readable at 47 rows.
    if (!sidecars.length && rec.status === 'draft') continue;

    const declared = resolveRouteSet(rec.coverage, tiers, universe);
    const cov = coverageForLocale(rec.locale, declared, universe);

    const invalid = [];
    const pages = [];
    for (const s of sidecars) {
      if (s.parseError) { invalid.push({ file: s.file, errors: [`unparseable: ${s.parseError}`] }); continue; }
      const errors = validateSidecar(s.data, { fileName: s.fileName, locale: rec.locale });
      // A sidecar pointing at a source file that no longer exists is an orphan: the English
      // page was deleted or renamed, and the translation is now unreachable.
      if (s.data.sourcePath && !bySource.has(s.data.sourcePath)) {
        errors.push(`sourcePath '${s.data.sourcePath}' has no English source (renamed or deleted?)`);
      }
      if (errors.length) { invalid.push({ file: s.file, errors }); continue; }

      const entry = bySource.get(s.data.sourcePath);
      const fresh = sourceHash(path.join(root, s.data.sourcePath)) === s.data.sourceHash;
      pages.push({
        route: s.data.route,
        sourcePath: s.data.sourcePath,
        surface: entry.surface,
        tier: s.data.tier,
        state: s.data.state === 'current' && !fresh ? 'stale' : s.data.state,
        translatedAt: s.data.translatedAt,
        attempts: s.data.attempts,
        mqm: s.data.mqm,
        jsd: s.data.jsd,
        declared: declared.has(s.data.route),
      });
    }

    const scored = pages.filter((p) => p.mqm && typeof p.mqm.score === 'number');
    out.locales[rec.locale] = {
      tier: rec.tier,
      coverage: rec.coverage,
      status: rec.status,
      declared: declared.size,
      current: pages.filter((p) => p.state === 'current').length,
      stale: pages.filter((p) => p.state === 'stale').length,
      blocked: pages.filter((p) => p.state === 'blocked').length,
      missing: cov.missing.length,
      droppedRatio: declared.size ? cov.blocked.length / declared.size : 0,
      mqm: {
        pages: scored.length,
        medianScore: median(scored.map((p) => p.mqm.score)),
        maxScore: scored.length ? Math.max(...scored.map((p) => p.mqm.score)) : null,
        failing: scored
          .filter((p) => p.mqm.verdict !== 'pass' || p.mqm.majorAccuracy > 0 || p.mqm.terminology > 0)
          .map((p) => p.route),
      },
      // Section 13.5 tracks the per-locale MEDIAN JSD and alarms on a >20% rise between runs;
      // the previous value lives in the previous generated file, so only the median is stored.
      jsd: { pages: pages.length, median: median(pages.map((p) => p.jsd).filter((x) => typeof x === 'number')) },
      invalidSidecars: invalid,
      routes: Object.fromEntries(pages.map((p) => [p.route, p])),
    };
  }
  return out;
}

/* ------------------------------------------------------------------ main */

function report(status) {
  const rows = Object.entries(status.locales);
  if (!rows.length) {
    console.log('No locale has any .status sidecar yet. Nothing has been translated.');
    return;
  }
  console.log('locale  tier cov       status   declared current stale blocked missing  mqm(med) jsd(med)');
  for (const [l, v] of rows) {
    console.log(
      l.padEnd(8) + String(v.tier).padEnd(5) + String(v.coverage).padEnd(10) +
      String(v.status).padEnd(9) + String(v.declared).padEnd(9) + String(v.current).padEnd(8) +
      String(v.stale).padEnd(6) + String(v.blocked).padEnd(8) + String(v.missing).padEnd(9) +
      String(v.mqm.medianScore ?? '-').padEnd(9) + String(v.jsd.median ?? '-'),
    );
    for (const bad of v.invalidSidecars) {
      console.log(`  ! ${bad.file}: ${bad.errors.join('; ')}`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const status = buildStatus();

  if (args.includes('--json')) { console.log(JSON.stringify(status, null, 2)); return; }
  if (args.includes('--report')) { report(status); return; }

  const target = path.join(ROOT, 'i18n', 'translation-status.json');
  fs.writeFileSync(target, JSON.stringify(status, null, 2) + '\n');
  const n = Object.keys(status.locales).length;
  console.log(`translation-status.json: ${n} locale(s) with translation activity.`);

  if (args.includes('--check')) {
    const broken = Object.entries(status.locales).filter(([, v]) => v.invalidSidecars.length);
    const failing = Object.entries(status.locales).filter(([, v]) => v.mqm.failing.length);
    for (const [l, v] of broken) {
      console.error(`\n${l}: ${v.invalidSidecars.length} malformed status sidecar(s)`);
      for (const b of v.invalidSidecars) console.error(`  ${b.file}: ${b.errors.join('; ')}`);
    }
    for (const [l, v] of failing) {
      console.error(`\n${l}: ${v.mqm.failing.length} page(s) recorded as current with a failing MQM verdict`);
      for (const r of v.mqm.failing) console.error(`  ${r}`);
    }
    if (broken.length || failing.length) process.exit(1);
    console.log('All status sidecars are well-formed and passing.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
