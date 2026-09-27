#!/usr/bin/env node
/**
 * Layout matrix: every page in pages.json x 5 viewports x 2 themes.
 *
 *   node scripts/visual/matrix.mjs [--base http://localhost:3100]
 *     [--out visual-results/matrix] [--pages scripts/visual/pages.json]
 *     [--only home,faq] [--concurrency 3] [--tz America/New_York]
 *
 * Needs a served production build (npx docusaurus serve --port 3100).
 * For each combination it records hard checks (ratcheted against
 * known-issues.json), advisory notes (printed, never fail), and a full-page
 * capture with prefers-reduced-motion: reduce, so the homepage scroll reveal
 * does not blank the sections below the fold.
 *
 * Hard checks: page loads (status < 400 except the 404 route), horizontal
 * overflow, interactive elements overlapping line by line, touch targets
 * under 44x44 on touch viewports, no visible focus change on the first 25 tab
 * stops, axe-core wcag2a/2aa/21a/21aa/22aa violations.
 * Advisory: clipped text, layout shift over 0.1, images without width/height,
 * homepage sections not fully opaque in the unscrolled reduced-motion view.
 *
 * Exit 0: no new finding and no stale known-issues entry. Exit 1: either.
 * Exit 2: no server at --base.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import {
  loadKnownIssues,
  groupFindings,
  compareFindings,
  report,
  normalizeSelector,
  assertServerUp,
} from './ratchet.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

export const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740, touch: true },
  { name: '390x844', width: 390, height: 844, touch: true },
  { name: '768x1024', width: 768, height: 1024, touch: true },
  { name: '1280x800', width: 1280, height: 800, touch: false },
  { name: '1920x1080', width: 1920, height: 1080, touch: false },
];
const THEMES = ['light', 'dark'];
const MAX_CAPTURE_HEIGHT = 6000;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const TAP_MIN = 44;
const FOCUS_STOPS = 25;

function parseArgs(argv) {
  const args = {
    base: process.env.VISUAL_BASE_URL || 'http://localhost:3100',
    out: path.join(ROOT, 'visual-results', 'matrix'),
    pages: path.join(HERE, 'pages.json'),
    known: path.join(HERE, 'known-issues.json'),
    only: null,
    concurrency: 3,
    tz: 'America/New_York', // outside the consent banner's time zones
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') args.base = argv[++i];
    else if (a === '--out') args.out = path.resolve(argv[++i]);
    else if (a === '--pages') args.pages = path.resolve(argv[++i]);
    else if (a === '--known') args.known = path.resolve(argv[++i]);
    else if (a === '--only') args.only = argv[++i].split(',').map((s) => s.trim());
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10) || 3;
    else if (a === '--tz') args.tz = argv[++i];
    else throw new Error(`unknown argument ${a}`);
  }
  args.base = args.base.replace(/\/$/, '');
  return args;
}

// Init script: page-side helpers every check below uses.
function describeInPage() {
  // Elements a reader can see and tap. Transparent (hover-only heading
  // anchors), off-canvas (closed drawer) and aria-hidden elements are not
  // targets.
  window.__sgInteractive = () => {
    const vw = window.innerWidth;
    return Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')).filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.right <= 0 || r.left >= vw) return false;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      return !el.closest('[aria-hidden="true"], [inert]');
    });
  };
  // tag + two classes, else prefixed by the nearest ancestor that has a class.
  window.__sgDescribe = (el) => {
    const own = (e) => {
      const cls =
        typeof e.className === 'string' && e.className.trim()
          ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
      return `${e.tagName.toLowerCase()}${cls}`;
    };
    const self = own(el);
    if (self.includes('.')) return self;
    let p = el.parentElement;
    while (p && p !== document.body) {
      const d = own(p);
      if (d.includes('.')) return `${d} ${self}`;
      p = p.parentElement;
    }
    return self;
  };
}

async function seedThemeAndGoto(page, url, theme) {
  // Never set data-theme directly (React inline styles would not follow):
  // load once, seed localStorage, load again.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.evaluate((t) => {
    try {
      window.localStorage.setItem('theme', t);
    } catch {
      /* storage blocked */
    }
  }, theme);
  return page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
}

