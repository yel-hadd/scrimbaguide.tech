#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_SITE_NAME = 'Scrimba Guide';
const DEFAULT_SITE_URL = 'https://scrimbaguide.tech';
const DEFAULT_SITEMAP_PATH = path.resolve(__dirname, '..', 'build', 'sitemap.xml');
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '..', 'build');

const LOW_VALUE_PATTERNS = [
  /^\/search(?:\/|$)/,
  /^\/tags(?:\/|$)/,
  /^\/blog\/tags(?:\/|$)/,
  /^\/blog\/authors(?:\/|$)/,
  /^\/blog\/archive(?:\/|$)/,
  /^\/blog\/page\/\d+(?:\/|$)/,
  /** Redirect-only stubs; canonical blog URLs are `/blog/<slug>`. */
  /^\/blog\/blog(?:\/|$)/,
  /** Double-prefixed docs paths should never be indexed; canonical is `/docs/...`. */
  /^\/docs\/docs(?:\/|$)/,
];

const KEY_PATHS = [
  '/',
  '/docs/intro',
  '/docs/paths',
  '/docs/pricing',
  '/docs/comparisons',
  '/docs/courses',
  '/docs/faq',
  '/blog',
  '/about',
  '/contact',
];

/**
 * Curated annotations for high-value pages.
 * Format: path (no trailing slash) → { title, description }
 * These are rendered as `- [Title](URL): Description` in llms.txt
 * so AI systems understand page content without fetching it.
 */
