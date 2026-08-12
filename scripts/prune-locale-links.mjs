#!/usr/bin/env node
/**
 * Prune in-body links that a tiered locale does not build.
 *
 * I18N-PLAN.md section 4 Phase 2 task (c). There are ~1,573 in-body `](/docs/...`
 * and `](/blog/...` targets across `docs/`, plus more in `blog/`. A Core-set
 * locale builds 56 routes, so most of those targets point at pages that locale
 * deliberately does not build, and under `onBrokenLinks: 'throw'` a single one
 * of them is a hard build failure rather than a broken link.
 *
 * THE ONE RULE THAT MATTERS: an uncovered link becomes its own ANCHOR TEXT,
 * unlinked. It is never rewritten to point at the English page. The language
 * switcher is the only cross-locale link on the site (invariant 6); a body link
 * that silently escapes into another language leaks users out of their locale,
 * splits the hreflang cluster's authority, and reads to a crawler as an
 * unannotated duplicate.
 *
 * WHAT IT TOUCHES
 * ---------------
 * Only `i18n/<locale>/**`. The English sources under `docs/`, `blog/` and
 * `src/pages/` are never opened for writing, and the script exits immediately
 * when the current locale is the default one, so it is a no-op in the English
 * build it also runs inside (`prebuild`).
 *
 * It is idempotent: pruning an already-pruned tree changes nothing, which is
 * what makes `--check` usable as a CI gate.
 *
 * `<Link to>` and `href` targets cannot be unlinked automatically without
 * rewriting JSX, so they are AUDITED instead: any that resolves outside the
 * manifest exits non-zero. That check also covers the always-built `.tsx` pages
 * (homepage, tools, roadmap), which every locale renders and which therefore
 * must only ever link to routes inside the Core set. When it fires, the fix is
 * to widen the route set in `i18n/tiers.json` or to make the component filter
 * against the manifest, never to point the link at English.
 *
 * Usage:
 *   node scripts/prune-locale-links.mjs                 # locale from DOCUSAURUS_CURRENT_LOCALE
 *   node scripts/prune-locale-links.mjs --locale sk     # explicit locale
 *   node scripts/prune-locale-links.mjs --check         # no writes; exit 1 if pruning is pending
 *   node scripts/prune-locale-links.mjs --root <dir>    # alternate site root (tests)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_LOCALE,
  isCoverageBypassed,
  localeCoverage,
  resolveCurrentLocale,
  toManifestRoute,
} from '../config/locale-coverage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Routes that exist in a locale without appearing in the coverage manifest,
 * because no markdown file produces them.
 *
 * Kept deliberately short. Everything outside it fails closed and gets
 * unlinked: blog tag and pagination routes, for instance, exist only if a post
 * carrying that tag survived exclusion, which is not computable from the
 * manifest, and a link that turns out to be wrong takes the whole locale build
 * down with it.
 */
const ALWAYS_RESOLVABLE = [
  /^\/$/,
  // The blog list route is emitted by plugin-content-blog for any locale that
  // keeps at least one post, and every route set keeps at least two.
  /^\/blog\/$/,
  // Theme routes, present in every locale regardless of content.
  /^\/search\/$/,
];

/** Assets, not routes: never unlinked, never audited. */
const ASSET_PATTERN = /\.(png|jpe?g|gif|svg|webp|avif|ico|pdf|txt|xml|json|zip|css|js|mjs)$/i;

/**
 * A target resolver bound to one locale's coverage.
 *
 * @param {ReturnType<typeof localeCoverage>} coverage
 */
export function makeResolver(coverage) {
  const covered = coverage.routes;
  return function resolve(target) {
    if (typeof target !== 'string' || !target.startsWith('/')) {
      return { kind: 'external', covered: true, route: null };
    }
    const bare = target.split('#')[0].split('?')[0];
    if (bare === '') return { kind: 'anchor', covered: true, route: null };
    if (ASSET_PATTERN.test(bare)) return { kind: 'asset', covered: true, route: null };

    const route = toManifestRoute(target);
    if (route === null) return { kind: 'unresolvable', covered: false, route: null };
    if (ALWAYS_RESOLVABLE.some((rx) => rx.test(route))) {
      return { kind: 'always', covered: true, route };
    }
    return { kind: 'route', covered: covered.has(route), route };
  };
}

/* ------------------------------------------------------------- markdown pruning */

