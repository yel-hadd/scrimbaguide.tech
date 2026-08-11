import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Loading a TypeScript subject under plain `node --test`
// ---------------------------------------------------------------------------
// The other tests in this directory either test a `.mjs` script directly or
// re-implement the logic they check (see search-modal.test.mjs). Neither works
// here: localePath.ts must be tested as the real module, because the whole
// point of the unit is that exactly one implementation of locale-prefix
// arithmetic exists. A re-implementation would be a second one.
//
// Node 22.18+ strips TypeScript types on import with no flag and no build
// step, so `import('.../localePath.ts')` runs the real source. Two resolution
// gaps have to be bridged, both of which come from the source being written
// for the Docusaurus/webpack resolver rather than for Node ESM:
//
//   - `@site/...` is the Docusaurus alias for the project root (declared in
//     tsconfig `paths`). Node has never heard of it.
//   - tsconfig uses `moduleResolution: "bundler"`, so TS source imports are
//     extensionless. Node ESM requires the real filename.
//
// `module.registerHooks()` (synchronous, in-thread, core-only) fixes both in
// ~10 lines with no dependency and no loader file. It is scoped to this test
// process, so it changes nothing about how the site builds.
const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const REAL_EXTENSIONS = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|json)$/i;

registerHooks({
  resolve(specifier, context, nextResolve) {
    let target = specifier;
    if (target.startsWith('@site/')) {
      target = pathToFileURL(path.join(ROOT, target.slice('@site/'.length)))
        .href;
    }
    // `locales.config` ends in a dot-segment that is NOT an extension, hence
    // the explicit extension whitelist instead of a generic /\.\w+$/ test.
    if (
      (target.startsWith('.') || target.startsWith('file:')) &&
      !REAL_EXTENSIONS.test(target)
    ) {
      target += '.ts';
    }
    return nextResolve(target, context);
  },
});

const { stripLocale, getLocale, localize } = await import(
  pathToFileURL(path.join(ROOT, 'src/utils/localePath.ts')).href
);

const { LOCALES, DEFAULT_LOCALE } = await import(
  pathToFileURL(path.join(ROOT, 'i18n/locales.config.ts')).href
);

// Multi-segment tags (region/script subtags) are read off the roster rather
// than typed out. Two reasons, both real: the Phase 1 acceptance check greps
// for a hardcoded locale tag anywhere under src/, plugins/, scripts/, config/
// or docusaurus.config.ts and requires the roster file to be the only hit, and
// a tag added to the roster later gets these assertions for free instead of
// quietly going untested.
const MULTI_SEGMENT_LOCALES = LOCALES.map((l) => l.locale).filter((l) =>
  l.includes('-'),
);

/** `pt-BR` -> `pt-br`: the casing a case-insensitive matcher would accept. */
function miscase(locale) {
  return locale.toLowerCase();
}

// ---------------------------------------------------------------------------
// stripLocale
// ---------------------------------------------------------------------------

test('stripLocale removes a real locale prefix', () => {
  assert.equal(stripLocale('/de/docs/paths/'), '/docs/paths/');
  assert.equal(stripLocale('/es/blog/scrimba-review/'), '/blog/scrimba-review/');
  assert.equal(stripLocale('/ar/docs/pricing/'), '/docs/pricing/');
});

test('stripLocale is a no-op on unprefixed paths', () => {
  assert.equal(stripLocale('/docs/paths/'), '/docs/paths/');
  assert.equal(stripLocale('/blog/scrimba-review/'), '/blog/scrimba-review/');
});

test('stripLocale round-trips multi-segment tags with canonical casing', () => {
  assert.ok(MULTI_SEGMENT_LOCALES.length > 0, 'roster must have region/script tags');
  for (const locale of MULTI_SEGMENT_LOCALES) {
    assert.equal(stripLocale(`/${locale}/docs/paths/`), '/docs/paths/');
    assert.equal(getLocale(`/${locale}/docs/paths/`), locale);
  }
});

