import test from 'node:test';
import assert from 'node:assert/strict';

import { blogBreadcrumbTrail, blogBreadcrumbSchema } from '../../src/utils/blogBreadcrumbs.ts';

test('trail is Home > Blog > the post title verbatim (copy slot S24)', () => {
  const trail = blogBreadcrumbTrail('Scrimba Review 2026: Is It Worth It, and Is It Legit?', '/blog/scrimba-review/');
  assert.deepEqual(trail, [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog/' },
    { label: 'Scrimba Review 2026: Is It Worth It, and Is It Legit?', path: '/blog/scrimba-review/' },
  ]);
});

test('post path always ends in a slash', () => {
  assert.equal(blogBreadcrumbTrail('T', '/blog/x').at(-1).path, '/blog/x/');
  assert.equal(blogBreadcrumbTrail('T', 'blog/x/').at(-1).path, '/blog/x/');
});

test('schema is one BreadcrumbList with absolute trailing-slash URLs', () => {
  const schema = blogBreadcrumbSchema(blogBreadcrumbTrail('Post', '/blog/post/'));
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.equal(schema['@id'], 'https://scrimbaguide.tech/blog/post/#breadcrumb');
  assert.deepEqual(schema.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scrimbaguide.tech/' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://scrimbaguide.tech/blog/' },
    { '@type': 'ListItem', position: 3, name: 'Post', item: 'https://scrimbaguide.tech/blog/post/' },
  ]);
  // No nested breadcrumb property: this node is the page's only trail.
  assert.equal(JSON.stringify(schema).includes('"breadcrumb"'), false);
});
