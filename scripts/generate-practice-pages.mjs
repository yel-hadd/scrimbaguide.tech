import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const DOCS = join(ROOT, 'docs', 'practice');

// Ensure output directory exists
mkdirSync(DOCS, { recursive: true });

// Load data
const practicePages = JSON.parse(readFileSync(join(DATA, 'practice-pages.json'), 'utf8'));
const courses = JSON.parse(readFileSync(join(DATA, 'courses.json'), 'utf8'));

// Helper to find course by slug (partial match or exact)
function findCourse(slug) {
  return courses.find(c => c.scrimbaSlug === slug || c.docSlug === slug || c.scrimbaSlug.includes(slug));
}

let generated = 0;

for (const page of practicePages) {
  const courseItems = page.courses.map(slug => {
    const course = findCourse(slug);
    if (!course) return null;
    return `
### [${course.title}](/docs/courses/${course.category}/${course.docSlug})
**Level**: ${course.level || 'All Levels'} | **Duration**: ${course.duration || 'Varies'}

${course.description || 'Learn interactively on Scrimba.'}
`;
  }).filter(Boolean).join('\n');

  const content = `---
title: "${page.title}"
description: "${page.description}"
keywords: [${page.skill.toLowerCase()} practice, learn ${page.skill.toLowerCase()}, interactive ${page.skill.toLowerCase()}]
---

import AffiliateLink from '@site/src/components/AffiliateLink';
import PricingCTA from '@site/src/components/PricingCTA';

# ${page.title}

${page.description}

## Why Practice ${page.skill} on Scrimba?

Reading documentation is passive. To truly master **${page.skill}**, you need to write code. Scrimba's interactive format lets you:

1. **Pause the video** at any moment
2. **Edit the code** directly in the player
3. **Run it** to see your changes instantly

## Top Courses to Practice ${page.skill}

${courseItems}

## How to Practice Effectively

1. **Don't just watch**. Whenever the instructor writes code, pause and type it yourself.
2. **Break things**. Change values, delete lines, and see what happens.
3. **Do the challenges**. Scrimba courses have built-in challenges. Do not skip them.

<PricingCTA
  title="Start practicing now"
  subtitle="Most of these courses are included in Scrimba Pro. Some are free."
/>
`;

  writeFileSync(join(DOCS, `${page.slug}.mdx`), content);
  generated++;
}

console.log(`✓ Generated ${generated} practice pages in docs/practice/`);
