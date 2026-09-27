import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import {
  deriveCatalog,
  deriveFacts,
  deriveLite,
  serialize,
  staleCatalogFiles,
  FACTS_FILE,
  LITE_FILE,
} from '../derive-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = path.join(ROOT, 'data');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const courses = readJson('courses.json');

/**
 * Loads a src/ TypeScript module the way webpack would, with every
 * `require('../../data/<file>')` answered from `dataFiles`, so the same source
 * can be evaluated against the full catalog and against the derived subset.
 */
function loadTsModule(relPath, dataFiles) {
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  const req = (spec) => {
    const m = /^\.\.\/\.\.\/data\/(.+)$/.exec(spec);
    if (!m || !(m[1] in dataFiles)) throw new Error(`unexpected require(${spec}) in ${relPath}`);
    return structuredClone(dataFiles[m[1]]);
  };
  new Function('require', 'module', 'exports', outputText)(req, mod, mod.exports);
  return mod.exports;
}

/**
 * The computation src/utils/scrimbaFacts.ts ran on the full courses.json
 * before this change, copied verbatim, labels included.
 */
function legacyScrimbaFacts(list) {
  const nonPaths = list.filter((c) => !c.isPath);
  const paths = list.filter((c) => c.isPath);
  const totalCourses = list.length;
  const freeCount = list.filter((c) => c.access === 'Free').length;
  const proCount = list.filter((c) => c.access === 'Pro').length;
  const pathCount = paths.length;
  const categoryCounts = {};
  for (const c of nonPaths) {
    const cat = c.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }
  const pathDurations = {};
  for (const p of paths) {
    if (p.pathInfo) {
      pathDurations[p.pathInfo.slug] = {
        name: p.pathInfo.name,
        duration: p.pathInfo.duration,
        level: p.pathInfo.level,
      };
    }
  }
  const totalContentHours = nonPaths.reduce((sum, c) => {
    const match = /([\d.]+)/.exec(c.duration ?? '');
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);
  return {
    totalCourses,
    freeCount,
    proCount,
    pathCount,
    categoryCounts,
    pathDurations,
    totalContentHours,
    totalContentHoursLabel: `${Math.floor(totalContentHours / 50) * 50}+ hrs`,
    totalCoursesLabel: `${totalCourses}+`,
    freeCountLabel: `${freeCount}+`,
  };
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.mdx?$/.test(e.name) ? [p] : [];
  });
}

const slugOf = (file) => /^slug:\s*['"]?([^'"\n]+?)['"]?\s*$/m.exec(fs.readFileSync(file, 'utf8').split(/^---$/m)[1] ?? '')?.[1];

/** Every docs and blog route the site can mount, plus every course leaf in the catalog. */
function allRoutes(mapKeys) {
  const routes = new Set(mapKeys);
  for (const file of walk(path.join(ROOT, 'docs'))) {
    const slug = slugOf(file);
    if (slug?.startsWith('/')) {
      routes.add(`/docs${slug}`);
      continue;
    }
    const rel = path.relative(path.join(ROOT, 'docs'), file).replace(/\.mdx?$/, '');
    const parts = rel.split(path.sep).map((s) => s.replace(/^\d+-/, ''));
    if (parts.at(-1) === 'index') parts.pop();
    if (slug) parts[parts.length - 1] = slug;
    routes.add(`/docs/${parts.join('/')}`);
  }
  for (const file of walk(path.join(ROOT, 'blog'))) {
    const slug = slugOf(file) ?? path.basename(file).replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.mdx?$/, '');
    routes.add(`/blog/${slug.replace(/^\//, '')}`);
  }
  for (const c of courses) routes.add(`/docs/courses/${c.category}/${c.docSlug}`);
  routes.add('/docs/courses/react/not-a-real-course');
  return [...routes].flatMap((r) => {
    const bare = r.replace(/\/$/, '') || '/';
    return [bare, `${bare}/`];
  });
}

test('deriveFacts deep-equals the old scrimbaFacts computation over courses.json', () => {
  const { totalContentHoursLabel, totalCoursesLabel, freeCountLabel, ...legacy } = legacyScrimbaFacts(courses);
  assert.deepStrictEqual(deriveFacts(courses), legacy);
  // Key order drives any Object.keys() rendering, so it must survive too.
  assert.deepStrictEqual(Object.keys(deriveFacts(courses).categoryCounts), Object.keys(legacy.categoryCounts));
  assert.ok(totalContentHoursLabel && totalCoursesLabel && freeCountLabel);
});

