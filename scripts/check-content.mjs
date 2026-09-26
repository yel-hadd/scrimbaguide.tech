#!/usr/bin/env node
/**
 * Content guardrails. Fails the build if an editorial invariant regresses:
 *   1. No em-dashes in authored prose (project style rule).
 *   2. No exact Scrimba prices (regional + drift; link to /our-pricing instead).
 *      Competitor/bootcamp prices are allowed, so we only flag a $-amount that
 *      sits directly next to a Scrimba plan (its own price), not one that merely
 *      shares a comparison line with "Scrimba Pro".
 *   3. No reappearance of the stale Backend path duration (30.1 hrs -> 36.2 hrs).
 *   4. Frontmatter `description` is 160 characters or fewer (draft: true pages skip).
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
  // A Scrimba price expressed as CODE rather than prose, e.g.
  // `const scrimbaMonthly = 30`. The prose patterns above cannot see this, and
  // it shipped a live $30/mo figure into the bootcamp calculator once already.
  /(?:const|let|var)\s+\w*scrimba\w*\s*(?::\s*number\s*)?=\s*\d/i,
];
// ── Image text ceilings ─────────────────────────────────────────────
// Nothing enforced these before, so both drifted: alts reached 514 chars and
// captions welded three or four ideas together. Re-establishing them by hand
// costs a full audit pass, so they are gates now.
//
// 150 for alt is Nielsen Norman Group's guideline (Cionca and Kohler,
// 22 Nov 2024). It is NOT the folklore "125 character limit", which has no
// basis: WCAG deliberately declines to set one, and the number traces to old
// JAWS builds that chunked long alt rather than truncating it. Applies to
// every alt, not just <Screenshot>: ScrimPoster and bare <img> use the same
// alt-plus-figcaption pattern.
const ALT_MAX = 150;
// Captions run longer than alts by design, since they carry the verdict and
// the m:ss provenance. 250 is the backstop, not the target; the house rule is
// one idea in about 180.
const CAPTION_MAX = 250;

// ── Frontmatter description length ──────────────────────────────────
// A description this site can't fit into a SERP snippet gets truncated by
// Google, which usually clips the sentence that was supposed to earn the
// click. 160 is the conventional safe width; draft pages aren't live yet
// so they don't have to meet it.
const DESCRIPTION_MAX = 160;

// Pulls the leading `---\n...\n---` frontmatter block off an .md/.mdx file.
// Returns null when the file has no frontmatter (components, non-doc pages).
export function extractFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}

// Reads a single `key: value` field out of a frontmatter block, stripping
// a wrapping quote pair (single or double) if present. Returns null when
// the key is absent.
export function readFrontmatterField(frontmatter, key) {
  const re = new RegExp(`^${key}:\\s*(.+)\\s*$`, 'm');
  const m = frontmatter.match(re);
  if (!m) return null;
  let value = m[1].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

// Checks one file's frontmatter `description` against DESCRIPTION_MAX.
// Skips files with no frontmatter, no description, or `draft: true`.
// Returns a violation string, or null when the page passes (or isn't in scope).
export function checkDescriptionLength(rel, content) {
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) return null;
  if (readFrontmatterField(frontmatter, 'draft') === 'true') return null;
  const description = readFrontmatterField(frontmatter, 'description');
  if (description === null) return null;
  if (description.length > DESCRIPTION_MAX) {
    return `${rel}:1 description is ${description.length} chars (max ${DESCRIPTION_MAX}): ${description.slice(0, 80)}...`;
  }
  return null;
}

function main() {
  const violations = [];

  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const rel = path.relative(ROOT, file);
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      const body = lines.join('\n');

      const descriptionViolation = checkDescriptionLength(rel, body);
      if (descriptionViolation) violations.push(descriptionViolation);

      for (const m of body.matchAll(/alt="((?:[^"\\]|\\.)*)"/g)) {
        if (m[1].length > ALT_MAX) {
          const n = body.slice(0, m.index).split('\n').length;
          violations.push(`${rel}:${n} alt is ${m[1].length} chars (max ${ALT_MAX}): ${m[1].slice(0, 80)}...`);
        }
      }
      for (const m of body.matchAll(/caption="((?:[^"\\]|\\.)*)"/g)) {
        const c = m[1];
        const n = body.slice(0, m.index).split('\n').length;
        if (c.length > CAPTION_MAX) {
          violations.push(`${rel}:${n} caption is ${c.length} chars (max ${CAPTION_MAX}): ${c.slice(0, 80)}...`);
        }
        // A third idea bolted on is the failure this rule exists to stop.
        if (/\b(?:Note|Notice) (?:the|that|how)\b|\bThe next scrim\b/.test(c)) {
          violations.push(`${rel}:${n} caption carries a Note/Notice/next-scrim clause (move it into the prose): ${c.slice(0, 80)}...`);
        }
      }

      lines.forEach((line, i) => {
        const n = i + 1;
        if (line.includes('—')) violations.push(`${rel}:${n} em-dash (—): ${line.trim().slice(0, 100)}`);
        if (SCRIMBA_PRICE_LEAK.some((re) => re.test(line))) {
          violations.push(`${rel}:${n} possible exact Scrimba price (link to /our-pricing instead): ${line.trim().slice(0, 100)}`);
        }
        if (/\b(?:30\.1|39\.4)\b/.test(line)) violations.push(`${rel}:${n} stale Backend hours (should be 36.2 as of 2026-08): ${line.trim().slice(0, 100)}`);
      });
    }
  }

  if (violations.length) {
    console.error(`Content guardrail failed (${violations.length} issue(s)):`);
    for (const v of violations) console.error('  ' + v);
    process.exit(1);
  }
  console.log('Content guardrails passed: no em-dashes, Scrimba price leaks, stale Backend hours, over-long alt/caption text, or over-long descriptions.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
