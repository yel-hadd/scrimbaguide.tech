import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectFiles,
  createLinter,
  isTranslationPath,
  loadConfig,
  localeForPath,
  readAffiliateId,
} from '../check-content.mjs';

/**
 * Fixture-string tests. They lint strings, never the repo, so a content edit elsewhere can
 * never turn this suite red and a rule regression can never hide behind "no content triggers
 * it yet" (i18n/ is empty of translations in this commit).
 */
const linter = createLinter();

const EN_DOC = 'docs/pricing/index.mdx';
const FR_DOC = 'i18n/fr/docusaurus-plugin-content-docs/current/pricing/index.mdx';
const JA_DOC = 'i18n/ja/docusaurus-plugin-content-docs/current/pricing/index.mdx';
const AR_DOC = 'i18n/ar/docusaurus-plugin-content-docs/current/pricing/index.mdx';

/** Convenience: does the fixture produce at least one violation of the expected kind? */
function lint(rel, text) {
  return linter.lintFile(rel, text);
}

// ------------------------------------------------------------------ localized currency rule

test('localized currency: flags a price attached to a Scrimba plan', () => {
  const cases = [
    ['Scrimba Pro coûte 20 € par mois.', 'plan then price, EUR suffix'],
    ['Scrimba Pro kostet CHF 25 pro Monat.', 'plan then price, CHF prefix'],
    ['20 € par mois pour Scrimba Pro.', 'price then plan (translated preposition)'],
    ['Subskrypcja Scrimba Pro to 79 zł.', 'PLN suffix'],
    ['Scrimba Pro: 1 899 ₽', 'RUB with a no-break thousands separator'],
    ['A assinatura Scrimba Pro custa R$ 99.', 'BRL prefix'],
    ['Scrimba Pro plan is 199 kr.', 'SEK/DKK/NOK suffix'],
  ];
  for (const [line, why] of cases) {
    const found = lint(FR_DOC, line);
    assert.equal(found.length, 1, `expected a price violation (${why}) for: ${line}`);
    assert.match(found[0], /possible exact Scrimba price/);
  }
});

test('localized currency: does NOT flag a competitor price sharing the line', () => {
  const cases = [
    // Markdown comparison table: the `|` cell boundary is what separates the two prices.
    ['| Codecademy | 30 € | Scrimba Pro | Voir les tarifs |', 'comparison table row'],
    // Prose comparison: the connective is config data (priceRules.comparisonConnectives).
    ['Codecademy coûte 30 € contre Scrimba Pro, moins cher.', 'explicit "contre"'],
    ['Un bootcamp coûte 9 000 €. Scrimba Pro est un abonnement mensuel.', 'sentence boundary'],
    ['Scrimba Pro donne accès à 79 cours interactifs.', 'a bare number is not a price'],
    ['Voir les tarifs de Scrimba Pro sur la page officielle.', 'no figure at all'],
  ];
  for (const [line, why] of cases) {
    assert.deepEqual(lint(FR_DOC, line), [], `expected no violation (${why}) for: ${line}`);
  }
});

test('dollar price rules are unchanged', () => {
  assert.match(lint(EN_DOC, 'Scrimba Pro is $20 a month.')[0], /possible exact Scrimba price/);
  assert.match(
    lint(EN_DOC, 'You pay $20/month for Scrimba Pro.')[0],
    /possible exact Scrimba price/,
  );
  assert.match(
    lint('src/pages/tools/bootcamp-cost-calculator.tsx', 'const scrimbaMonthly = 30;')[0],
    /possible exact Scrimba price/,
  );
  // The pre-i18n false-positive guard: a bootcamp price on a Scrimba comparison line.
  assert.deepEqual(
    lint(EN_DOC, 'Traditional bootcamps average $14,000. Scrimba Pro is a subscription.'),
    [],
  );
});

// ------------------------------------------------------------------------- affiliate integrity

test('affiliate integrity: flags a bare scrimba.com link in a translation', () => {
  const found = lint(FR_DOC, 'Voir [les tarifs](https://scrimba.com/home?pricing) sur Scrimba.');
  assert.equal(found.length, 1);
  assert.match(found[0], /without affiliate attribution/);
  assert.match(found[0], new RegExp(`via=${readAffiliateId()}`));
});

test('affiliate integrity: accepts <AffiliateLink> or an inline via= param', () => {
  const id = readAffiliateId();
  assert.deepEqual(
    lint(FR_DOC, '<AffiliateLink href="https://scrimba.com/home?pricing">Voir les tarifs</AffiliateLink>'),
    [],
  );
  assert.deepEqual(lint(FR_DOC, `[Tarifs](https://scrimba.com/home?pricing&via=${id})`), []);
  // Tag wrapped across lines, as MDX authors actually write long CTAs.
  assert.deepEqual(
    lint(FR_DOC, ['<AffiliateLink', '  href="https://scrimba.com/home?pricing"', '>Voir</AffiliateLink>'].join('\n')),
    [],
  );
});

