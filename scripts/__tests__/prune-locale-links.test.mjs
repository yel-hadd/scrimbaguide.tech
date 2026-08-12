/**
 * Phase 2 exclusion: sidebar filtering, plugin `exclude` computation, and body
 * link pruning (I18N-PLAN.md section 4 Phase 2 tasks (a), (c), (d), plus the
 * fail-closed rule).
 *
 * All three consumers share `config/locale-coverage.mjs`, so this file tests the
 * shared module and the pruner together: the failure mode being defended against
 * is two surfaces disagreeing about what a locale builds, which is invisible
 * until a locale build dies at content load.
 *
 * The English assertions are the important ones. English is absent from
 * `coverage.json` by construction (the manifest builder skips the translation
 * source), and every rule here has to treat that absence as FULL coverage while
 * treating any other locale's absence as ZERO coverage.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GlobExcludeDefault, loadFreshModule } from '@docusaurus/utils';
import {
  DEFAULT_LOCALE,
  contentExcludeOption,
  docIdForSourceFile,
  filterSidebars,
  localeCoverage,
  resolveCurrentLocale,
  toManifestRoute,
} from '../../config/locale-coverage.mjs';
import {
  auditLinks,
  makeResolver,
  pruneLocale,
  pruneMarkdown,
} from '../prune-locale-links.mjs';
import { buildSourceUniverse, resolveRouteSet } from '../build-coverage-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tiers = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'tiers.json'), 'utf8'));
const universe = buildSourceUniverse();

/** A manifest for a locale that covers exactly `routes`, shaped like the real generator's output. */
function fixtureManifest(locale, routes) {
  const byRoute = new Map(universe.map((e) => [e.route, e]));
  const entries = [];
  for (const route of routes) {
    const entry = byRoute.get(route);
    if (entry) entries.push({ route, surface: entry.surface, sourceFile: entry.sourceFile });
    else entries.push({ route, surface: 'pages', sourceFile: null, alwaysBuilt: true });
  }
  return { version: 1, locales: { [locale]: { status: 'live', entries } } };
}

const coreRoutes = [...resolveRouteSet('core', tiers, universe), ...tiers.alwaysBuilt.routes];
const coreCoverage = localeCoverage({
  locale: 'sk',
  manifest: fixtureManifest('sk', coreRoutes),
  universe,
  env: {},
});

/* ------------------------------------------------------------- locale resolution */

test('the inlined plugin exclude defaults still match @docusaurus/utils', () => {
  // config/locale-coverage.mjs copies GlobExcludeDefault rather than importing
  // it (undeclared transitive dependency, loaded at config time). This is the
  // pin that turns an upstream change into a failing test.
  const source = fs.readFileSync(path.join(ROOT, 'config', 'locale-coverage.mjs'), 'utf8');
  for (const pattern of GlobExcludeDefault) {
    assert.ok(source.includes(`'${pattern}'`), `GLOB_EXCLUDE_DEFAULT is missing '${pattern}'`);
  }
});

test('DEFAULT_LOCALE mirrors the roster', () => {
  const roster = fs.readFileSync(path.join(ROOT, 'i18n', 'locales.config.ts'), 'utf8');
  const declared = roster.match(/export const DEFAULT_LOCALE[^=]*=\s*'([^']+)'/);
  assert.ok(declared, 'could not find DEFAULT_LOCALE in i18n/locales.config.ts');
  assert.equal(DEFAULT_LOCALE, declared[1]);
});

test('the literal string "undefined" resolves to the default locale', () => {
  // `docusaurus start` assigns cliOptions.locale unconditionally, so a bare
  // `docusaurus start` stores "undefined" and both `?? 'en'` and `|| 'en'` keep it.
  assert.equal(resolveCurrentLocale({ DOCUSAURUS_CURRENT_LOCALE: 'undefined' }), DEFAULT_LOCALE);
  assert.equal(resolveCurrentLocale({ DOCUSAURUS_CURRENT_LOCALE: '' }), DEFAULT_LOCALE);
  assert.equal(resolveCurrentLocale({ DOCUSAURUS_CURRENT_LOCALE: '  ' }), DEFAULT_LOCALE);
  assert.equal(resolveCurrentLocale({}), DEFAULT_LOCALE);
  assert.equal(resolveCurrentLocale({ DOCUSAURUS_CURRENT_LOCALE: 'de' }), 'de');
});

