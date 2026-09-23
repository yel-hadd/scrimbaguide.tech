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
    description: '36.2-hour intermediate path covering Node.js, Express, SQL, TypeScript, cybersecurity, and DevOps.',
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

/**
 * Title + description for one llms.txt line. The page's own built <title> and
 * meta description win because they are what the site actually publishes and
 * they can't go stale; PAGE_ANNOTATIONS is the fallback for pages that have no
 * built HTML (or when called without a metadata map, e.g. in tests).
 */
function annotationFor(url, metaByPath = {}) {
  const pathname = pathnameKey(url);
  const live = metaByPath[pathname];
  if (live && live.title) return live;
  return PAGE_ANNOTATIONS[pathname] ?? null;
}

function formatUrlList(urls, metaByPath = {}) {
  return urls.map((url) => {
    const annotation = annotationFor(url, metaByPath);
    if (annotation) {
      const title = escapeMarkdownLinkTitle(annotation.title);
      const description = stripMdxAndJsxFromLlmsText(annotation.description ?? '');
      return description ? `- [${title}](${url}): ${description}` : `- [${title}](${url})`;
    }
    return `- ${url}`;
  }).join('\n');
}

/** Read the published <title> (minus the site suffix) and meta description from built HTML. */
export function extractPageMeta(html) {
  const $ = load(html);
  const title = ($('title').first().text() || '')
    .replace(/\s*\|\s*Scrimba Guide\s*$/i, '')
    .trim();
  const description = ($('meta[name="description"]').attr('content') || '').trim();
  return { title, description };
}