test('committed catalog files match what courses.json derives to', () => {
  const { facts, lite } = deriveCatalog(courses);
  assert.equal(fs.readFileSync(path.join(DATA, FACTS_FILE), 'utf8'), serialize(facts));
  assert.equal(fs.readFileSync(path.join(DATA, LITE_FILE), 'utf8'), serialize(lite));
  assert.deepStrictEqual(staleCatalogFiles(DATA), []);
});

test('staleCatalogFiles reports a changed or missing derived file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'derive-catalog-'));
  try {
    fs.copyFileSync(path.join(DATA, 'courses.json'), path.join(dir, 'courses.json'));
    assert.deepStrictEqual(staleCatalogFiles(dir), [FACTS_FILE, LITE_FILE]);
    const { facts, lite } = deriveCatalog(courses);
    fs.writeFileSync(path.join(dir, FACTS_FILE), serialize({ ...facts, freeCount: facts.freeCount + 1 }));
    fs.writeFileSync(path.join(dir, LITE_FILE), serialize(lite));
    assert.deepStrictEqual(staleCatalogFiles(dir), [FACTS_FILE]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('deriveLite keeps only the fields the related-guides fallback reads', () => {
  const lite = deriveLite([
    { cleanName: 'A', docSlug: 'a', category: 'css', isPath: false, modules: [1], relatedCourses: [{ docSlug: 'b', category: 'css', title: 'B' }] },
    { cleanName: 'P', docSlug: 'p', category: 'paths', isPath: true, pathMembership: [] },
  ]);
  assert.deepStrictEqual(lite, [
    { cleanName: 'A', docSlug: 'a', category: 'css', isPath: false, relatedCourses: [{ docSlug: 'b', category: 'css' }] },
    { cleanName: 'P', docSlug: 'p', category: 'paths', isPath: true, pathMembership: [] },
  ]);
});

test('scrimbaFacts.ts exports the same values from catalog-facts.json as the old code did from courses.json', () => {
  const mod = loadTsModule('src/utils/scrimbaFacts.ts', { [FACTS_FILE]: readJson(FACTS_FILE) });
  const legacy = legacyScrimbaFacts(courses);
  // Computed in scrimbaFacts.ts from pathDurations (homepage FAQ range, #141), not stored in catalog-facts.json.
  const pathHours = Object.values(legacy.pathDurations)
    .map((p) => parseFloat(/([\d.]+)/.exec(p.duration)?.[1] ?? '0'))
    .filter((n) => n > 0);
  legacy.pathDurationHoursRange = { min: Math.floor(Math.min(...pathHours)), max: Math.floor(Math.max(...pathHours)) };
  assert.deepStrictEqual(Object.keys(mod).sort(), Object.keys(legacy).sort());
  for (const [k, v] of Object.entries(legacy)) assert.deepStrictEqual(mod[k], v, k);
});

test('getRelatedGuides is identical on catalog-lite.json and on the full courses.json for every route', () => {
  const lite = loadTsModule('src/content/relatedGuidesMap.ts', { [LITE_FILE]: readJson(LITE_FILE) });
  const full = loadTsModule('src/content/relatedGuidesMap.ts', { [LITE_FILE]: courses });
  const routes = allRoutes(Object.keys(lite.relatedGuidesMap));
  assert.ok(routes.length > 400, `only ${routes.length} routes enumerated`);
  let leafWithSibling = 0;
  for (const route of routes) {
    const got = lite.getRelatedGuides(route);
    assert.deepStrictEqual(got, full.getRelatedGuides(route), route);
    if (/^\/docs\/courses\/[^/]+\/[^/]+\/?$/.test(route) && got.some((g) => g.href.startsWith('/docs/courses/') && g.href.split('/').length > 5)) leafWithSibling++;
  }
  // The catalog-dependent branch must actually be exercised.
  assert.ok(leafWithSibling > 50, `only ${leafWithSibling} course-leaf routes resolved a sibling`);
});
