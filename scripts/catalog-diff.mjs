#!/usr/bin/env node
/**
 * scripts/catalog-diff.mjs <ours.json> <live.json>
 *
 * Compares two data/courses.json-shaped arrays by scrimbaSlug: duration,
 * lessonCount, level, access, instructor, module count and title. An
 * instructor or title change at the same slug is flagged `possible_swap`
 * (the Learn Python trap: Scrimba reusing a slug for a different course).
 * Lists new and removed slugs. Network-free: it only reads the two files
 * given on argv.
 *
 * Prints [{slug, course, field, ours, live}] to stdout.
 */
import { readFileSync } from 'fs';

const FIELDS = ['duration', 'lessonCount', 'level', 'access', 'instructor', 'title'];

export function moduleCount(course) {
  return Array.isArray(course?.modules) ? course.modules.length : null;
}

function courseName(course, slug) {
  return course?.cleanName ?? course?.title ?? slug;
}

export function diffCourses(ours, live) {
  const oursBySlug = new Map((ours ?? []).map((c) => [c.scrimbaSlug, c]));
  const liveBySlug = new Map((live ?? []).map((c) => [c.scrimbaSlug, c]));
  const rows = [];

  for (const [slug, o] of oursBySlug) {
    const l = liveBySlug.get(slug);
    if (!l) {
      rows.push({ slug, course: courseName(o, slug), field: 'removed', ours: true, live: false });
      continue;
    }

    for (const field of FIELDS) {
      const ov = o[field] ?? null;
      const lv = l[field] ?? null;
      if (ov !== lv) {
        rows.push({ slug, course: courseName(o, slug), field, ours: ov, live: lv });
      }
    }

    const om = moduleCount(o);
    const lm = moduleCount(l);
    if (om !== lm) {
      rows.push({ slug, course: courseName(o, slug), field: 'moduleCount', ours: om, live: lm });
    }

    const instructorChanged = (o.instructor ?? null) !== (l.instructor ?? null);
    const titleChanged = (o.title ?? null) !== (l.title ?? null);
    if (instructorChanged || titleChanged) {
      rows.push({
        slug,
        course: courseName(o, slug),
        field: 'possible_swap',
        ours: `${o.instructor ?? '?'} / ${o.title ?? '?'}`,
        live: `${l.instructor ?? '?'} / ${l.title ?? '?'}`,
      });
    }
  }

  for (const [slug, l] of liveBySlug) {
    if (!oursBySlug.has(slug)) {
      rows.push({ slug, course: courseName(l, slug), field: 'new', ours: false, live: true });
    }
  }

  return rows;
}

function main() {
  const [oursPath, livePath] = process.argv.slice(2);
  if (!oursPath || !livePath) {
    console.error('usage: node scripts/catalog-diff.mjs <ours.json> <live.json>');
    process.exit(1);
  }
  const ours = JSON.parse(readFileSync(oursPath, 'utf8'));
  const live = JSON.parse(readFileSync(livePath, 'utf8'));
  const rows = diffCourses(ours, live);
  console.log(JSON.stringify(rows, null, 1));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
