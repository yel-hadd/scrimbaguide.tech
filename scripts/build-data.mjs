/**
 * Data pipeline: processes output/index.json into structured data files
 * for the Docusaurus site.
 *
 * Produces:
 *   data/courses.json      – enriched course objects with topic, free/pro, path membership
 *   data/help-articles.json – categorized FAQ content
 *   data/topics.json        – topic metadata with course lists
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT = join(ROOT, 'output');
const DATA = join(ROOT, 'data');

mkdirSync(DATA, { recursive: true });

// ── Load raw index ──────────────────────────────────────────────
const raw = JSON.parse(readFileSync(join(OUTPUT, 'index.json'), 'utf8'));

// ── Separate by type ────────────────────────────────────────────
const coursesRaw = raw.filter(r => r.type === 'course');
const helpRaw    = raw.filter(r => r.type === 'help');
const topicsRaw  = raw.filter(r => r.type === 'topic');
const marketingRaw = raw.filter(r => r.type === 'marketing');

// ── Read scraped markdown for each item to extract metadata ─────
function readContent(item) {
  const mdPath = join(OUTPUT, item.path);
  if (!existsSync(mdPath)) return { frontmatter: {}, body: '' };
  const text = readFileSync(mdPath, 'utf8');
  // parse YAML frontmatter
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: {}, body: text };
  const fm = {};
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return { frontmatter: fm, body: fmMatch[2] };
}

// ── Topic mapping ───────────────────────────────────────────────
// Read each topic page to build topic → course slug lists
const topicCourseMap = {};  // topic title → [course slugs mentioned on topic page]
const topicMeta = [];

for (const t of topicsRaw) {
  const { frontmatter, body } = readContent(t);
  const title = t.title;
  const slug = t.url.split('/').filter(Boolean).pop();
  topicCourseMap[title] = [];
  topicMeta.push({
    title,
    slug,
    url: t.url,
    description: frontmatter.meta_description || '',
  });
}

// ── Course slug → topic assignment ──────────────────────────────
// Heuristic: assign topics based on course title/slug keywords
const TOPIC_KEYWORDS = {
  'React': ['react', 'react-router', 'styled-components', 'reusable-react'],
  'JavaScript': ['javascript', 'js-', '-js', 'es6', 'tricky-parts'],
  'CSS': ['css', 'flexbox', 'grid', 'tailwind', 'bulma', 'bootstrap', 'responsive-web-design', 'animations'],
  'HTML': ['html'],
  'AI': ['ai', 'openai', 'langchain', 'dall-e', 'gpt', 'mistral', 'claude', 'rag', 'prompt-engineering', 'mcp', 'model-context-protocol', 'context-engineering', 'vercel-ai', 'langbase', 'ai-engineer', 'intro-to-ai', 'generative-ai'],
  'Backend': ['node', 'express', 'nestjs', 'firebase', 'supabase', 'sql', 'backend'],
  'Python': ['python'],
  'TypeScript': ['typescript'],
  'Fullstack': ['fullstack'],
  'Algorithms': ['algorithms', 'binary-search', 'merge-sort', 'data-structures'],
  'UI Design': ['ui-design', 'design-fundamentals', 'figma'],
  'Career': ['interview', 'getting-hired', 'frontend-path', 'portfolio'],
  'Vue': ['vue'],
  'Databases': ['sql', 'supabase', 'firebase'],
};

function assignTopics(slug, title) {
  const topics = [];
  const key = (slug + ' ' + title).toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => key.includes(kw))) {
      // PROMPT_LOGIC: Prevent "tailwind" from matching "ai" unless real AI keywords are present
      if (topic === 'AI' && key.includes('tailwind') && !keywords.filter(k => k !== 'ai').some(k => key.includes(k))) {
        // If the only match is 'ai', check if it's a distinct word
        if (!/\bai\b/.test(key)) continue;
      }
      topics.push(topic);
    }
  }
  if (topics.length === 0) topics.push('Other');
  return topics;
}

// ── Determine primary category for docs structure ───────────────
function primaryCategory(topics) {
  // Priority order for site directory mapping
  const priority = ['React', 'JavaScript', 'AI', 'CSS', 'Backend', 'Python', 'TypeScript'];
  for (const p of priority) {
    if (topics.includes(p)) return p.toLowerCase();
  }
  if (topics.includes('Fullstack')) return 'backend';
  if (topics.includes('Algorithms')) return 'javascript';
  if (topics.includes('UI Design')) return 'css';
  if (topics.includes('Career')) return 'javascript';
  if (topics.includes('Vue')) return 'javascript';
  return 'javascript'; // fallback
}

// ── Learning path definitions ───────────────────────────────────
const PATHS = {
  'frontend-path-c0j': {
    name: 'Frontend Developer Path',
    slug: 'frontend-developer-path',
    duration: '81.6 hrs',
    level: 'Beginner',
    access: 'Pro',
  },
  'fullstack-path-c0fullstack': {
    name: 'Fullstack Developer Path',
    slug: 'fullstack-developer-path',
    duration: '108.4 hrs',
    level: 'Beginner',
    access: 'Pro',
  },
  'the-backend-developer-path-c0tbi0l98f': {
    name: 'Backend Developer Path',
    slug: 'backend-developer-path',
    duration: '30.1 hrs',
    level: 'Intermediate',
    access: 'Pro',
  },
  'the-ai-engineer-path-c02v': {
    name: 'AI Engineer Path',
    slug: 'ai-engineer-path',
    duration: '11.4 hrs',
    level: 'Intermediate',
    access: 'Pro',
  },
};

const PATH_SLUGS = new Set(Object.keys(PATHS));

// ── Parse course metadata from scraped markdown ─────────────────
function parseCourse(item) {
  const { frontmatter, body } = readContent(item);
  const slug = item.url.split('/').filter(Boolean).pop();
  const isPath = PATH_SLUGS.has(slug);

  // Parse duration and level from body
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  let duration = '';
  let level = '';
  let access = 'Pro'; // default

  for (const line of lines) {
    if (!duration && /^\d+(\.\d+)?\s*(hrs?|min)$/i.test(line)) duration = line;
    if (/^(Beginner|Intermediate|Advanced)$/i.test(line)) level = line;
    if (/^(Community|Pro)$/i.test(line)) access = line === 'Community' ? 'Free' : 'Pro';
  }

  // Parse modules from headings_h2 in frontmatter or body
  const modules = [];
  const h2s = frontmatter.headings_h2 || '';
  // Re-read the raw markdown to get structured headings
  const mdPath = join(OUTPUT, item.path);
  const rawText = existsSync(mdPath) ? readFileSync(mdPath, 'utf8') : '';
  const fmMatch = rawText.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    // Parse the headings_h2 array from YAML
    const yamlBlock = fmMatch[1];
    const h2Section = yamlBlock.match(/headings_h2:\n((?:\s+-[\s\S]*?)(?=\n\w|\nheadings_h3|\nscreenshot|$))/);
    if (h2Section) {
      const entries = h2Section[1].match(/- "([^"]+)"/g) || h2Section[1].match(/- (.+)/g) || [];
      for (const entry of entries) {
        const cleaned = entry.replace(/^-\s*"?|"?\s*$/g, '');
        if (cleaned === 'Popular') continue;
        // Parse "Module Name\nDuration\nLessons"
        const parts = cleaned.split('\n').map(p => p.trim());
        const modName = parts[0];
        const modDuration = parts[1] || '';
        const modLessons = parts[2] || '';
        const lessonMatch = modLessons.match(/(\d+)\/(\d+)/);
        modules.push({
          name: modName,
          duration: modDuration,
          totalLessons: lessonMatch ? parseInt(lessonMatch[2]) : 0,
        });
      }
    }
  }

  const topics = assignTopics(slug, item.title);
  const category = primaryCategory(topics);

  // Determine which paths this course belongs to
  const pathMembership = [];
  const titleLower = item.title.toLowerCase();
  const slugLower = slug.toLowerCase();
  if (titleLower.includes('react') || slugLower.includes('react')) {
    pathMembership.push('frontend-developer-path');
    pathMembership.push('fullstack-developer-path');
  }
  if (titleLower.includes('javascript') || titleLower.includes('js') || slugLower.includes('javascript')) {
    pathMembership.push('frontend-developer-path');
    pathMembership.push('fullstack-developer-path');
  }
  if (titleLower.includes('css') || titleLower.includes('html') || slugLower.includes('css') || slugLower.includes('html')) {
    pathMembership.push('frontend-developer-path');
    pathMembership.push('fullstack-developer-path');
  }
  if (titleLower.includes('node') || titleLower.includes('express') || titleLower.includes('sql') || titleLower.includes('backend') || slugLower.includes('backend') || slugLower.includes('nestjs')) {
    pathMembership.push('backend-developer-path');
    pathMembership.push('fullstack-developer-path');
  }
  if (titleLower.includes('ai') || titleLower.includes('openai') || titleLower.includes('langchain') || titleLower.includes('rag') || slugLower.includes('ai')) {
    pathMembership.push('ai-engineer-path');
  }
  if (titleLower.includes('typescript') || slugLower.includes('typescript')) {
    pathMembership.push('fullstack-developer-path');
    pathMembership.push('backend-developer-path');
  }

  // Generate a URL-safe doc slug
  let docSlug = slug
    .replace(/^(learn-|intro-to-|introduction-to-|build-|the-|tutorial-)/, '')
    .replace(/-c[0-9a-z]+$/i, '')  // remove Scrimba course ID suffix
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (docSlug === 'react' && category === 'react') {
    docSlug = 'learn-react';
  }

  return {
    title: item.title,
    scrimbaUrl: item.url,
    scrimbaSlug: slug,
    docSlug: docSlug || slug,
    category,
    topics,
    duration,
    level,
    access,
    isPath,
    pathInfo: isPath ? PATHS[slug] : null,
    pathMembership: [...new Set(pathMembership)],
    modules,
    description: (frontmatter.meta_description || '').replace(/^["']|["']$/g, ''),
    screenshot: item.screenshot,
  };
}

// ── Build courses ───────────────────────────────────────────────
const courses = coursesRaw.map(parseCourse);

// Add related courses (same category, different difficulty)
for (const course of courses) {
  const related = courses
    .filter(c => c.scrimbaSlug !== course.scrimbaSlug && c.category === course.category && !c.isPath)
    .slice(0, 5)
    .map(c => ({ docSlug: c.docSlug, title: c.title, category: c.category }));
  course.relatedCourses = related;
}

// ── Build help articles ─────────────────────────────────────────
const HELP_CATEGORIES = {
  billing: [
    'how-much-does-scrimba-cost', 'whats-the-difference-between-pro-and-free',
    'how-do-i-get-a-refund', 'troubleshooting-payment-issues',
    'do-you-offer-student-discounts', 'can-i-purchase-a-single-course',
    'do-i-get-to-keep-my-courses', 'do-i-lose-my-progress',
    'do-i-get-access-to-all-content', 'my-automatic-payment-failed',
    'how-do-i-manage-my-subscription', 'can-i-pay-using-paypal',
    'can-i-get-a-scholarship', 'how-do-i-access-the-student-github',
  ],
  certificates: [
    'how-do-i-change-my-name-on-my-certificate',
    'how-do-i-add-my-certificate-to-your-linkedin',
  ],
  'discord-community': [
    'how-to-join-the-scrimba-discord',
    'email-is-already-registered',
    'linking-your-scrimba-account-to-discord',
    'what-is-scrimbassadors',
    'claim-your-scrimbassador-badge',
    'i-need-help-with-my-code',
    'feedback-and-suggestions',
  ],
  'platform-issues': [
    'can-i-download-the-code', 'do-you-support-captions',
    'where-to-find-free-courses', 'what-courses-are-coming-up',
    'can-i-change-the-language', 'can-i-watch-courses-offline',
    'the-lesson-is-not-playing', 'how-to-i-reset-my-progress',
    'my-progress-is-now-correct', 'my-code-crashes',
    'device-compatibility', 'i-see-red-error-lines',
    'what-is-instant-feedback', 'what-are-free-challenges',
    'sign-in-sign-up', 'how-do-i-delete-my-account',
    'how-do-i-copy-a-scrim',
  ],
};

function categorizeHelp(item) {
  const slug = item.url.split('/').pop();
  const { frontmatter, body } = readContent(item);

  // Find category
  let category = 'general';
  for (const [cat, keywords] of Object.entries(HELP_CATEGORIES)) {
    if (keywords.some(kw => slug.includes(kw))) {
      category = cat;
      break;
    }
  }

  return {
    title: item.title.replace(' - Scrimba Help Centre', ''),
    url: item.url,
    slug,
    category,
    description: (frontmatter.meta_description || '').replace(/^["']|["']$/g, ''),
    body: body.trim(),
  };
}

const helpArticles = helpRaw
  .filter(h => !h.url.includes('/category/') && !h.url.includes('/collection/') && !h.url.endsWith('helpscoutdocs.com'))
  .map(categorizeHelp);

// ── Write output ────────────────────────────────────────────────
writeFileSync(join(DATA, 'courses.json'), JSON.stringify(courses, null, 2));
writeFileSync(join(DATA, 'help-articles.json'), JSON.stringify(helpArticles, null, 2));
writeFileSync(join(DATA, 'topics.json'), JSON.stringify(topicMeta, null, 2));

console.log(`✓ Wrote ${courses.length} courses to data/courses.json`);
console.log(`  - Paths: ${courses.filter(c => c.isPath).length}`);
console.log(`  - Free: ${courses.filter(c => c.access === 'Free').length}`);
console.log(`  - Pro: ${courses.filter(c => c.access === 'Pro').length}`);
console.log(`  - Categories: ${[...new Set(courses.map(c => c.category))].join(', ')}`);
console.log(`✓ Wrote ${helpArticles.length} help articles to data/help-articles.json`);
console.log(`  - billing: ${helpArticles.filter(h => h.category === 'billing').length}`);
console.log(`  - certificates: ${helpArticles.filter(h => h.category === 'certificates').length}`);
console.log(`  - discord-community: ${helpArticles.filter(h => h.category === 'discord-community').length}`);
console.log(`  - platform-issues: ${helpArticles.filter(h => h.category === 'platform-issues').length}`);
console.log(`✓ Wrote ${topicMeta.length} topics to data/topics.json`);
