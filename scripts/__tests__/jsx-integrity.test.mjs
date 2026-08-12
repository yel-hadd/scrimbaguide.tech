/**
 * scripts/jsx-integrity.mjs must FAIL a deliberately corrupted translation
 * (I18N-PLAN.md section 4 Phase 5 item 9).
 *
 * Every case below is a real defect a language model produces when it is asked to translate
 * MDX: it localizes a URL, renames a component to something that "reads better", helpfully
 * translates the identifiers in a code sample, or rewrites a heading anchor to match the
 * translated heading text. All of them pass a native-speaker read-through, and all of them
 * either break the build, break a link, or stop the affiliate param from being sent.
 *
 * The clean-translation case matters just as much: a checker that fails everything is a
 * checker the pipeline learns to ignore.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkIntegrity, extractFences, anchorSet, frozenPropMultiset } from '../jsx-integrity.mjs';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'jsx-integrity.mjs');

const SOURCE = `---
title: Is Scrimba Worth It?
slug: /is-scrimba-worth-it
sidebar_position: 3
image: /img/og/worth-it.png
---

import AffiliateLink from '@site/src/components/AffiliateLink';

## What you get {#what-you-get}

Scrimba Pro unlocks every course. Run \`npm install\` to follow along locally.

<AffiliateLink href="https://scrimba.com/learn-react-c0e" label="Start Learn React">
  Try the course
</AffiliateLink>

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Add one</button>;
}
\`\`\`

## Verdict {#verdict}

<PricingCTA to="/docs/pricing/" verdict="Worth it for hands-on learners" />
`;

/** A faithful Spanish translation: prose changed, structure untouched. */
const GOOD = `---
title: "¿Merece la pena Scrimba?"
slug: /is-scrimba-worth-it
sidebar_position: 3
image: /img/og/worth-it.png
---

import AffiliateLink from '@site/src/components/AffiliateLink';

## Qué incluye {#what-you-get}

Scrimba Pro desbloquea todos los cursos. Ejecuta \`npm install\` para seguir el curso en local.

<AffiliateLink href="https://scrimba.com/learn-react-c0e" label="Empieza Learn React">
  Prueba el curso
</AffiliateLink>

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Add one</button>;
}
\`\`\`

## Veredicto {#verdict}

<PricingCTA to="/docs/pricing/" verdict="Merece la pena si aprendes practicando" />
`;

test('a faithful translation passes', () => {
  assert.deepEqual(checkIntegrity(SOURCE, GOOD), []);
});

test('extractors see what they are supposed to see', () => {
  assert.equal(extractFences(SOURCE).length, 1);
  assert.deepEqual([...anchorSet(SOURCE)].sort(), ['verdict', 'what-you-get']);
  // The <button onClick> inside the fence must not leak into prop scanning.
  assert.ok(!frozenPropMultiset(SOURCE).has('onClick=/'));
});

const corruptions = [
  {
    name: 'translated href (affiliate link silently stops paying)',
    type: 'frozen-prop',
    mutate: (s) => s.replace('href="https://scrimba.com/learn-react-c0e"', 'href="https://scrimba.com/aprende-react-c0e"'),
  },
  {
    name: 'translated internal route (broken link, build throws at the barrier)',
    type: 'frozen-prop',
    mutate: (s) => s.replace('to="/docs/pricing/"', 'to="/es/docs/precios/"'),
  },
  {
    name: 'renamed component',
    type: 'component',
    mutate: (s) => s.replace(/PricingCTA/g, 'LlamadaPrecios'),
  },
  {
    name: 'dropped <AffiliateLink> wrapper',
    type: 'component',
    mutate: (s) => s
      .replace(/<AffiliateLink[^>]*>\n/, '')
      .replace('</AffiliateLink>', ''),
  },
  {
    name: 'translated identifiers inside a fenced code block',
    type: 'code-fence-content',
    mutate: (s) => s.replace('Add one', 'Añadir uno').replace('function Counter', 'function Contador'),
  },
  {
    name: 'anchor rewritten to match the translated heading',
    type: 'anchor',
    mutate: (s) => s.replace('{#what-you-get}', '{#que-incluye}'),
  },
  {
    name: 'translated frontmatter slug (points every hreflang alternate at a 404)',
    type: 'frontmatter',
    mutate: (s) => s.replace('slug: /is-scrimba-worth-it', 'slug: /merece-la-pena-scrimba'),
  },
  {
    name: 'translated import specifier',
    type: 'import',
    mutate: (s) => s.replace("import AffiliateLink from", "import EnlaceAfiliado from"),
  },
  {
    name: 'translated inline code',
    type: 'inline-code',
    mutate: (s) => s.replace('`npm install`', '`instalar npm`'),
  },
];

for (const c of corruptions) {
  test(`FAILS a corrupted fixture: ${c.name}`, () => {
    const violations = checkIntegrity(SOURCE, c.mutate(GOOD));
    assert.ok(violations.length > 0, 'expected at least one violation');
    assert.ok(
      violations.some((v) => v.type === c.type),
      `expected a '${c.type}' violation, got ${JSON.stringify(violations.map((v) => v.type))}`,
    );
  });
}

test('the CLI exits non-zero on a corrupted file and zero on a clean one', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsx-integrity-'));
  const src = path.join(dir, 'source.mdx');
  const good = path.join(dir, 'good.mdx');
  const bad = path.join(dir, 'bad.mdx');
  fs.writeFileSync(src, SOURCE);
  fs.writeFileSync(good, GOOD);
  fs.writeFileSync(bad, corruptions[0].mutate(GOOD));

  execFileSync(process.execPath, [SCRIPT, src, good], { encoding: 'utf8' });

  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT, src, bad], { encoding: 'utf8', stdio: 'pipe' }),
    (err) => err.status === 1,
  );
  fs.rmSync(dir, { recursive: true, force: true });
});
