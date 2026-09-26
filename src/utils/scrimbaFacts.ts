/**
 * Scrimba platform facts derived from data/courses.json.
 * Run `make generate-data` after scraping to refresh.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const courses = require('../../data/courses.json') as Array<{
  category: string;
  access: string;
  isPath: boolean;
  duration?: string;
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

/**
 * Total hours of educational content across individual courses (paths excluded,
 * since a path bundles courses and would double-count). `duration` is a string
 * like "9.8 hrs"; we pull the leading number. Courses without a duration count
 * as zero, so this is a conservative floor, not an exact figure.
 */
export const totalContentHours = nonPaths.reduce((sum, c) => {
  const match = /([\d.]+)/.exec(c.duration ?? '');
  return sum + (match ? parseFloat(match[1]) : 0);
}, 0);

/** Conservative label, floored to the nearest 50, e.g. "450+ hrs". */
export const totalContentHoursLabel = `${Math.floor(totalContentHours / 50) * 50}+ hrs`;

/** Human-readable count string, e.g. "87+" or "19" */
export const totalCoursesLabel = `${totalCourses}+`;
export const freeCountLabel = `${freeCount}+`;

/**
 * Floor(min) and floor(max) path duration in hours, derived from pathInfo.duration
 * across the four career paths (e.g. 11 to 108). Used so the homepage FAQ's hour
 * range tracks the catalog instead of being hardcoded.
 */
const pathDurationHours = Object.values(pathDurations)
  .map((p) => parseFloat(/([\d.]+)/.exec(p.duration)?.[1] ?? '0'))
  .filter((n) => n > 0);
export const pathDurationHoursRange = {
  min: Math.floor(Math.min(...pathDurationHours)),
  max: Math.floor(Math.max(...pathDurationHours)),
};
