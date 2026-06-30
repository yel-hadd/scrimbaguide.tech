/**
 * Generates unique social card images (SVG + PNG) for each blog post.
 *
 * Design system:
 *   - Size: 1200x630 (Open Graph standard)
 *   - Background: #5b3fd9 (ScrimbaGuide brand purple)
 *   - Accent circles: white at 5% opacity for depth
 *   - Title: white, bold, auto-fit font size, up to 4 lines (ellipsis only if it overflows)
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

// ---------- Title layout ----------
const TITLE_X = 80;                 // left edge of title text
const TITLE_RIGHT_PADDING = 90;     // keep title clear of the right border
const TITLE_MAX_WIDTH = WIDTH - TITLE_X - TITLE_RIGHT_PADDING; // ~1030px usable
const TITLE_MAX_LINES = 4;          // hard cap before we truncate
const TITLE_FONT_SIZES = [66, 62, 58, 54, 50, 46, 42]; // tried largest-first
const CHAR_WIDTH_RATIO = 0.56;      // approx avg glyph width / font-size for bold sans

/** Greedy word-wrap using an estimated chars-per-line for a given font size. */
function wrapToWidth(text, fontSize) {
  const maxChars = Math.max(8, Math.floor(TITLE_MAX_WIDTH / (fontSize * CHAR_WIDTH_RATIO)));
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && current.length + 1 + word.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current += (current ? ' ' : '') + word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Auto-fit the title: pick the largest font size whose word-wrap fits within
 * TITLE_MAX_LINES. Only truncate (with an ellipsis) if even the smallest size
 * overflows. Returns { lines, fontSize }.
 */
function fitTitle(title) {
  for (const fontSize of TITLE_FONT_SIZES) {
    const lines = wrapToWidth(title, fontSize);
    if (lines.length <= TITLE_MAX_LINES) return { lines, fontSize };
  }
  const fontSize = TITLE_FONT_SIZES[TITLE_FONT_SIZES.length - 1];
  const lines = wrapToWidth(title, fontSize);
  lines.length = TITLE_MAX_LINES;
  // drop the dangling partial word + trailing punctuation, then ellipsize
  lines[TITLE_MAX_LINES - 1] =
    lines[TITLE_MAX_LINES - 1].replace(/\s+\S*$/, '').replace(/[\s.,:;]+$/, '') + '…';
  return { lines, fontSize };
}

/**
 * Normalize frontmatter slug into a safe social-card filename.
 * Examples:
 *   /blog/my-post      -> my-post
 *   blog/my-post/      -> my-post
 *   guides/react/hooks -> guides-react-hooks
 */
function toCardSlug(rawSlug) {
  return rawSlug
    .trim()
    .replace(/^\/+/, '')
    .replace(/^blog\//, '')
    .replace(/\/+$/, '')
    .replace(/\//g, '-');
}

/** Generate SVG social card */
function generateSVG(title, category) {
  const { lines, fontSize } = fitTitle(title);
  const lineHeight = Math.round(fontSize * 1.22);
  const totalTextHeight = lines.length * lineHeight;
  const startY = (HEIGHT / 2) - (totalTextHeight / 2) + 20;

  const categoryLabel = CATEGORY_MAP[category] || 'Guide';

  const titleLines = lines.map((line, i) => {
    const y = startY + (i * lineHeight);
    return `    <text x="${TITLE_X}" y="${y}"
          dominant-baseline="middle"
          text-anchor="start"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          font-weight="800"
          font-size="${fontSize}"
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
    Scrimba Guide
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

const UPDATE_FM = process.argv.includes('--update-frontmatter');
const blogFiles = readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
let generated = 0;
let skipped = 0;
let fmUpdated = 0;

for (const file of blogFiles) {
  let content = readFileSync(join(BLOG_DIR, file), 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const fm = fmMatch[1];
  const slugMatch = fm.match(/^slug:\s*(.+)$/m);
  const titleMatch = fm.match(/^title:\s*"(.+)"$/m);
  const tagsMatch = fm.match(/^tags:\s*\[(.+)\]$/m);

  if (!slugMatch || !titleMatch) continue;

  const slug = slugMatch[1].trim();
  const cardSlug = toCardSlug(slug);
  const title = titleMatch[1].trim();
  const firstTag = tagsMatch ? tagsMatch[1].split(',')[0].trim() : 'guide';
  const categoryLabel = CATEGORY_MAP[firstTag] || 'Guide';

  const imagePath = `/img/blog/${cardSlug}.png`;
  const altText = `${title} — Scrimba Guide ${categoryLabel}`;

  // ---- Backfill frontmatter ----
  const hasImage = /^image:\s/m.test(fm);
  const hasAlt = /^image_alt:\s/m.test(fm);
  let needsWrite = false;

  if (!hasImage) {
    // Insert image: after the image line or after slug:
    content = content.replace(
      /^(slug:\s*.+)$/m,
      `$1\nimage: ${imagePath}`
    );
    needsWrite = true;
  }

  if (!hasAlt) {
    // Insert image_alt: after image:
    content = content.replace(
      /^(image:\s*.+)$/m,
      `$1\nimage_alt: "${altText}"`
    );
    needsWrite = true;
  }

  if (needsWrite) {
    writeFileSync(join(BLOG_DIR, file), content);
    fmUpdated++;
  }

  // Skip image generation if only updating frontmatter
  if (UPDATE_FM) continue;

  const svgPath = join(IMG_DIR, `${cardSlug}.svg`);
  const pngPath = join(IMG_DIR, `${cardSlug}.png`);

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
    console.error(`  Failed to convert ${cardSlug}: ${err.message}`);
    generated++;
  }
}

if (fmUpdated) console.log(`✓ Updated frontmatter in ${fmUpdated} blog posts`);
if (!UPDATE_FM) {
  console.log(`✓ Generated ${generated} social card images`);
  if (skipped) console.log(`  Skipped ${skipped} (already exist, use --force to regenerate)`);
  console.log(`  Output: static/img/blog/{slug}.png`);
}
