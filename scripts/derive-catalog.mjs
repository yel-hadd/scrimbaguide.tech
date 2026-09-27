/**
 * Derives the two small catalog files the client bundle needs from
 * data/courses.json, so the full catalog (about 117KB with module lists) stays
 * out of every chunk that only wants a count or a slug.
 *
 * Produces:
 *   data/catalog-facts.json – site-wide counts and totals read by src/utils/scrimbaFacts.ts
 *   data/catalog-lite.json  – per-course slugs and links read by src/content/relatedGuidesMap.ts
 *
 * Both files are generated: never edit them by hand. This script is a pure
 * function of data/courses.json. It never reads output/ and never writes
 * courses.json, so running it is safe at any time. scripts/build-data.mjs
 * calls it after writing courses.json, and `npm run check:content` fails when
 * either committed file no longer matches what courses.json derives to.
 *
 * Usage: node scripts/derive-catalog.mjs   (CATALOG_DATA_DIR overrides data/)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export const FACTS_FILE = 'catalog-facts.json';
export const LITE_FILE = 'catalog-lite.json';

/**
 * Same computation src/utils/scrimbaFacts.ts ran over the full catalog before
 * this file existed. Key order is insertion order, as it was there.
 */
export function deriveFacts(courses) {
  const nonPaths = courses.filter((c) => !c.isPath);
  const paths = courses.filter((c) => c.isPath);

  const categoryCounts = {};
  for (const c of nonPaths) {
    const cat = c.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  const pathDurations = {};
  for (const p of paths) {
    if (p.pathInfo) {
      pathDurations[p.pathInfo.slug] = {
        name: p.pathInfo.name,
        duration: p.pathInfo.duration,
        level: p.pathInfo.level,
      };
    }
  }

  // Paths bundle courses, so only individual courses count toward hours.
  const totalContentHours = nonPaths.reduce((sum, c) => {
    const match = /([\d.]+)/.exec(c.duration ?? '');
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  return {
    totalCourses: courses.length,
    freeCount: courses.filter((c) => c.access === 'Free').length,
    proCount: courses.filter((c) => c.access === 'Pro').length,
    pathCount: paths.length,
    categoryCounts,
    pathDurations,
    totalContentHours,
  };
}

/** The fields the related-guides fallback reads, nothing else. */
export function deriveLite(courses) {
  return courses.map((c) => {
    const row = {
      cleanName: c.cleanName,
      docSlug: c.docSlug,
      category: c.category,
      isPath: c.isPath,
    };
    if (c.pathMembership !== undefined) row.pathMembership = c.pathMembership;
    if (c.relatedCourses !== undefined) {
      row.relatedCourses = c.relatedCourses.map((rc) => ({ docSlug: rc.docSlug, category: rc.category }));
    }
    return row;
  });
}

export function deriveCatalog(courses) {
  return { facts: deriveFacts(courses), lite: deriveLite(courses) };
}

/** The exact bytes written to disk, so the staleness gate can compare strings. */
export function serialize(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

/** Returns the committed files that differ from what courses.json derives to. */
export function staleCatalogFiles(dataDir) {
  const courses = JSON.parse(readFileSync(join(dataDir, 'courses.json'), 'utf8'));
  const { facts, lite } = deriveCatalog(courses);
  const stale = [];
  for (const [file, value] of [[FACTS_FILE, facts], [LITE_FILE, lite]]) {
    let current = null;
    try {
      current = readFileSync(join(dataDir, file), 'utf8');
    } catch {
      // missing counts as stale
    }
    if (current !== serialize(value)) stale.push(file);
  }
  return stale;
}

export function writeDerivedCatalog(dataDir, courses) {
  const list = courses ?? JSON.parse(readFileSync(join(dataDir, 'courses.json'), 'utf8'));
  const { facts, lite } = deriveCatalog(list);
  writeFileSync(join(dataDir, FACTS_FILE), serialize(facts));
  writeFileSync(join(dataDir, LITE_FILE), serialize(lite));
  return { facts, lite };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dataDir = process.env.CATALOG_DATA_DIR || join(ROOT, 'data');
  const { facts, lite } = writeDerivedCatalog(dataDir);
  console.log(`✓ Wrote ${FACTS_FILE} (${facts.totalCourses} courses, ${facts.pathCount} paths) and ${LITE_FILE} (${lite.length} rows)`);
}
