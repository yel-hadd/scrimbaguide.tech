import test from 'node:test';
import assert from 'node:assert/strict';

import { h2s, findProblems, MAX_SHARED } from '../check-heading-uniqueness.mjs';

test('h2s reads H2 lines, strips {#id}, skips code fences and other levels', () => {
  const src = [
    '# Title',
    '## Five challenges in a real Node sandbox {#lesson-feel}',
    '### 1. Getting started',
    '```md',
    '## Not a heading',
    '```',
    '## All free, certificate aside',
  ].join('\n');
  assert.deepEqual(h2s(src), ['Five challenges in a real Node sandbox', 'All free, certificate aside']);
});

test('findProblems flags retired generic labels', () => {
  const problems = findProblems(new Map([['a.mdx', '## Quick answer\n## Prerequisites']]));
  assert.equal(problems.length, 2);
  assert.match(problems[0], /generic H2 "Quick answer"/);
});

test('findProblems flags an H2 shared by more than MAX_SHARED leaves', () => {
  const leaves = new Map(
    Array.from({ length: MAX_SHARED + 1 }, (_, i) => [`leaf${i}.mdx`, '## The project you build']),
  );
  const problems = findProblems(leaves);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /appears on 3 leaves/);
});

test('findProblems accepts distinct, specific headings', () => {
  const leaves = new Map([
    ['vite.mdx', '## Five CHALLENGE.md tasks in a real Node sandbox'],
    ['astro.mdx', '## Building the Astro blog island by island'],
  ]);
  assert.deepEqual(findProblems(leaves), []);
});
