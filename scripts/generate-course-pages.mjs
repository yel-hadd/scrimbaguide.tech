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
const totalCoursesLabel = `${courses.length}+`;

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

const PRACTICE_LINKS = {
  react: [
    { label: 'Practice React Hooks', url: '/docs/practice/practice-react-hooks' },
    { label: 'Practice React Projects', url: '/docs/practice/practice-react-projects' },
  ],
  javascript: [
    { label: 'Practice JavaScript Arrays', url: '/docs/practice/practice-javascript-arrays' },
    { label: 'Practice API Calls', url: '/docs/practice/practice-api-calls' },
  ],
  css: [
    { label: 'Practice CSS Grid', url: '/docs/practice/practice-css-grid' },
    { label: 'Practice Flexbox', url: '/docs/practice/practice-flexbox' },
    { label: 'Practice Tailwind CSS', url: '/docs/practice/practice-tailwind-css' },
  ],
  ai: [
    { label: 'Practice AI Engineering', url: '/docs/practice/practice-ai-engineering' },
    { label: 'Practice API Calls', url: '/docs/practice/practice-api-calls' },
  ],
  typescript: [
    { label: 'Practice TypeScript', url: '/docs/practice/practice-typescript' },
    { label: 'Practice React Hooks', url: '/docs/practice/practice-react-hooks' },
  ],
  backend: [
    { label: 'Practice API Calls', url: '/docs/practice/practice-api-calls' },
    { label: 'Practice JavaScript Arrays', url: '/docs/practice/practice-javascript-arrays' },
  ],
  python: [
    { label: 'Practice API Calls', url: '/docs/practice/practice-api-calls' },
  ],
};

