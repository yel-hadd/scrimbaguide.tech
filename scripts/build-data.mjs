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
    duration: '39.4 hrs',
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

// ── Extract instructor ───────────────────────────────────────────
// Prefer the JSON-LD "Instructor:" line the scraper writes into the body
// (reliable, covers the whole catalogue); fall back to title phrasing.
function extractInstructorFromBody(body) {
  const m = body.match(/^Instructor:\s*(.+)$/m);
  if (!m) return '';
  // JSON-LD can list multiple instructors; keep the primary one.
  return m[1].split(',')[0].trim();
}

function extractInstructor(title) {
  const patterns = [
    /lead by ([A-Z][a-z]+ [A-Z][a-z]+)/,
    /teacher ([A-Z][a-z]+ [A-Z][a-z]+)/,
    /created by ([A-Z][a-z]+ [A-Z][a-z]+)/,
    /instructor ([A-Z][a-z]+ [A-Z][a-z]+)/,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) return m[1].trim();
  }
  return '';
}

// ── Extract better description from body text ────────────────────
function extractDescription(frontmatter, body, title) {
  const meta = (frontmatter.meta_description || '').replace(/^["']|["']$/g, '');
  if (meta && meta.length > 60 && /[.!?]$/.test(meta)) return meta;

  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  const skipPatterns = [
    /^(Home|Courses|Paths|Topics|Teams|Extras|Sign in|SIGN IN|UPGRADE|NEW SCRIM|WIN\+ENTER|FOLLOW|START|Popular)$/i,
    /^(AI|Algorithms|Backend|CSS|Career|Show more|JavaScript|React|Python|TypeScript|Community|Pro)$/i,
    /^\d+(\.\d+)?\s*(hrs?|min)$/i,
    /^(Beginner|Intermediate|Advanced|free|Pro)$/i,
    /^\d+\/\d+$/,
    /^Certificate of Completion$/i,
    /^Sign in to unlock/i,
    /^(Join|Sign up|Log in|Create account)/i,
    /^(Certificate|Completion|Progress)/i,
  ];
  for (const line of lines) {
    if (line.length < 40) continue;
    if (skipPatterns.some(p => p.test(line))) continue;
    if (line.startsWith('#')) continue;
    const cleaned = line.replace(/\s+/g, ' ');
    if (cleaned.length >= 40 && cleaned.length <= 500) return cleaned;
  }
  // Try extracting from the title's subtitle (after the colon)
  const colonParts = title.split(':');
  if (colonParts.length > 1) {
    const subtitle = colonParts.slice(1).join(':').trim();
    if (subtitle.length >= 30) return subtitle;
  }
  return meta || `Learn ${title.split(':')[0]} through Scrimba's interactive coding format on Scrimba.`;
}

// ── Extract projects from body text ──────────────────────────────
function extractProjects(body) {
  const projects = [];
  const lines = body.split('\n').map(l => l.trim());
  for (const line of lines) {
    if (/^(Capstone|Solo|Build |Project[:\s#])/i.test(line)) {
      const name = line
        .replace(/^(Capstone Project\s*#?\d*\s*[-–:]\s*)/i, '')
        .replace(/^(Solo Project\s*[-–:]\s*)/i, '')
        .replace(/^(Build\s+)/i, '')
        .replace(/\n.*/, '')
        .trim();
      if (name && name.length > 3 && name.length < 80) projects.push(name);
    }
  }
  return [...new Set(projects)];
}

// ── Parse course metadata from scraped markdown ─────────────────
function parseCourse(item) {
  const { frontmatter, body } = readContent(item);
  const slug = item.url.split('/').filter(Boolean).pop();
  const isPath = PATH_SLUGS.has(slug);

  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  let duration = '';
  let level = '';
  let access = 'Pro';

  if (/^Free\s/i.test(item.title)) access = 'Free';

  for (const line of lines) {
    if (!duration && /^\d+(\.\d+)?\s*(hrs?|min)$/i.test(line)) duration = line;
    if (/^(Beginner|Intermediate|Advanced)$/i.test(line)) level = line;
    if (/^Community$/i.test(line)) access = 'Free';
  }

  // Parse modules from YAML headings_h2 (multiline quoted strings)
  const modules = [];
  const mdPath = join(OUTPUT, item.path);
  const rawText = existsSync(mdPath) ? readFileSync(mdPath, 'utf8') : '';
  const fmMatch = rawText.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const yamlBlock = fmMatch[1];
    const h2Match = yamlBlock.match(/headings_h2:\n([\s\S]*?)(?=\nheadings_h3:|\nscreenshot:|\n[a-z_]+:)/);
    if (h2Match) {
      const rawEntries = h2Match[1].split(/\n\s+-\s+/).filter(Boolean);
      for (const raw of rawEntries) {
        const cleaned = raw.replace(/^\s*-\s*/, '').replace(/^"/, '').replace(/"\s*$/m, '').trim();
        if (!cleaned || /^(Popular|\[\])$/i.test(cleaned)) continue;
        const parts = cleaned.split('\n').map(p => p.trim()).filter(Boolean);
        const modName = parts[0];
        if (!modName || modName.length < 2) continue;
        // Parse the remaining lines by pattern, not position: a duration line
        // ("2.4 hrs"/"108 min") and a lesson counter ("0/22" or "22 lessons")
        // can appear in either order or be absent.
        let modDuration = '';
        let totalLessons = 0;
        for (const part of parts.slice(1)) {
          if (!modDuration && /^\d+(\.\d+)?\s*(hrs?|min)$/i.test(part)) {
            modDuration = part;
            continue;
          }
          const progress = part.match(/(\d+)\s*\/\s*(\d+)/);
          if (progress) {
            totalLessons = parseInt(progress[2], 10);
            continue;
          }
          const lessonsOnly = part.match(/(\d+)\s*lessons?/i);
          if (lessonsOnly) totalLessons = parseInt(lessonsOnly[1], 10);
        }
        modules.push({
          name: modName,
          duration: modDuration,
          totalLessons,
        });
      }
    }
  }

  const topics = assignTopics(slug, item.title);
  const category = primaryCategory(topics);
  const instructor = extractInstructorFromBody(body) || extractInstructor(item.title);
  const description = extractDescription(frontmatter, body, item.title);
  const projects = extractProjects(body);

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

  let docSlug = slug
    .replace(/^(learn-|intro-to-|introduction-to-|build-|the-|tutorial-)/, '')
    .replace(/-c[0-9a-z]+$/i, '')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (docSlug === category) {
    docSlug = `learn-${docSlug}`;
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
    // Path duration comes from the path page's own JSON-LD (timeRequired),
    // which stays current; the PATHS table value is only a fallback.
    pathInfo: isPath
      ? { ...PATHS[slug], duration: duration || PATHS[slug].duration }
      : null,
    pathMembership: [...new Set(pathMembership)],
    modules,
    description,
    instructor,
    projects,
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