const PAGE_ANNOTATIONS = {
  '/': {
    title: 'Scrimba Guide, Home',
    description: 'Independent guide to Scrimba covering paths, pricing, and platform comparisons for developers learning to code.',
  },
  '/docs/intro': {
    title: 'What Is Scrimba Guide?',
    description: 'Overview of this independent Scrimba resource: what we cover, how we review content, and how to navigate the guides.',
  },
  '/docs/paths': {
    title: 'Scrimba Career Paths Overview (2026)',
    description: 'Comparison of all four Scrimba career paths (Frontend, Fullstack, Backend, AI Engineer), hours, skill level, and who each path is for.',
  },
  '/docs/paths/frontend-developer-path': {
    title: 'Scrimba Frontend Developer Path Review (2026)',
    description: '81.6-hour beginner path covering HTML, CSS, JavaScript, and React. Best for complete beginners targeting a first frontend job.',
  },
  '/docs/paths/fullstack-developer-path': {
    title: 'Scrimba Fullstack Developer Path Review (2026)',
    description: '108.4-hour path adding backend, databases, TypeScript, Next.js, and AI engineering on top of frontend skills.',
  },
  '/docs/paths/backend-developer-path': {
    title: 'Scrimba Backend Developer Path Review (2026)',
    description: '30.1-hour intermediate path covering Node.js, Express, SQL, TypeScript, cybersecurity, and DevOps.',
  },
  '/docs/paths/ai-engineer-path': {
    title: 'Scrimba AI Engineer Path Review (2026)',
    description: '11.4-hour intermediate path for building AI-powered apps with agents, RAG, MCP, and the Vercel AI SDK.',
  },
  '/docs/pricing': {
    title: 'Scrimba Pricing 2026, Pro vs Free',
    description: 'Current Scrimba pricing breakdown: what Free includes, what Pro unlocks, and how to get the cheapest Pro subscription.',
  },
  '/docs/pricing/pro-vs-free': {
    title: 'Scrimba Pro vs Free: What\'s the Difference? (2026)',
    description: 'Side-by-side comparison of Scrimba Free and Pro tiers, course access, career paths, certificates, and AI features.',
  },
  '/docs/comparisons': {
    title: 'Scrimba vs Alternatives: The Complete Comparison Guide (2026)',
    description: 'Decision-focused comparisons of Scrimba against 12 platforms including Codecademy, Udemy, freeCodeCamp, and Frontend Masters.',
  },
  '/docs/comparisons/scrimba-vs-codecademy': {
    title: 'Scrimba vs Codecademy (2026)',
    description: 'Detailed comparison of interactive screencasts (Scrimba) vs text-based drills (Codecademy), features, pricing, and who each suits.',
  },
  '/docs/comparisons/scrimba-vs-udemy': {
    title: 'Scrimba vs Udemy (2026)',
    description: 'Curated subscription platform vs marketplace: when to pick Scrimba\'s structured paths over Udemy\'s per-course model.',
  },
  '/docs/comparisons/scrimba-vs-freecodecamp': {
    title: 'Scrimba vs freeCodeCamp (2026)',
    description: 'Paid interactive platform vs free text-based curriculum, who should pay for Scrimba and who gets enough from freeCodeCamp.',
  },
  '/docs/comparisons/scrimba-vs-frontendmasters': {
    title: 'Scrimba vs Frontend Masters (2026)',
    description: 'Structured beginner paths (Scrimba) vs advanced expert workshops (Frontend Masters), which fits your current skill level.',
  },
  '/docs/comparisons/scrimba-vs-odin-project': {
    title: 'Scrimba vs The Odin Project (2026)',
    description: 'Guided platform vs open-source self-directed curriculum, key tradeoffs for career changers and self-taught developers.',
  },
  '/docs/comparisons/scrimba-vs-coursera': {
    title: 'Scrimba vs Coursera (2026)',
    description: 'Job-ready interactive skills (Scrimba) vs university-style credentials (Coursera), choosing based on your career goals.',
  },
  '/docs/comparisons/scrimba-vs-zerotomastery': {
    title: 'Scrimba vs Zero to Mastery (2026)',
    description: 'Comparison of interactive screencasts vs traditional video courses across web development and AI learning paths.',
  },
  '/docs/comparisons/scrimba-vs-treehouse': {
    title: 'Scrimba vs Treehouse (2026)',
    description: 'Interactive coding environment (Scrimba) vs general video library (Treehouse), content depth, pricing, and job outcomes.',
  },
  '/docs/comparisons/scrimba-vs-pluralsight': {
    title: 'Scrimba vs Pluralsight (2026)',
    description: 'Beginner-focused interactive paths (Scrimba) vs enterprise certification platform (Pluralsight), target audience and use cases.',
  },
  '/docs/comparisons/scrimba-vs-educative': {
    title: 'Scrimba vs Educative (2026)',
    description: 'Video-based interactive coding (Scrimba) vs text + embedded playgrounds (Educative), interview prep and learning style comparison.',
  },
  '/docs/comparisons/scrimba-vs-fireship': {
    title: 'Scrimba vs Fireship (2026)',
    description: 'Structured career paths (Scrimba) vs fast-paced YouTube overviews + Pro course (Fireship), depth vs breadth tradeoff.',
  },
  '/docs/comparisons/scrimba-vs-youtube': {
    title: 'Scrimba vs YouTube for Learning to Code (2026)',
    description: 'Passive video watching vs active coding environment, why structure and accountability matter for career changers.',
  },
  '/docs/faq/is-scrimba-free': {
    title: 'Is Scrimba Free? (2026)',
    description: 'Scrimba\'s free tier covers 19+ courses permanently, details on what is and isn\'t free, and when Pro is worth paying for.',
  },
  '/docs/faq/how-to-use-scrimba': {
    title: 'How to Use Scrimba: Getting Started Guide',
    description: 'Step-by-step guide to setting up Scrimba, navigating scrims, using the interactive IDE, and choosing a learning path.',
  },
  '/blog/scrimba-review': {
    title: 'Scrimba Review 2026: Is It Worth It?',
    description: 'In-depth independent review covering the scrim format, course quality, pricing, career outcomes, and who Scrimba is actually for.',
  },
  '/blog/is-scrimba-worth-it': {
    title: 'Is Scrimba Worth It in 2026? Honest Assessment',
    description: 'Evidence-based assessment of Scrimba Pro value, when the subscription pays off and when free alternatives are sufficient.',
  },
  '/blog/scrimba-vs-coding-bootcamps-cost': {
    title: 'Scrimba vs Coding Bootcamps: Full Cost Analysis (2026)',
    description: 'Total cost comparison between Scrimba Pro (~$19/mo) and coding bootcamps ($10k–$20k), ROI, outcomes, and time commitment.',
  },
  '/about': {
    title: 'About Scrimba Guide',
    description: 'Who runs Scrimba Guide, our editorial independence policy, how we review platforms, and our affiliate disclosure.',
  },
};

