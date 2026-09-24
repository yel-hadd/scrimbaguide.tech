#!/usr/bin/env node
/**
 * Structured data must describe content a reader can actually see.
 *
 * Google's structured-data policy requires marked-up content to be visible on
 * the page. Two violations of it shipped to production and neither was caught
 * by any existing gate:
 *
 *   - blog/2026-01-04-is-scrimba-worth-it.mdx emitted ratingValue={4.4} while
 *     the visible verdict said only "Conditional yes". The number 4.4 appeared
 *     nowhere a reader could see it.
 *   - Nine blog posts emitted FAQPage JSON-LD through <DocFaqSchema> with no
 *     visible FAQ section at all: 42 questions and answers that existed only
 *     in the markup.
 *
 * Both are invisible to reviewers because the markup is valid and the page
 * looks fine. Only a comparison catches them, so this runs as a gate.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['docs', 'blog', 'src/pages'];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(mdx?|tsx|jsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** Strip punctuation and case so "Is it worth it?" matches an h3 without the "?". */
const norm = (t) => t.toLowerCase().replace(/[?.,:;!"'\u2018\u2019\u201c\u201d]/g, '').replace(/\s+/g, ' ').trim();

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file);
    const src = fs.readFileSync(file, 'utf8');

    // 1. A marked-up rating must appear somewhere a reader sees it.
    // Strip the whole ratingValue={...} expression, not just the identifier:
    // leaving "={4.4}" behind makes the value look present and the check pass.
    const withoutRating = src.replace(/ratingValue=\{[\d.]+\}/g, '');
    for (const m of src.matchAll(/ratingValue=\{([\d.]+)\}/g)) {
      const value = m[1];
      if (!withoutRating.includes(value)) {
        violations.push(`${rel} emits ratingValue ${value} but ${value} appears nowhere in the visible page`);
      }
    }

    // 2. Every schema FAQ question must appear in the page's visible text.
    //    <FAQAccordion> renders its own items, so it is self-consistent;
    //    <DocFaqSchema> is schema-only and is the one that can drift.
    const schemaOnly = src.match(/<DocFaqSchema[\s\S]*?\/>/g) || [];
    if (schemaOnly.length) {
      const visible = norm(src.replace(/<DocFaqSchema[\s\S]*?\/>/g, ''));
      for (const block of schemaOnly) {
        for (const q of block.matchAll(/q:\s*"((?:[^"\\]|\\.)*)"/g)) {
          if (!visible.includes(norm(q[1]))) {
            violations.push(`${rel} DocFaqSchema question is not in the visible page: "${q[1].slice(0, 70)}"`);
          }
        }
      }
    }

    // 3. A hand-written FAQPage question must match its own visible heading.
    if (/"@type":\s*'FAQPage'|'@type':\s*'FAQPage'/.test(src)) {
      const headings = [...src.matchAll(/<h[23]>([^<]+)<\/h[23]>/g)].map((h) => norm(h[1]));
      for (const q of src.matchAll(/name:\s*'([^']+\?)'/g)) {
        if (headings.length && !headings.includes(norm(q[1]))) {
          violations.push(`${rel} FAQPage question has no matching visible heading: "${q[1].slice(0, 70)}"`);
        }
      }
    }
  }
}

if (violations.length) {
  console.error(`Schema visibility check failed (${violations.length} issue(s)):`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nMarked-up content must be visible to readers. Surface it in the prose,');
  console.error('render it with <FAQAccordion>, or drop the markup.');
  process.exit(1);
}
console.log('Schema visibility passed: every marked-up rating and FAQ question appears in visible content.');
