#!/usr/bin/env node
/**
 * Deterministic structural diff between an English MDX source and its translation
 * (I18N-PLAN.md section 4 Phase 5 item 9, per-file gate).
 *
 * This is the check that keeps a translated page WORKING, as opposed to reading well. Every
 * failure it catches is invisible to a language reviewer and expensive in production:
 *
 *   dropped <AffiliateLink>   silent lost revenue, green build (risk R6)
 *   translated href/to        broken internal link, or an affiliate URL that stops paying
 *   changed frontmatter slug  the hreflang engine swaps the locale segment of the CURRENT
 *                             pathname, so a translated slug points every alternate at a 404
 *                             and the whole cluster stops being reciprocal
 *   drifted {#id} anchor      onBrokenAnchors is 'throw', so this fails the locale build at
 *                             the barrier instead of on the file that caused it
 *   edited fenced code        a translated identifier in a code sample teaches broken code
 *
 * SCOPE: structure only. It says nothing about whether the prose is good; that is MQM's job.
 *
 * Usage:
 *   node scripts/jsx-integrity.mjs <englishSource> <translatedFile>
 *   node scripts/jsx-integrity.mjs --json <englishSource> <translatedFile>
 */
import fs from 'node:fs';

/** Props whose VALUES must be byte-identical across locales. Plan Phase 5 item 2. */
export const FROZEN_PROPS = ['href', 'to', 'slug', 'courseSlug', 'id'];

/** Frontmatter keys that must be byte-identical across locales. Plan Phase 5 item 1. */
export const FROZEN_FRONTMATTER = ['slug', 'id', 'sidebar_position', 'authors', 'tags', 'date', 'image'];

/* ------------------------------------------------------------ extraction */

/**
 * Fenced code blocks, in document order, with their info string and raw body.
 * Both ``` and ~~~ fences, because MDX accepts both and a mixed file would otherwise have half
 * its code unchecked.
 */
export function extractFences(src) {
  const out = [];
  const rx = /^([ \t]*)(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/gm;
  let m;
  while ((m = rx.exec(src)) !== null) out.push({ info: m[3].trim(), body: m[4] });
  return out;
}

/** Remove fenced blocks so component/prop scanning never sees JSX that lives inside a sample. */
export function stripFences(src) {
  return src.replace(/^([ \t]*)(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/gm, '\n');
}

export function splitFrontmatter(src) {
  const text = src.replace(/\r\n/g, '\n');
  if (!text.startsWith('---')) return { frontmatter: '', body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: '', body: text };
  return { frontmatter: text.slice(3, end), body: text.slice(end + 4) };
}

/** Scalar frontmatter values for the frozen keys. Block values are captured as-is. */
export function frontmatterValues(frontmatter) {
  const out = {};
  for (const key of FROZEN_FRONTMATTER) {
    const m = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
    if (m) out[key] = m[1].trim();
  }
  return out;
}

/** Multiset of JSX component names (capitalized opening tags). Closing tags mirror them. */
export function componentMultiset(body) {
  const counts = new Map();
  for (const m of body.matchAll(/<([A-Z][A-Za-z0-9_.]*)(?=[\s/>])/g)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  return counts;
}

/** Multiset of `prop=value` pairs for the frozen props, values kept raw (quotes normalized). */
export function frozenPropMultiset(body) {
  const counts = new Map();
  const rx = new RegExp(
    `\\b(${FROZEN_PROPS.join('|')})\\s*=\\s*(?:"([^"]*)"|'([^']*)'|(\\{[^}]*\\}))`,
    'g',
  );
  for (const m of body.matchAll(rx)) {
    const value = m[2] ?? m[3] ?? m[4];
    const key = `${m[1]}=${value}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Import statements. Translating one breaks the build; reordering them is harmless. */
export function importMultiset(body) {
  const counts = new Map();
  for (const m of body.matchAll(/^import\s+[^\n]+$/gm)) {
    const key = m[0].trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Explicit heading anchors. Frozen in English; a translated heading keeps the same id. */
export function anchorSet(body) {
  return new Set([...body.matchAll(/\{#([A-Za-z0-9_-]+)\}/g)].map((m) => m[1]));
}

/**
 * Inline code spans, as a SET rather than a multiset. Presence is what matters: a translation
 * may legitimately repeat `npm` once more or once less than the English sentence structure
 * required, but it may never translate `data/courses.json` into a localized path.
 */
export function inlineCodeSet(body) {
  return new Set(
    [...body.matchAll(/(?<!`)`([^`\n]+)`(?!`)/g)]
      .map((m) => m[1])
      // Template literals are backtick-delimited too, but they are PROSE with
      // code holes, not code spans. templateLiterals() owns them; leaving them
      // here would flag every correctly translated interpolated string as a
      // changed code span.
      .filter((code) => !code.includes('${')),
  );
}


