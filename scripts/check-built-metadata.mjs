#!/usr/bin/env node
/**
 * Metadata invariants on the BUILT site (V10).
 *
 * check:content reads MDX sources; nothing read the rendered <head> until
 * this script. It walks build/** /index.html, keeps the indexable pages
 * (no robots noindex, not a client-redirect stub) and checks:
 *
 *   hard   title-missing, title-ellipsis
 *   hard   og-title-mismatch (og:title must equal <title>)
 *   hard   twitter-title-mismatch (absent, or equal to og:title)
 *   hard   description-missing, description-too-long (> 160 chars)
 *   hard   duplicate-title, duplicate-description (across indexable pages)
 *   hard   canonical-count, canonical-invalid, og-url-invalid
 *          (absolute https://scrimbaguide.tech URL ending in "/")
 *   hard   h1-count (exactly one <h1>)
 *   hard   jsonld-parse, faqpage-count (at most one FAQPage node)
 *   hard   list-page-schema: no top-level Review, HowTo, ItemList,
 *          BlogPosting or BreadcrumbList on /blog/, /blog/page/N/ or
 *          /blog/tags/**. "Top level" means a script block's root object
 *          or a member of its @graph; a BlogPosting nested under
 *          Blog.blogPost (stock BlogListPageStructuredData) is allowed.
 *   hard   breadcrumblist-count: at most one BreadcrumbList node per page,
 *          counted anywhere in any JSON-LD block (top level, @graph or
 *          nested). Docs get the stock one; blog posts get ours.
 *   hard   breadcrumb-property-duplicate: a `breadcrumb` property that is
 *          not a bare {"@id"} reference, on a page that has another
 *          breadcrumb trail (a BreadcrumbList node or a second property).
 *   hard   breadcrumb-nav-count: at most one visible breadcrumbs <nav>
 *          (nav.theme-doc-breadcrumbs, nav[aria-label=Breadcrumbs] or a
 *          nav holding ul.breadcrumbs).
 *   hard   list-page-breadcrumbs: no breadcrumbs <nav> on blog list routes.
 *   hard   blogposting-author-mismatch: on a blog post page, the author
 *          names of every top-level BlogPosting, and the article:author
 *          meta tags, must equal the visible byline (the post header's
 *          .avatar__name entries), in order.
 *   advisory title-over-60 (printed, never fails, never allowlisted)
 *
 * Ratchet: hard findings are compared with the allowlist
 * (scripts/check-built-metadata.known-issues.json). The run fails on any
 * finding not in the allowlist AND on any allowlist entry that no longer
 * reproduces (stale), so a fixed issue must be removed from the list in
 * the PR that fixes it.
 *
 * Usage:
 *   node scripts/check-built-metadata.mjs [--build <dir>] [--allowlist <file>]
 *   node scripts/check-built-metadata.mjs --write-allowlist   # reseed from this build
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const SITE_ORIGIN = 'https://scrimbaguide.tech';
export const MAX_DESCRIPTION = 160;
export const ADVISORY_TITLE_MAX = 60;
export const LIST_PAGE_FORBIDDEN_TYPES = ['Review', 'HowTo', 'ItemList', 'BlogPosting', 'BreadcrumbList'];
export const DEFAULT_ALLOWLIST = path.join(__dirname, 'check-built-metadata.known-issues.json');

/** Blog list, pagination and tag pages. */
export function isBlogListRoute(route) {
  return /^\/blog\/$/.test(route) || /^\/blog\/page\/\d+\/$/.test(route) || /^\/blog\/tags\//.test(route);
}

function charLength(str) {
  return [...str].length;
}

function typesOf(node) {
  if (!node || typeof node !== 'object') return [];
  const t = node['@type'];
  if (Array.isArray(t)) return t.map(String);
  return t ? [String(t)] : [];
}

/** Types of each block's root object(s) and its @graph members. */
export function topLevelTypes(parsed) {
  const out = [];
  const roots = Array.isArray(parsed) ? parsed : [parsed];
  for (const root of roots) {
    out.push(...typesOf(root));
    if (root && Array.isArray(root['@graph'])) {
      for (const member of root['@graph']) out.push(...typesOf(member));
    }
  }
  return out;
}

/** Every @type anywhere in the tree (used for the FAQPage count). */
export function allTypeNodes(parsed) {
  const out = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const types = typesOf(node);
    if (types.length) out.push(types);
    for (const value of Object.values(node)) visit(value);
  };
  visit(parsed);
  return out;
}

