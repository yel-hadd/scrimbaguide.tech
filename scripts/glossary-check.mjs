#!/usr/bin/env node
/**
 * Deterministic do-not-translate compliance for one translated file
 * (I18N-PLAN.md section 4 Phase 5 item 9, per-file gate).
 *
 * A glossary violation is not a style problem, it is a commercial one: a localized course name
 * points a reader at a product that does not exist in the catalog, and a localized "Scrimba
 * Pro" breaks the only phrase the affiliate funnel is built around. Section 13.3 therefore
 * makes terminology binary rather than weighted: zero violations, or the page does not ship.
 *
 * THE RULE, stated exactly:
 *   For every glossary term that appears in the ENGLISH SOURCE, the translation must contain
 *   the required rendering at least once, in its exact byte form.
 *
 * Source-conditioned on purpose. Requiring every term in the file would fail every page; not
 * conditioning at all would let a translator drop a course name entirely and pass.
 *
 * Two distinguishable failures, because the fix differs:
 *   missing               the term is simply gone (Accuracy/Omission).
 *   rendered-differently  a near-miss is present: wrong case, or a case ending on a term that
 *                         this locale has not declared inflectable (Terminology).
 *
 * Inflection: `inflectable: yes` tolerates a case ending on the term's stem ("Scrimba" ->
 * "Scrimbie" in pl). It is opt-in per locale because a global tolerance would silently accept
 * "React" as "Reactivo" in Spanish, which is the exact error class this check exists to catch.
 *
 * Usage:
 *   node scripts/glossary-check.mjs <englishSource> <translatedFile> [--locale es]
 *   node scripts/glossary-check.mjs --json ...   # machine-readable report on stdout
 *
 * The locale is inferred from an `i18n/<locale>/...` translated path when `--locale` is absent.
 *
 * Exit code is non-zero on any violation. That is the whole contract; the reporting shape is
 * for humans.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGlossary, GLOSSARY_PATH } from './build-glossary.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Effective glossary for a locale: the locale's own row wins over the global row for the same
 * term, so a language agent can declare an inflected or transliterated rendering without
 * touching anyone else's rows.
 */
export function effectiveTerms(rows, locale) {
  const byTerm = new Map();
  for (const r of rows) {
    if (r.locale !== '*') continue;
    byTerm.set(r.term, {
      term: r.term,
      category: r.category,
      rendering: r.rendering || r.term,
      inflectable: r.inflectable === 'yes',
      source: r.source,
    });
  }
  for (const r of rows) {
    if (r.locale !== locale) continue;
    const base = byTerm.get(r.term);
    byTerm.set(r.term, {
      term: r.term,
      category: r.category || base?.category || 'locale-override',
      rendering: r.rendering || base?.rendering || r.term,
      inflectable: r.inflectable === 'yes',
      source: r.source,
    });
  }
  return [...byTerm.values()];
}

/**
 * Occurrence matcher for one term.
 *
 * Boundaries are letters and digits rather than \b, so "Next.js" and "React 19" behave and a
 * hyphenated German compound ("Scrimba-Kurs") still counts as an occurrence of "Scrimba".
 *
 * Inflection trims the term's final LETTER before allowing a suffix, because Slavic and Baltic
 * case endings replace the stem-final vowel rather than appending to it: Polish locative of
 * "Scrimba" is "Scrimbie", not "Scrimbaie". An append-only tolerance would reject every
 * correctly inflected page in exactly the languages the column exists for.
 */
export function countExact(haystack, needle, { inflectable = false } = {}) {
  const endsWithLetter = /\p{L}$/u.test(needle);
  const stem = inflectable && endsWithLetter ? needle.slice(0, -1) : needle;
  const tail = inflectable ? '\\p{L}{0,5}' : '';
  const rx = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRx(stem)}${tail}(?![\\p{L}\\p{N}])`, 'gu');
  return (haystack.match(rx) ?? []).length;
}

/**
 * A near-miss: recognisably the same term, wrong bytes. Consulted only when the required
 * rendering is absent, and always with inflection and case tolerance ON, since the point is to
 * distinguish "the translator mangled the term" from "the term is simply gone".
 */
function findNearMiss(haystack, needle) {
  const endsWithLetter = /\p{L}$/u.test(needle);
  const stem = endsWithLetter ? needle.slice(0, -1) : needle;
  const rx = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRx(stem)}\\p{L}{0,5}(?![\\p{L}\\p{N}])`, 'giu');
  const m = haystack.match(rx);
  return m ? m[0] : null;
}