test('affiliate integrity: a wrong or stripped id is still a violation', () => {
  const found = lint(FR_DOC, '[Tarifs](https://scrimba.com/home?pricing&via=someoneelse)');
  assert.equal(found.length, 1);
  assert.match(found[0], /without affiliate attribution/);
});

test('affiliate integrity: JSX props whose component appends via= are exempt', () => {
  // These are the shapes translated course pages inherit verbatim from docs/. Flagging them
  // would report ~10 false positives per course page and get the rule switched off.
  const card = [
    '<CourseCard',
    '  title="Apprendre React"',
    '  instructorUrl="https://scrimba.com/@bobziroll"',
    '  href="https://scrimba.com/learn-react-c0e"',
    '/>',
  ].join('\n');
  assert.deepEqual(lint(FR_DOC, card), []);
  assert.deepEqual(lint(FR_DOC, '  url="https://scrimba.com/frontend-path-c0j"'), []);
  assert.deepEqual(lint(FR_DOC, '  itemUrl="https://scrimba.com"'), []);
  assert.deepEqual(lint(FR_DOC, '  { q: "Quoi?", a: "...", sourceUrl: "https://scrimba.com/pricing" },'), []);
});

test('affiliate integrity: a hand-written <a> is never exempt, even on an allowlisted prop', () => {
  const found = lint(FR_DOC, '<a href="https://scrimba.com/learn-react-c0e">Apprendre React</a>');
  assert.equal(found.length, 1);
  assert.match(found[0], /without affiliate attribution/);
  // An <article> is not an <a>: the tag matcher must not trip on it.
  assert.deepEqual(lint(FR_DOC, '<article><CourseCard href="https://scrimba.com/x" /></article>'), []);
});

test('affiliate integrity: tag state closes on a lone ">" line', () => {
  // If the closing `>` did not reset the state, everything after it would count as wrapped.
  const text = [
    '<AffiliateLink',
    '  href="https://scrimba.com/home?pricing"',
    '>Voir</AffiliateLink>',
    '',
    // Deliberately a URL the English source does NOT contain, so this test keeps
    // measuring tag-state closing rather than accidentally hitting the
    // source-parity exemption (a bare URL present in the English original is
    // exempt, because copying it is link parity, not a stripped via= param).
    'Voir [le cours](https://scrimba.com/learn/frontend-not-in-source).',
  ].join('\n');
  const found = lint(FR_DOC, text);
  assert.equal(found.length, 1, 'the markdown link after the closed tag must still be flagged');
  assert.match(found[0], /:5 /);
});

test('affiliate integrity: translation JSON payloads are linted too', () => {
  const found = lint('i18n/fr/code.json', '{ "cta.href": { "message": "https://scrimba.com/home?pricing" } }');
  assert.equal(found.length, 1);
  assert.match(found[0], /without affiliate attribution/);
});

test('affiliate integrity applies to i18n/ only, so English pages behave exactly as before', () => {
  // docs/pricing/scrimba-vs-bootcamps.mdx has referenced scrimba.com in plain prose for
  // months; the rule is scoped to translations (plan invariant 9) and must not touch it.
  assert.deepEqual(lint(EN_DOC, 'See https://scrimba.com/our-pricing for the current rate.'), []);
});

test('affiliate integrity ignores subdomains and bare mentions', () => {
  assert.deepEqual(lint(FR_DOC, 'La documentation vit sur https://docs.scrimba.com/javascript/.'), []);
  assert.deepEqual(lint(FR_DOC, 'Le site officiel est scrimba.com.'), []);
});

// --------------------------------------------------------------- script-scoped punctuation

test('em-dash still fails on Latin-script content', () => {
  for (const rel of [EN_DOC, 'blog/2026-01-02-scrimba-review.mdx', FR_DOC]) {
    const found = lint(rel, 'Scrimba is different — it is interactive.');
    assert.equal(found.length, 1, `expected an em-dash violation in ${rel}`);
    assert.match(found[0], /em-dash/);
  }
});

test('Japanese punctuation passes, including the horizontal bar', () => {
  assert.deepEqual(lint(JA_DOC, 'Scrimbaは対話型の学習プラットフォームです。'), []);
  assert.deepEqual(lint(JA_DOC, 'Scrimbaは違います――実際にコードを書きます。'), []);
  // U+2014 itself is not blacklisted for CJK: it is one keystroke from U+2015 and the
  // distinction is not worth failing a build over.
  assert.deepEqual(lint(JA_DOC, 'Scrimba — 実践的な学習。'), []);
});

test('Arabic comma and semicolon pass', () => {
  assert.deepEqual(lint(AR_DOC, 'سكريمبا تفاعلية، وسريعة؛ وهذا يهم.'), []);
});