/**
 * Markdown link TARGETS, as a multiset.
 *
 * This is the check that actually protects internal linking here. FROZEN_PROPS
 * freezes href/to/slug, but the corpus contains 2,221 markdown links and ZERO
 * `to=` or `href=` props, so without this the frozen-props check protects
 * nothing at all for internal links.
 *
 * The failure it catches is the single most predictable translator error:
 * localizing `/docs/paths/frontend-developer-path/` into
 * `/docs/rutas/desarrollador-frontend/`. That breaks slug parity, which is what
 * hreflang is computed from (Docusaurus swaps the locale segment on the CURRENT
 * pathname), so every alternate on the page would point at a 404.
 *
 * External targets and bare anchors are included for free: an external URL must
 * never be rewritten either, and a bare `#anchor` must match the frozen {#id}.
 */
export function linkTargetMultiset(body) {
  const out = new Map();
  for (const m of body.matchAll(/\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g)) {
    const target = m[1].replace(/^<|>$/g, '');
    out.set(target, (out.get(target) ?? 0) + 1);
  }
  return out;
}


/**
 * Prose carried inside TEMPLATE LITERALS, keyed by its interpolation skeleton.
 *
 * This exists because of a real, measured failure. The JSX policy said "never
 * touch anything inside {...} expressions", and template literals live inside
 * {...}. Translators followed that rule correctly and therefore skipped every
 * interpolated string, while translating the quoted ones beside them. The
 * result shipped Spanish comparison tables whose Scrimba column was English,
 * and Spanish FAQ questions with English answers - 24 Major/Non-translation
 * errors across the first calibration tranche, all of this one shape.
 *
 * The `${...}` holes are code and must stay byte-identical; the text BETWEEN
 * them is prose and must be translated. We compare on the skeleton (the
 * interpolations, in order) so a template can be matched across locales even
 * though its prose changed.
 */
export function templateLiterals(body) {
  const out = [];
  for (const m of body.matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
    const raw = m[1];
    if (!raw.includes('${')) continue;
    const holes = [...raw.matchAll(/\$\{([^}]*)\}/g)].map((h) => h[1].trim());
    const prose = raw.replace(/\$\{[^}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
    out.push({ skeleton: holes.join('|'), prose, raw });
  }
  return out;
}

/** Words of two or more letters. Used to decide whether a chunk is prose at all. */
function proseWordCount(text) {
  return (text.match(/[\p{L}]{2,}/gu) ?? []).length;
}

/* -------------------------------------------------------------- compare */

function diffMultiset(a, b) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  const diffs = [];
  for (const k of [...keys].sort()) {
    const x = a.get(k) ?? 0;
    const y = b.get(k) ?? 0;
    if (x !== y) diffs.push({ key: k, source: x, translated: y });
  }
  return diffs;
}