/**
 * Blank out every LONGER glossary term that contains this one before probing for a near-miss.
 * Without it, a page that correctly writes "Scrimba Pro" but localizes the noun "scrim" gets
 * reported as "scrim rendered as Scrimba", which sends the fix to the wrong line.
 */
function maskLongerTerms(text, terms, current) {
  let out = text;
  const needle = current.rendering.toLowerCase();
  for (const other of terms) {
    const r = other.rendering;
    if (r.length <= current.rendering.length) continue;
    if (!r.toLowerCase().includes(needle)) continue;
    out = out.replace(new RegExp(escapeRx(r), 'gi'), ' '.repeat(r.length));
  }
  return out;
}

export function checkGlossary(sourceText, translatedText, terms) {
  const violations = [];
  for (const t of terms) {
    // Term must be present in the English source for the rule to apply at all.
    if (countExact(sourceText, t.term) === 0) continue;
    if (countExact(translatedText, t.rendering, { inflectable: t.inflectable }) > 0) continue;

    const near = findNearMiss(maskLongerTerms(translatedText, terms, t), t.rendering);
    violations.push({
      type: near ? 'rendered-differently' : 'missing',
      term: t.term,
      category: t.category,
      expected: t.rendering,
      found: near,
      inflectable: t.inflectable,
    });
  }
  return violations;
}

/* -------------------------------------------------------------------- CLI */

/** `i18n/<locale>/...` -> that locale. Same convention check-content.mjs uses. */
export function localeFromPath(p) {
  const parts = path.resolve(p).replace(ROOT + path.sep, '').split(path.sep);
  return parts[0] === 'i18n' && parts.length > 2 ? parts[1] : null;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const flagIdx = args.indexOf('--locale');
  const localeFlag = flagIdx === -1 ? null : args[flagIdx + 1];
  // Filter by INDEX, not by value: `--locale` consumes the argument that follows it, and a
  // value-based filter with flagIdx === -1 would silently eat args[0], i.e. the source file.
  const files = args.filter(
    (a, i) => !a.startsWith('--') && !(flagIdx !== -1 && i === flagIdx + 1),
  );
  const [sourceFile, translatedFile] = files;

  if (!sourceFile || !translatedFile) {
    console.error('usage: node scripts/glossary-check.mjs <englishSource> <translatedFile> [--locale es]');
    process.exit(2);
  }
  const locale = localeFlag ?? localeFromPath(translatedFile);
  if (!locale) {
    console.error('Cannot infer locale from the translated path; pass --locale <tag>.');
    process.exit(2);
  }

  const rows = readGlossary(GLOSSARY_PATH);
  if (!rows.length) {
    console.error(`No glossary rows at ${GLOSSARY_PATH}. Run: node scripts/build-glossary.mjs`);
    process.exit(2);
  }
  const terms = effectiveTerms(rows, locale);
  const violations = checkGlossary(
    fs.readFileSync(sourceFile, 'utf8'),
    fs.readFileSync(translatedFile, 'utf8'),
    terms,
  );

  if (json) {
    console.log(JSON.stringify({ locale, sourceFile, translatedFile, violations }, null, 2));
  } else if (violations.length) {
    console.error(`glossary-check FAILED for ${translatedFile} (${locale}):`);
    for (const v of violations) {
      console.error(
        v.type === 'missing'
          ? `  missing: "${v.expected}" (${v.category}) is in the source but absent from the translation`
          : `  rendered differently: expected "${v.expected}" (${v.category}), found "${v.found}"`,
      );
    }
    console.error('\nDo-not-translate terms ship verbatim. See .claude/skills/translate-content/SKILL.md.');
  } else {
    console.log(`glossary-check OK: ${translatedFile} (${locale}), ${terms.length} glossary terms loaded.`);
  }
  process.exit(violations.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