/** Opening or closing fence. Content inside is code, not prose, and is left alone. */
const FENCE_PATTERN = /^\s{0,3}(`{3,}|~{3,})/;
/** Inline code span. A link written inside backticks is documentation ABOUT a link. */
const CODE_SPAN_PATTERN = /`[^`]*`/g;
/**
 * An inline markdown link with a site-absolute target, plus the leading `!` that
 * distinguishes an image (which must survive: an unlinked image is a deleted
 * image) and the optional `"title"`.
 */
const MD_LINK_PATTERN = /(!?)\[([^\]\n]*)\]\((\/[^)\s]*)((?:\s+"[^"]*")?)\)/g;

/**
 * Unlink every markdown link whose target this locale does not build.
 *
 * @param {string} source
 * @param {(target: string) => {covered: boolean, route: string|null}} resolve
 */
export function pruneMarkdown(source, resolve) {
  const lines = source.split('\n');
  const unlinked = [];
  let fence = null;
  let inFrontmatter = lines[0]?.trim() === '---';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (inFrontmatter) {
      if (i > 0 && /^---\s*$/.test(line)) inFrontmatter = false;
      continue;
    }

    const fenceMatch = line.match(FENCE_PATTERN);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;

    lines[i] = pruneLine(line, resolve, unlinked, i + 1);
  }

  const output = lines.join('\n');
  return { output, changed: output !== source, unlinked };
}

function pruneLine(line, resolve, unlinked, lineNumber) {
  let out = '';
  let last = 0;
  // Code spans are copied through verbatim, so a `[x](/docs/y)` shown as an
  // example stays an example.
  for (const span of line.matchAll(CODE_SPAN_PATTERN)) {
    out += pruneSegment(line.slice(last, span.index), resolve, unlinked, lineNumber) + span[0];
    last = span.index + span[0].length;
  }
  return out + pruneSegment(line.slice(last), resolve, unlinked, lineNumber);
}

function pruneSegment(segment, resolve, unlinked, lineNumber) {
  return segment.replace(MD_LINK_PATTERN, (match, bang, text, target) => {
    if (bang === '!') return match;
    const resolution = resolve(target);
    if (resolution.covered) return match;
    unlinked.push({ line: lineNumber, text, target, route: resolution.route });
    // Anchor text only. Not the English URL, not a switcher link, not a
    // placeholder: the sentence keeps reading, and the reader stays in-locale.
    return text;
  });
}

/* ----------------------------------------------------------------- JSX auditing */

/** `to="/x"`, `href='/x'`, `to={'/x'}`. Expressions are skipped: they are not statically resolvable. */
const ATTR_TARGET_PATTERN =
  /\b(?:to|href)\s*=\s*(?:"(\/[^"]*)"|'(\/[^']*)'|\{\s*['"](\/[^'"]*)['"]\s*\})/g;
/**
 * A route-shaped string literal anywhere in a `.tsx` page. The always-built
 * pages keep their links in data arrays (`{title, link: '/docs/...'}`) rendered
 * through `<Link to={item.link}>`, so attribute scanning alone would miss every
 * one of them.
 */
const ROUTE_LITERAL_PATTERN = /['"](\/(?:docs|blog|tools|roadmaps|legal)\/[^'"\s]*)['"]/g;

/**
 * Collect link targets that survive pruning but do not resolve in this locale.
 *
 * @param {string} source
 * @param {(target: string) => {covered: boolean, route: string|null}} resolve
 */
export function auditLinks(source, resolve, { routeLiterals = false } = {}) {
  const violations = [];
  const seen = new Set();
  const record = (target, kind) => {
    const resolution = resolve(target);
    if (resolution.covered) return;
    const key = `${kind}:${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    violations.push({ target, route: resolution.route, kind });
  };

  for (const m of source.matchAll(ATTR_TARGET_PATTERN)) {
    record(m[1] ?? m[2] ?? m[3], 'attribute');
  }
  if (routeLiterals) {
    for (const m of source.matchAll(ROUTE_LITERAL_PATTERN)) record(m[1], 'route-literal');
  }
  return violations;
}

/* --------------------------------------------------------------------- file I/O */

const CONTENT_DIRS = [
  ['docs', (root, locale) => path.join(root, 'i18n', locale, 'docusaurus-plugin-content-docs', 'current')],
  ['blog', (root, locale) => path.join(root, 'i18n', locale, 'docusaurus-plugin-content-blog')],
  ['pages', (root, locale) => path.join(root, 'i18n', locale, 'docusaurus-plugin-content-pages')],
];

function walk(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/**
 * Refuse to write outside the locale's own tree.
 *
 * The English sources are the input to every translation on the site; a path bug
 * that unlinked them would silently strip navigation from the one locale that
 * has full coverage, and it would do it during `prebuild`, in a build that
 * otherwise goes green.
 */
function assertInsideLocale(file, root, locale) {
  const localeRoot = path.join(root, 'i18n', locale) + path.sep;
  if (!path.resolve(file).startsWith(localeRoot)) {
    throw new Error(`Refusing to write '${file}': outside i18n/${locale}/`);
  }
}

/**
 * Prune (or check) one locale.
 *
 * @returns {{locale: string, skipped?: string, files: number, changed: string[], unlinked: number, violations: object[]}}
 */
export function pruneLocale({ locale, root = ROOT, check = false, coverage } = {}) {
  const resolvedCoverage = coverage ?? localeCoverage({ locale, root });
  const resolve = makeResolver(resolvedCoverage);
  const changed = [];
  const violations = [];
  let files = 0;
  let unlinked = 0;

  for (const [, dirFor] of CONTENT_DIRS) {
    for (const file of walk(dirFor(root, locale), ['.md', '.mdx'])) {
      files += 1;
      const source = fs.readFileSync(file, 'utf8');
      const result = pruneMarkdown(source, resolve);
      unlinked += result.unlinked.length;
      if (result.changed) {
        changed.push(path.relative(root, file));
        if (!check) {
          assertInsideLocale(file, root, locale);
          fs.writeFileSync(file, result.output);
        }
      }
      for (const v of auditLinks(result.output, resolve)) {
        violations.push({ ...v, file: path.relative(root, file) });
      }
    }
  }

  // The always-built .tsx pages render in EVERY locale and are translated
  // through code.json, so they are never pruned. Their links still have to
  // resolve, and they are the likeliest source of a locale-only build failure.
  for (const file of walk(path.join(root, 'src', 'pages'), ['.tsx'])) {
    const source = fs.readFileSync(file, 'utf8');
    for (const v of auditLinks(source, resolve, { routeLiterals: true })) {
      violations.push({ ...v, file: path.relative(root, file) });
    }
  }

  return { locale, files, changed, unlinked, violations };
}

/* ------------------------------------------------------------------------ main */

function parseArgs(argv) {
  const args = { check: false, locale: null, root: ROOT };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--check') args.check = true;
    else if (argv[i] === '--locale') args.locale = argv[++i];
    else if (argv[i] === '--root') args.root = path.resolve(argv[++i]);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const locale = args.locale ?? resolveCurrentLocale();

  if (locale === DEFAULT_LOCALE) {
    console.log(`prune-locale-links: locale '${locale}' is the translation source, nothing to prune.`);
    return;
  }
  if (isCoverageBypassed()) {
    console.log('prune-locale-links: I18N_COVERAGE=full, exclusion bypassed, nothing to prune.');
    return;
  }

  const coverage = localeCoverage({ locale, root: args.root });
  const result = pruneLocale({ locale, root: args.root, check: args.check, coverage });

  console.log(
    `prune-locale-links [${locale}]: ${result.files} translated files, ` +
    `${result.unlinked} link(s) unlinked across ${result.changed.length} file(s), ` +
    `${coverage.routes.size} covered route(s).`,
  );

  if (args.check && result.changed.length) {
    console.error('\nThese translated files still link to routes this locale does not build:');
    for (const f of result.changed) console.error(`  ${f}`);
    console.error('\nRun `node scripts/prune-locale-links.mjs --locale ' + locale + '` and commit the result.');
    process.exitCode = 1;
  }

  if (result.violations.length) {
    console.error('\nLinks that survive pruning but resolve outside the manifest:');
    for (const v of result.violations) {
      console.error(`  ${v.file}: ${v.target} (${v.kind}) -> ${v.route ?? 'unresolvable'}`);
    }
    console.error(
      '\nThese cannot be unlinked automatically. Either add the route to this tier in\n' +
      'i18n/tiers.json, or make the component filter its links against the manifest.\n' +
      'Never repoint them at the English page: the switcher is the only cross-locale link.',
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