test('locale prefixes are stripped from manifest routes using the real roster', () => {
  assert.equal(toManifestRoute('/de/docs/paths/'), '/docs/paths/');
  assert.equal(toManifestRoute('/docs/paths'), '/docs/paths/');
  assert.equal(toManifestRoute('/docs/paths/#path-advisor'), '/docs/paths/');
  assert.equal(toManifestRoute('/de'), '/');
  // `docs` is a real first segment, not a locale, and must survive.
  assert.equal(toManifestRoute('/docs/'), '/docs/');
  assert.equal(toManifestRoute('https://scrimba.com/x'), null);
});

/* --------------------------------------------------------------- fail-closed rule */

test('English is unrestricted even though it is absent from the manifest', () => {
  const coverage = localeCoverage({ locale: DEFAULT_LOCALE, manifest: { locales: {} }, universe, env: {} });
  assert.equal(coverage.unrestricted, true);
  assert.equal(contentExcludeOption('docs', coverage), undefined);
  assert.equal(contentExcludeOption('pages', coverage), undefined);
});

test('a non-default locale missing from the manifest excludes ALL content', () => {
  const coverage = localeCoverage({ locale: 'sk', manifest: { locales: {} }, universe, env: {} });
  assert.equal(coverage.unrestricted, false);
  assert.equal(coverage.routes.size, 0);
  for (const surface of ['docs', 'blog', 'pages']) {
    const excluded = contentExcludeOption(surface, coverage).exclude;
    const surfaceFiles = universe.filter((e) => e.surface === surface);
    assert.equal(
      excluded.length,
      GlobExcludeDefault.length + surfaceFiles.length + (surface === 'pages' ? 1 : 0),
      `${surface}: a manifest miss must exclude every file, not fall back to English`,
    );
  }
});

test('a manifest with zero entries is the same as a missing locale', () => {
  const coverage = localeCoverage({
    locale: 'sk',
    manifest: { locales: { sk: { status: 'live', entries: [] } } },
    universe,
    env: {},
  });
  assert.equal(coverage.routes.size, 0);
  assert.equal(coverage.docIds.size, 0);
});

test('I18N_COVERAGE=full is the single escape hatch', () => {
  const coverage = localeCoverage({
    locale: 'ar',
    manifest: { locales: {} },
    universe,
    env: { I18N_COVERAGE: 'full' },
  });
  assert.equal(coverage.unrestricted, true);
  assert.equal(contentExcludeOption('blog', coverage), undefined);
  // Anything other than the exact value must NOT bypass.
  const strict = localeCoverage({
    locale: 'ar',
    manifest: { locales: {} },
    universe,
    env: { I18N_COVERAGE: 'partial' },
  });
  assert.equal(strict.unrestricted, false);
});

/* ------------------------------------------------------------------ exclude globs */

test('exclude patterns are file paths, keep the plugin defaults, and spare covered files', () => {
  const docsExclude = contentExcludeOption('docs', coreCoverage).exclude;
  for (const pattern of GlobExcludeDefault) {
    assert.ok(docsExclude.includes(pattern), `plugin default '${pattern}' was dropped`);
  }
  // A core-covered doc that overrides its slug: the route-to-file inverse comes
  // from the manifest, so this must not be excluded despite the path mismatch.
  assert.ok(!docsExclude.includes('pricing/index.mdx'), 'covered doc was excluded');
  assert.ok(docsExclude.includes('courses/react/learn-react.mdx'), 'uncovered leaf was not excluded');

  const blogExclude = contentExcludeOption('blog', coreCoverage).exclude;
  assert.ok(blogExclude.includes('2026-02-04-scrimba-success-stories.mdx'));
  assert.ok(!blogExclude.includes('2026-01-02-scrimba-review.mdx'), 'covered post was excluded');
});

