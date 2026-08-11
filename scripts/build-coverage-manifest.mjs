#!/usr/bin/env node
/**
 * Builds i18n/coverage.json: what each locale has ACTUALLY translated.
 *
 * Two files, deliberately not one (I18N-PLAN.md section 4 Phase 2):
 *
 *   i18n/tiers.json     DECLARED scope. Hand-authored, committed.
 *   i18n/coverage.json  ACTUAL coverage. Derived from disk, generated, gitignored.
 *
 * Conflating them makes the launch gate uncomputable: a disk-derived manifest is
 * always 100% of itself, so "declared page set is 100% translated" could never
 * fail. Keeping them apart is what lets `make i18n-status` report
 * `declared - covered` and lets CI block a locale from joining i18n.locales
 * while that difference is non-empty.
 *
 * WHY A ROUTE IS NOT "COVERED" JUST BECAUSE A FILE EXISTS
 * -------------------------------------------------------
 * Coverage requires a `.status` sidecar with state 'current' AND a sourceHash
 * matching the English source as it stands right now. File presence alone is
 * not enough, because Docusaurus falls back to the default locale per file: a
 * half-written or stale translation is indistinguishable on disk from a good
 * one, and counting it would publish an English page under a non-English
 * hreflang with a green build. That is the exact invariant-4 violation this
 * whole phase exists to prevent.
 *
 * Usage:
 *   node scripts/build-coverage-manifest.mjs            # write i18n/coverage.json
 *   node scripts/build-coverage-manifest.mjs --check    # exit 1 if any live locale is incomplete
 *   node scripts/build-coverage-manifest.mjs --json     # print, do not write
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ roster */

/**
 * The roster is TypeScript, and this is a plain .mjs build script that must run
 * in `prebuild` with no compile step. Rather than add a loader, parse the
 * record literals out of the file. The roster is required by its own header to
 * stay erasable-syntax-only and one-record-per-line, which is what makes this
 * safe; if that ever changes, this throws loudly instead of silently returning
 * an empty roster (which would mark every locale uncovered and fail closed).
 */