/** Build { '/pathname': { title, description } } for every sitemap URL with built HTML. */
export function collectPageMeta(urls, contentDir) {
  const meta = {};
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    const file = path.join(contentDir, pathname, 'index.html');
    if (!fs.existsSync(file)) continue;
    const parsed = extractPageMeta(fs.readFileSync(file, 'utf8'));
    if (parsed.title) meta[pathnameKey(url)] = parsed;
  }
  return meta;
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
  const metaByPath = options.metaByPath ?? {};
  const canonical = uniqueCanonicalUrls(urls).filter((url) => !isLowValuePath(toPathname(url)));
  const keyUrls = findMatchingKeyUrls(canonical);
  const { docs, blog, tools, roadmaps, legal, topPages } = buildSections(canonical);
  const docsHubs = docs.filter((url) => toPathname(url).split('/').filter(Boolean).length <= 3);
  // Course leaves sit at depth 4 (/docs/courses/<topic>/<course>/), so the hub
  // filter above drops all 71 of them. They are the first-hand review corpus and
  // the reason an assistant would cite this site at all, so they get their own
  // section rather than living only in llms-full.txt.
  const courseLeaves = docs.filter((url) => {
    const parts = toPathname(url).split('/').filter(Boolean);
    return parts.length === 4 && parts[0] === 'docs' && parts[1] === 'courses';
  });
  const blogPosts = blog.filter((url) => toPathname(url).startsWith('/blog/'));
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
    lines.push('## Key Pages', '', formatUrlList(keyUrls, metaByPath), '');
  }
  if (docsHubs.length > 0) {
    lines.push('## Docs', '', formatUrlList(docsHubs, metaByPath), '');
  }
  if (courseLeaves.length > 0) {
    lines.push('## Courses', '', formatUrlList(courseLeaves, metaByPath), '');
  }
  if (blogHighlights.length > 0) {
    lines.push('## Blog', '', formatUrlList(blogHighlights, metaByPath), '');
  }
  if (tools.length > 0) {
    lines.push('## Tools', '', formatUrlList(tools, metaByPath), '');
  }
  if (roadmaps.length > 0) {
    lines.push('## Roadmaps', '', formatUrlList(roadmaps, metaByPath), '');
  }
  if (topPages.length > 0) {
    lines.push('## Pages', '', formatUrlList(topPages, metaByPath), '');
  }
  // The llms.txt spec reserves `## Optional` for links an LLM may skip under a
  // tight context budget. Legal/contact pages fit that.
  if (legal.length > 0) {
    lines.push('## Optional', '', formatUrlList(legal, metaByPath), '');
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

  // Strip non-content chrome before walking. `button` is NOT blanket-removed:
  // FAQAccordion renders each question as a <button>, so dropping every button
  // left ~1300 answers with no questions attached. Drop the interactive chrome
  // by class instead, and keep the FAQ questions.
  $root
    .find('script, style, noscript, svg, nav, header, footer, .theme-doc-toc-mobile, .tableOfContents, .pagination-nav, .theme-doc-breadcrumbs, .breadcrumbs, .theme-doc-sidebar-container, .clean-btn')
    .remove();
  $root.find('button').not('.faq-accordion__question').remove();
  // Screen-reader-only text and decorative glyphs are assistive chrome, not
  // content: without this every affiliate link reads "Title↗ (opens in a new tab)".
  $root.find('.sr-only, [aria-hidden="true"]').remove();
  // The page's own <h1> is already captured as the section title; drop it here
  // so the inlined body doesn't repeat the heading.
  $root.find('h1').first().remove();

  /**
   * Turn one of the site's own components into labelled markdown.
   * Returns null when `$el` is not a component this understands, so the
   * generic walker handles it as before.
   */
  const componentMarkdown = ($el, tag, walk) => {
    const cls = ($el.attr('class') || '').split(/\s+/);
    const has = (name) => cls.includes(name);
    const txt = (sel) => $el.find(sel).first().text().replace(/\s+/g, ' ').trim();
    const deep = ($node) =>
      $node
        .contents()
        .map((_, c) => walk(c))
        .get()
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

    // FAQAccordion: each question is a <button>, each answer the panel after it.
    if (has('faq-accordion')) {
      const heading = txt('.faq-accordion__title');
      const out = [];
      if (heading) out.push(`\n\n### ${heading}\n`);
      $el.find('.faq-accordion__question').each((_, q) => {
        const $q = $(q);
        const question = $q.text().replace(/\s+/g, ' ').trim();
        const $answer = $q
          .closest('.faq-accordion__item, li, div')
          .find('.faq-accordion__answer')
          .first();
        const answer = $answer.length ? deep($answer) : '';
        if (question) out.push(`\n**Q: ${question}**\n${answer ? `\n${answer}\n` : ''}`);
      });
      return out.length ? `${out.join('')}\n` : '';
    }

    // CourseCurriculum row: index, name, duration and lesson count are separate
    // spans that otherwise collide into "...base styles12 min3 lessons".
    if (has('curriculum__item')) {
      const name = txt('.curriculum__name');
      const meta = [txt('.curriculum__duration'), txt('.curriculum__lessons')].filter(Boolean);
      if (!name) return null;
      /* The rendered index span is aria-hidden (the <ol> already conveys order),
         so it is stripped above. Recover the number from the row's position. */
      const index = $el.index() + 1;
      return `\n- Module ${index}: ${name}${meta.length ? ` (${meta.join(', ')})` : ''}`;
    }

    // CourseCard: the page's restatement of data/courses.json.
    if (has('course-card')) {
      const title = txt('.course-card__title');
      const description = txt('.course-card__description');
      const instructor = deep($el.find('.course-card__instructor').first());
      const meta = $el
        .find('.course-card__meta-item')
        .map((_, m) => $(m).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter(Boolean);
      /* The CTA element IS the anchor, so walk the node itself: walking its
         contents would skip the <a> handler and drop the link. */
      const $cta = $el.find('.course-card__cta').first();
      const cta = $cta.length ? walk($cta.get(0)).replace(/\s+/g, ' ').trim() : '';
      const out = [];
      if (title) out.push(`\n\n**${title}**\n`);
      if (description) out.push(`\n${description}\n`);
      if (meta.length) out.push(`\n${meta.map((m) => `- ${m}`).join('\n')}\n`);
      if (instructor) out.push(`\n- ${instructor}\n`);
      if (cta) out.push(`\n${cta}\n`);
      return out.length ? `${out.join('')}\n` : null;
    }

    // Screenshot: keep the alt (the description of the evidence) and separate
    // the caption from the source note instead of welding them together.
    if (tag === 'figure' && (has('screenshot') || $el.find('img').length)) {
      const $img = $el.find('img').first();
      const alt = ($img.attr('alt') || '').replace(/\s+/g, ' ').trim();
      const src = absoluteLink($img.attr('src'), siteUrl);
      const caption = txt('.screenshot__caption');
      const source = txt('.screenshot__source');
      if (!alt && !caption) return null;
      const parts = [];
      if (alt) parts.push(`\n\n![${alt}](${src || ''})\n`);
      if (caption) parts.push(`\n*${caption}*\n`);
      if (source) parts.push(`\n${source}\n`);
      return `${parts.join('')}\n`;
    }

    // Tables need a header separator row or no markdown parser sees a table.
    if (tag === 'table') {
      /* Use toArray(), not .map().get(): cheerio flattens one level, which
         would collapse the rows into a single list of cells. */
      const rows = $el
        .find('tr')
        .toArray()
        .map((tr) =>
          $(tr)
            .find('th, td')
            .toArray()
            .map((cell) => deep($(cell)).replace(/\|/g, '\\|')),
        )
        .filter((r) => r.length);
      if (!rows.length) return null;
      const caption = txt('caption');
      const width = Math.max(...rows.map((r) => r.length));
      const pad = (r) => [...r, ...Array(width - r.length).fill('')];
      const lines = [];
      if (caption) lines.push(`\n\n${caption}\n`);
      lines.push(`\n| ${pad(rows[0]).join(' | ')} |`);
      lines.push(`\n| ${Array(width).fill('---').join(' | ')} |`);
      for (const r of rows.slice(1)) lines.push(`\n| ${pad(r).join(' | ')} |`);
      return `${lines.join('')}\n\n`;
    }

    // RelatedGuides: badge and title are adjacent spans, so the generic walker
    // produced link text like "DocsScrimba Pricing".
    if (has('related-guides')) {
      const heading = txt('.related-guides__title');
      const out = [heading ? `\n\n### ${heading}\n` : '\n\n### Related guides\n'];
      $el.find('a').each((_, a) => {
        const $a = $(a);
        const href = absoluteLink($a.attr('href'), siteUrl);
        const label = $a
          .find('.related-guides__featured-title, .related-guides__list-title')
          .first()
          .text()
          .replace(/\s+/g, ' ')
          .trim();
        const name = label || $a.text().replace(/\s+/g, ' ').trim();
        const description = $a
          .find('.related-guides__description')
          .first()
          .text()
          .replace(/\s+/g, ' ')
          .trim();
        if (name && href) out.push(`\n- [${name}](${href})${description ? `: ${description}` : ''}`);
      });
      return `${out.join('')}\n\n`;
    }

    return null;
  };

  const walk = (node) => {
    if (!node) return '';
    if (node.type === 'text') return (node.data || '').replace(/\s+/g, ' ');
    if (node.type !== 'tag') return '';
    const tag = node.tagName.toLowerCase();
    const $el = $(node);
    const inner = () => $el.contents().map((_, c) => walk(c)).get().join('');

    /* Component-aware parsers. The generic walker concatenates sibling <span>s
       with no separator, which turned the site's structured blocks into runs
       like "Duration: 56 minLevel: Intermediate13 lessons". Each handler below
       emits the component's own fields as labelled markdown instead. */
    const component = componentMarkdown($el, tag, walk);
    if (component !== null) return component;

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
    // Docusaurus heading anchors leave a zero-width space in the heading text.
    .replace(/[​-‍﻿]/g, '')
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
  const metaByPath = collectPageMeta(urls, outputDir);
  const llmsTxt = renderLlmsTxt(urls, { siteName, siteUrl, metaByPath });

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