export function checkIntegrity(sourceText, translatedText) {
  const violations = [];
  const push = (type, detail, extra = {}) => violations.push({ type, detail, ...extra });

  const s = splitFrontmatter(sourceText);
  const t = splitFrontmatter(translatedText);

  // 1. Frontmatter parity. slug is the hreflang invariant; the rest are routing/identity keys.
  const sf = frontmatterValues(s.frontmatter);
  const tf = frontmatterValues(t.frontmatter);
  for (const key of FROZEN_FRONTMATTER) {
    if ((sf[key] ?? null) !== (tf[key] ?? null)) {
      push('frontmatter', `frontmatter key '${key}' must be identical across locales`, {
        key, source: sf[key] ?? null, translated: tf[key] ?? null,
      });
    }
  }

  // 2. Fenced code: same count, same bytes, same order.
  const sFences = extractFences(s.body);
  const tFences = extractFences(t.body);
  if (sFences.length !== tFences.length) {
    push('code-fence-count', `source has ${sFences.length} fenced blocks, translation has ${tFences.length}`);
  }
  const n = Math.min(sFences.length, tFences.length);
  for (let i = 0; i < n; i++) {
    if (sFences[i].body !== tFences[i].body || sFences[i].info !== tFences[i].info) {
      push('code-fence-content', `fenced block #${i + 1} differs from the source`, {
        index: i, sourceInfo: sFences[i].info, translatedInfo: tFences[i].info,
      });
    }
  }

  const sBody = stripFences(s.body);
  const tBody = stripFences(t.body);

  // 2a. Template-literal prose. Interpolations must be identical (they are code);
  // the prose between them must NOT be, or the string was never translated.
  {
    const sTpl = templateLiterals(s.body);
    const tTpl = templateLiterals(t.body);
    if (sTpl.length !== tTpl.length) {
      push('template-literal-count',
        `source has ${sTpl.length} interpolated template literals, translation has ${tTpl.length}`);
    }
    const n2 = Math.min(sTpl.length, tTpl.length);
    for (let i = 0; i < n2; i++) {
      if (sTpl[i].skeleton !== tTpl[i].skeleton) {
        push('template-literal-interpolation',
          `template literal #${i + 1} changed its \${...} expressions`, {
            index: i, source: sTpl[i].skeleton, translated: tTpl[i].skeleton,
          });
        continue;
      }
      // Identical prose in a translated file means the string was skipped. Short
      // fragments (a unit, a bare product name) can legitimately match, so only
      // flag chunks substantial enough to be sentences.
      if (
        proseWordCount(sTpl[i].prose) >= 4 &&
        sTpl[i].prose === tTpl[i].prose
      ) {
        push('template-literal-untranslated',
          `template literal #${i + 1} is byte-identical to the English source`, {
            index: i, prose: sTpl[i].prose.slice(0, 120),
          });
      }
    }
  }

  // 2b. Markdown link targets. See linkTargetMultiset: these are 100% of this
  // repo's internal links, and a localized path silently breaks slug parity.
  {
    const sLinks = linkTargetMultiset(sBody);
    const tLinks = linkTargetMultiset(tBody);
    const keys = new Set([...sLinks.keys(), ...tLinks.keys()]);
    for (const target of keys) {
      const a = sLinks.get(target) ?? 0;
      const b = tLinks.get(target) ?? 0;
      if (a !== b) {
        push('link-target', `link target '${target}' appears ${a}x in the source and ${b}x in the translation`, {
          target, source: a, translated: b,
        });
      }
    }
  }

  // 3. Components, frozen props, imports: identical multisets.
  for (const d of diffMultiset(componentMultiset(sBody), componentMultiset(tBody))) {
    push('component', `<${d.key}> appears ${d.source}x in the source, ${d.translated}x in the translation`, d);
  }
  for (const d of diffMultiset(frozenPropMultiset(sBody), frozenPropMultiset(tBody))) {
    push('frozen-prop', `${d.key} appears ${d.source}x in the source, ${d.translated}x in the translation`, d);
  }
  for (const d of diffMultiset(importMultiset(sBody), importMultiset(tBody))) {
    push('import', `import statement changed: ${d.key}`, d);
  }

  // 4. Anchors: identical id set. Order and heading text are free.
  const sAnchors = anchorSet(sBody);
  const tAnchors = anchorSet(tBody);
  for (const id of [...sAnchors].sort()) {
    if (!tAnchors.has(id)) push('anchor', `heading anchor {#${id}} is missing from the translation`, { id });
  }
  for (const id of [...tAnchors].sort()) {
    if (!sAnchors.has(id)) push('anchor', `heading anchor {#${id}} does not exist in the source`, { id });
  }

  // 5. Inline code: every source span survives verbatim.
  const tInline = inlineCodeSet(tBody);
  for (const code of [...inlineCodeSet(sBody)].sort()) {
    if (!tInline.has(code)) push('inline-code', `inline code \`${code}\` is missing from the translation`, { code });
  }

  return violations;
}

/* ------------------------------------------------------------------ CLI */

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const [sourceFile, translatedFile] = args.filter((a) => !a.startsWith('--'));
  if (!sourceFile || !translatedFile) {
    console.error('usage: node scripts/jsx-integrity.mjs [--json] <englishSource> <translatedFile>');
    process.exit(2);
  }
  const violations = checkIntegrity(
    fs.readFileSync(sourceFile, 'utf8'),
    fs.readFileSync(translatedFile, 'utf8'),
  );
  if (json) {
    console.log(JSON.stringify({ sourceFile, translatedFile, violations }, null, 2));
  } else if (violations.length) {
    console.error(`jsx-integrity FAILED for ${translatedFile}:`);
    for (const v of violations) console.error(`  [${v.type}] ${v.detail}`);
    console.error('\nStructure is frozen across locales. See .claude/skills/translate-content/references/jsx-contract.md.');
  } else {
    console.log(`jsx-integrity OK: ${translatedFile}`);
  }
  process.exit(violations.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