export function loadRoster(rosterPath = path.join(ROOT, 'i18n', 'locales.config.ts')) {
  const src = fs.readFileSync(rosterPath, 'utf8');

  // Anchor on the `locale:` key itself and read forward to the record's closing
  // brace. Anchoring on `{` instead would silently drop every record that opens
  // with a comment line (e.g. `ur`), and an undercounted roster fails OPEN:
  // the dropped locales just vanish from the manifest without any error.
  const starts = [...src.matchAll(/^[ \t]*locale:\s*'([^']+)'/gm)];
  const records = starts.map((m, i) => {
    const from = m.index;
    const to = i + 1 < starts.length ? starts[i + 1].index : src.length;
    const body = src.slice(from, to);
    const field = (name) => {
      const f = body.match(new RegExp(`^[ \\t]*${name}:\\s*'([^']*)'`, 'm'));
      return f ? f[1] : undefined;
    };
    return {
      locale: m[1],
      htmlLang: field('htmlLang') ?? m[1],
      direction: field('direction') ?? 'ltr',
      calendar: field('calendar'),
      tier: field('tier'),
      coverage: field('coverage'),
      status: field('status'),
    };
  });

  // Cross-check against a completely independent count. A parser that silently
  // returns a SUBSET is worse than one that returns nothing, because every
  // missing locale looks like a locale that simply has no coverage yet.
  const declaredCount = (src.match(/^[ \t]*locale:\s*'/gm) ?? []).length;
  if (records.length !== declaredCount || records.length === 0) {
    throw new Error(
      `Parsed ${records.length} locale records from ${rosterPath} but found ` +
      `${declaredCount} 'locale:' keys. The roster format changed; fix this ` +
      `parser rather than shipping a partial roster.`,
    );
  }
  for (const r of records) {
    if (!r.tier || !r.coverage || !r.status) {
      throw new Error(`Roster record '${r.locale}' is missing tier/coverage/status.`);
    }
  }
  return records;
}

/* ------------------------------------------------- English route universe */

function readFrontmatter(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.startsWith('---')) return {};
  const end = src.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = src.slice(3, end);
  const out = {};
  // Only the scalar keys we need. A full YAML parser is not worth a dependency
  // here, and every key we read is a plain scalar in this repo.
  for (const key of ['slug', 'id', 'title']) {
    const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    if (m) out[key] = m[1].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function walk(dir, exts = ['.md', '.mdx']) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const withSlashes = (p) => (p === '/' ? '/' : `/${p.replace(/^\/+|\/+$/g, '')}/`);

/**
 * Route for a docs file. `slug:` in frontmatter is relative to routeBasePath
 * (`/docs`), so `slug: /pricing` serves `/docs/pricing/`. Never derive this by
 * path arithmetic: 16 docs override their slug and would map to the wrong route.
 */
function docsRoute(file) {
  const rel = path.relative(path.join(ROOT, 'docs'), file);
  const fm = readFrontmatter(file);
  if (fm.slug) return withSlashes(`docs/${fm.slug.replace(/^\/+/, '')}`);
  let p = rel.replace(/\.mdx?$/, '').replace(/(^|\/)\d+-/g, '$1');
  if (p.endsWith('/index') || p === 'index') p = p.replace(/\/?index$/, '');
  return withSlashes(`docs/${p}`);
}

/** Route for a blog file. Filenames are YYYY-MM-DD-*; the date never appears in the URL. */
function blogRoute(file) {
  const fm = readFrontmatter(file);
  const base = path.basename(file).replace(/\.mdx?$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return withSlashes(`blog/${(fm.slug ?? base).replace(/^\/+/, '')}`);
}

/** Route for a markdown page under src/pages. */
function pagesRoute(file) {
  const rel = path.relative(path.join(ROOT, 'src', 'pages'), file);
  const fm = readFrontmatter(file);
  if (fm.slug) return withSlashes(fm.slug);
  let p = rel.replace(/\.mdx?$/, '');
  if (p.endsWith('/index') || p === 'index') p = p.replace(/\/?index$/, '');
  return withSlashes(p);
}

/**
 * Every translatable English route, mapped back to its source file.
 *
 * The route -> file inverse is NOT derivable by convention, which is why this
 * reads frontmatter. The Phase 2 `exclude` computation needs the file path
 * (plugin `exclude` takes file globs, not routes), and the hreflang engine
 * needs the route, so both directions have to be carried together.
 */
export function buildSourceUniverse() {
  const entries = [];
  for (const f of walk(path.join(ROOT, 'docs'))) {
    entries.push({ route: docsRoute(f), surface: 'docs', sourceFile: path.relative(path.join(ROOT, 'docs'), f) });
  }
  for (const f of walk(path.join(ROOT, 'blog'))) {
    entries.push({ route: blogRoute(f), surface: 'blog', sourceFile: path.basename(f) });
  }
  for (const f of walk(path.join(ROOT, 'src', 'pages'))) {
    entries.push({ route: pagesRoute(f), surface: 'pages', sourceFile: path.relative(path.join(ROOT, 'src', 'pages'), f) });
  }
  return entries;
}

/* -------------------------------------------------------- declared scope */

function matchesGlob(route, glob) {
  // '*' matches exactly one path segment and never crosses '/'. Documented in
  // tiers.json; getting this wrong silently changes Tier B's scope.
  const rx = new RegExp('^' + glob.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+') + '$');
  return rx.test(route);
}

/** Source-path glob (`legal/**`) -> matcher. Used for alwaysExcluded, which is keyed on files. */
function matchesSourceGlob(entry, glob) {
  const rx = new RegExp(
    '^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, ' ').replace(/\*/g, '[^/]*').replace(/ /g, '.*') + '$',
  );
  return rx.test(entry.sourceFile ?? '');
}

/**
 * Routes that are English-only in EVERY locale (section 1: translated legal text
 * creates real exposure and has zero SEO value).
 *
 * This has to be subtracted from every route set including `full`, or a Tier A
 * locale declares /legal/privacy-policy/ as a translation target and the whole
 * decision is silently undone for exactly the tiers that ship first.
 */
export function alwaysExcludedRoutes(tiers, universe) {
  const globs = tiers.alwaysExcluded?.globs ?? [];
  return new Set(
    universe
      .filter((e) => e.surface === 'pages' && globs.some((g) => matchesSourceGlob(e, g)))
      .map((e) => e.route),
  );
}

/** Resolve a routeSet (which may be '*', an array, or a derived object) to concrete routes. */
export function resolveRouteSet(name, tiers, universe) {
  const set = tiers.routeSets[name];
  if (set === undefined) throw new Error(`Unknown routeSet '${name}' in tiers.json`);
  const banned = alwaysExcludedRoutes(tiers, universe);
  const keep = (routes) => new Set([...routes].filter((r) => !banned.has(r)));
  const all = universe.map((e) => e.route);
  if (set === '*') return keep(all);
  if (Array.isArray(set)) return keep(set);
  if (set && typeof set === 'object' && set.base) {
    const base = resolveRouteSet(set.base, tiers, universe);
    const retain = new Set(set.retainRoutes ?? []);
    const excl = set.excludeRouteGlobs ?? [];
    return keep([...base].filter((r) => retain.has(r) || !excl.some((g) => matchesGlob(r, g))));
  }
  throw new Error(`Unsupported routeSet shape for '${name}'`);
}

/* ------------------------------------------------------- actual coverage */

const I18N_DIRS = {
  docs: (l) => path.join(ROOT, 'i18n', l, 'docusaurus-plugin-content-docs', 'current'),
  blog: (l) => path.join(ROOT, 'i18n', l, 'docusaurus-plugin-content-blog'),
  pages: (l) => path.join(ROOT, 'i18n', l, 'docusaurus-plugin-content-pages'),
};

/**
 * Hash of the English source, with volatile frontmatter removed.
 *
 * `last_update`, `date` and `image` are stripped before hashing: hashing raw
 * bytes means one `last_update` bump marks all 47 locales stale at once, which
 * is precisely the maintenance-drift cost (R5) this mechanism exists to bound.
 */
export function sourceHash(absFile) {
  let src = fs.readFileSync(absFile, 'utf8').replace(/\r\n/g, '\n');
  if (src.startsWith('---')) {
    const end = src.indexOf('\n---', 3);
    if (end !== -1) {
      const fm = src.slice(3, end)
        .split('\n')
        .filter((line, i, arr) => {
          if (/^(last_update|date|image):/.test(line)) return false;
          // drop indented children of a stripped block key (last_update: \n  date: ...)
          if (/^\s+/.test(line)) {
            for (let j = i - 1; j >= 0; j--) {
              if (!/^\s/.test(arr[j])) return !/^(last_update|date|image):/.test(arr[j]);
            }
          }
          return true;
        })
        .join('\n');
      src = `---${fm}${src.slice(end)}`;
    }
  }
  return crypto.createHash('sha256').update(src).digest('hex');
}

function statusSidecar(locale, sourcePath) {
  const id = crypto.createHash('sha256').update(sourcePath).digest('hex');
  return path.join(ROOT, 'i18n', locale, '.status', `${id}.json`);
}

function absSourceFor(entry) {
  const base = { docs: 'docs', blog: 'blog', pages: path.join('src', 'pages') }[entry.surface];
  return path.join(ROOT, base, entry.sourceFile);
}

/** Repo-relative source path, the identity a .status sidecar is keyed on. */
function relSourceFor(entry) {
  const base = { docs: 'docs', blog: 'blog', pages: 'src/pages' }[entry.surface];
  return `${base}/${entry.sourceFile}`;
}

export function coverageForLocale(locale, declared, universe) {
  const byRoute = new Map(universe.map((e) => [e.route, e]));
  const covered = [];
  const missing = [];
  const stale = [];
  const blocked = [];

  for (const route of declared) {
    const entry = byRoute.get(route);
    if (!entry) {
      // Declared in tiers.json but no such English route exists. That is a bug
      // in tiers.json, not a translation gap, so surface it distinctly.
      missing.push({ route, reason: 'no-english-source' });
      continue;
    }
    const sidecarPath = statusSidecar(locale, relSourceFor(entry));
    if (!fs.existsSync(sidecarPath)) {
      missing.push({ route, reason: 'not-translated' });
      continue;
    }
    let sidecar;
    try {
      sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
    } catch {
      missing.push({ route, reason: 'unreadable-status-sidecar' });
      continue;
    }
    if (sidecar.state === 'blocked') {
      // Auto-dropped after 3 failed attempts (section 13.4). It leaves hreflang
      // and the sitemap rather than rendering an English fallback.
      blocked.push({ route, attempts: sidecar.attempts ?? null });
      continue;
    }
    if (sidecar.state !== 'current') {
      missing.push({ route, reason: `state:${sidecar.state ?? 'unset'}` });
      continue;
    }
    if (sidecar.sourceHash !== sourceHash(absSourceFor(entry))) {
      stale.push({ route, reason: 'source-changed-since-translation' });
      continue;
    }
    covered.push({ route, surface: entry.surface, sourceFile: entry.sourceFile });
  }
  return { covered, missing, stale, blocked };
}

/* ------------------------------------------------------------------ main */

export function buildManifest() {
  const tiers = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'tiers.json'), 'utf8'));
  const roster = loadRoster();
  const universe = buildSourceUniverse();
  const alwaysBuilt = tiers.alwaysBuilt?.routes ?? [];

  const out = { version: 1, generatedAt: null, locales: {} };
  for (const rec of roster) {
    if (rec.locale === 'en') continue; // the default locale is the source, never a translation target
    const declared = resolveRouteSet(rec.coverage, tiers, universe);
    const { covered, missing, stale, blocked } = coverageForLocale(rec.locale, declared, universe);

    // ALWAYS_BUILT: the five .tsx routes are translated through code.json and can
    // never be "covered" by a translated markdown file, so they are injected into
    // every locale's manifest to keep the locale homepage inside its own hreflang
    // cluster. This is the single accepted exception to invariant 4.
    const entries = [
      ...covered,
      ...alwaysBuilt.map((route) => ({ route, surface: 'pages', sourceFile: null, alwaysBuilt: true })),
    ];

    out.locales[rec.locale] = {
      tier: rec.tier,
      coverage: rec.coverage,
      status: rec.status,
      htmlLang: rec.htmlLang,
      direction: rec.direction,
      declaredCount: declared.size,
      coveredCount: covered.length,
      complete: missing.length === 0 && stale.length === 0,
      droppedRatio: declared.size ? blocked.length / declared.size : 0,
      missing,
      stale,
      blocked,
      entries,
    };
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const manifest = buildManifest();

  if (args.includes('--json')) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  const target = path.join(ROOT, 'i18n', 'coverage.json');
  fs.writeFileSync(target, JSON.stringify(manifest, null, 2) + '\n');

  const live = Object.entries(manifest.locales).filter(([, v]) => v.status === 'live');
  console.log(
    `Coverage manifest: ${Object.keys(manifest.locales).length} translation locales, ` +
    `${live.length} live.`,
  );

  if (args.includes('--check')) {
    const bad = live.filter(([, v]) => !v.complete);
    if (bad.length) {
      console.error('\nLive locales are incomplete relative to their declared scope:');
      for (const [l, v] of bad) {
        console.error(`  ${l}: ${v.coveredCount}/${v.declaredCount} covered, ` +
          `${v.missing.length} missing, ${v.stale.length} stale`);
      }
      console.error('\nA locale ships complete or not at all (invariant 4). Either finish the');
      console.error('translation or set status back to "draft" in i18n/locales.config.ts.');
      process.exit(1);
    }
    // Section 13.4: above 10% auto-dropped, the pipeline is failing on that language.
    const overDropped = live.filter(([, v]) => v.droppedRatio > 0.1);
    if (overDropped.length) {
      console.error('\nLive locales exceeding the 10% auto-drop launch veto:');
      for (const [l, v] of overDropped) {
        console.error(`  ${l}: ${(v.droppedRatio * 100).toFixed(1)}% of declared routes blocked`);
      }
      process.exit(1);
    }
    console.log('All live locales are complete relative to their declared scope.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
