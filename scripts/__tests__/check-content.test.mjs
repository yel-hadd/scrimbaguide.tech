import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractFrontmatter,
  readFrontmatterField,
  checkDescriptionLength,
} from '../check-content.mjs';

test('extractFrontmatter reads the leading --- block and stops at the closing ---', () => {
  const content = `---\ntitle: Foo\ndescription: Bar\n---\n\nBody text here.`;
  assert.equal(extractFrontmatter(content), 'title: Foo\ndescription: Bar');
});

test('extractFrontmatter returns null when a file has no frontmatter', () => {
  assert.equal(extractFrontmatter('Just a plain file with no frontmatter.'), null);
});

test('readFrontmatterField strips wrapping quotes and returns null when absent', () => {
  const fm = 'title: Foo\ndescription: "A quoted description"\ndraft: true';
  assert.equal(readFrontmatterField(fm, 'description'), 'A quoted description');
  assert.equal(readFrontmatterField(fm, 'draft'), 'true');
  assert.equal(readFrontmatterField(fm, 'missing'), null);
});

test('checkDescriptionLength passes a description at or under 160 chars', () => {
  const description = 'x'.repeat(160);
  const content = `---\ntitle: Foo\ndescription: "${description}"\n---\n\nBody.`;
  assert.equal(checkDescriptionLength('docs/foo.mdx', content), null);
});

test('checkDescriptionLength flags a description over 160 chars', () => {
  const description = 'x'.repeat(161);
  const content = `---\ntitle: Foo\ndescription: "${description}"\n---\n\nBody.`;
  const violation = checkDescriptionLength('docs/foo.mdx', content);
  assert.match(violation, /docs\/foo\.mdx:1 description is 161 chars \(max 160\)/);
});

test('checkDescriptionLength skips draft: true pages even when the description is too long', () => {
  const description = 'x'.repeat(200);
  const content = `---\ntitle: Foo\ndraft: true\ndescription: "${description}"\n---\n\nBody.`;
  assert.equal(checkDescriptionLength('docs/foo.mdx', content), null);
});

test('checkDescriptionLength returns null for files with no frontmatter or no description field', () => {
  assert.equal(checkDescriptionLength('src/pages/foo.tsx', 'export default function Foo() { return null; }'), null);
  const content = `---\ntitle: Foo\n---\n\nBody.`;
  assert.equal(checkDescriptionLength('docs/foo.mdx', content), null);
});
