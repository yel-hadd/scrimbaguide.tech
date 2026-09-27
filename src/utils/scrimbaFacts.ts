/**
 * Scrimba platform facts derived from data/courses.json.
 *
 * The numbers come from data/catalog-facts.json, which scripts/derive-catalog.mjs
 * computes from courses.json (build-data.mjs runs it after `make generate-data`).
 * Importing the full courses.json here put the whole catalog into every chunk
 * that shows a count, so only the derived facts reach the client.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const facts = require('../../data/catalog-facts.json') as {
  totalCourses: number;
  freeCount: number;
  proCount: number;
  pathCount: number;
  categoryCounts: Record<string, number>;
  pathDurations: Record<string, { name: string; duration: string; level: string }>;
  totalContentHours: number;
};

export const totalCourses = facts.totalCourses;
export const freeCount = facts.freeCount;
export const proCount = facts.proCount;
export const pathCount = facts.pathCount;

/** Course count by category (excluding paths) */
export const categoryCounts: Record<string, number> = facts.categoryCounts;

/** Path info: slug -> { name, duration, level } */
export const pathDurations: Record<
  string,
  { name: string; duration: string; level: string }
> = facts.pathDurations;

/**
 * Total hours of educational content across individual courses (paths excluded,
 * since a path bundles courses and would double-count). `duration` is a string
 * like "9.8 hrs"; we pull the leading number. Courses without a duration count
 * as zero, so this is a conservative floor, not an exact figure.
 */
export const totalContentHours = facts.totalContentHours;

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