/**
 * Breadcrumb facts across a page's parsed JSON-LD blocks.
 *   listNodes    BreadcrumbList nodes anywhere in the tree
 *   inlineProps  `breadcrumb` properties whose value is not a bare {"@id"} ref
 *   inlineLists  the subset of inlineProps whose value is itself a BreadcrumbList
 */
export function breadcrumbFacts(blocks) {
  const facts = { listNodes: 0, inlineProps: 0, inlineLists: 0 };
  const isReference = (value) =>
    value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 1 && '@id' in value;
  for (const block of blocks) {
    facts.listNodes += allTypeNodes(block).filter((types) => types.includes('BreadcrumbList')).length;
    const visit = (node) => {
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (!node || typeof node !== 'object') return;
      if ('breadcrumb' in node && !isReference(node.breadcrumb)) {
        facts.inlineProps += 1;
        if (typesOf(node.breadcrumb).includes('BreadcrumbList')) facts.inlineLists += 1;
      }
      for (const value of Object.values(node)) visit(value);
    };
    visit(block);
  }
  return facts;
}

/** Visible breadcrumb trails: distinct <nav> elements that are breadcrumbs. */
export function countBreadcrumbNavs($) {
  const navs = new Set();
  $('nav').each((_, el) => {
    const cls = ` ${el.attribs?.class ?? ''} `;
    const label = (el.attribs?.['aria-label'] ?? '').trim().toLowerCase();
    if (cls.includes(' theme-doc-breadcrumbs ') || label === 'breadcrumbs' || $(el).find('ul.breadcrumbs').length > 0) {
      navs.add(el);
    }
  });
  return navs.size;
}

/** Pull the facts the checks need out of one HTML document. */
export function extractPage(html) {
  const $ = load(html);
  const metaContents = (attr, value) =>
    $('head meta')
      .toArray()
      .filter((el) => (el.attribs?.[attr] || '').toLowerCase() === value)
      .map((el) => el.attribs.content ?? '');

  const jsonLd = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => {
      const text = $(el).text();
      try {
        return { ok: true, value: JSON.parse(text) };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    });

  return {
    title: $('head > title').first().text(),
    titleCount: $('head > title').length,
    descriptions: metaContents('name', 'description'),
    ogTitles: metaContents('property', 'og:title'),
    twitterTitles: metaContents('name', 'twitter:title'),
    ogUrls: metaContents('property', 'og:url'),
    robots: metaContents('name', 'robots'),
    refresh: metaContents('http-equiv', 'refresh'),
    canonicals: $('head link[rel="canonical"]')
      .toArray()
      .map((el) => el.attribs.href ?? ''),
    h1Count: $('h1').length,
    breadcrumbNavCount: countBreadcrumbNavs($),
    articleAuthors: metaContents('property', 'article:author'),
    bylineNames: $('article')
      .first()
      .find('header .avatar__name')
      .toArray()
      .map((el) => $(el).text().replace(/\s+/g, ' ').trim())
      .filter(Boolean),
    jsonLd,
  };
}

/** Author names of each top-level BlogPosting node, one array per node. */
export function blogPostingAuthorNames(parsed) {
  const roots = Array.isArray(parsed) ? parsed : [parsed];
  const nodes = [];
  for (const root of roots) {
    if (!root || typeof root !== 'object') continue;
    nodes.push(root);
    if (Array.isArray(root['@graph'])) nodes.push(...root['@graph']);
  }
  return nodes
    .filter((node) => typesOf(node).includes('BlogPosting'))
    .map((node) => {
      const author = node.author;
      const list = Array.isArray(author) ? author : author ? [author] : [];
      return list.map((a) => (typeof a === 'string' ? a : String(a?.name ?? ''))).map((n) => n.trim());
    });
}

/** Indexable = not noindex and not a client-redirect stub. */
export function isIndexable(page) {
  if (page.robots.some((r) => /noindex/i.test(r))) return false;
  if (page.refresh.length > 0) return false;
  return true;
}

function validSiteUrl(url) {
  return typeof url === 'string' && url.startsWith(`${SITE_ORIGIN}/`) && url.endsWith('/');
}