test('stripLocale does not case-fold: a wrongly-cased tag is not a prefix', () => {
  // Docusaurus route lookup is case-sensitive and only ever emits the roster's
  // canonical casing. Accepting a lowercased region subtag here would make a
  // 404 look like a valid localized URL, and would hand back a locale string
  // that no route table and no hreflang cluster contains.
  for (const locale of MULTI_SEGMENT_LOCALES) {
    const wrong = `/${miscase(locale)}/docs/paths/`;
    assert.equal(stripLocale(wrong), wrong);
    assert.equal(getLocale(wrong), DEFAULT_LOCALE);
  }
  assert.equal(stripLocale('/DE/docs/paths/'), '/DE/docs/paths/');
});

test('stripLocale leaves real routes that merely look like locales', () => {
  // The failure mode a /^\/[a-z]{2}\// regex would produce. Every one of these
  // is a live route on the site.
  assert.equal(stripLocale('/docs/for/beginners/'), '/docs/for/beginners/');
  assert.equal(stripLocale('/docs/for/'), '/docs/for/');
  assert.equal(stripLocale('/docs/ai/'), '/docs/ai/');
  assert.equal(stripLocale('/docs/is-scrimba-free/'), '/docs/is-scrimba-free/');
  assert.equal(stripLocale('/tools/'), '/tools/');
  assert.equal(stripLocale('/about/'), '/about/');
  assert.equal(stripLocale('/contact/'), '/contact/');
});

test('stripLocale does not strip the default locale, which has no prefix', () => {
  // `en` is in the roster but is served at the bare root, so `/en/...` is not
  // a prefixed path and must survive intact.
  assert.equal(stripLocale('/en/docs/paths/'), '/en/docs/paths/');
});

test('stripLocale handles the root', () => {
  assert.equal(stripLocale('/'), '/');
  assert.equal(stripLocale('/de/'), '/');
  // Bare `/de` has an empty remainder; `''` is not a pathname, so it
  // normalises to `/`. The one documented trailing-slash exception.
  assert.equal(stripLocale('/de'), '/');
});

test('stripLocale preserves the trailing-slash convention of its input', () => {
  assert.equal(stripLocale('/de/docs/paths'), '/docs/paths');
  assert.equal(stripLocale('/de/docs/paths/'), '/docs/paths/');
  assert.equal(stripLocale('/docs/paths'), '/docs/paths');
});

test('stripLocale splits off a query or hash instead of mangling it', () => {
  assert.equal(stripLocale('/de/docs/x/?a=1'), '/docs/x/?a=1');
  assert.equal(stripLocale('/de/docs/x/#top'), '/docs/x/#top');
  assert.equal(stripLocale('/de/docs/x/?a=1#top'), '/docs/x/?a=1#top');
  assert.equal(stripLocale('/de/?a=1'), '/?a=1');
  assert.equal(stripLocale('/docs/x/?a=1'), '/docs/x/?a=1');
});

test('stripLocale returns non-pathname input untouched', () => {
  assert.equal(stripLocale(''), '');
  assert.equal(stripLocale('docs/paths/'), 'docs/paths/');
  assert.equal(stripLocale('de/docs/paths/'), 'de/docs/paths/');
  assert.equal(
    stripLocale('https://scrimbaguide.tech/de/docs/'),
    'https://scrimbaguide.tech/de/docs/',
  );
});

// ---------------------------------------------------------------------------
// getLocale
// ---------------------------------------------------------------------------

test('getLocale reads the prefix, defaulting to en', () => {
  assert.equal(getLocale('/de/docs/paths/'), 'de');
  assert.equal(getLocale('/docs/paths/'), 'en');
  assert.equal(getLocale('/'), 'en');
  assert.equal(getLocale('/de/'), 'de');
  assert.equal(getLocale('/de'), 'de');
});

test('getLocale returns canonical casing for multi-segment tags', () => {
  for (const locale of MULTI_SEGMENT_LOCALES) {
    // The returned string must be usable as a route prefix as-is, so it has to
    // be the roster's exact spelling, not a normalised one.
    assert.equal(getLocale(`/${locale}/docs/`), locale);
    assert.equal(getLocale(`/${miscase(locale)}/docs/`), DEFAULT_LOCALE);
  }
});