/**
 * Remove MDX/JSX-shaped fragments so llms*.txt stays plain prose + URLs (no component syntax).
 * Strips import lines, MDX block comments, and tags that look like `<Component />`.
 * Does not remove `{identifier}`, keep literals like `use {foo} in code` intact in annotations.
 */
export function stripMdxAndJsxFromLlmsText(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text
    .split('\n')
    .filter((line) => !/^\s*import\s/.test(line))
    .join(' ');
  s = s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  s = s.replace(/<\/?[A-Za-z][A-Za-z0-9.]*(?:\s[^>]*)?\/?>/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

/** Escape `]` so link titles stay valid CommonMark link labels. */
export function escapeMarkdownLinkTitle(text) {
  return stripMdxAndJsxFromLlmsText(text).replace(/\\/g, '\\\\').replace(/\]/g, '\\]');
}

export function extractLocUrls(xml) {
  const urls = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export function normalizeCanonicalUrl(url) {
  const parsed = new URL(url);
  const pathname = parsed.pathname === '/'
    ? '/'
    : `${parsed.pathname.replace(/\/+$/, '')}/`;
  return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
}

function isLowValuePath(pathname) {
  return LOW_VALUE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function toPathname(url) {
  return new URL(url).pathname;
}

/** Canonical path comparison key, strips trailing slash so lookups work regardless of input form. */
function pathnameKey(url) {
  const p = toPathname(url);
  return p === '/' ? '/' : p.replace(/\/+$/, '');
}

function uniqueSortedUrls(urls) {
  return [...new Set(urls.map(normalizeCanonicalUrl))].sort((a, b) => a.localeCompare(b));
}

function uniqueCanonicalUrls(urls) {
  return [...new Set(urls.map(normalizeCanonicalUrl))];
}

function formatUrlList(urls, siteUrl = DEFAULT_SITE_URL) {
  return urls.map((url) => {
    const pathname = pathnameKey(url);
    const annotation = PAGE_ANNOTATIONS[pathname];
    if (annotation) {
      const title = escapeMarkdownLinkTitle(annotation.title);
      const description = stripMdxAndJsxFromLlmsText(annotation.description);
      return `- [${title}](${url}): ${description}`;
    }
    return `- ${url}`;
  }).join('\n');
}

function sectionByPrefix(urls, prefix) {
  return urls.filter((url) => toPathname(url).startsWith(prefix));
}

function topLevelPages(urls) {
  return urls.filter((url) => {
    const pathname = toPathname(url);
    if (pathname === '/') return false;
    const depth = pathname.split('/').filter(Boolean).length;
    return depth === 1;
  });
}

function findMatchingKeyUrls(urls) {
  const byPath = new Map(urls.map((url) => [pathnameKey(url), url]));
  return KEY_PATHS.map((keyPath) => byPath.get(keyPath)).filter(Boolean);
}

function buildSections(urls) {
  const docs = sectionByPrefix(urls, '/docs/');
  const blog = urls.filter((url) => {
    const key = pathnameKey(url);
    return key === '/blog' || key.startsWith('/blog/');
  });
  const tools = sectionByPrefix(urls, '/tools/');
  const roadmaps = sectionByPrefix(urls, '/roadmaps/');
  const legal = sectionByPrefix(urls, '/legal/');
  const topPages = topLevelPages(urls).filter((url) => {
    const key = pathnameKey(url);
    return !['/blog', '/docs', '/tools', '/roadmaps', '/legal'].includes(key);
  });

  return { docs, blog, tools, roadmaps, legal, topPages };
}

export function renderLlmsTxt(urls, options = {}) {
  const siteName = options.siteName ?? DEFAULT_SITE_NAME;
  const siteUrl = options.siteUrl ?? DEFAULT_SITE_URL;
  const canonical = uniqueCanonicalUrls(urls).filter((url) => !isLowValuePath(toPathname(url)));
  const keyUrls = findMatchingKeyUrls(canonical);
  const { docs, blog, tools, roadmaps, legal, topPages } = buildSections(canonical);
  const docsHubs = docs.filter((url) => toPathname(url).split('/').filter(Boolean).length <= 3);
  const blogPosts = blog.filter((url) => toPathname(url).startsWith('/blog/')).slice(0, 20);
  const blogOverview = blog.find((url) => pathnameKey(url) === '/blog');
  const blogHighlights = blogOverview ? [blogOverview, ...blogPosts] : blogPosts;

  const lines = [
    `# ${siteName}`,
    '',
    `> Independent guide to Scrimba, covering career paths, pricing, and platform comparisons for developers learning to code in 2026. Annotated high-signal pages below; see \`${siteUrl}/llms-full.txt\` for the complete canonical URL index.`,
    '',
    `- Full canonical index: ${siteUrl}/llms-full.txt`,
    '',
  ];

  if (keyUrls.length > 0) {
    lines.push('## Key Pages', '', formatUrlList(keyUrls), '');
  }
  if (docsHubs.length > 0) {
    lines.push('## Docs', '', formatUrlList(docsHubs), '');
  }
  if (blogHighlights.length > 0) {
    lines.push('## Blog', '', formatUrlList(blogHighlights), '');
  }
  if (tools.length > 0) {
    lines.push('## Tools', '', formatUrlList(tools), '');
  }
  if (roadmaps.length > 0) {
    lines.push('## Roadmaps', '', formatUrlList(roadmaps), '');
  }
  if (topPages.length > 0) {
    lines.push('## Pages', '', formatUrlList(topPages), '');
  }
  if (legal.length > 0) {
    lines.push('## Legal', '', formatUrlList(legal), '');
  }

  return `${lines.join('\n').trim()}\n`;
}

export function renderLlmsFullTxt(urls, options = {}) {
  const siteName = options.siteName ?? DEFAULT_SITE_NAME;
  const canonical = uniqueSortedUrls(urls).filter((url) => !isLowValuePath(toPathname(url)));

  const lines = [
    `# ${siteName} (Full URL Index)`,
    '',
    '> Complete canonical URL index for Scrimba Guide, an independent review site covering Scrimba\'s courses, career paths, pricing, and comparisons with Codecademy, Udemy, freeCodeCamp, Frontend Masters, and 8 other platforms.',
    '',
    '## All Canonical URLs',
    '',
    formatUrlList(canonical),
    '',
  ];

  return lines.join('\n');
}

function parseArgValue(args, name) {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
}

export function generateLlmsFromSitemap({
  sitemapPath = DEFAULT_SITEMAP_PATH,
  outputDir = DEFAULT_OUTPUT_DIR,
  siteName = DEFAULT_SITE_NAME,
  siteUrl = DEFAULT_SITE_URL,
} = {}) {
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Sitemap not found at ${sitemapPath}`);
  }

  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = extractLocUrls(xml);
  const llmsTxt = renderLlmsTxt(urls, { siteName, siteUrl });
  const llmsFullTxt = renderLlmsFullTxt(urls, { siteName });

  fs.mkdirSync(outputDir, { recursive: true });
  const llmsPath = path.join(outputDir, 'llms.txt');
  const llmsFullPath = path.join(outputDir, 'llms-full.txt');

  fs.writeFileSync(llmsPath, llmsTxt, 'utf8');
  fs.writeFileSync(llmsFullPath, llmsFullTxt, 'utf8');

  return {
    totalUrls: urls.length,
    llmsPath,
    llmsFullPath,
  };
}

function main() {
  const args = process.argv.slice(2);
  const sitemapPath = parseArgValue(args, '--sitemap') ?? DEFAULT_SITEMAP_PATH;
  const outputDir = parseArgValue(args, '--output-dir') ?? DEFAULT_OUTPUT_DIR;
  const siteName = parseArgValue(args, '--site-name') ?? DEFAULT_SITE_NAME;
  const siteUrl = parseArgValue(args, '--site-url') ?? DEFAULT_SITE_URL;

  const result = generateLlmsFromSitemap({ sitemapPath, outputDir, siteName, siteUrl });
  console.log(`Generated ${result.llmsPath}`);
  console.log(`Generated ${result.llmsFullPath}`);
  console.log(`Processed ${result.totalUrls} sitemap URLs`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
