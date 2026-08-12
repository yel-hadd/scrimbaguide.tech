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

/**
 * The source locale, which is served from the bare root (`/docs/...`, no prefix).
 *
 * Mirrors `DEFAULT_LOCALE` in `i18n/locales.config.ts`, which this file cannot import: that
 * roster is TypeScript and this is a plain `.mjs` build script running on the repo's Node 20
 * floor (package.json `engines`), where `.ts` imports do not load. Keep the two values equal;
 * everything else about the roster is passed in by the caller.
 */
const DEFAULT_LOCALE = 'en';

/**
 * Paths that carry no standalone value for an LLM ingesting the site: search, tag/author
 * indexes, blog pagination, and redirect-only stubs.
 *
 * Exported because the indexer reuses this exact list; keeping one copy means a new stub
 * pattern cannot be filtered out of llms.txt while still being submitted for indexing.
 *
 * Every pattern is `^/`-anchored, so it matches a *locale-stripped* pathname only.
 * `/de/tags/` and `/ja/blog/page/2/` do NOT match. See isLowValuePath below.
 */
export const LOW_VALUE_PATTERNS = [
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
 *
 * KEYED BY LOCALE-STRIPPED PATH, no trailing slash: `/docs/paths`, never `/de/docs/paths`.
 * Slugs are identical across locales (SEO invariant 1: never localize a `slug`), so one table
 * annotates every locale and a key with a locale prefix in it would simply never match.
 *
 * Rendered as `- [Title](URL): Description` in llms.txt so AI systems understand page content
 * without fetching it. A locale that wants its own annotation text passes an override map
 * (CLI `--annotations <file>`, same key shape); anything it omits falls back to English, which
 * is strictly better than dropping the annotation.
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

/**
 * True when `pathname` is one of the low-value paths above.
 *
 * CALL-SITE CONTRACT: pass a locale-stripped pathname, i.e. `isLowValuePath(stripLocale(p))`,
 * never the raw pathname. Because LOW_VALUE_PATTERNS is `^/`-anchored, a raw `/de/tags/` or
 * `/ja/blog/page/2/` returns false and the junk page sails through the filter, with nothing
 * failing to signal it. This module is a build script (.mjs) and cannot import the app's
 * `src/utils/localePath.ts`, so the strip must happen in the consumer.
 */
export function isLowValuePath(pathname) {
  return LOW_VALUE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function toPathname(url) {
  return new URL(url).pathname;
}

/**
 * Drop a leading `/<locale>` segment so every downstream comparison is against the canonical,
 * locale-independent route.
 *
 * This is the `.mjs` twin of `stripLocale()` in `src/utils/localePath.ts`; it takes the locale
 * as an argument instead of consulting the roster, because this file cannot import TypeScript
 * (see DEFAULT_LOCALE above). It therefore strips ONLY the locale it was told about, which is
 * the right behaviour here: each generator run processes exactly one locale's sitemap.
 *
 * `stripLocalePrefix('/de/tags/', 'de') === '/tags/'` is what makes `isLowValuePath` work under
 * a localized sitemap; passing the raw pathname is a silent pass-through.
 */
export function stripLocalePrefix(pathname, locale) {
  if (!locale || locale === DEFAULT_LOCALE) return pathname;
  const prefix = `/${locale}`;
  if (pathname === prefix || pathname === `${prefix}/`) return '/';
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
}

/** Locale-stripped pathname of a URL, trailing slash preserved. */
function routePathname(url, locale) {
  return stripLocalePrefix(toPathname(url), locale);
}

/**
 * Canonical route comparison key: locale-stripped and trailing-slash-free, so `/de/docs/paths/`
 * and `/docs/paths` both key as `/docs/paths` and hit the same annotation.
 */
function routeKey(url, locale) {
  const p = routePathname(url, locale);
  return p === '/' ? '/' : p.replace(/\/+$/, '');
}

function uniqueSortedUrls(urls) {
  return [...new Set(urls.map(normalizeCanonicalUrl))].sort((a, b) => a.localeCompare(b));
}

function uniqueCanonicalUrls(urls) {
  return [...new Set(urls.map(normalizeCanonicalUrl))];
}

function formatUrlList(urls, { locale = DEFAULT_LOCALE, annotations = PAGE_ANNOTATIONS } = {}) {
  return urls.map((url) => {
    const annotation = annotations[routeKey(url, locale)] ?? PAGE_ANNOTATIONS[routeKey(url, locale)];
    if (annotation) {
      const title = escapeMarkdownLinkTitle(annotation.title);
      const description = stripMdxAndJsxFromLlmsText(annotation.description);
      return `- [${title}](${url}): ${description}`;
    }
    return `- ${url}`;
  }).join('\n');
}

function sectionByPrefix(urls, prefix, locale) {
  return urls.filter((url) => routePathname(url, locale).startsWith(prefix));
}

function topLevelPages(urls, locale) {
  return urls.filter((url) => {
    const pathname = routePathname(url, locale);
    if (pathname === '/') return false;
    const depth = pathname.split('/').filter(Boolean).length;
    return depth === 1;
  });
}

function findMatchingKeyUrls(urls, locale) {
  const byPath = new Map(urls.map((url) => [routeKey(url, locale), url]));
  return KEY_PATHS.map((keyPath) => byPath.get(keyPath)).filter(Boolean);
}

function buildSections(urls, locale) {
  const docs = sectionByPrefix(urls, '/docs/', locale);
  const blog = urls.filter((url) => {
    const key = routeKey(url, locale);
    return key === '/blog' || key.startsWith('/blog/');
  });
  const tools = sectionByPrefix(urls, '/tools/', locale);
  const roadmaps = sectionByPrefix(urls, '/roadmaps/', locale);
  const legal = sectionByPrefix(urls, '/legal/', locale);
  const topPages = topLevelPages(urls, locale).filter((url) => {
    const key = routeKey(url, locale);
    return !['/blog', '/docs', '/tools', '/roadmaps', '/legal'].includes(key);
  });

  return { docs, blog, tools, roadmaps, legal, topPages };
}

/**
 * Render one locale's `llms.txt`.
 *
 * Options beyond the original two:
 *   locale         which locale's sitemap these URLs came from; drives prefix stripping.
 *   localeIndexes  `[{ locale, url? }]` rendered as a `## Translations` section. Only the ROOT
 *                  (English) file passes this, so the English index is the discovery entry
 *                  point for every localized index (plan Phase 3, C11).
 *   emitFull       whether a sibling `llms-full.txt` exists to point at. It is ~1.6 MB per
 *                  locale, so it is generated for Tier A/B only; advertising a file that was
 *                  never written would send every crawler to a 404.
 *   annotations    per-locale override map, same locale-stripped key shape as PAGE_ANNOTATIONS.
 */
export function renderLlmsTxt(urls, options = {}) {
  const siteName = options.siteName ?? DEFAULT_SITE_NAME;
  const siteUrl = options.siteUrl ?? DEFAULT_SITE_URL;
  const locale = options.locale ?? DEFAULT_LOCALE;
  const localeIndexes = options.localeIndexes ?? [];
  const emitFull = options.emitFull ?? true;
  const annotations = options.annotations ?? PAGE_ANNOTATIONS;
  const listOptions = { locale, annotations };

  const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const localeBase = `${siteUrl}${localePrefix}`;

  // Locale-STRIPPED path, always: every LOW_VALUE_PATTERNS entry is `^/`-anchored, so filtering
  // the raw pathname would let `/de/tags/` and `/ja/blog/page/2/` straight through.
  const canonical = uniqueCanonicalUrls(urls).filter(
    (url) => !isLowValuePath(routePathname(url, locale)),
  );
  const keyUrls = findMatchingKeyUrls(canonical, locale);
  const { docs, blog, tools, roadmaps, legal, topPages } = buildSections(canonical, locale);
  const docsHubs = docs.filter(
    (url) => routePathname(url, locale).split('/').filter(Boolean).length <= 3,
  );
  const blogPosts = blog.filter((url) => routePathname(url, locale).startsWith('/blog/')).slice(0, 20);
  const blogOverview = blog.find((url) => routeKey(url, locale) === '/blog');
  const blogHighlights = blogOverview ? [blogOverview, ...blogPosts] : blogPosts;

  const heading = locale === DEFAULT_LOCALE ? `# ${siteName}` : `# ${siteName} (${locale})`;
  const intro = locale === DEFAULT_LOCALE
    ? `> Independent guide to Scrimba, covering career paths, pricing, and platform comparisons for developers learning to code in 2026. Annotated high-signal pages below${emitFull ? `; see \`${siteUrl}/llms-full.txt\` for the full text of every page in one document` : ''}.`
    : `> Independent guide to Scrimba, covering career paths, pricing, and platform comparisons, in the \`${locale}\` locale. Page slugs are identical across locales, so \`${siteUrl}/llms.txt\` is the English equivalent of this file${emitFull ? `; see \`${localeBase}/llms-full.txt\` for the full text of every page in this locale` : ''}.`;

  const lines = [heading, '', intro, ''];

  if (emitFull) {
    lines.push(`- Full text of every page: ${localeBase}/llms-full.txt`, '');
  }
  if (locale !== DEFAULT_LOCALE) {
    lines.push(`- English source index: ${siteUrl}/llms.txt`, '');
  }

  if (keyUrls.length > 0) {
    lines.push('## Key Pages', '', formatUrlList(keyUrls, listOptions), '');
  }
  if (docsHubs.length > 0) {
    lines.push('## Docs', '', formatUrlList(docsHubs, listOptions), '');
  }
  if (blogHighlights.length > 0) {
    lines.push('## Blog', '', formatUrlList(blogHighlights, listOptions), '');
  }
  if (tools.length > 0) {
    lines.push('## Tools', '', formatUrlList(tools, listOptions), '');
  }
  if (roadmaps.length > 0) {
    lines.push('## Roadmaps', '', formatUrlList(roadmaps, listOptions), '');
  }
  if (topPages.length > 0) {
    lines.push('## Pages', '', formatUrlList(topPages, listOptions), '');
  }
  if (localeIndexes.length > 0) {
    lines.push(
      '## Translations',
      '',
      localeIndexes
        .map(({ locale: tag, url }) => `- [${tag}](${url ?? `${siteUrl}/${tag}/llms.txt`}): index of the same pages in the ${tag} locale.`)
        .join('\n'),
      '',
    );
  }
  // The llms.txt spec reserves `## Optional` for links an LLM may skip under a
  // tight context budget. Legal/contact pages fit that.
  if (legal.length > 0) {
    lines.push('## Optional', '', formatUrlList(legal, listOptions), '');
  }

  return `${lines.join('\n').trim()}\n`;
}