const COMPARISON_LINKS = [
  { label: 'Scrimba vs Codecademy', url: '/docs/comparisons/scrimba-vs-codecademy' },
  { label: 'Scrimba vs Udemy', url: '/docs/comparisons/scrimba-vs-udemy' },
  { label: 'All Comparisons', url: '/docs/comparisons/' },
];

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

  // Build a clean, short course name from the (often verbose) scraped title.
  // Cut marketing tails ("in this ... course", " - A 13-hour ...", "lead by X"),
  // anything after a colon, then cap length at a word boundary as a safety net.
  let cleanTitle = course.title
    .replace(/^(Free |Tutorial: |Free Tutorial: |Interactive Tutorial: )/i, '')
    .replace(/\s+in this\b[^:]*?\b(course|tutorial)\b.*$/i, '')
    .replace(/\s+[–-]\s+.*$/, '')
    .replace(/\s+(lead|taught|created)\s+by\b.*$/i, '')
    .replace(/\s+with (this|our)\b.*$/i, '')
    .split(':')[0]
    .replace(/[.\s]+$/, '')
    .trim();
  if (cleanTitle.length > 44) {
    cleanTitle = cleanTitle.slice(0, 44).replace(/\s+\S*$/, '').trim();
  }
  // Drop a dangling trailing conjunction/preposition left by truncation.
  cleanTitle = cleanTitle.replace(/[\s,]+(?:and|or|&|with|the|a|an|to|of|in|on|for)$/i, '').replace(/[\s,]+$/, '').trim();

  // Evergreen SEO title (no year-stamp); the sidebar uses the short course name.
  const pageTitle = `${cleanTitle}: Scrimba Review`;
  const description = course.description || `Review of ${cleanTitle} on Scrimba. ${course.duration || ''} ${course.level || ''} course.`;

  // Build the visual curriculum (module-by-module breakdown).
  let moduleSection = '';
  if (course.modules && course.modules.length > 0) {
    const moduleData = JSON.stringify(
      course.modules.map(m => ({ name: m.name, duration: m.duration, lessons: m.totalLessons })),
    );
    moduleSection = `
## Course curriculum

<CourseCurriculum modules={${moduleData}} title="" />
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
  const sanitize = (s) => s.replace(/[\[\]]/g, '');
  const keywords = [
    `scrimba ${sanitize(cleanTitle.toLowerCase())}`,
    `${sanitize(cleanTitle.toLowerCase())} course`,
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

  // Build instructor section
  let instructorSection = '';
  if (course.instructor) {
    instructorSection = `
### Instructor

This course is taught by **${course.instructor}**, an experienced educator on the Scrimba platform.
`;
  }

  // Build projects section
  let projectsSection = '';
  if (course.projects && course.projects.length > 0) {
    const projectList = course.projects.map(p => `- ${p}`).join('\n');
    projectsSection = `
## What You'll Build

${projectList}

These hands-on projects reinforce what you learn and give you portfolio-ready work to show employers.
`;
  }

  // Build prerequisites section
  let prerequisitesSection = '';
  const levelPrereqs = {
    Beginner: 'No prior programming experience is required. A web browser and willingness to learn are all you need.',
    Intermediate: `Basic knowledge of ${course.category === 'react' ? 'HTML, CSS, and JavaScript' : course.category === 'ai' ? 'JavaScript and basic API concepts' : course.category === 'backend' ? 'JavaScript fundamentals' : course.category === 'typescript' ? 'JavaScript' : 'HTML and CSS'} is recommended before starting this course.`,
    Advanced: `Working knowledge of ${course.category === 'react' ? 'React fundamentals (components, state, props)' : course.category === 'ai' ? 'JavaScript, APIs, and basic AI/ML concepts' : course.category === 'backend' ? 'Node.js and basic server concepts' : course.category === 'typescript' ? 'TypeScript basics and JavaScript' : 'the core technology'} is expected.`,
  };
  prerequisitesSection = `
## Prerequisites

${levelPrereqs[course.level] || levelPrereqs['Intermediate']}
`;

  // Build varied FAQ answers
  const freeAnswer = course.access === 'Free'
    ? 'Yes! This course is completely free. No credit card or Scrimba Pro subscription is needed to start learning.'
    : `This course requires a [Scrimba Pro](/docs/pricing/) subscription. Pro gives you access to ${totalCoursesLabel} courses, a certificate of completion, and access to the Discord community. Check the [pricing page](/docs/pricing/) for current rates.`;

  const durationAnswer = course.duration
    ? `The course contains ${course.duration} of interactive screencasts. Since you can pause and code along at your own pace, most learners finish in ${parseFloat(course.duration) > 10 ? '2-4 weeks' : parseFloat(course.duration) > 4 ? '1-2 weeks' : 'a few days'} of regular practice.`
    : 'The course is self-paced, so you can complete it as quickly or slowly as you like. Most learners finish within 1-2 weeks.';

  const buildAnswer = course.projects && course.projects.length > 0
    ? `You will build real projects including: ${course.projects.slice(0, 3).join(', ')}. These projects teach you practical skills you can apply immediately.`
    : `You will build practical projects using ${cleanTitle.split(' ').slice(0, 3).join(' ')} concepts. Scrimba's interactive format lets you modify the instructor's code directly in the browser.`;

  const totalLessons = course.modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const totalLessonsStr = totalLessons > 0 ? ` across ${totalLessons} interactive screencasts` : '';

  const content = `---
title: "${safeTitle}"
description: "${safeDesc}"
keywords: [${keywords}]
---

import AffiliateLink from '@site/src/components/AffiliateLink';
import CourseCard from '@site/src/components/CourseCard';
import PricingCTA from '@site/src/components/PricingCTA';
import FAQAccordion from '@site/src/components/FAQAccordion';
import CourseSchema from '@site/src/components/CourseSchema';${course.modules.length > 0 ? `\nimport CourseCurriculum from '@site/src/components/CourseCurriculum';` : ''}

# ${cleanTitle} on Scrimba

<CourseCard
  title="${cleanTitle.replace(/"/g, '\\"')}"
  duration="${course.duration || 'Available'}"
  difficulty="${course.level || 'Intermediate'}"
  access="${course.access}"
  ${course.instructor ? `instructor="${course.instructor.replace(/"/g, '\\"')}"` : ''}
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
  ${course.modules.length > 0 ? `modules={${JSON.stringify(course.modules.map(m => ({ name: m.name, duration: m.duration, lessons: m.totalLessons })))}}` : ''}
