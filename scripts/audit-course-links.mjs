#!/usr/bin/env node
/**
 * Link-coverage checklist for docs/ and blog/.
 *
 * Reports two things:
 *   1. Raw scrimba.com URLs that bypass <AffiliateLink> (markdown links, <a>,
 *      bare text). URLs inside AffiliateLink, inside components that wrap it
 *      (CourseCard, ScrimPoster, PricingCTA, ...), inside schema components,
 *      and scrimba.com/explain/* links (bare on purpose) are not flagged.
 *   2. Named Scrimba courses and paths (from data/courses.json) mentioned in
 *      prose without a link. Mentions inside links, headings, code, component
 *      props and the page's own course are counted separately, not flagged.
 *
 * Usage:
 *   node scripts/audit-course-links.mjs            # summary + per-file list
 *   node scripts/audit-course-links.mjs --json out.json
 *   node scripts/audit-course-links.mjs --file docs/paths/frontend-developer-path.mdx
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const onlyFile = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

// Components that route their href through <AffiliateLink> internally.
const WRAPPERS = new Set([
  'AffiliateLink', 'CourseCard', 'ScrimPoster', 'PricingCTA', 'VerdictBox',
  'ComparisonTable', 'WhyScrimba', 'CodePreview', 'ExplainerEmbed',
  'LearningTimeCalculator', 'PathAdvisor', 'DesktopStickyCTA',
]);
const SCHEMA = new Set([
  'CourseSchema', 'HowToSchema', 'ReviewSchema', 'ItemListSchema',
  'VideoSchema', 'DocFaqSchema', 'PersonSchema', 'Head',
]);
// Elements whose children count as "linked text".
const LINK_ELEMENTS = new Set(['AffiliateLink', 'Link', 'a']);

// ---------- course / path name index ----------
const courses = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/courses.json'), 'utf8'));
const NON_COURSE = /^(best-|how-to-learn)/;

function findDoc(docSlug) {
  for (const dir of fs.readdirSync(path.join(ROOT, 'docs/courses'))) {
    const f = path.join(ROOT, 'docs/courses', dir, `${docSlug}.mdx`);
    if (fs.existsSync(f)) return { file: path.relative(ROOT, f), url: `/docs/courses/${dir}/${docSlug}/` };
  }
  return null;
}

const PATHS = {
  'frontend-path': { file: 'docs/paths/frontend-developer-path.mdx', url: '/docs/paths/frontend-developer-path/',
    aliases: ['Frontend Developer Career Path', 'Front-End Developer Career Path', 'Frontend Developer Path', 'Frontend Career Path', 'Frontend Path'] },
  'fullstack-path': { file: 'docs/paths/fullstack-developer-path.mdx', url: '/docs/paths/fullstack-developer-path/',
    aliases: ['Fullstack Developer Path', 'Full-Stack Developer Path', 'Fullstack Path', 'Full-Stack Path'] },
  'ai-engineer-path': { file: 'docs/paths/ai-engineer-path.mdx', url: '/docs/paths/ai-engineer-path/',
    aliases: ['AI Engineer Path', 'AI Engineering Path'] },
  'backend-developer-path': { file: 'docs/paths/backend-developer-path.mdx', url: '/docs/paths/backend-developer-path/',
    aliases: ['Backend Developer Path', 'Back-End Developer Path', 'Backend Path'] },
};
const EXTRA_ALIASES = {
  'git-and-github': ['Learn Git and GitHub'],
  'dall-e-and-gpt-vision': ['Intro to DALL-E and GPT Vision'],
  'model-context-protocol-mcp': ['Intro to MCP'],
  'whats-new-in-react-19': ["What's New in React 19"],
  'tricky-parts-of-javascript': ['Tricky Parts of JavaScript'],
  'a-space-travel-website': ['Space Travel website'],
};

const entities = [];
for (const c of courses) {
  if (NON_COURSE.test(c.docSlug)) continue;
  if (c.isPath) {
    const p = PATHS[c.docSlug];
    if (!p) continue;
    entities.push({ id: c.docSlug, kind: 'path', ...p, scrimbaUrl: c.scrimbaUrl, names: p.aliases });
  } else {
    const doc = findDoc(c.docSlug);
    const names = [c.cleanName, ...(EXTRA_ALIASES[c.docSlug] || [])];
    if (c.cleanName.startsWith('The ')) names.push(c.cleanName.slice(4));
    entities.push({ id: c.docSlug, kind: 'course', file: doc?.file, url: doc?.url, scrimbaUrl: c.scrimbaUrl, names });
  }
}
// Longest names first so "Learn React Router" wins over "Learn React".
const nameList = entities
  .flatMap((e) => e.names.map((n) => ({ name: n, entity: e })))
  .sort((a, b) => b.name.length - a.name.length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRe = new RegExp(`(?<![\\w-])(${nameList.map((n) => esc(n.name)).join('|')})(?![\\w-])`, 'g');
const byName = new Map(nameList.map((n) => [n.name, n.entity]));

// ---------- MDX scanning ----------
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return /\.mdx?$/.test(d.name) ? [p] : [];
  });
}

/** Scan JSX opening tags, respecting quotes, template strings and braces. */
function jsxTags(src) {
  const tags = [];
  const re = /<([A-Za-z][A-Za-z0-9]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    if (/^[a-z]/.test(name) && name !== 'a' && name !== 'div' && name !== 'span') continue;
    let i = m.index + m[0].length;
    let depth = 0;
    let quote = null;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === '\\') { i++; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        // Apostrophes in JSX text children are not quotes; only treat as quote inside braces or after '='.
        if (depth > 0 || src[i - 1] === '=') quote = ch;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    const selfClosing = src[i - 1] === '/';
    const tag = { name, start: m.index, openEnd: i + 1, selfClosing };
    if (!selfClosing) {
      const close = src.indexOf(`</${name}>`, tag.openEnd);
      tag.close = close === -1 ? tag.openEnd : close;
    }
    tags.push(tag);
    re.lastIndex = tag.openEnd;
  }
  return tags;
}