/**
 * Canonical, deduped, sorted, low-value-filtered URLs for the full corpus.
 * `locale` is optional and only affects the low-value filter, which must see a stripped path.
 */
export function selectFullTxtUrls(urls, locale = DEFAULT_LOCALE) {
  return uniqueSortedUrls(urls).filter((url) => !isLowValuePath(routePathname(url, locale)));
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

/**
 * Generate `llms.txt` (and optionally `llms-full.txt`) for ONE locale.
 *
 * `outputDir` and `contentRoot` are separate because the merged multi-locale tree nests locale
 * builds: `de`'s files are written to `merged/de/`, but its sitemap URLs are `/de/docs/...`,
 * which already carry the `de/` segment. Resolving those pathnames against `merged/de` would
 * look for `merged/de/de/docs/...` and inline zero pages while exiting 0. So HTML is always
 * read from the tree ROOT and only the two output files are written into the locale directory.
 */
export function generateLlmsFromSitemap({
  sitemapPath = DEFAULT_SITEMAP_PATH,
  outputDir = DEFAULT_OUTPUT_DIR,
  contentRoot = null,
  siteName = DEFAULT_SITE_NAME,
  siteUrl = DEFAULT_SITE_URL,
  locale = DEFAULT_LOCALE,
  localeIndexes = [],
  emitFull = true,
  annotations = PAGE_ANNOTATIONS,
} = {}) {
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Sitemap not found at ${sitemapPath}`);
  }

  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = extractLocUrls(xml);
  const llmsTxt = renderLlmsTxt(urls, { siteName, siteUrl, locale, localeIndexes, emitFull, annotations });

  // Inline each page's built HTML content into llms-full.txt.
  const contentDir = contentRoot ?? outputDir;
  let pagesInlined = 0;
  let pagesMissing = 0;
  const pages = emitFull
    ? selectFullTxtUrls(urls, locale).map((url) => {
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
    }).filter(Boolean)
    : [];

  fs.mkdirSync(outputDir, { recursive: true });
  const llmsPath = path.join(outputDir, 'llms.txt');
  fs.writeFileSync(llmsPath, llmsTxt, 'utf8');

  let llmsFullPath = null;
  if (emitFull) {
    llmsFullPath = path.join(outputDir, 'llms-full.txt');
    fs.writeFileSync(llmsFullPath, renderLlmsFullTxt(pages, { siteName, siteUrl }), 'utf8');
  }

  return {
    locale,
    totalUrls: urls.length,
    pagesInlined,
    pagesMissing,
    llmsPath,
    llmsFullPath,
  };
}

function parseList(value) {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const sitemapPath = parseArgValue(args, '--sitemap') ?? DEFAULT_SITEMAP_PATH;
  const outputDir = parseArgValue(args, '--output-dir') ?? DEFAULT_OUTPUT_DIR;
  const contentRoot = parseArgValue(args, '--content-root');
  const siteName = parseArgValue(args, '--site-name') ?? DEFAULT_SITE_NAME;
  const siteUrl = parseArgValue(args, '--site-url') ?? DEFAULT_SITE_URL;
  const locale = parseArgValue(args, '--locale') ?? DEFAULT_LOCALE;
  // `--locales` lists the OTHER live locales to advertise; only the root file uses it.
  const localeIndexes = parseList(parseArgValue(args, '--locales'))
    .filter((tag) => tag !== locale)
    .map((tag) => ({ locale: tag }));
  // Tier C/D/E skip llms-full.txt: it is ~1.6 MB per locale and the merged tree is gated on
  // both bytes and file count (plan Phase 3 two-axis deploy gate).
  const emitFull = !args.includes('--no-full');
  const annotationsPath = parseArgValue(args, '--annotations');
  const annotations = annotationsPath
    ? { ...PAGE_ANNOTATIONS, ...JSON.parse(fs.readFileSync(annotationsPath, 'utf8')) }
    : PAGE_ANNOTATIONS;

  const result = generateLlmsFromSitemap({
    sitemapPath,
    outputDir,
    contentRoot,
    siteName,
    siteUrl,
    locale,
    localeIndexes,
    emitFull,
    annotations,
  });
  console.log(`Generated ${result.llmsPath} (locale ${result.locale})`);
  if (result.llmsFullPath) {
    console.log(`Generated ${result.llmsFullPath} (${result.pagesInlined} pages inlined, ${result.pagesMissing} missing)`);
  } else {
    console.log('Skipped llms-full.txt (--no-full)');
  }
  console.log(`Processed ${result.totalUrls} sitemap URLs`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