test('legal pages are excluded from every non-default locale, by name and by coverage', () => {
  const pagesExclude = contentExcludeOption('pages', coreCoverage).exclude;
  assert.ok(pagesExclude.includes('legal/**'), 'the alwaysExcluded glob must be stated explicitly');
  for (const entry of universe.filter((e) => e.surface === 'pages')) {
    if (entry.sourceFile.startsWith('legal/')) {
      assert.ok(
        pagesExclude.includes(entry.sourceFile) || pagesExclude.includes('legal/**'),
        `${entry.sourceFile} must not build in a translated locale`,
      );
    }
  }
  // The .tsx routes are alwaysBuilt and have no markdown source, so nothing can
  // exclude them; assert they never leak into the pattern list.
  for (const pattern of pagesExclude) assert.ok(!pattern.endsWith('.tsx'), pattern);
});

/* ----------------------------------------------------------------- sidebar (task a) */

const sidebarFixture = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'How Scrimba Works',
      items: ['how-it-works/how-scrims-work', 'how-it-works/learning-speed'],
    },
    {
      type: 'category',
      label: 'Courses by Topic',
      link: { type: 'doc', id: 'courses/index' },
      items: [
        {
          type: 'category',
          label: 'React',
          link: { type: 'doc', id: 'courses/react/index' },
          items: [{ type: 'autogenerated', dirName: 'courses/react' }],
        },
      ],
    },
    {
      type: 'category',
      label: 'Practice',
      link: { type: 'doc', id: 'practice/index' },
      items: ['practice/practice-flexbox'],
    },
  ],
};

test('an unrestricted locale gets the very same sidebar object back', () => {
  const coverage = localeCoverage({ locale: DEFAULT_LOCALE, manifest: { locales: {} }, universe, env: {} });
  assert.equal(filterSidebars(sidebarFixture, coverage), sidebarFixture);
});

test('sidebar entries are filtered to the docs the locale builds', () => {
  const filtered = filterSidebars(sidebarFixture, coreCoverage);
  const [intro, howItWorks, courses] = filtered.docs;

  assert.equal(intro, 'intro');
  // 'how-it-works/learning-speed' is not in the Core set; the category survives
  // on its remaining item.
  assert.deepEqual(howItWorks.items, ['how-it-works/how-scrims-work']);
  // Practice has an uncovered category link, so the whole category goes: leaving
  // it would point the sidebar at a route this locale does not build.
  assert.ok(!filtered.docs.some((i) => i.label === 'Practice'));
  // The React hub is covered, so the category stays. Its autogenerated dir also
  // stays, because the hub file itself lives under that dir: autogeneration only
  // ever sees the files that survived the plugin `exclude`, so it self-prunes to
  // the same set the English build would show for those files.
  const react = courses.items[0];
  assert.equal(react.label, 'React');
  assert.deepEqual(react.items, [{ type: 'autogenerated', dirName: 'courses/react' }]);
});

test('an autogenerated dir with zero covered docs is dropped, the category is not', () => {
  // The generator throws "Can't find any doc with directory name X" for an empty
  // dir, which is a build failure rather than a broken link, so the item has to
  // go while the still-covered category link stays.
  const fixture = {
    docs: [
      {
        type: 'category',
        label: 'Courses by Topic',
        link: { type: 'doc', id: 'courses/index' },
        items: [{ type: 'autogenerated', dirName: 'courses/javascript' }],
      },
    ],
  };
  const coverage = localeCoverage({
    locale: 'sk',
    manifest: fixtureManifest('sk', ['/docs/courses/']),
    universe,
    env: {},
  });
  const [category] = filterSidebars(fixture, coverage).docs;
  assert.equal(category.label, 'Courses by Topic');
  assert.deepEqual(category.items, []);
});

test('a locale with no covered docs yields no sidebars at all', () => {
  const empty = localeCoverage({ locale: 'sk', manifest: { locales: {} }, universe, env: {} });
  assert.deepEqual(filterSidebars(sidebarFixture, empty), {});
});