function lineOf(src, idx) {
  let n = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) n++;
  return n;
}

function blank(s) {
  return s.replace(/[^\n]/g, ' ');
}

function scanFile(abs) {
  const rel = path.relative(ROOT, abs);
  let src = fs.readFileSync(abs, 'utf8');
  // Frontmatter, fenced code, inline code, MDX comments, import/export lines -> blanked (keeps offsets).
  src = src.replace(/^---\n[\s\S]*?\n---\n/, blank);
  src = src.replace(/```[\s\S]*?```/g, blank);
  src = src.replace(/`[^`\n]*`/g, blank);
  src = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, blank);
  src = src.replace(/^(import|export) .*$/gm, blank);

  const tags = jsxTags(src);
  const inTagProps = (idx) => tags.find((t) => idx > t.start && idx < t.openEnd);
  const inLinkChildren = (idx) =>
    tags.find((t) => LINK_ELEMENTS.has(t.name) && !t.selfClosing && idx >= t.openEnd && idx < t.close);
  const mdLinks = [];
  const mdRe = /\[([^\]\n]*)\]\(([^)\s]+)[^)\n]*\)/g;
  let m;
  while ((m = mdRe.exec(src))) mdLinks.push({ start: m.index, textEnd: m.index + 1 + m[1].length, end: m.index + m[0].length, url: m[2] });
  const inMdText = (idx) => mdLinks.find((l) => idx > l.start && idx < l.textEnd);
  const inMdUrl = (idx) => mdLinks.find((l) => idx >= l.textEnd && idx < l.end);
  const lineStart = (idx) => src.lastIndexOf('\n', idx - 1) + 1;
  const isHeading = (idx) => /^#{1,6}\s/.test(src.slice(lineStart(idx), lineStart(idx) + 7));

  // 1. scrimba.com URLs
  const urls = [];
  const urlRe = /https?:\/\/(?:www\.)?scrimba\.com[^\s)"'`<>\]}]*/g;
  while ((m = urlRe.exec(src))) {
    const idx = m.index;
    const url = m[0];
    const tag = inTagProps(idx);
    let kind;
    if (/scrimba\.com\/explain\b/.test(url)) kind = /via=/.test(url) ? 'explain-with-via' : 'explain-bare-ok';
    else if (tag && WRAPPERS.has(tag.name)) kind = 'affiliate-ok';
    else if (tag && SCHEMA.has(tag.name)) kind = 'schema-ok';
    else if (tag && tag.name === 'a') kind = 'raw-a-tag';
    else if (tag) kind = `prop-of-${tag.name}`;
    else if (inMdUrl(idx)) kind = 'raw-markdown-link';
    else kind = 'raw-text';
    urls.push({ line: lineOf(src, idx), url, kind });
  }

  // 2. course / path mentions
  const mentions = [];
  const self = entities.find((e) => e.file === rel);
  while ((m = nameRe.exec(src))) {
    const idx = m.index;
    const entity = byName.get(m[1]);
    let kind;
    if (self && entity === self) kind = 'self';
    else if (inMdText(idx) || inLinkChildren(idx)) kind = 'linked';
    else if (isHeading(idx)) kind = 'heading';
    else if (inTagProps(idx)) kind = `prop-of-${inTagProps(idx).name}`;
    else kind = 'UNLINKED';
    mentions.push({ line: lineOf(src, idx), name: m[1], id: entity.id, kind, target: entity.url });
  }
  return { file: rel, urls, mentions };
}

