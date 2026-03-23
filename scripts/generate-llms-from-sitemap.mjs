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
  const normalizedPath = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${normalizedPath}${parsed.search}${parsed.hash}`;
}

function isLowValuePath(pathname) {
  return LOW_VALUE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function toPathname(url) {
  return new URL(url).pathname;
}

function uniqueSortedUrls(urls) {
  return [...new Set(urls.map(normalizeCanonicalUrl))].sort((a, b) => a.localeCompare(b));
}

function uniqueCanonicalUrls(urls) {
  return [...new Set(urls.map(normalizeCanonicalUrl))];
}

function formatUrlList(urls) {
  return urls.map((url) => `- ${url}`).join('\n');
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
  const byPath = new Map(urls.map((url) => [toPathname(url), url]));
  return KEY_PATHS.map((keyPath) => byPath.get(keyPath)).filter(Boolean);
}

function buildSections(urls) {
  const docs = sectionByPrefix(urls, '/docs/');
  const blog = urls.filter((url) => {
    const pathname = toPathname(url);
    return pathname === '/blog' || pathname.startsWith('/blog/');
  });
  const tools = sectionByPrefix(urls, '/tools/');
  const roadmaps = sectionByPrefix(urls, '/roadmaps/');
  const legal = sectionByPrefix(urls, '/legal/');
  const topPages = topLevelPages(urls).filter((url) => {
    const pathname = toPathname(url);
    return !['/blog', '/docs', '/tools', '/roadmaps', '/legal'].includes(pathname);
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
  const blogOverview = blog.find((url) => toPathname(url) === '/blog');
  const blogHighlights = blogOverview ? [blogOverview, ...blogPosts] : blogPosts;

  const lines = [
    `# ${siteName}`,
    '',
    `> Canonical URL index for ${siteName}. Use this file for high-signal pages and \`${siteUrl}/llms-full.txt\` for the complete set.`,
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
    '> Complete list of canonical URLs derived from sitemap.xml.',
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