async function waitForStable(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
}

async function triggerLazyLoad(page) {
  await page
    .evaluate(async () => {
      const step = Math.max(200, window.innerHeight);
      const total = document.scrollingElement.scrollHeight;
      for (let y = 0; y < total; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    })
    .catch(() => {});
  await page.waitForTimeout(300);
}

async function installLayoutShiftObserver(page) {
  await page.addInitScript(() => {
    window.__clsEntries = [];
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) window.__clsEntries.push(e.value);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* unsupported */
    }
  });
}

async function homeSectionOpacity(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.home-section'))
      .map((el, i) => ({ i, opacity: Number(getComputedStyle(el).opacity) }))
      .filter((s) => s.opacity < 1),
  );
}

async function checkOverflow(page) {
  return page.evaluate(() => {
    const innerWidth = window.innerWidth;
    const scrollWidth = document.scrollingElement.scrollWidth;
    const offenders = [];
    if (scrollWidth > innerWidth + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > innerWidth + 2 && r.width > 0) offenders.push(window.__sgDescribe(el));
        if (offenders.length >= 10) break;
      }
    }
    const clipped = [];
    for (const el of document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, button, li, td, th, label')) {
      if (el.closest('.sr-only, .visually-hidden')) continue;
      const cs = getComputedStyle(el);
      if (
        (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') &&
        el.scrollWidth > el.clientWidth + 2 &&
        el.textContent.trim()
      ) {
        clipped.push(window.__sgDescribe(el));
      }
      if (clipped.length >= 25) break;
    }
    return { overflow: scrollWidth > innerWidth + 1, scrollWidth, innerWidth, offenders, clipped };
  });
}

async function checkTapTargets(page, min) {
  return page.evaluate((min) => {
      const small = [];
      for (const el of window.__sgInteractive()) {
        const r = el.getBoundingClientRect();
        if (r.width >= min && r.height >= min) continue;
        // Links inside running text are exempt (WCAG 2.5.8 "inline").
        const parent = el.parentElement;
        const inline =
          el.tagName === 'A' &&
          parent &&
          ['P', 'LI', 'SPAN', 'TD', 'EM', 'STRONG'].includes(parent.tagName) &&
          parent.textContent.trim().length > el.textContent.trim().length;
        if (inline) continue;
        small.push({ sel: window.__sgDescribe(el), size: `${Math.round(r.width)}x${Math.round(r.height)}` });
      }
      return small;
    }, min);
}

// Overlap is judged line box by line box (getClientRects), so a link that
// wraps onto two lines is not reported as covering its neighbours.
async function checkOverlaps(page) {
  return page.evaluate(() => {
    const els = window.__sgInteractive().slice(0, 200);
    const rects = els.map((el) => Array.from(el.getClientRects()).filter((r) => r.width > 0 && r.height > 0));
    const out = [];
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
        let hit = null;
        for (const a of rects[i]) {
          for (const b of rects[j]) {
            const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ix > 4 && iy > 4) hit = `${Math.round(ix)}x${Math.round(iy)}`;
          }
        }
        if (hit) out.push({ a: window.__sgDescribe(els[i]), b: window.__sgDescribe(els[j]), px: hit });
        if (out.length >= 15) return out;
      }
    }
    return out;
  });
}