test('the real sidebars.ts resolves identically for every English env state', async () => {
  // Loaded exactly the way Docusaurus loads it (jiti, default export taken as
  // the module), because the failure this guards is env-dependent: a bare
  // `docusaurus start` sets DOCUSAURUS_CURRENT_LOCALE to the string "undefined".
  const sidebarsPath = path.join(ROOT, 'sidebars.ts');
  const load = async (locale) => {
    const previous = process.env.DOCUSAURUS_CURRENT_LOCALE;
    if (locale === null) delete process.env.DOCUSAURUS_CURRENT_LOCALE;
    else process.env.DOCUSAURUS_CURRENT_LOCALE = locale;
    try {
      return await loadFreshModule(sidebarsPath);
    } finally {
      if (previous === undefined) delete process.env.DOCUSAURUS_CURRENT_LOCALE;
      else process.env.DOCUSAURUS_CURRENT_LOCALE = previous;
    }
  };

  const bare = await load(null);
  assert.ok(bare.docs.includes('intro'), 'the English sidebar must be intact');
  assert.deepEqual(await load('undefined'), bare, '"undefined" must not restrict the sidebar');
  assert.deepEqual(await load('en'), bare, 'the default locale must not restrict the sidebar');

  // A locale the manifest has never heard of resolves to no sidebar at all
  // rather than to English doc ids its build excludes. 'zz' is not in the
  // roster, so this stays a manifest miss even after real locales ship.
  assert.deepEqual(await load('zz'), {});
});

test('no doc overrides its frontmatter id, which the doc-id mapping assumes', () => {
  // Docusaurus derives a doc id from the source path minus extension unless
  // frontmatter sets `id:`. The sidebar filter maps covered sourceFiles to ids
  // the same way; an `id:` override would silently drop that doc from the
  // sidebar of every translated locale.
  const overrides = [];
  for (const entry of universe.filter((e) => e.surface === 'docs')) {
    const src = fs.readFileSync(path.join(ROOT, 'docs', entry.sourceFile), 'utf8');
    if (/^---[\s\S]*?^id:\s*\S/m.test(src.slice(0, src.indexOf('\n---', 3) + 4))) {
      overrides.push(entry.sourceFile);
    }
  }
  assert.deepEqual(overrides, [], 'these docs set frontmatter id: and need explicit id mapping');
  assert.equal(docIdForSourceFile('courses/react/index.mdx'), 'courses/react/index');
});

/* ------------------------------------------------------------ link pruning (task c) */

const resolve = makeResolver({ routes: new Set(['/docs/pricing/', '/blog/scrimba-review/', '/docs/paths/']) });

test('an uncovered link becomes its anchor text and never an English link', () => {
  const source = [
    'See [the pricing page](/docs/pricing/) and [the React course](/docs/courses/react/learn-react/).',
    'Also [a post](/blog/scrimba-review/) plus [another](/blog/scrimba-for-teams/ "Teams").',
  ].join('\n');
  const { output, unlinked } = pruneMarkdown(source, resolve);

  assert.match(output, /\[the pricing page\]\(\/docs\/pricing\/\)/);
  assert.match(output, /and the React course\./);
  assert.match(output, /plus another\./);
  assert.equal(unlinked.length, 2);
  // Invariant 6: no cross-locale substitution, ever.
  assert.ok(!output.includes('/en/'), 'pruning must never emit a cross-locale link');
  assert.ok(!output.includes('scrimba-for-teams'), 'the uncovered target must be gone entirely');
});

test('pruning is idempotent', () => {
  const source = 'Read [this](/docs/gone/) then [that](/docs/pricing/).\n';
  const once = pruneMarkdown(source, resolve);
  const twice = pruneMarkdown(once.output, resolve);
  assert.equal(twice.changed, false);
  assert.equal(twice.output, once.output);
});