test('getLocale never mistakes a real route segment for a locale', () => {
  assert.equal(getLocale('/docs/for/beginners/'), 'en');
  assert.equal(getLocale('/tools/'), 'en');
  assert.equal(getLocale('/about/'), 'en');
  assert.equal(getLocale('/en/docs/'), 'en');
});

test('getLocale tolerates a query or hash and odd input', () => {
  assert.equal(getLocale('/de/docs/x/?a=1'), 'de');
  assert.equal(getLocale('/de/docs/x/#top'), 'de');
  assert.equal(getLocale(''), 'en');
  assert.equal(getLocale('de/docs/'), 'en');
});

// ---------------------------------------------------------------------------
// localize
// ---------------------------------------------------------------------------

test('localize adds the prefix', () => {
  assert.equal(localize('/docs/paths/', 'de'), '/de/docs/paths/');
  for (const locale of MULTI_SEGMENT_LOCALES) {
    assert.equal(
      localize('/blog/scrimba-review/', locale),
      `/${locale}/blog/scrimba-review/`,
    );
  }
});

test('localize into the default locale adds no prefix', () => {
  assert.equal(localize('/docs/paths/', 'en'), '/docs/paths/');
  assert.equal(localize('/', 'en'), '/');
});

test('localize handles the root', () => {
  assert.equal(localize('/', 'de'), '/de/');
  for (const locale of MULTI_SEGMENT_LOCALES) {
    assert.equal(localize('/', locale), `/${locale}/`);
  }
});

test('localize preserves the trailing-slash convention of its input', () => {
  assert.equal(localize('/docs/paths', 'de'), '/de/docs/paths');
  assert.equal(localize('/docs/paths/', 'de'), '/de/docs/paths/');
});

test('localize strips first, so it re-targets rather than nests', () => {
  // What the language switcher does: current pathname -> another locale.
  assert.equal(localize('/de/docs/paths/', 'fr'), '/fr/docs/paths/');
  for (const locale of MULTI_SEGMENT_LOCALES) {
    assert.equal(localize(`/${locale}/docs/paths/`, 'de'), '/de/docs/paths/');
  }
  assert.equal(localize('/de/docs/paths/', 'en'), '/docs/paths/');
  // Idempotent.
  assert.equal(localize(localize('/docs/paths/', 'de'), 'de'), '/de/docs/paths/');
});

test('localize treats an unknown locale as the default instead of throwing', () => {
  assert.equal(localize('/docs/paths/', 'xx'), '/docs/paths/');
  assert.equal(localize('/de/docs/paths/', 'xx'), '/docs/paths/');
  assert.equal(localize('/docs/paths/', ''), '/docs/paths/');
});

test('localize carries a query or hash through and leaves non-pathnames alone', () => {
  assert.equal(localize('/docs/x/?a=1', 'de'), '/de/docs/x/?a=1');
  assert.equal(localize('/docs/x/#top', 'de'), '/de/docs/x/#top');
  assert.equal(localize('', 'de'), '');
  assert.equal(localize('docs/paths/', 'de'), 'docs/paths/');
  assert.equal(
    localize('https://scrimbaguide.tech/docs/', 'de'),
    'https://scrimbaguide.tech/docs/',
  );
});

// ---------------------------------------------------------------------------
// Round-trip invariants over the whole roster
// ---------------------------------------------------------------------------

test('every roster locale round-trips through localize -> stripLocale/getLocale', () => {
  const routes =['/', '/docs/paths/', '/docs/for/beginners/', '/blog/scrimba-review/', '/tools/'];

  for (const { locale } of LOCALES) {
    for (const route of routes) {
      const localized = localize(route, locale);
      assert.equal(
        stripLocale(localized),
        route,
        `stripLocale(localize(${route}, ${locale})) should be ${route}`,
      );
      assert.equal(
        getLocale(localized),
        locale,
        `getLocale(localize(${route}, ${locale})) should be ${locale}`,
      );
      if (locale === DEFAULT_LOCALE) {
        assert.equal(localized, route, 'the default locale gets no prefix');
      } else {
        assert.equal(localized, `/${locale}${route}`);
      }
    }
  }
});
