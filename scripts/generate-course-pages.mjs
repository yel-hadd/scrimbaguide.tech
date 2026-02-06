/**
 * Generates individual course MDX pages from data/courses.json
 * into docs/courses/{category}/{docSlug}.mdx
 *
 * Run: node scripts/generate-course-pages.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const DOCS = join(ROOT, 'docs', 'courses');

const courses = JSON.parse(readFileSync(join(DATA, 'courses.json'), 'utf8'));

// Skip learning paths (they have dedicated hand-written pages)
const PATH_SLUGS = new Set([
  'frontend-path-c0j',
  'fullstack-path-c0fullstack',
  'the-backend-developer-path-c0tbi0l98f',
  'the-ai-engineer-path-c02v',
]);

const CATEGORY_LABELS = {
  react: 'React',
  javascript: 'JavaScript',
  ai: 'AI & Machine Learning',
  css: 'CSS & Design',
  backend: 'Backend & Databases',
  python: 'Python',
  typescript: 'TypeScript',
};

const PATH_LINKS = {
  'frontend-developer-path': { label: 'Frontend Developer Path', url: '/docs/paths/frontend-developer-path' },
  'fullstack-developer-path': { label: 'Fullstack Developer Path', url: '/docs/paths/fullstack-developer-path' },
  'backend-developer-path': { label: 'Backend Developer Path', url: '/docs/paths/backend-developer-path' },
  'ai-engineer-path': { label: 'AI Engineer Path', url: '/docs/paths/ai-engineer-path' },
};

let generated = 0;
let skipped = 0;

for (const course of courses) {
  // Skip learning paths
  if (PATH_SLUGS.has(course.scrimbaSlug)) {
    skipped++;
    continue;
  }

  const dir = join(DOCS, course.category);
  mkdirSync(dir, { recursive: true });

  const filePath = join(dir, `${course.docSlug}.mdx`);

  // Skip if hand-written hub page (index.mdx)
  if (course.docSlug === 'index') {
    skipped++;
    continue;
  }

  // Build clean title
  const cleanTitle = course.title
    .replace(/^(Free |Tutorial: |Free Tutorial: |Interactive Tutorial: )/i, '')
    .replace(/\s+in this (free |interactive |hands-on )*(course|tutorial).*/i, '')
    .replace(/\s+with (this|our).*$/i, '')
    .split(':')[0]
    .trim();

  const pageTitle = `${cleanTitle} on Scrimba: Course Review (2026)`;
  const description = course.description || `Review of ${cleanTitle} on Scrimba. ${course.duration || ''} ${course.level || ''} course.`;

  // Build module table
  let moduleSection = '';
  if (course.modules && course.modules.length > 0) {
    const rows = course.modules
      .map(m => `| ${m.name} | ${m.duration} | ${m.totalLessons} |`)
      .join('\n');
    moduleSection = `
## Module Breakdown

| Module | Duration | Lessons |
|---|---|---|
${rows}
`;
  }

  // Build path membership links
  let pathSection = '';
  if (course.pathMembership && course.pathMembership.length > 0) {
    const links = course.pathMembership
      .map(p => PATH_LINKS[p])
      .filter(Boolean)
      .map(p => `- [${p.label}](${p.url})`)
      .join('\n');
    if (links) {
      pathSection = `
## Part of These Learning Paths

${links}
`;
    }
  }

  // Build related courses
  let relatedSection = '';
  if (course.relatedCourses && course.relatedCourses.length > 0) {
    const links = course.relatedCourses
      .slice(0, 3)
      .map(r => {
        let rTitle = r.title.split(':')[0].trim();
         if (rTitle === 'Tutorial' || rTitle === 'Free Tutorial') {
           // Convert kebab-case slug to Title Case
           rTitle = r.docSlug
             .split('-')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
        }
        return `- [${rTitle}](/docs/courses/${r.category}/${r.docSlug})`;
      })
      .join('\n');
    relatedSection = `
## Related Courses

${links}
`;
  }

  const categoryLabel = CATEGORY_LABELS[course.category] || course.category;
  const keywords = [
    `scrimba ${cleanTitle.toLowerCase()}`,
    `${cleanTitle.toLowerCase()} course`,
    `scrimba ${course.category} course`,
  ].join(', ');

  // Smart truncate function — also fixes already-truncated source descriptions
  const truncate = (str, n) => {
    let result = str;
    if (result.length > n) {
      result = result.substr(0, n - 1);
    }
    // If description doesn't end with sentence punctuation, it was likely
    // truncated by the scraper — trim back to last complete word and add ellipsis.
    if (result && !/[.!?]$/.test(result)) {
      result = result.substr(0, result.lastIndexOf(' '));
      result = result.replace(/[,;:\s]+$/, '') + '...';
    }
    return result;
  };

  const safeTitle = pageTitle.replace(/"/g, '\\"');
  const safeDesc = truncate(description.replace(/"/g, '\\"'), 160);

  const content = `---
title: "${safeTitle}"
description: "${safeDesc}"
keywords: [${keywords}]
---

import AffiliateLink from '@site/src/components/AffiliateLink';
import CourseCard from '@site/src/components/CourseCard';
import PricingCTA from '@site/src/components/PricingCTA';
import FAQAccordion from '@site/src/components/FAQAccordion';
import CourseSchema from '@site/src/components/CourseSchema';

# ${cleanTitle} on Scrimba

<CourseCard
  title="${cleanTitle.replace(/"/g, '\\"')}"
  duration="${course.duration || 'Available'}"
  difficulty="${course.level || 'Intermediate'}"
  access="${course.access}"
  ${course.modules.length > 0 ? `modules={${course.modules.length}}` : ''}
  href="${course.scrimbaUrl}"
  description="${(course.description || '').replace(/"/g, '\\"').substring(0, 200)}"
/>

<CourseSchema
  name="${cleanTitle.replace(/"/g, '\\"')}"
  description="${safeDesc}"
  url="https://scrimba.com/${course.scrimbaSlug}"
  duration="${course.duration || ''}"
  difficulty="${course.level || 'Intermediate'}"
  access="${course.access}"
  keywords={[${keywords.split(', ').map(k => `"${k}"`).join(', ')}]}
/>

## About This Course

${course.description || `Learn ${cleanTitle} through Scrimba's interactive video format. Pause any lesson and edit the code directly in your browser.`}

- **Duration:** ${course.duration || 'Available on Scrimba'}
- **Level:** ${course.level || 'Intermediate'}
- **Access:** ${course.access === 'Free' ? 'Free (no subscription required)' : '[Scrimba Pro](/docs/pricing/) required'}
${moduleSection}
## Who Is This Course For?

${course.level === 'Beginner' ? 'This course is designed for complete beginners. No prior experience is required.' : course.level === 'Advanced' ? 'This course is for experienced developers looking to deepen their skills. Prior knowledge of the fundamentals is recommended.' : 'This course is for developers with some experience who want to build practical skills.'}
${pathSection}
${relatedSection}
## Related Pages

- [${categoryLabel} Courses](/docs/courses/${course.category}/)
- [All Courses](/docs/courses/)
- [Scrimba Pricing](/docs/pricing/)${course.access === 'Pro' ? ' | [Pro vs Free](/docs/pricing/pro-vs-free)' : ''}
- [Scrimba Review 2026](/blog/scrimba-review)

<FAQAccordion items={[
  { q: "Is this course free?", a: "${course.access === 'Free' ? 'Yes! This course is available for free without a Scrimba Pro subscription.' : 'No. This course requires a Scrimba Pro subscription. See our pricing guide for current rates and discounts.'}" },
  { q: "How long does this course take?", a: "The course contains ${course.duration || 'several hours'} of interactive content. Most learners complete it in 1-2 weeks at a moderate pace." },
  { q: "What will I be able to build?", a: "After completing this course, you will have practical experience building real projects using ${cleanTitle.split(' ').slice(0, 3).join(' ')} concepts." },
]} />

${course.access === 'Pro' ? `<PricingCTA
  title="Start this course"
  subtitle="Get access to ${cleanTitle} and 87+ more courses with Scrimba Pro."
/>` : `<AffiliateLink href="${course.scrimbaUrl}" variant="button">
  Start ${cleanTitle} for Free
</AffiliateLink>`}
`;

  writeFileSync(filePath, content);
  generated++;
}

console.log(`✓ Generated ${generated} course pages`);
console.log(`  Skipped ${skipped} (paths or special pages)`);
console.log(`  Output: docs/courses/{category}/{slug}.mdx`);