test('locale resolution', () => {
  assert.equal(localeForPath(EN_DOC), 'en');
  assert.equal(localeForPath(FR_DOC), 'fr');
  assert.equal(localeForPath('i18n/pt-BR/code.json'), 'pt-BR');
  assert.equal(localeForPath('i18n/locales.config.ts'), 'en');
  // i18n/ root files are infrastructure, not translation payloads.
  assert.equal(isTranslationPath('i18n/locales.config.ts'), false);
  assert.equal(isTranslationPath('i18n/pt-BR/code.json'), true);
  assert.equal(isTranslationPath(EN_DOC), false);
});

// -------------------------------------------------------------- config-driven rule mechanism

/** Plan section 15.2 row 3: enabling a per-language assertion must be a DATA change only. */
test('a forbid rule enabled purely in config fires', () => {
  const config = loadConfig();
  config.locales.de = {
    script: 'latin',
    rules: [
      {
        id: 'de-low-high-quotes',
        type: 'forbid',
        enabled: true,
        pattern: '"',
        message: 'German prose uses „ " quotes',
      },
    ],
  };
  const data = createLinter({ config, affiliateId: 'u42d4986' });
  const rel = 'i18n/de/docusaurus-plugin-content-docs/current/intro.md';
  assert.match(data.lintFile(rel, 'Er sagte "Hallo".')[0], /de-low-high-quotes/);
  assert.deepEqual(data.lintFile(rel, 'Er sagte „Hallo".'.replace('"', '“')), []);
});

test('a require rule enabled purely in config fires', () => {
  const config = loadConfig();
  config.locales.es = {
    script: 'latin',
    rules: [
      {
        id: 'es-opening-inverted-marks',
        type: 'require',
        enabled: true,
        when: '\\?',
        must: '¿',
        message: 'Spanish questions need the opening ¿',
      },
    ],
  };
  const data = createLinter({ config, affiliateId: 'u42d4986' });
  const rel = 'i18n/es/docusaurus-plugin-content-docs/current/faq/index.md';
  assert.match(data.lintFile(rel, 'Vale la pena Scrimba?')[0], /es-opening-inverted-marks/);
  assert.deepEqual(data.lintFile(rel, '¿Vale la pena Scrimba?'), []);
});

test('an enabled but unfinished rule throws instead of silently passing', () => {
  const config = loadConfig();
  config.locales.tr = { script: 'latin', rules: [{ id: 'tr-x', type: 'forbid', enabled: true }] };
  const data = createLinter({ config, affiliateId: 'u42d4986' });
  assert.throws(
    () => data.lintFile('i18n/tr/docusaurus-plugin-content-docs/current/intro.md', 'x'),
    /tr-x/,
  );
});

test('the shipped config disables every per-language rule (this commit adds zero locales)', () => {
  const config = loadConfig();
  for (const [locale, entry] of Object.entries(config.locales)) {
    if (locale.startsWith('$')) continue;
    for (const rule of entry.rules ?? []) {
      assert.equal(rule.enabled, false, `${locale}/${rule.id} must stay disabled until section 13.2 authors it`);
    }
  }
  // English keeps exactly one forbidden mark: the em dash.
  assert.deepEqual(linter.localeRules('en').forbidden, ['—']);
});

// ------------------------------------------------------------------------------ other rules

test('stale Backend hours are still flagged in every locale', () => {
  assert.match(lint(EN_DOC, 'The Backend path is 30.1 hours long.')[0], /stale Backend hours/);
  assert.match(lint(FR_DOC, 'Le parcours Backend dure 39.4 heures.')[0], /stale Backend hours/);
  assert.deepEqual(lint(EN_DOC, 'The Backend path is 36.2 hours long.'), []);
});

test('scan set covers i18n/ and still covers the English surfaces', () => {
  const files = collectFiles();
  assert.ok(files.some((f) => f.startsWith('docs/')), 'docs/ must stay in scope');
  assert.ok(files.some((f) => f.startsWith('blog/')), 'blog/ must stay in scope');
  assert.ok(files.some((f) => f.startsWith('src/')), 'src/ must stay in scope');
  assert.ok(files.some((f) => f.startsWith('i18n/')), 'i18n/ must be in scope (plan issue C9)');
  assert.ok(!files.some((f) => f.includes('.status')), '.status sidecars are generated metadata');
  assert.ok(
    !files.some((f) => f.endsWith('coverage.json') || f.endsWith('translation-status.json')),
    'generated manifests are not linted',
  );
});

test('affiliate integrity: source-parity exemption is narrow', () => {
  // A bare scrimba.com URL that the ENGLISH source also leaves bare is exempt:
  // reproducing it is link parity, and tagging an "official pricing" citation
  // would be dishonest. docs/pricing/index.mdx contains exactly such a link.
  assert.deepEqual(
    lint(FR_DOC, 'Voir [les tarifs](https://scrimba.com/our-pricing).'),
    [],
  );
  // But a DIFFERENT untagged link is still a violation — the exemption must not
  // become a blanket bypass that lets a stripped via= param through.
  assert.equal(
    lint(FR_DOC, 'Voir [le cours](https://scrimba.com/learn/learnreact).').length,
    1,
  );
});
