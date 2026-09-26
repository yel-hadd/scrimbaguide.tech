import test from 'node:test';
import assert from 'node:assert/strict';
import { diffCourses, moduleCount } from '../catalog-diff.mjs';

// Network-free: every case below is an in-memory fixture, never a live fetch.

function course(overrides = {}) {
  return {
    scrimbaSlug: 'learn-react-c0e',
    cleanName: 'Learn React',
    title: 'Learn React | Scrimba',
    duration: '5 hrs',
    lessonCount: 100,
    level: 'Beginner',
    access: 'Pro',
    instructor: 'Bob Ziroll',
    modules: [{ name: 'Intro' }, { name: 'Hooks' }],
    ...overrides,
  };
}

test('identical courses produce no rows', () => {
  const ours = [course()];
  const live = [course()];
  assert.deepEqual(diffCourses(ours, live), []);
});

test('flags a changed scalar field with ours/live values', () => {
  const ours = [course({ duration: '5 hrs' })];
  const live = [course({ duration: '6.5 hrs' })];
  const rows = diffCourses(ours, live);
  const row = rows.find((r) => r.field === 'duration');
  assert.ok(row, 'expected a duration row');
  assert.equal(row.ours, '5 hrs');
  assert.equal(row.live, '6.5 hrs');
  assert.equal(row.slug, 'learn-react-c0e');
});

test('flags a module count change', () => {
  const ours = [course({ modules: [{ name: 'Intro' }] })];
  const live = [course({ modules: [{ name: 'Intro' }, { name: 'Hooks' }, { name: 'Router' }] })];
  const rows = diffCourses(ours, live);
  const row = rows.find((r) => r.field === 'moduleCount');
  assert.ok(row);
  assert.equal(row.ours, 1);
  assert.equal(row.live, 3);
});

test('moduleCount is null when modules is missing or not an array', () => {
  assert.equal(moduleCount({}), null);
  assert.equal(moduleCount({ modules: null }), null);
  assert.equal(moduleCount({ modules: [{}, {}] }), 2);
});

test('an instructor or title change at the same slug is flagged possible_swap (the Learn Python trap)', () => {
  const ours = [course({ instructor: 'Bob Ziroll', title: 'Learn React | Scrimba' })];
  const live = [course({ instructor: 'Someone Else', title: 'Learn Something Different | Scrimba' })];
  const rows = diffCourses(ours, live);
  const swap = rows.find((r) => r.field === 'possible_swap');
  assert.ok(swap, 'expected a possible_swap row');
  assert.match(swap.ours, /Bob Ziroll/);
  assert.match(swap.live, /Someone Else/);
});

test('instructor-only change alone triggers possible_swap, not a silent pass', () => {
  const ours = [course({ instructor: 'Bob Ziroll' })];
  const live = [course({ instructor: 'Nathan Sebhastian' })];
  const rows = diffCourses(ours, live);
  assert.ok(rows.some((r) => r.field === 'possible_swap'));
  assert.ok(rows.some((r) => r.field === 'instructor'));
});

test('a slug present only in ours is reported removed', () => {
  const ours = [course({ scrimbaSlug: 'gone-c0x', cleanName: 'Gone Course' })];
  const live = [];
  const rows = diffCourses(ours, live);
  assert.deepEqual(rows, [{ slug: 'gone-c0x', course: 'Gone Course', field: 'removed', ours: true, live: false }]);
});

test('a slug present only in live is reported new', () => {
  const ours = [];
  const live = [course({ scrimbaSlug: 'fresh-c0y', cleanName: 'Fresh Course' })];
  const rows = diffCourses(ours, live);
  assert.deepEqual(rows, [{ slug: 'fresh-c0y', course: 'Fresh Course', field: 'new', ours: false, live: true }]);
});

test('empty inputs produce an empty diff', () => {
  assert.deepEqual(diffCourses([], []), []);
  assert.deepEqual(diffCourses(undefined, undefined), []);
});

test('level and access changes are both reported independently', () => {
  const ours = [course({ level: 'Beginner', access: 'Free' })];
  const live = [course({ level: 'Intermediate', access: 'Pro' })];
  const rows = diffCourses(ours, live);
  const fields = rows.map((r) => r.field).sort();
  assert.deepEqual(fields, ['access', 'level']);
});
