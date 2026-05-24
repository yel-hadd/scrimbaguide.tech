#!/usr/bin/env node
/**
 * Content guardrails. Fails the build if an editorial invariant regresses:
 *   1. No em-dashes in authored prose (project style rule).
 *   2. No exact Scrimba prices (regional + drift; link to /our-pricing instead).
 *      Competitor/bootcamp prices are allowed, so we only flag a $-amount that
 *      sits directly next to a Scrimba plan (its own price), not one that merely
 *      shares a comparison line with "Scrimba Pro".
 *   3. No reappearance of the stale Backend path duration (30.1 hrs -> 39.4 hrs).
 *
 * Usage: node scripts/check-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['docs', 'blog', 'src/pages', 'src/components', 'src/content'];
const EXTS = new Set(['.md', '.mdx', '.tsx', '.ts']);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

// A Scrimba price leak = a $-amount attached to a Scrimba plan as ITS price.
// Adjacency (not mere co-occurrence) avoids flagging competitor/bootcamp/salary
// figures that share a comparison line with "Scrimba Pro".
const SCRIMBA_PRICE_LEAK = [
  // "Scrimba Pro is $20" — gap may not cross a sentence (.) or table (|) boundary.
  /scrimba\s+(?:pro|bootcamp|subscription|plan)\b[^.|\n]{0,15}\$\s?\d/i,
  // "$20/month for Scrimba Pro" — price directly attributed via for/of.
  /\$\s?\d[\d.,kK]*\s*(?:\/?\s?(?:mo|month|yr|year))?\s+(?:for|of)\s+scrimba\s+pro\b/i,
];
const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const n = i + 1;
      if (line.includes('—')) violations.push(`${rel}:${n} em-dash (—): ${line.trim().slice(0, 100)}`);
      if (SCRIMBA_PRICE_LEAK.some((re) => re.test(line))) {
        violations.push(`${rel}:${n} possible exact Scrimba price (link to /our-pricing instead): ${line.trim().slice(0, 100)}`);
      }
      if (/\b30\.1\b/.test(line)) violations.push(`${rel}:${n} stale Backend hours (30.1, should be 39.4): ${line.trim().slice(0, 100)}`);
    });
  }
}

if (violations.length) {
  console.error(`Content guardrail failed (${violations.length} issue(s)):`);
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log('Content guardrails passed: no em-dashes, Scrimba price leaks, or stale Backend hours.');
