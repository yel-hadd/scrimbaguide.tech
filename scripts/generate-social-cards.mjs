/**
 * Generates unique social card images (SVG + PNG) for each blog post.
 *
 * Design system:
 *   - Size: 1200x630 (Open Graph standard)
 *   - Background: #5b3fd9 (ScrimbaGuide brand purple)
 *   - Accent circles: white at 5% opacity for depth
 *   - Title: white, bold, max 3 lines with word-wrap
 *   - Brand badge: "ScrimbaGuide" top-left
 *   - Category pill: bottom-right, white at 15% opacity
 *   - Border: rounded rect, white at 30% opacity
 *   - Font: system sans-serif stack
 *
 * Requires: rsvg-convert (librsvg) for PNG conversion
 *
 * Run:   node scripts/generate-social-cards.mjs
 * Regen: node scripts/generate-social-cards.mjs --force
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_DIR = join(ROOT, 'blog');
const IMG_DIR = join(ROOT, 'static', 'img', 'blog');

const FORCE = process.argv.includes('--force');

// Ensure output directory exists
mkdirSync(IMG_DIR, { recursive: true });

// ---------- Design tokens ----------
const BRAND_COLOR = '#5b3fd9';
const BRAND_LIGHT = '#7c5ce7';
const TEXT_WHITE = '#ffffff';
const TEXT_MUTED = '#e0d9ff';
const WIDTH = 1200;
const HEIGHT = 630;

// ---------- Category icons (simple text labels) ----------
const CATEGORY_MAP = {
  review: 'Review',
  comparison: 'Comparison',
  guide: 'Guide',
  pricing: 'Pricing',
  courses: 'Courses',
  career: 'Career',
  ai: 'AI',
};

// ---------- Helpers ----------

/** Escape XML special chars */
function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Word-wrap text to fit within maxWidth (approximate char count per line) */
function wrapText(text, maxCharsPerLine = 28) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 > maxCharsPerLine && current.length > 0) {
      lines.push(current.trim());
      current = word;
    } else {
      current += (current ? ' ' : '') + word;
    }
  }
  if (current) lines.push(current.trim());

  // Cap at 3 lines
  if (lines.length > 3) {
    lines.length = 3;
    lines[2] = lines[2].replace(/\s+\S*$/, '') + '...';
  }

  return lines;
}

/** Generate SVG social card */
function generateSVG(title, category) {
  const lines = wrapText(title, 26);
  const lineHeight = 72;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (HEIGHT / 2) - (totalTextHeight / 2) + 20;

  const categoryLabel = CATEGORY_MAP[category] || 'Guide';

  const titleLines = lines.map((line, i) => {
    const y = startY + (i * lineHeight);
    return `    <text x="80" y="${y}"
          dominant-baseline="middle"
          text-anchor="start"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          font-weight="800"
          font-size="58"
          fill="${TEXT_WHITE}"
          letter-spacing="-1">
      ${esc(line)}
    </text>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND_COLOR}"/>
      <stop offset="100%" stop-color="${BRAND_LIGHT}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Subtle pattern overlay -->
  <circle cx="950" cy="80" r="350" fill="${TEXT_WHITE}" fill-opacity="0.04"/>
  <circle cx="150" cy="550" r="250" fill="${TEXT_WHITE}" fill-opacity="0.04"/>
  <circle cx="1100" cy="500" r="200" fill="${TEXT_WHITE}" fill-opacity="0.03"/>

  <!-- Border -->
  <rect x="20" y="20" width="${WIDTH - 40}" height="${HEIGHT - 40}" rx="20" fill="none" stroke="${TEXT_WHITE}" stroke-width="3" stroke-opacity="0.2"/>

  <!-- Brand badge top-left -->
  <rect x="60" y="45" width="50" height="50" rx="10" fill="${TEXT_WHITE}" fill-opacity="0.15"/>
  <text x="85" y="75"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-weight="800"
        font-size="22"
        fill="${TEXT_WHITE}">
    SG
  </text>
  <text x="125" y="75"
        dominant-baseline="central"
        text-anchor="start"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-weight="600"
        font-size="22"
        fill="${TEXT_MUTED}">
    ScrimbaGuide
  </text>

  <!-- Category pill bottom-right -->
  <rect x="${WIDTH - 60 - (categoryLabel.length * 13 + 30)}" y="${HEIGHT - 90}" width="${categoryLabel.length * 13 + 30}" height="38" rx="19" fill="${TEXT_WHITE}" fill-opacity="0.15"/>
  <text x="${WIDTH - 60 - (categoryLabel.length * 13 + 30) / 2}" y="${HEIGHT - 68}"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-weight="600"
        font-size="18"
        fill="${TEXT_MUTED}">
    ${esc(categoryLabel)}
  </text>

  <!-- Tagline bottom-left -->
  <text x="80" y="${HEIGHT - 68}"
        dominant-baseline="central"
        text-anchor="start"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-weight="400"
        font-size="22"
        fill="${TEXT_MUTED}"
        fill-opacity="0.7">
    scrimbaguide.tech
  </text>

  <!-- Title text -->
${titleLines}
</svg>`;
}

// ---------- Main ----------

// Parse blog posts
import { readdirSync } from 'fs';

const blogFiles = readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
let generated = 0;
let skipped = 0;

for (const file of blogFiles) {
  const content = readFileSync(join(BLOG_DIR, file), 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const fm = fmMatch[1];
  const slugMatch = fm.match(/^slug:\s*(.+)$/m);
  const titleMatch = fm.match(/^title:\s*"(.+)"$/m);
  const tagsMatch = fm.match(/^tags:\s*\[(.+)\]$/m);

  if (!slugMatch || !titleMatch) continue;

  const slug = slugMatch[1].trim();
  const title = titleMatch[1].trim();
  const firstTag = tagsMatch ? tagsMatch[1].split(',')[0].trim() : 'guide';

  const svgPath = join(IMG_DIR, `${slug}.svg`);
  const pngPath = join(IMG_DIR, `${slug}.png`);

  if (!FORCE && existsSync(pngPath)) {
    skipped++;
    continue;
  }

  const svg = generateSVG(title, firstTag);
  writeFileSync(svgPath, svg);

  // Convert SVG -> PNG via rsvg-convert
  try {
    execSync(`rsvg-convert -w ${WIDTH} -h ${HEIGHT} "${svgPath}" -o "${pngPath}"`, {
      stdio: 'pipe',
    });
    generated++;
  } catch (err) {
    console.error(`  Failed to convert ${slug}: ${err.message}`);
    generated++;
  }
}

console.log(`✓ Generated ${generated} social card images`);
if (skipped) console.log(`  Skipped ${skipped} (already exist, use --force to regenerate)`);
console.log(`  Output: static/img/blog/{slug}.png`);
