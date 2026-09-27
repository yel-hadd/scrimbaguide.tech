import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The homepage's counted CTAs are identified in GA4 only by their
// `location` prop (cta_location). Renaming or dropping one silently splits
// or ends a GA4 series, and check:content does not read .tsx files. This
// test pins the set so a change to it is a deliberate, reviewed edit
// (update this list and scripts/analytics/tracking.json together).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.resolve(__dirname, '..', '..', 'src', 'pages', 'index.tsx');

const EXPECTED_LOCATIONS = [
  'home-final-cta',
  'home-hero-poster',
  'home-hero-primary',
  'home-pricing-section',
  'home-scrim-explainer',
];

const source = fs.readFileSync(HOME, 'utf8');

test('homepage CTA locations match the pinned inventory', () => {
  const found = [...source.matchAll(/\blocation=(["'])([^"']+)\1/g)].map((m) => m[2]);
  assert.deepEqual([...found].sort(), EXPECTED_LOCATIONS, 'location set changed');
  assert.equal(new Set(found).size, found.length, 'a location value is used twice');
});

test('every homepage location prop is a string literal', () => {
  // location={...} would hide the value from this test and from review.
  assert.deepEqual([...source.matchAll(/\blocation=\{/g)].map((m) => m.index), []);
});

test('every AffiliateLink and ScrimPoster on the homepage carries a location', () => {
  const tags = [...source.matchAll(/<(AffiliateLink|ScrimPoster)\b([^>]*)>/g)];
  assert.ok(tags.length > 0, 'no AffiliateLink or ScrimPoster found');
  for (const [, name, attrs] of tags) {
    assert.match(attrs, /\blocation=/, `<${name}> without a location prop`);
  }
});
