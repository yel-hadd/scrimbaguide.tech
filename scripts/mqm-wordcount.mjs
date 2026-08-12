#!/usr/bin/env node
/**
 * The MQM denominator: ENGLISH SOURCE WORDS (I18N-PLAN.md section 13.3).
 *
 * Section 13.3 pins the denominator to the source, identical for every locale, for two
 * reasons. Two judges scoring the same page must reach the same score, and a target-word
 * denominator would need a word segmenter for ja/zh/th that nothing in the program defines,
 * so the same page would be "5.0 per 1000" in French and "8.7 per 1000" in Japanese purely as
 * an artefact of tokenization.
 *
 * Contract, frozen so a score recorded in a .status sidecar stays reproducible:
 *   1. strip frontmatter
 *   2. strip fenced code blocks
 *   3. strip inline code spans
 *   4. strip import/export lines
 *   5. strip JSX tags INCLUDING all attribute values, and all {expression} braces
 *   6. strip markdown link/image TARGETS, keep the link text
 *   7. count whitespace-separated tokens that contain at least one letter or digit
 *
 * Step 7 is the one refinement over "count whitespace tokens": a bare "-" bullet marker or a
 * lone "|" from a table row is not a word, and counting them would inflate the denominator by
 * several percent on table-heavy comparison pages, which quietly LOOSENS the quality gate.
 *
 * Usage:
 *   node scripts/mqm-wordcount.mjs docs/comparisons/scrimba-vs-udemy.mdx
 *   node scripts/mqm-wordcount.mjs --json docs/**\/*.mdx
 */
import fs from 'node:fs';

export function stripForCount(src) {
  let text = src.replace(/\r\n/g, '\n');

  // 1. frontmatter
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) text = text.slice(end + 4);
  }
  // 2. fenced code
  text = text.replace(/^([ \t]*)(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/gm, '\n');
  // 3. inline code
  text = text.replace(/(?<!`)`[^`\n]+`(?!`)/g, ' ');
  // 4. import/export lines (MDX module scope, never prose)
  text = text.replace(/^(import|export)\s+[^\n]*$/gm, ' ');
  // 5. JSX tags with their attributes, then any remaining {expressions}. Tags first: an
  //    attribute value may itself contain braces, and stripping braces first would leave a
  //    half-eaten tag whose leftover attribute names would be counted as prose.
  text = text.replace(/<\/?[A-Za-z][^>]*>/g, ' ');
  text = text.replace(/\{[^{}]*\}/g, ' ');
  // 6. link and image targets; keep the visible text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, ' $1 ');
  // markdown table pipes and leading list/quote markers carry no words
  text = text.replace(/^[ \t]*[>#*+-]+[ \t]/gm, ' ').replace(/\|/g, ' ');

  return text;
}

export function countSourceWords(src) {
  const tokens = stripForCount(src).split(/\s+/);
  return tokens.filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/**
 * MQM score for a page: weighted error points per 1000 source words (section 13.3).
 * Minor 1, Major 5, Non-translation 25, negligible minor punctuation 0.1.
 */
export const MQM_WEIGHTS = { minor: 1, major: 5, 'non-translation': 25, negligible: 0.1 };

export function mqmScore(errors, sourceWords) {
  const points = errors.reduce((sum, e) => sum + (MQM_WEIGHTS[e.severity] ?? 0), 0);
  // A 300-word practice page must not fail on one Minor error while a 2400-word comparison
  // absorbs twelve, so section 13.3 requires a minimum denominator alongside the rate.
  const denominator = Math.max(sourceWords, 1);
  return Math.round((points / denominator) * 1000 * 100) / 100;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) {
    console.error('usage: node scripts/mqm-wordcount.mjs [--json] <file...>');
    process.exit(2);
  }
  const rows = files.map((f) => ({ file: f, sourceWords: countSourceWords(fs.readFileSync(f, 'utf8')) }));
  if (json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  for (const r of rows) console.log(`${r.sourceWords}\t${r.file}`);
  if (rows.length > 1) {
    console.log(`${rows.reduce((s, r) => s + r.sourceWords, 0)}\ttotal`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