/** Per-page checks. Returns { hard: [{rule, route, detail}], advisory: [...] }. */
export function checkPage(route, page) {
  const hard = [];
  const advisory = [];
  const add = (rule, detail) => hard.push({ rule, route, detail });

  const title = page.title.trim();
  if (!title) add('title-missing', 'no <title> text');
  else if (/(\.\.\.|…)$/.test(title)) add('title-ellipsis', title);
  if (title && charLength(title) > ADVISORY_TITLE_MAX) {
    advisory.push({ rule: 'title-over-60', route, detail: `${charLength(title)} chars` });
  }

  if (page.ogTitles.length !== 1 || page.ogTitles[0] !== page.title) {
    add('og-title-mismatch', `og:title ${JSON.stringify(page.ogTitles)} vs <title> ${JSON.stringify(page.title)}`);
  }
  const twitterTitle = page.twitterTitles.at(-1);
  if (page.twitterTitles.length > 0 && (page.twitterTitles.length > 1 || twitterTitle !== page.ogTitles[0])) {
    add('twitter-title-mismatch', `twitter:title ${JSON.stringify(page.twitterTitles)}`);
  }

  const description = (page.descriptions[0] ?? '').trim();
  if (page.descriptions.length === 0 || !description) add('description-missing', 'no meta description');
  else if (charLength(description) > MAX_DESCRIPTION) {
    add('description-too-long', `${charLength(description)} chars (max ${MAX_DESCRIPTION})`);
  }

  if (page.canonicals.length !== 1) add('canonical-count', `${page.canonicals.length} canonical links`);
  if (page.canonicals.some((href) => !validSiteUrl(href))) add('canonical-invalid', page.canonicals.join(' '));
  if (page.ogUrls.length !== 1 || !validSiteUrl(page.ogUrls[0])) add('og-url-invalid', page.ogUrls.join(' ') || 'missing');

  if (page.h1Count !== 1) add('h1-count', `${page.h1Count} <h1> elements`);

  let faqNodes = 0;
  const forbidden = new Set();
  page.jsonLd.forEach((block, index) => {
    if (!block.ok) {
      add('jsonld-parse', `block ${index}: ${block.error}`);
      return;
    }
    faqNodes += allTypeNodes(block.value).filter((types) => types.includes('FAQPage')).length;
    if (isBlogListRoute(route)) {
      for (const type of topLevelTypes(block.value)) {
        if (LIST_PAGE_FORBIDDEN_TYPES.includes(type)) forbidden.add(type);
      }
    }
  });
  if (faqNodes > 1) add('faqpage-count', `${faqNodes} FAQPage nodes`);
  if (forbidden.size) add('list-page-schema', [...forbidden].sort().join(', '));

  const crumbs = breadcrumbFacts(page.jsonLd.filter((block) => block.ok).map((block) => block.value));
  if (crumbs.listNodes > 1) add('breadcrumblist-count', `${crumbs.listNodes} BreadcrumbList nodes`);
  const trails = crumbs.listNodes + crumbs.inlineProps - crumbs.inlineLists;
  if (crumbs.inlineProps > 0 && trails > 1) {
    add('breadcrumb-property-duplicate', `${crumbs.inlineProps} inline breadcrumb properties, ${trails} trails`);
  }
  const navCount = page.breadcrumbNavCount ?? 0;
  if (navCount > 1) add('breadcrumb-nav-count', `${navCount} breadcrumb <nav> elements`);
  if (isBlogListRoute(route) && navCount > 0) add('list-page-breadcrumbs', `${navCount} breadcrumb <nav> elements`);

  const byline = page.bylineNames ?? [];
  if (/^\/blog\//.test(route) && !isBlogListRoute(route) && byline.length > 0) {
    const same = (names) => names.length === byline.length && names.every((name, i) => name === byline[i]);
    const postings = page.jsonLd.filter((block) => block.ok).flatMap((block) => blogPostingAuthorNames(block.value));
    for (const names of postings) {
      if (!same(names)) {
        add('blogposting-author-mismatch', `BlogPosting author ${JSON.stringify(names)} vs byline ${JSON.stringify(byline)}`);
      }
    }
    const metaAuthors = (page.articleAuthors ?? []).map((a) => a.trim());
    if (postings.length > 0 && !same(metaAuthors)) {
      add('blogposting-author-mismatch', `article:author ${JSON.stringify(metaAuthors)} vs byline ${JSON.stringify(byline)}`);
    }
  }

  return { hard, advisory };
}

