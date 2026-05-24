#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';

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
    description: '39.4-hour intermediate path covering Node.js, Express, SQL, TypeScript, cybersecurity, and DevOps.',
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
    description: 'Scrimba\'s free tier covers about 15 courses permanently, details on what is and isn\'t free, and when Pro is worth paying for.',
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
    description: 'Total cost comparison between a Scrimba Pro subscription and coding bootcamps, ROI, outcomes, and time commitment.',
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
    `> Independent guide to Scrimba, covering career paths, pricing, and platform comparisons for developers learning to code in 2026. Annotated high-signal pages below; see \`${siteUrl}/llms-full.txt\` for the full text of every page in one document.`,
    '',
    `- Full text of every page: ${siteUrl}/llms-full.txt`,
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
  // The llms.txt spec reserves `## Optional` for links an LLM may skip under a
  // tight context budget. Legal/contact pages fit that.
  if (legal.length > 0) {
    lines.push('## Optional', '', formatUrlList(legal), '');
  }

  return `${lines.join('\n').trim()}\n`;
}

/** Canonical, deduped, sorted, low-value-filtered URLs for the full corpus. */
export function selectFullTxtUrls(urls) {
  return uniqueSortedUrls(urls).filter((url) => !isLowValuePath(toPathname(url)));
}

/** Resolve a root-relative href to an absolute URL; drop in-page anchors. */
function absoluteLink(href, siteUrl) {
  if (!href) return '';
  if (href.startsWith('#')) return '';
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `${siteUrl}${href}`;
  return href;
}

/**
 * Extract a built Docusaurus HTML page's main content as plain markdown so the
 * whole site can be ingested from one file. Drops chrome (nav, sidebar, footer,
 * scripts) and keeps headings, links, lists, and code as lightweight markdown.
 */
export function htmlToLlmsMarkdown(html, { siteUrl = DEFAULT_SITE_URL } = {}) {
  const $ = load(html);
  const pageTitle = ($('h1').first().text() || $('title').text() || '')
    .replace(/\s*\|\s*Scrimba Guide\s*$/i, '')
    .trim();

  // Prefer the Docusaurus content region; fall back to <main>, then <body>.
  let $root = $('.markdown').first();
  if (!$root.length) $root = $('main').first();
  if (!$root.length) $root = $('body').first();

  // Strip non-content chrome before walking.
  $root
    .find('script, style, noscript, svg, nav, header, footer, button, .theme-doc-toc-mobile, .tableOfContents, .pagination-nav, .theme-doc-breadcrumbs, .breadcrumbs, .theme-doc-sidebar-container, .clean-btn')
    .remove();
  // The page's own <h1> is already captured as the section title; drop it here
  // so the inlined body doesn't repeat the heading.
  $root.find('h1').first().remove();

  const walk = (node) => {
    if (!node) return '';
    if (node.type === 'text') return (node.data || '').replace(/\s+/g, ' ');
    if (node.type !== 'tag') return '';
    const tag = node.tagName.toLowerCase();
    const $el = $(node);
    const inner = () => $el.contents().map((_, c) => walk(c)).get().join('');
    if (/^h([1-6])$/.test(tag)) {
      const level = Number(tag[1]);
      const text = inner().trim();
      return text ? `\n\n${'#'.repeat(level)} ${text}\n\n` : '';
    }
    switch (tag) {
      case 'p':
      case 'blockquote':
        return `\n\n${inner().trim()}\n\n`;
      case 'br':
        return '\n';
      case 'li':
        return `\n- ${inner().trim()}`;
      case 'ul':
      case 'ol':
        return `\n${inner()}\n`;
      case 'pre':
        return `\n\n\`\`\`\n${$el.text().replace(/\n+$/, '')}\n\`\`\`\n\n`;
      case 'code':
        return $el.parents('pre').length ? inner() : `\`${$el.text().trim()}\``;
      case 'a': {
        const text = inner().trim();
        const href = absoluteLink($el.attr('href'), siteUrl);
        return href && text ? `[${text}](${href})` : text;
      }
      case 'tr':
        return `\n${inner().replace(/\s*\|\s*$/, '')}`;
      case 'td':
      case 'th':
        return `${inner().trim()} | `;
      default:
        return inner();
    }
  };

  const body = walk($root.get(0))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title: pageTitle, markdown: body };
}

/**
 * Render llms-full.txt with each page's content inlined as markdown (per the
 * llms.txt spec, the "full" file is the whole site in one ingestible document).
 * `pages` is an array of { url, title, content }.
 */
export function renderLlmsFullTxt(pages, options = {}) {
  const siteName = options.siteName ?? DEFAULT_SITE_NAME;
  const lines = [
    `# ${siteName} (Full Content)`,
    '',
    '> Full text of every canonical page on Scrimba Guide, an independent review site covering Scrimba\'s courses, career paths, pricing, and comparisons with Codecademy, Udemy, freeCodeCamp, Frontend Masters, and other platforms. Each section below is one page, inlined as markdown.',
    '',
  ];
  for (const page of pages) {
    if (!page || !page.content) continue;
    lines.push('---', '', `# ${page.title || page.url}`, '', `Source: ${page.url}`, '', page.content, '');
  }
  return `${lines.join('\n').trim()}\n`;
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

  // Inline each page's built HTML content into llms-full.txt.
  const contentDir = outputDir;
  let pagesInlined = 0;
  let pagesMissing = 0;
  const pages = selectFullTxtUrls(urls).map((url) => {
    const pathname = new URL(url).pathname;
    const file = path.join(contentDir, pathname, 'index.html');
    if (!fs.existsSync(file)) {
      pagesMissing += 1;
      return null;
    }
    const { title, markdown } = htmlToLlmsMarkdown(fs.readFileSync(file, 'utf8'), { siteUrl });
    if (!markdown) return null;
    pagesInlined += 1;
    return { url, title, content: markdown };
  }).filter(Boolean);

  const llmsFullTxt = renderLlmsFullTxt(pages, { siteName, siteUrl });

  fs.mkdirSync(outputDir, { recursive: true });
  const llmsPath = path.join(outputDir, 'llms.txt');
  const llmsFullPath = path.join(outputDir, 'llms-full.txt');

  fs.writeFileSync(llmsPath, llmsTxt, 'utf8');
  fs.writeFileSync(llmsFullPath, llmsFullTxt, 'utf8');

  return {
    totalUrls: urls.length,
    pagesInlined,
    pagesMissing,
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
  console.log(`Generated ${result.llmsFullPath} (${result.pagesInlined} pages inlined, ${result.pagesMissing} missing)`);
  console.log(`Processed ${result.totalUrls} sitemap URLs`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