test('images, code fences, code spans, frontmatter and anchors are left alone', () => {
  const source = [
    '---',
    'title: X',
    'slug: /docs/gone/',
    '---',
    '',
    '![a chart](/img/chart.png) and ![missing](/img/nope.svg)',
    '',
    'Inline `[example](/docs/gone/)` stays an example.',
    '',
    '```md',
    '[docs sample](/docs/gone/)',
    '```',
    '',
    'A [pure anchor](#section) and an [external](https://scrimba.com/x).',
    '',
    'A [real one](/docs/gone/) goes.',
  ].join('\n');
  const { output, unlinked } = pruneMarkdown(source, resolve);

  assert.ok(output.includes('![a chart](/img/chart.png)'), 'images must survive');
  assert.ok(output.includes('`[example](/docs/gone/)`'), 'code spans must survive');
  assert.ok(output.includes('[docs sample](/docs/gone/)'), 'fenced code must survive');
  assert.ok(output.includes('slug: /docs/gone/'), 'frontmatter must survive');
  assert.ok(output.includes('[pure anchor](#section)'));
  assert.ok(output.includes('[external](https://scrimba.com/x)'));
  assert.equal(unlinked.length, 1);
  assert.ok(output.includes('A real one goes.'));
});

test('an in-locale prefixed link resolves against the locale-stripped manifest', () => {
  const { unlinked } = pruneMarkdown('[x](/de/docs/pricing/)', resolve);
  assert.equal(unlinked.length, 0);
});

test('JSX targets are audited, not rewritten', () => {
  const source = [
    '<Link to="/docs/pricing/">ok</Link>',
    '<Link to="/docs/vanished/">bad</Link>',
    '<a href="/blog/also-gone/">bad</a>',
    '<Link to={someExpression}>skipped</Link>',
  ].join('\n');
  const violations = auditLinks(source, resolve);
  assert.deepEqual(violations.map((v) => v.target), ['/docs/vanished/', '/blog/also-gone/']);
});

test('route literals in always-built .tsx pages are audited too', () => {
  const source = "const paths = [{title: 'A', link: '/docs/paths/'}, {title: 'B', link: '/blog/gone/'}];";
  assert.deepEqual(auditLinks(source, resolve).length, 0, 'attribute scan alone must not fire');
  assert.deepEqual(
    auditLinks(source, resolve, { routeLiterals: true }).map((v) => v.target),
    ['/blog/gone/'],
  );
});

/* ------------------------------------------------------------------ file walking */

function makeFixtureSite() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prune-locale-'));
  const docsDir = path.join(root, 'i18n', 'sk', 'docusaurus-plugin-content-docs', 'current');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, 'intro.md'),
    '# Intro\n\nSee [pricing](/docs/pricing/) and [gone](/docs/gone/).\n',
  );
  // An English source that must never be touched.
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'intro.md'), 'See [gone](/docs/gone/).\n');
  return root;
}

test('pruning writes inside i18n/<locale> only, and --check writes nothing', () => {
  const root = makeFixtureSite();
  const coverage = { routes: new Set(['/docs/pricing/']) };
  const english = path.join(root, 'docs', 'intro.md');
  const translated = path.join(root, 'i18n', 'sk', 'docusaurus-plugin-content-docs', 'current', 'intro.md');
  const englishBefore = fs.readFileSync(english, 'utf8');

  const dry = pruneLocale({ locale: 'sk', root, check: true, coverage });
  assert.equal(dry.changed.length, 1);
  assert.equal(fs.readFileSync(translated, 'utf8').includes('[gone](/docs/gone/)'), true);

  const wet = pruneLocale({ locale: 'sk', root, coverage });
  assert.equal(wet.unlinked, 1);
  const after = fs.readFileSync(translated, 'utf8');
  assert.ok(after.includes('[pricing](/docs/pricing/)'));
  assert.ok(!after.includes('/docs/gone/'));
  assert.equal(fs.readFileSync(english, 'utf8'), englishBefore, 'English sources are read-only here');

  assert.equal(pruneLocale({ locale: 'sk', root, check: true, coverage }).changed.length, 0);
  fs.rmSync(root, { recursive: true, force: true });
});