const files = onlyFile
  ? [path.resolve(ROOT, onlyFile)]
  : [...walk(path.join(ROOT, 'docs')), ...walk(path.join(ROOT, 'blog'))].sort();
const results = files.map(scanFile);

// ---------- report ----------
const tally = (arr) => arr.reduce((o, x) => ((o[x.kind] = (o[x.kind] || 0) + 1), o), {});
const allUrls = results.flatMap((r) => r.urls.map((u) => ({ ...u, file: r.file })));
const allMentions = results.flatMap((r) => r.mentions.map((u) => ({ ...u, file: r.file })));
const rawUrls = allUrls.filter((u) => u.kind.startsWith('raw') || u.kind === 'explain-with-via' || u.kind.startsWith('prop-of'));
const unlinked = allMentions.filter((u) => u.kind === 'UNLINKED');
// "First unlinked mention per entity per file" is the actionable subset: link the first one.
const firstUnlinked = [];
const seen = new Set();
for (const r of results) {
  const linkedIds = new Set(r.mentions.filter((x) => x.kind === 'linked').map((x) => x.id));
  for (const x of r.mentions) {
    const k = `${r.file}|${x.id}`;
    if (x.kind !== 'UNLINKED' || seen.has(k)) continue;
    seen.add(k);
    firstUnlinked.push({ ...x, file: r.file, linkedElsewhereOnPage: linkedIds.has(x.id) });
  }
}
const neverLinked = firstUnlinked.filter((x) => !x.linkedElsewhereOnPage);

const summary = {
  filesScanned: results.length,
  scrimbaUrls: tally(allUrls),
  courseMentions: tally(allMentions),
  unlinkedMentions: unlinked.length,
  entitiesNeverLinkedOnPage: neverLinked.length,
  filesWithRawUrls: new Set(rawUrls.map((u) => u.file)).size,
  filesWithNeverLinkedMentions: new Set(neverLinked.map((u) => u.file)).size,
};

if (jsonOut) {
  fs.writeFileSync(jsonOut, JSON.stringify({ summary, rawUrls, neverLinked, firstUnlinked, unlinked }, null, 2));
}

console.log('# Link coverage audit\n');
console.log(JSON.stringify(summary, null, 2));
console.log('\n## Raw scrimba.com URLs (fix: wrap in <AffiliateLink>)\n');
for (const u of rawUrls) console.log(`${u.file}:${u.line}  [${u.kind}]  ${u.url}`);
console.log('\n## Courses/paths named but never linked on the page (fix: link first mention)\n');
const byFile = {};
for (const x of neverLinked) (byFile[x.file] ||= []).push(x);
for (const [f, xs] of Object.entries(byFile)) {
  console.log(`${f}`);
  for (const x of xs) console.log(`  :${x.line}  ${x.name}  -> ${x.target ?? '(no review page)'}`);
}
