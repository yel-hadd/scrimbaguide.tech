/**
 * Unit tests for the hreflang cluster rule, over FIXTURE manifests
 * (I18N-PLAN.md section 4 Phase 2).
 *
 * These run against fixtures rather than the real coverage.json on purpose:
 * every locale is status 'draft' today, so a test bound to real data would
 * assert nothing and would keep passing right up until the first locale ships.
 *
 * Cross-locale RECIPROCITY is deliberately NOT tested here. A single-locale
 * build cannot see the other locales' output; only the `assemble` job sees the
 * merged tree, so reciprocity is a separate assertion over merged HTML.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Same loader shim as localePath.test.mjs: the subject is TypeScript written
// for the Docusaurus/webpack resolver (extensionless imports, `@site/` alias),
// and Node ESM needs both bridged. See that file for the full rationale.
const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const REAL_EXTENSIONS = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|json)$/i;

registerHooks({
  resolve(specifier, context, nextResolve) {
    let target = specifier;
    if (target.startsWith('@site/')) {
      target = pathToFileURL(path.join(ROOT, target.slice('@site/'.length))).href;
    }
    if ((target.startsWith('.') || target.startsWith('file:')) && !REAL_EXTENSIONS.test(target)) {
      target += '.ts';
    }
    return nextResolve(target, context);
  },
});

const { indexManifest, selectAlternates, toManifestRoute } = await import(
  pathToFileURL(path.join(ROOT, 'src/utils/hreflang.ts')).href
);

const manifest = (locales) => ({ locales });
const cov = (routes, status = 'draft') => ({ status, entries: routes.map((route) => ({ route })) });

const FULL = ['/docs/pricing/', '/docs/paths/', '/blog/scrimba-review/', '/docs/courses/react/learn-react/'];
const CORE = ['/docs/pricing/', '/docs/paths/'];

const FIXTURE = manifest({
  es: cov(FULL),                 // Tier A, full
  de: cov(CORE),                 // Core-set locale
  sk: cov([]),                   // scaffolded, nothing translated
  mk: cov(CORE, 'pruned'),       // retired under the section 7 kill criteria
});
const INDEX = indexManifest(FIXTURE);

const select = (route, currentLocale = 'en', configured = ['en', 'es', 'de', 'sk', 'mk']) =>
  selectAlternates({
    route,
    currentLocale,
    defaultLocale: 'en',
    configuredLocales: configured,
    index: INDEX,
  });

/* ---------------------------------------------------------------- routes */

test('toManifestRoute strips locale, query and hash and normalizes the slash', () => {
  assert.equal(toManifestRoute('/de/docs/pricing/'), '/docs/pricing/');
  assert.equal(toManifestRoute('/docs/pricing'), '/docs/pricing/');
  assert.equal(toManifestRoute('/pt-BR/docs/pricing/'), '/docs/pricing/');
  assert.equal(toManifestRoute('/docs/pricing/?a=1#faq'), '/docs/pricing/');
  assert.equal(toManifestRoute('/'), '/');
  assert.equal(toManifestRoute('/de/'), '/');
  // A route that merely looks locale-shaped must survive intact.
  assert.equal(toManifestRoute('/docs/for/beginners/'), '/docs/for/beginners/');
});

/* -------------------------------------------------------------- clusters */

test('a fully covered route advertises every locale that has it', () => {
  const { alternates } = select('/docs/pricing/');
  assert.deepEqual(alternates, ['en', 'es', 'de']); // sk empty, mk pruned
});

test('a route only the full-coverage locale has does NOT advertise core locales', () => {
  const { alternates } = select('/docs/courses/react/learn-react/');
  assert.deepEqual(alternates, ['en', 'es']);
  assert.ok(!alternates.includes('de'), 'de has not translated this route and must not be advertised');
});

test('a scaffolded-but-empty locale is never advertised', () => {
  for (const route of [...FULL, '/nonexistent/']) {
    assert.ok(!select(route).alternates.includes('sk'), `sk leaked into cluster for ${route}`);
  }
});

test('a pruned locale leaves every cluster even though it has coverage', () => {
  const { alternates } = select('/docs/pricing/');
  assert.ok(!alternates.includes('mk'), 'pruned locales must drop out of hreflang entirely');
});

test('fails closed: unknown locale and unknown route both yield no alternate', () => {
  assert.deepEqual(select('/docs/pricing/', 'en', ['en', 'zz']).alternates, ['en']);
  assert.deepEqual(select('/totally/unknown/').alternates, ['en']);
});

/* --------------------------------------------------------- invariant 3 */

test('the default locale is always present: it is the source of every route', () => {
  for (const route of [...FULL, '/anything/at/all/']) {
    assert.ok(select(route).alternates.includes('en'), `en missing from cluster for ${route}`);
  }
});

test('self-reference is always present, even on a route the manifest lacks', () => {
  // The manifest can lag the page currently rendering. A cluster with no
  // self-reference is rejected outright, so self must not depend on it.
  const { alternates } = select('/docs/courses/react/learn-react/', 'de');
  assert.ok(alternates.includes('de'), 'current locale must always self-reference');
});

test('exactly one x-default, always the default locale', () => {
  for (const locale of ['en', 'es', 'de']) {
    const { xDefault } = select('/docs/pricing/', locale);
    assert.equal(xDefault, 'en');
  }
});

test('no duplicate locale tags in a cluster', () => {
  const { alternates } = select('/docs/pricing/', 'es');
  assert.equal(new Set(alternates).size, alternates.length);
});

/* ------------------------------------------------------------- BCP 47 */

test('roster htmlLang values are valid BCP 47 and carry no invented region codes', () => {
  // Google ignores non-standard region subtags like EU or UK, which silently
  // drops that locale from the cluster rather than erroring.
  const BCP47 = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?$/;
  const INVALID_REGIONS = new Set(['EU', 'UK']);
  const src = fs.readFileSync(path.join(ROOT, 'i18n/locales.config.ts'), 'utf8');
  const tags = [...src.matchAll(/^[ \t]*htmlLang:\s*'([^']+)'/gm)].map((m) => m[1]);
  assert.ok(tags.length >= 40, `expected the full roster, parsed ${tags.length} htmlLang values`);
  for (const tag of tags) {
    assert.match(tag, BCP47, `htmlLang '${tag}' is not a well-formed BCP 47 tag`);
    const region = tag.split('-').at(-1);
    assert.ok(!INVALID_REGIONS.has(region), `htmlLang '${tag}' uses a region code Google ignores`);
  }
});

test('the real manifest is loadable and indexes without throwing', () => {
  const file = path.join(ROOT, 'i18n/coverage.json');
  assert.ok(fs.existsSync(file), 'coverage.json must exist (generated by prebuild/prestart)');
  const real = JSON.parse(fs.readFileSync(file, 'utf8'));
  const idx = indexManifest(real);
  assert.equal(typeof idx.covered, 'object');
  // Today: 47 draft locales, none with coverage. Assert the shape, not the emptiness.
  assert.ok(Object.keys(idx.covered).length >= 40, 'manifest should carry the full roster');
});
