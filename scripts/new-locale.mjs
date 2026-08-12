#!/usr/bin/env node
/**
 * Scaffolds a locale for translation: DIRECTORIES and the four `write-translations` JSON files
 * ONLY (I18N-PLAN.md section 4 Phase 5).
 *
 * IT MUST NEVER COPY ENGLISH MARKDOWN. The official Docusaurus i18n tutorial answers this step
 * with `cp -r docs/ i18n/fr/docusaurus-plugin-content-docs/current/`, and that advice is
 * actively harmful in this repo:
 *
 *   - Docusaurus already falls back to the default locale PER FILE, so the copy buys nothing.
 *   - Coverage is derived from disk. An untranslated copy is byte-indistinguishable from a
 *     finished translation, so an interrupted multi-day run reads as covered, earns an
 *     hreflang annotation and a self-canonical, and ships ENGLISH PAGES UNDER A NON-ENGLISH
 *     HREFLANG WITH A GREEN BUILD. That is the invariant-4 violation the whole program is
 *     built to prevent.
 *   - The copy destroys the only disk signal available: presence of a markdown file under
 *     i18n/<locale>/ means a translator wrote it.
 *
 * The scaffold is therefore empty by construction, and this script self-asserts that at the
 * end of every run: if any .md/.mdx file exists under the locale that has no .status sidecar,
 * it says so loudly.
 *
 * It also does NOT shell out to `npx docusaurus write-translations`. That command loads the
 * full config and shares .docusaurus/ with any concurrent build, and locale scaffolding
 * happens while other agents are working. The JSON files are created as empty objects and the
 * exact command to populate them is printed for the operator to run at a barrier.
 *
 * Usage:
 *   node scripts/new-locale.mjs es
 *   node scripts/new-locale.mjs es --root /tmp/fixture   # tests
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRoster } from './build-coverage-manifest.mjs';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Named once, here, so nobody guesses. These are the paths Docusaurus reads for each content
 * plugin; the relative path under each root mirrors the English source exactly.
 */
export const LOCALE_DIRS = [
  'docusaurus-plugin-content-docs/current',
  'docusaurus-plugin-content-blog',
  'docusaurus-plugin-content-pages',
  '.status',
];

/**
 * The write-translations outputs: four surfaces, five files. ALL of them are translated, not
 * just code.json. current.json carries the sidebar category labels hand-written in sidebars.ts
 * and content-blog.json carries the blog sidebar title and tag labels, which are the
 * most-seen UI on a docs site and the two the earlier plan draft omitted.
 */
export const TRANSLATION_JSON = [
  'code.json',
  'docusaurus-theme-classic/navbar.json',
  'docusaurus-theme-classic/footer.json',
  'docusaurus-plugin-content-docs/current.json',
  'docusaurus-plugin-content-blog.json',
];

/** Directory tree of the English docs, mirrored empty so translators drop files into place. */
function docsSubtree(root) {
  const base = path.join(root, 'docs');
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const full = path.join(dir, e.name);
      out.push(path.relative(base, full));
      walk(full);
    }
  };
  walk(base);
  return out;
}

export function scaffoldLocale(locale, { root = DEFAULT_ROOT, roster = null } = {}) {
  const records = roster ?? loadRoster(path.join(root, 'i18n', 'locales.config.ts'));
  const rec = records.find((r) => r.locale === locale);
  if (!rec) {
    throw new Error(
      `'${locale}' is not in i18n/locales.config.ts. The roster is the only source of ` +
      `locales; add the record there first (adding a record is free, it stays 'draft').`,
    );
  }
  if (locale === 'en') {
    throw new Error("'en' is the source locale, never a translation target.");
  }

  const localeRoot = path.join(root, 'i18n', locale);
  const created = [];
  const mkdir = (p) => {
    if (!fs.existsSync(p)) { fs.mkdirSync(p, { recursive: true }); created.push(path.relative(root, p)); }
  };

  for (const d of LOCALE_DIRS) mkdir(path.join(localeRoot, ...d.split('/')));
  for (const sub of docsSubtree(root)) {
    mkdir(path.join(localeRoot, 'docusaurus-plugin-content-docs', 'current', sub));
  }
  mkdir(path.join(root, 'data', 'i18n', locale));

  // Empty objects, never overwritten: an existing file holds real translated UI strings.
  const jsonCreated = [];
  for (const rel of TRANSLATION_JSON) {
    const file = path.join(localeRoot, ...rel.split('/'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '{}\n');
      jsonCreated.push(path.relative(root, file));
    }
  }

  // Self-assertion: the scaffold contains no content. If markdown is present it was either
  // written by a translator (fine, and this run is a re-scaffold) or copied in by hand
  // (not fine). Sidecar presence is what tells the two apart.
  const markdown = [];
  const scan = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '.status') scan(full); }
      else if (/\.mdx?$/.test(e.name)) markdown.push(path.relative(localeRoot, full));
    }
  };
  scan(localeRoot);
  const sidecars = fs.existsSync(path.join(localeRoot, '.status'))
    ? fs.readdirSync(path.join(localeRoot, '.status')).filter((f) => f.endsWith('.json')).length
    : 0;

  return { locale, rec, created, jsonCreated, markdown, sidecars, localeRoot };
}

function main() {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf('--root');
  const root = rootIdx === -1 ? DEFAULT_ROOT : path.resolve(args[rootIdx + 1]);
  const locale = args.find((a, i) => !a.startsWith('--') && !(rootIdx !== -1 && i === rootIdx + 1));
  if (!locale) {
    console.error('usage: node scripts/new-locale.mjs <locale> [--root <dir>]');
    process.exit(2);
  }

  let result;
  try {
    result = scaffoldLocale(locale, { root });
  } catch (err) {
    console.error(String(err.message));
    process.exit(1);
  }

  console.log(
    `Scaffolded ${locale} (tier ${result.rec.tier}, coverage ${result.rec.coverage}, ` +
    `status ${result.rec.status}): ${result.created.length} directories, ` +
    `${result.jsonCreated.length} translation JSON files.`,
  );
  console.log('\nNo markdown was copied. That is deliberate: presence of a file under');
  console.log(`i18n/${locale}/ is the signal that a translator wrote it.`);
  console.log('\nNext, at a barrier (never while another build is running):');
  console.log(`  npx docusaurus write-translations --locale ${locale}`);
  console.log(`  # then translate the "message" values only, never the keys`);

  if (result.markdown.length && result.sidecars === 0) {
    console.warn(
      `\nWARNING: ${result.markdown.length} markdown file(s) exist under i18n/${locale}/ with ` +
      `no .status sidecar. If those are copied English sources, DELETE THEM: they will be ` +
      `counted as coverage the moment a sidecar appears next to them.`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
