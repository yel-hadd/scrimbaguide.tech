/**
 * Scrimba platform facts derived from data/courses.json.
 * Run `make generate-data` after scraping to refresh.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const courses = require('../../data/courses.json') as Array<{
  category: string;
  access: string;
  isPath: boolean;
  pathInfo?: { name: string; slug: string; duration: string; level: string };
}>;

const nonPaths = courses.filter((c) => !c.isPath);
const paths = courses.filter((c) => c.isPath);

export const totalCourses = courses.length;
export const freeCount = courses.filter((c) => c.access === 'Free').length;
export const proCount = courses.filter((c) => c.access === 'Pro').length;
export const pathCount = paths.length;

/** Course count by category (excluding paths) */
export const categoryCounts: Record<string, number> = {};
for (const c of nonPaths) {
  const cat = c.category || 'other';
  categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
}

/** Path info: slug -> { name, duration, level } */
export const pathDurations: Record<
  string,
  { name: string; duration: string; level: string }
> = {};
for (const p of paths) {
  if (p.pathInfo) {
    pathDurations[p.pathInfo.slug] = {
      name: p.pathInfo.name,
      duration: p.pathInfo.duration,
      level: p.pathInfo.level,
    };
  }
}

/** Human-readable count string, e.g. "87+" or "19" */
export const totalCoursesLabel = `${totalCourses}+`;
export const freeCountLabel = `${freeCount}+`;