// Tab through the first stops and compare the focused element's outline,
// box-shadow, border and background against the same element unfocused.
// Iframes are skipped: focus moves into the frame's own document.
async function checkFocusVisible(page) {
  const missing = [];
  await page.keyboard.press('Tab');
  for (let i = 0; i < FOCUS_STOPS; i++) {
    const info = await page
      .evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el.tagName === 'IFRAME') return null;
        const snap = () => {
          const cs = getComputedStyle(el);
          return [
            `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
            cs.boxShadow,
            cs.borderColor,
            cs.backgroundColor,
            cs.textDecorationLine,
          ].join('|');
        };
        const focused = snap();
        const outlineNone = getComputedStyle(el).outlineStyle === 'none';
        el.blur();
        const rest = snap();
        el.focus({ preventScroll: true });
        return { sel: window.__sgDescribe(el), same: focused === rest && outlineNone };
      })
      .catch(() => null);
    if (info?.same) missing.push(info.sel);
    await page.keyboard.press('Tab');
  }
  return [...new Set(missing)];
}

async function runAxe(page) {
  // Legacy mode runs axe inside the page instead of opening a helper page
  // (which fails intermittently in mobile contexts). Embedded iframes (the
  // sandboxed CodePreview and ScrimSandbox previews, video players) are not
  // our markup and a script-less sandbox never answers axe's frame
  // handshake, so frames are left out.
  const res = await new AxeBuilder({ page })
    .options({ iframes: false }) // before withTags: options() replaces runOnly
    .withTags(AXE_TAGS)
    .setLegacyMode(true)
    .analyze();
  const out = [];
  for (const v of res.violations) {
    for (const n of v.nodes.slice(0, 10)) {
      // axe targets are nth-child paths that shift with content; key the
      // finding on the element's own description instead.
      const target = n.target.length === 1 && typeof n.target[0] === 'string' ? n.target[0] : null;
      const desc = target
        ? await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            return el ? window.__sgDescribe(el) : null;
          }, target).catch(() => null)
        : null;
      out.push({ rule: v.id, target: normalizeSelector(desc || n.target.join(' ')), impact: v.impact });
    }
  }
  return out;
}

const TASK_DEADLINE_MS = 180000;

// Run one page x viewport x theme with a deadline. Past it, the context is
// closed (which rejects whatever call was stuck) and a harness-error
// finding is returned.
function auditWithDeadline(browser, args, pageDef, vp, theme) {
  const ref = {};
  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => {
      ref.context?.close().catch(() => {});
      resolve({
        findings: [{ id: `harness-error:${pageDef.url}`, where: `${pageDef.url} @${vp.name} ${theme}`, detail: 'deadline' }],
        advisory: [],
      });
    }, TASK_DEADLINE_MS);
  });
  return Promise.race([auditOne(browser, args, pageDef, vp, theme, ref), deadline]).finally(() => clearTimeout(timer));
}

async function auditOne(browser, args, pageDef, vp, theme, ref = {}) {
  const where = `${pageDef.url} @${vp.name} ${theme}`;
  const step = (n) => process.env.VISUAL_DEBUG && console.log(`  ${where}: ${n}`);
  const findings = [];
  const advisory = [];
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: vp.touch,
    isMobile: vp.touch,
    timezoneId: args.tz,
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  ref.context = context;
  context.setDefaultTimeout(30000);
  try {
    const page = await context.newPage();
    await page.addInitScript(describeInPage);
    await installLayoutShiftObserver(page);
    step('seedThemeAndGoto');
    const resp = await seedThemeAndGoto(page, args.base + pageDef.url, theme);
    const status = resp ? resp.status() : 0;
    if (!pageDef.expectNotFound && (status === 0 || status >= 400)) {
      findings.push({ id: `load:${pageDef.url}`, where, detail: `HTTP ${status}` });
      return { findings, advisory };
    }
    step('waitForStable');
    await waitForStable(page);

    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (dataTheme !== theme) findings.push({ id: `theme-not-applied:${theme}`, where, detail: `data-theme=${dataTheme}` });

    // Measured before any scroll: with reduced motion every homepage section
    // must already be fully visible.
    step('homeSectionOpacity');
    for (const s of await homeSectionOpacity(page)) {
      advisory.push({ id: `home-section-opacity:${s.i}`, where, detail: `opacity ${s.opacity}` });
    }

    step('triggerLazyLoad');

    await triggerLazyLoad(page);
    step('waitForStable');
    await waitForStable(page);

    step('checkOverflow');

    const ov = await checkOverflow(page);
    if (ov.overflow) {
      findings.push({
        id: `overflow:${pageDef.url}@${vp.name}`,
        where,
        detail: `scrollWidth ${ov.scrollWidth} > ${ov.innerWidth}: ${ov.offenders.slice(0, 3).join(', ')}`,
      });
    }
    for (const c of ov.clipped) advisory.push({ id: `clipped-text:${c}`, where });

    if (vp.touch) {
      step('checkTapTargets');
      for (const t of await checkTapTargets(page, TAP_MIN)) {
        findings.push({ id: `tap-target:${normalizeSelector(t.sel)}`, where: `${where} (${t.size})` });
      }
    }

    step('checkOverlaps');

    for (const o of await checkOverlaps(page)) {
      const pair = [normalizeSelector(o.a), normalizeSelector(o.b)].sort().join(' | ');
      findings.push({ id: `overlap:${pair}`, where: `${where} (${o.px})` });
    }

    const cls = (await page.evaluate(() => window.__clsEntries || []).catch(() => [])).reduce((s, v) => s + v, 0);
    if (cls > 0.1) advisory.push({ id: `layout-shift:${pageDef.url}`, where, detail: cls.toFixed(3) });

    // axe runs before the tab walk, at the top of the page, so the result
    // does not depend on where the last tab stop scrolled to.
    await page.evaluate(() => window.scrollTo(0, 0));
    step('runAxe');
    for (const v of await runAxe(page)) {
      findings.push({ id: `axe:${v.rule}:${v.target}`, where, detail: v.impact });
    }

    step('checkFocusVisible');

    for (const sel of await checkFocusVisible(page)) {
      findings.push({ id: `focus-ring:${normalizeSelector(sel)}`, where });
    }
    await page.evaluate(() => document.activeElement?.blur?.()).catch(() => {});

    const noDims = await page.evaluate(
      () => Array.from(document.querySelectorAll('img')).filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
    );
    if (noDims) advisory.push({ id: `img-missing-dimensions:${pageDef.url}`, where, detail: `${noDims} images` });

    // Capture last, with nothing focused and the page at the top.
    await page.evaluate(() => {
      document.activeElement?.blur?.();
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(150);
    const height = await page.evaluate(() => document.scrollingElement.scrollHeight);
    await page.screenshot({
      path: path.join(args.out, `${pageDef.slug}__${vp.name}__${theme}.png`),
      fullPage: true,
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(height, MAX_CAPTURE_HEIGHT) },
    });
  } catch (e) {
    findings.push({ id: `harness-error:${pageDef.url}`, where, detail: String(e?.message || e).split('\n')[0] });
  } finally {
    await context.close().catch(() => {});
  }
  return { findings, advisory };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await assertServerUp(args.base + '/');
  fs.mkdirSync(args.out, { recursive: true });
  const known = loadKnownIssues(args.known);
  const allPages = JSON.parse(fs.readFileSync(args.pages, 'utf8'));
  const pages = args.only ? allPages.filter((p) => args.only.includes(p.slug)) : allPages;
  const fullRun = !args.only && args.pages === path.join(HERE, 'pages.json');

  const tasks = [];
  for (const p of pages) for (const vp of VIEWPORTS) for (const theme of THEMES) tasks.push({ p, vp, theme });

  const browser = await chromium.launch({ headless: true });
  const raw = [];
  const rawAdvisory = [];
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < tasks.length) {
      const t = tasks[next++];
      let out = await auditWithDeadline(browser, args, t.p, t.vp, t.theme);
      // One retry for harness trouble (a crashed tab, a stuck protocol call);
      // a real page defect reproduces, harness noise does not.
      if (out.findings.some((f) => f.id.startsWith('harness-error:'))) {
        out = await auditWithDeadline(browser, args, t.p, t.vp, t.theme);
      }
      const { findings, advisory } = out;
      raw.push(...findings);
      rawAdvisory.push(...advisory);
      done++;
      console.log(`[${done}/${tasks.length}] ${t.p.slug} ${t.vp.name} ${t.theme}${findings.length ? ` (${findings.length} findings)` : ''}`);
    }
  }
  await Promise.all(Array.from({ length: args.concurrency }, worker));
  await browser.close();

  const findings = groupFindings(raw);
  const advisory = groupFindings(rawAdvisory);
  const result = compareFindings({ findings, known, harness: 'matrix', fullRun });
  fs.writeFileSync(
    path.join(args.out, 'results.json'),
    JSON.stringify({ base: args.base, fullRun, axeTags: AXE_TAGS, ...result, advisory }, null, 2),
  );
  process.exitCode = report({ harness: 'matrix', result, advisory, fullRun });
  console.log(`\nCaptures and results.json in ${path.relative(process.cwd(), args.out) || '.'}`);
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
