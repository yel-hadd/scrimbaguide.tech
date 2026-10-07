#!/usr/bin/env node
/**
 * Course-leaf heading gate. Course leaves (docs/courses/**, pages that render
 * <CourseSchema>) must not share a skeleton: until 2026-10 all 70 used the
 * same eleven H2s, and Google left most of them "crawled, not indexed".
 *
 * Fails when:
 *   1. an H2 is one of the retired generic labels, or
 *   2. the same H2 text appears on more than MAX_SHARED leaves.
 *
 * Usage: node scripts/check-heading-uniqueness.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MAX_SHARED = 2;

export const GENERIC_H2 = [
  'quick answer',
  'is it worth your time?',
  "what you'll learn",
  'what a lesson feels like',
  'how long it takes',
  'prerequisites',
  'where it fits',
  'strengths and limits',
  'related courses and comparisons',
  'free or pro: exactly what is gated',
  "who it's for, and who should skip it",
  'inside the course, module by module',
  'inside the course, scrim by scrim',
  'inside the course, section by section',
];

/** H2 texts of an MDX body, outside code fences, without {#id} suffixes. */
export function h2s(source) {
  const out = [];
  let fenced = false;
  for (const line of source.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^##\s+(.+?)\s*(\{#[^}]+\})?\s*$/.exec(line);
    if (m) out.push(m[1].trim());
  }
  return out;
}

const norm = (h) => h.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

/** @param {Map<string, string>} leaves file -> source */
export function findProblems(leaves) {
  const problems = [];
  const seen = new Map();
  for (const [file, source] of leaves) {
    for (const h of h2s(source)) {
      const key = norm(h);
      if (GENERIC_H2.includes(key)) problems.push(`${file}: generic H2 "${h}"`);
      if (!seen.has(key)) seen.set(key, new Set());
      seen.get(key).add(file);
    }
  }
  for (const [key, files] of seen) {
    if (files.size > MAX_SHARED && !GENERIC_H2.includes(key)) {
      problems.push(`H2 "${key}" appears on ${files.size} leaves: ${[...files].sort().join(', ')}`);
    }
  }
  return problems;
}

function collectLeaves() {
  const leaves = new Map();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.mdx')) {
        const src = fs.readFileSync(full, 'utf8');
        if (src.includes('<CourseSchema') && !/^draft:\s*true/m.test(src)) {
          leaves.set(path.relative(ROOT, full), src);
        }
      }
    }
  };
  walk(path.join(ROOT, 'docs', 'courses'));
  return leaves;
}

function main() {
  const leaves = collectLeaves();
  const problems = findProblems(leaves);
  if (problems.length) {
    console.error(`check-heading-uniqueness: ${problems.length} problem(s) across ${leaves.size} course leaves`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-heading-uniqueness: ${leaves.size} course leaves, no shared or generic H2s`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