/>

## About This Course

${course.description || `Learn ${cleanTitle} through Scrimba's interactive video format. Pause any lesson and edit the code directly in your browser.`}

This ${course.level || 'intermediate'}-level course covers ${course.duration || 'hours'} of content${totalLessonsStr}. ${course.access === 'Free' ? 'It is available for free — no subscription required.' : 'A [Scrimba Pro](/docs/pricing/) subscription is required for full access.'}

- **Duration:** ${course.duration || 'Available on Scrimba'}
- **Level:** ${course.level || 'Intermediate'}
- **Access:** ${course.access === 'Free' ? 'Free (no subscription required)' : '[Scrimba Pro](/docs/pricing/) required'}
${course.modules.length > 0 ? `- **Modules:** ${course.modules.length}` : ''}
${totalLessons > 0 ? `- **Total Lessons:** ${totalLessons}` : ''}
${instructorSection}${moduleSection}${projectsSection}${prerequisitesSection}
## Who Is This Course For?

${course.level === 'Beginner' ? `This course is designed for complete beginners who want to learn ${cleanTitle.split(' ').slice(0, 2).join(' ')} from scratch. No prior experience is required — you will start from the very basics and build up to real projects.` : course.level === 'Advanced' ? `This course is for experienced developers looking to deepen their ${cleanTitle.split(' ').slice(0, 2).join(' ')} skills. You should already be comfortable with the fundamentals before diving in.` : `This course is ideal for developers with some experience who want to level up their ${cleanTitle.split(' ').slice(0, 2).join(' ')} skills through hands-on practice.`}
${pathSection}
${relatedSection}
## Practice & Learn More

${(PRACTICE_LINKS[course.category] || []).map(l => `- [${l.label}](${l.url})`).join('\n')}
- [How Long Does It Take to Learn Coding?](/docs/how-it-works/learning-speed)
- [${COMPARISON_LINKS[0].label}](${COMPARISON_LINKS[0].url}) | [${COMPARISON_LINKS[2].label}](${COMPARISON_LINKS[2].url})

## Related Pages

- [${categoryLabel} Courses](/docs/courses/${course.category}/)
- [All Courses](/docs/courses/)
- [Scrimba Pricing](/docs/pricing/)${course.access === 'Pro' ? ' | [Pro vs Free](/docs/pricing/pro-vs-free)' : ''}
- [Scrimba Review 2026](/blog/scrimba-review)

<FAQAccordion items={[
  { q: "Is ${cleanTitle} free on Scrimba?", a: "${freeAnswer.replace(/"/g, '\\"')}" },
  { q: "How long does ${cleanTitle} take to complete?", a: "${durationAnswer.replace(/"/g, '\\"')}" },
  { q: "What will I build in this course?", a: "${buildAnswer.replace(/"/g, '\\"')}" },
]} />

${course.access === 'Pro' ? `<PricingCTA
  title="Start ${cleanTitle}"
  subtitle="Get access to ${cleanTitle} and ${totalCoursesLabel} more interactive courses with Scrimba Pro."
/>` : `<AffiliateLink href="${course.scrimbaUrl}" variant="button">
  Start ${cleanTitle} for Free
</AffiliateLink>`}
`;

  // Enforce the project's no-em-dash rule on generated output: the boilerplate
  // and some scraped Scrimba descriptions contain em-dashes. Replace each with a
  // comma (the rule allows periods, commas, semicolons, or parentheses).
  writeFileSync(filePath, content.replace(/\s*—\s*/g, ', '));
  generated++;
}

console.log(`✓ Generated ${generated} course pages`);
console.log(`  Skipped ${skipped} (paths or special pages)`);
console.log(`  Output: docs/courses/{category}/{slug}.mdx`);