/** Cross-page checks: duplicate titles and descriptions. */
export function checkDuplicates(pages) {
  const findings = [];
  const group = (rule, pick) => {
    const byValue = new Map();
    for (const [route, page] of pages) {
      const value = pick(page);
      if (!value) continue;
      if (!byValue.has(value)) byValue.set(value, []);
      byValue.get(value).push(route);
    }
    for (const routes of byValue.values()) {
      if (routes.length < 2) continue;
      for (const route of routes) {
        findings.push({ rule, route, detail: `shared with ${routes.filter((r) => r !== route).join(' ')}` });
      }
    }
  };
  group('duplicate-title', (page) => page.title.trim());
  group('duplicate-description', (page) => (page.descriptions[0] ?? '').trim());
  return findings;
}

/** Route for build/<dir>/index.html. */
export function routeFromFile(buildDir, file) {
  const rel = path.relative(buildDir, path.dirname(file)).split(path.sep).join('/');
  return rel ? `/${rel}/` : '/';
}

function walkIndexHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets') continue;
      walkIndexHtml(full, out);
    } else if (entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

/** Run every check over a build directory. */
export function checkBuild(buildDir) {
  const pages = new Map();
  let total = 0;
  for (const file of walkIndexHtml(buildDir)) {
    total += 1;
    const page = extractPage(fs.readFileSync(file, 'utf8'));
    if (isIndexable(page)) pages.set(routeFromFile(buildDir, file), page);
  }
  const hard = [];
  const advisory = [];
  for (const [route, page] of pages) {
    const result = checkPage(route, page);
    hard.push(...result.hard);
    advisory.push(...result.advisory);
  }
  hard.push(...checkDuplicates(pages));
  hard.sort((a, b) => a.rule.localeCompare(b.rule) || a.route.localeCompare(b.route));
  return { total, indexable: pages.size, hard, advisory };
}

/** Allowlist shape: { entries: { [rule]: [route, ...] } }. */
export function toAllowlist(findings) {
  const entries = {};
  for (const { rule, route } of findings) {
    (entries[rule] ??= []).push(route);
  }
  for (const rule of Object.keys(entries)) entries[rule] = [...new Set(entries[rule])].sort();
  return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
}

/** Split findings into unlisted ones and stale allowlist entries. */
export function compareToAllowlist(findings, allowlistEntries) {
  const key = (rule, route) => `${rule} ${route}`;
  const found = new Set(findings.map((f) => key(f.rule, f.route)));
  const listed = new Set();
  for (const [rule, routes] of Object.entries(allowlistEntries ?? {})) {
    for (const route of routes) listed.add(key(rule, route));
  }
  const unlisted = findings.filter((f) => !listed.has(key(f.rule, f.route)));
  const stale = [...listed].filter((k) => !found.has(k)).sort();
  return { unlisted, stale };
}

function parseArgs(argv) {
  const args = { build: path.join(ROOT, 'build'), allowlist: DEFAULT_ALLOWLIST, write: false };
  const value = (i, flag) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    return v;
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--build') args.build = path.resolve(value(i++, '--build'));
    else if (argv[i] === '--allowlist') args.allowlist = path.resolve(value(i++, '--allowlist'));
    else if (argv[i] === '--write-allowlist') args.write = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(path.join(args.build, 'index.html'))) {
    console.error(`No built site at ${args.build}. Run the build first.`);
    process.exit(2);
  }
  const { total, indexable, hard, advisory } = checkBuild(args.build);

  if (args.write) {
    const payload = {
      _comment:
        'Ratchet for scripts/check-built-metadata.mjs. Known hard findings on the built site, by rule. ' +
        'Remove an entry in the PR that fixes it (stale entries fail the run). Never add one to silence a new regression.',
      entries: toAllowlist(hard),
    };
    fs.writeFileSync(args.allowlist, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote ${hard.length} known findings to ${path.relative(ROOT, args.allowlist)}`);
    return;
  }

  const allowlist = fs.existsSync(args.allowlist) ? JSON.parse(fs.readFileSync(args.allowlist, 'utf8')) : { entries: {} };
  const { unlisted, stale } = compareToAllowlist(hard, allowlist.entries);

  console.log(`Metadata invariants: ${indexable} indexable pages of ${total} built pages.`);
  console.log(`Known (allowlisted) findings: ${hard.length - unlisted.length}. Advisory title-over-60: ${advisory.length}.`);
  for (const f of unlisted) console.error(`NEW   ${f.rule} ${f.route}: ${f.detail}`);
  for (const k of stale) console.error(`STALE ${k} (no longer reproduces: remove it from the allowlist)`);

  if (unlisted.length || stale.length) {
    console.error(`Metadata invariants failed: ${unlisted.length} new, ${stale.length} stale.`);
    process.exit(1);
  }
  console.log('Metadata invariants passed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
