#!/usr/bin/env node
/**
 * Interactive-component checks for scrimbaguide.tech.
 *
 *   node scripts/visual/interactions.mjs [--base http://localhost:3100]
 *     [--out visual-results/interactions]
 *
 * Needs a served production build (npx docusaurus serve --port 3100).
 * Covers ImageLightbox, PathAdvisor, FAQAccordion, ScrimSandbox,
 * LearningTimeCalculator, CodePreview, ConsentBanner, MegaMenu, the mobile
 * drawer's Resources collapsible, search (modal, Ctrl+K, /search/), the docs
 * sidebar, the footer, DesktopStickyCTA, keyboard focus in the navbar and a
 * dark-theme sweep. Every failed check is a finding, ratcheted against
 * known-issues.json (harness "interactions"). Screenshots and results.json
 * go to --out.
 *
 * Theme is seeded through localStorage before navigation, never by setting
 * data-theme. Contexts use prefers-reduced-motion: reduce, and the focused
 * element is blurred before each capture unless focus is what the capture
 * shows.
 *
 * Exit 0: no new failure and no stale entry. Exit 1: either. Exit 2: no
 * server at --base.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { loadKnownIssues, groupFindings, compareFindings, report, assertServerUp } from './ratchet.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : def;
}
const BASE = getArg('base', process.env.VISUAL_BASE_URL || 'http://localhost:3100').replace(/\/$/, '');
const OUT = path.resolve(getArg('out', path.join(ROOT, 'visual-results', 'interactions')));
const KNOWN = path.resolve(getArg('known', path.join(HERE, 'known-issues.json')));

const results = [];
function record(name, pass, detail, screenshot) {
  results.push({ name, pass, detail: detail || null, screenshot: screenshot ? path.basename(screenshot) : null });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
}

function shot(file) {
  return path.join(OUT, file);
}

// Capture with nothing focused, so a leftover focus ring never reads as a
// defect. Pass { keepFocus: true } when the focus state is the subject.
async function snap(page, file, { keepFocus = false } = {}) {
  if (!keepFocus) await page.evaluate(() => document.activeElement?.blur?.()).catch(() => {});
  await page.screenshot({ path: file });
}

async function seedTheme(page, url, theme) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate((t) => {
    try {
      window.localStorage.setItem('theme', t);
    } catch {}
  }, theme);
  await page.goto(url, { waitUntil: 'networkidle' });
  return page.evaluate(() => document.documentElement.getAttribute('data-theme'));
}

async function freshContext(browser, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 800 },
    timezoneId: opts.timezoneId || 'America/New_York',
    reducedMotion: 'reduce',
  });
  ctx.setDefaultTimeout(30000);
  return ctx;
}

// The search worker's first query can take well over 600 ms. Wait for a
// result row or the empty state instead of a fixed delay.
async function waitForSearchSettled(page) {
  await page
    .waitForFunction(
      () =>
        !!document.querySelector('.sg-search-result') ||
        /No results found/.test(document.querySelector('.sg-search-status')?.textContent || ''),
      null,
      { timeout: 10000 },
    )
    .catch(() => {});
}

async function main() {
  await assertServerUp(`${BASE}/`);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ---------------------------------------------------------------
  // 1. ImageLightbox - multi-image page (docs/courses/react/react-router/)
  //    and single-image page (docs/paths/fullstack-developer-path/)
  // ---------------------------------------------------------------
  for (const theme of ['light', 'dark']) {
    for (const vp of [{ w: 390, h: 844, tag: 'mobile' }, { w: 1280, h: 800, tag: 'desktop' }]) {
      const ctx = await freshContext(browser, { viewport: { width: vp.w, height: vp.h } });
      const page = await ctx.newPage();
      const url = `${BASE}/docs/courses/react/react-router/`;
      const actualTheme = await seedTheme(page, url, theme);
      record(
        `lightbox-multi:${theme}:${vp.tag}:theme-applied`,
        actualTheme === theme,
        `data-theme=${actualTheme}`,
      );

      const figures = await page.$$('figure.screenshot');
      if (figures.length < 2) {
        record(`lightbox-multi:${theme}:${vp.tag}:setup`, false, `only ${figures.length} figure.screenshot found, need >=2`);
        await ctx.close();
        continue;
      }
      const firstImgButton = figures[0];
      await firstImgButton.scrollIntoViewIfNeeded();
      const img = await firstImgButton.$('img');
      await img.click();
      await page.waitForSelector('.lightbox', { timeout: 5000 }).catch(() => {});
      const lightboxOpen = (await page.$('.lightbox')) !== null;
      record(`lightbox-multi:${theme}:${vp.tag}:open`, lightboxOpen, null, null);
      if (!lightboxOpen) {
        await ctx.close();
        continue;
      }
      // focus moves to the close button when the dialog opens
      const focusedIsClose = await page.evaluate(
        () => document.activeElement?.classList.contains('lightbox__close'),
      );
      const f1 = shot(`lightbox-multi-open-${theme}-${vp.tag}.png`);
      await snap(page, f1, { keepFocus: true });
      record(`lightbox-multi:${theme}:${vp.tag}:initial-focus-close`, focusedIsClose, null, f1);

      // scroll lock
      const overflowLocked = await page.evaluate(() => document.body.style.overflow === 'hidden');
      record(`lightbox-multi:${theme}:${vp.tag}:scroll-locked`, overflowLocked, null, null);

      // counter present
      const counterText = await page.$eval('.lightbox__counter', (el) => el.textContent).catch(() => null);
      record(`lightbox-multi:${theme}:${vp.tag}:counter-present`, !!counterText, counterText, null);

      // next
      const nextBtn = await page.$('.lightbox__nav--next');
      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(200);
        const counterAfterNext = await page.$eval('.lightbox__counter', (el) => el.textContent).catch(() => null);
        record(`lightbox-multi:${theme}:${vp.tag}:next-advances`, counterAfterNext !== counterText, `before=${counterText} after=${counterAfterNext}`, null);
        const f2 = shot(`lightbox-multi-next-${theme}-${vp.tag}.png`);
        await snap(page, f2, { keepFocus: true });

        // prev
        const prevBtn = await page.$('.lightbox__nav--prev');
        await prevBtn.click();
        await page.waitForTimeout(200);
        const counterAfterPrev = await page.$eval('.lightbox__counter', (el) => el.textContent).catch(() => null);
        record(`lightbox-multi:${theme}:${vp.tag}:prev-returns`, counterAfterPrev === counterText, `after-prev=${counterAfterPrev}`, null);
      } else {
        record(`lightbox-multi:${theme}:${vp.tag}:nav-buttons-present`, false, 'no .lightbox__nav--next found while count>1', f1);
      }

      // Escape close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      const closedByEsc = (await page.$('.lightbox')) === null;
      record(`lightbox-multi:${theme}:${vp.tag}:escape-closes`, closedByEsc, null, null);

      // scroll unlock restored
      const overflowRestored = await page.evaluate(() => document.body.style.overflow);
      record(
        `lightbox-multi:${theme}:${vp.tag}:scroll-restored`,
        overflowRestored === '' || overflowRestored === 'visible',
        `overflow="${overflowRestored}"`,
        null,
      );

      // reopen, test backdrop close
      const img2 = await (await page.$$('figure.screenshot'))[0].$('img');
      await img2.click();
      await page.waitForSelector('.lightbox', { timeout: 5000 }).catch(() => {});
      // click far corner of viewport (outside figure/nav)
      await page.mouse.click(5, 5);
      await page.waitForTimeout(200);
      const closedByBackdrop = (await page.$('.lightbox')) === null;
      record(`lightbox-multi:${theme}:${vp.tag}:backdrop-closes`, closedByBackdrop, null, null);

      await ctx.close();
    }
  }

  // Single-image page: no arrows/counter
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const url = `${BASE}/docs/paths/fullstack-developer-path/`;
    await seedTheme(page, url, 'light');
    const figures = await page.$$('figure.screenshot');
    if (figures.length === 1) {
      const img = await figures[0].$('img');
      await img.click();
      await page.waitForSelector('.lightbox', { timeout: 5000 }).catch(() => {});
      const open = (await page.$('.lightbox')) !== null;
      const f = shot('lightbox-single-open.png');
      if (open) await snap(page, f, { keepFocus: true });
      record('lightbox-single:open', open, null, open ? f : null);
      if (open) {
        const hasNav = (await page.$('.lightbox__nav')) !== null;
        const hasCounter = (await page.$('.lightbox__counter')) !== null;
        record('lightbox-single:no-arrows', !hasNav, null, f);
        record('lightbox-single:no-counter', !hasCounter, null, f);
      }
    } else {
      record('lightbox-single:setup', false, `expected 1 figure.screenshot, found ${figures.length}`);
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------
  // 2. PathAdvisor - /docs/paths/#path-advisor, every step + result
  // ---------------------------------------------------------------
  for (const vp of [{ w: 390, h: 844, tag: 'mobile' }, { w: 1280, h: 800, tag: 'desktop' }]) {
    const ctx = await freshContext(browser, { viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    const url = `${BASE}/docs/paths/`;
    await seedTheme(page, url, 'light');
    const advisor = await page.$('.path-advisor');
    record(`path-advisor:${vp.tag}:found`, !!advisor, null);
    if (!advisor) {
      await ctx.close();
      continue;
    }
    await advisor.scrollIntoViewIfNeeded();
    await snap(page, shot(`path-advisor-step0-${vp.tag}.png`));

    const stepSelections = [
      { name: 'experience', valueIndex: 0 },
      { name: 'goal', valueIndex: 0 },
      { name: 'hours', valueIndex: 0 },
      { name: 'situation', valueIndex: 0 },
    ];
    let stepOk = true;
    for (let s = 0; s < stepSelections.length; s++) {
      const choices = await page.$$('.path-advisor__choice');
      if (choices.length === 0) {
        stepOk = false;
        record(`path-advisor:${vp.tag}:step${s + 1}:choices-present`, false, 'no .path-advisor__choice buttons found');
        break;
      }
      await choices[0].click();
      await page.waitForTimeout(150);
      await snap(page, shot(`path-advisor-step${s + 1}-${vp.tag}.png`));
    }
    record(`path-advisor:${vp.tag}:steps-complete`, stepOk, null, shot(`path-advisor-step4-${vp.tag}.png`));

    // result screen
    const resultHeading = await page.$('h2, h3');
    await page.waitForTimeout(300);
    await snap(page, shot(`path-advisor-result-${vp.tag}.png`));
    const hasResult = await page.evaluate(() => {
      return !!document.querySelector('.path-advisor')?.textContent?.match(/path|recommend/i);
    });
    record(`path-advisor:${vp.tag}:result-shown`, hasResult, null, shot(`path-advisor-result-${vp.tag}.png`));

    await ctx.close();
  }

  // ---------------------------------------------------------------
  // 3. FAQAccordion open/closed - /docs/pricing/ or wherever FAQAccordion lives
  // ---------------------------------------------------------------
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const url = `${BASE}/docs/pricing/`;
    await seedTheme(page, url, 'light');
    const faq = await page.$('.faq-accordion');
    record('faq-accordion:found', !!faq, `on ${url}`);
    if (faq) {
      await faq.scrollIntoViewIfNeeded();
      await snap(page, shot('faq-closed.png'));
      const firstQ = await page.$('.faq-accordion__question');
      if (firstQ) {
        await firstQ.click();
        await page.waitForTimeout(200);
        const isOpen = await page.evaluate(
          () => !!document.querySelector('.faq-accordion__item--open'),
        );
        await snap(page, shot('faq-open.png'));
        record('faq-accordion:opens', isOpen, null, shot('faq-open.png'));
        await firstQ.click();
        await page.waitForTimeout(200);
        const isClosedAgain = await page.evaluate(
          () => !document.querySelector('.faq-accordion__item--open'),
        );
        record('faq-accordion:closes-on-toggle', isClosedAgain, null, null);
      } else {
        record('faq-accordion:question-button-present', false);
      }
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------
  // 4. ScrimSandbox interaction on homepage
  // ---------------------------------------------------------------
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await seedTheme(page, `${BASE}/`, 'light');
    const sandbox = await page.$('.scrim-window');
    record('scrim-sandbox:found', !!sandbox, 'on /');
    if (sandbox) {
      await sandbox.scrollIntoViewIfNeeded();
      await snap(page, shot('scrim-sandbox-initial.png'));
      const textarea = await page.$('.scrim-window__editor');
      if (textarea) {
        await textarea.click();
        await page.keyboard.press('End');
        await page.keyboard.type('\n<p>edited by harness</p>');
        const runBtn = await page.$('.scrim-window__run');
        await runBtn.click();
        await page.waitForTimeout(400);
        await snap(page, shot('scrim-sandbox-after-run.png'));
        const frameContent = await page
          .frameLocator('.scrim-window__preview')
          .locator('body')
          .textContent()
          .catch(() => null);
        record(
          'scrim-sandbox:run-updates-preview',
          !!frameContent && frameContent.includes('edited by harness'),
          frameContent ? frameContent.slice(0, 80) : 'no frame content',
          shot('scrim-sandbox-after-run.png'),
        );
      } else {
        record('scrim-sandbox:editor-present', false);
      }
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------
  // 5. LearningTimeCalculator input change
  // ---------------------------------------------------------------
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const url = `${BASE}/blog/how-long-to-learn-web-development-2026/`;
    let resp;
    try {
      resp = await page.goto(url, { waitUntil: 'networkidle' });
    } catch (e) {
      resp = null;
    }
    if (!resp || resp.status() >= 400) {
      record('learning-time-calc:page-found', false, `status=${resp ? resp.status() : 'error'} url=${url}`);
    } else {
      await page.evaluate(() => {
        try {
          window.localStorage.setItem('theme', 'light');
        } catch {}
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      const calc = await page.$('.ltc-wrapper');
      record('learning-time-calc:found', !!calc, url);
      if (calc) {
        await calc.scrollIntoViewIfNeeded();
        const before = await page.$eval('.ltc-months', (el) => el.textContent).catch(() => null);
        await snap(page, shot('learning-time-calc-before.png'));
        const selects = await page.$$('.ltc-field select');
        if (selects.length > 0) {
          await selects[0].selectOption({ index: 2 }).catch(() => {});
        }
        const range = await page.$('.ltc-field input[type="range"]');
        if (range) {
          await range.fill('40').catch(async () => {
            await range.click();
            for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
          });
        }
        await page.waitForTimeout(200);
        const after = await page.$eval('.ltc-months', (el) => el.textContent).catch(() => null);
        await snap(page, shot('learning-time-calc-after.png'));
        record(
          'learning-time-calc:input-updates-result',
          before !== after,
          `before="${before}" after="${after}"`,
          shot('learning-time-calc-after.png'),
        );
      }
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------
  // 6. CodePreview
  // ---------------------------------------------------------------
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const url = `${BASE}/docs/practice/practice-css-grid/`;
    await seedTheme(page, url, 'light');
    const cp = await page.$('.code-preview');
    record('code-preview:found', !!cp, url);
    if (cp) {
      await cp.scrollIntoViewIfNeeded();
      await snap(page, shot('code-preview-initial.png'));
      const textarea = await page.$('.code-preview__textarea');
      if (textarea) {
        await textarea.click();
        await page.keyboard.press('Control+a');
        await page.keyboard.type('body { background: hotpink; }');
        await page.waitForTimeout(400);
        await snap(page, shot('code-preview-edited.png'));
        const resetBtn = await page.$('.code-preview__reset');
        if (resetBtn) {
          await resetBtn.click();
          await page.waitForTimeout(300);
          const val = await page.$eval('.code-preview__textarea', (el) => el.value).catch(() => null);
          await snap(page, shot('code-preview-after-reset.png'));
          record('code-preview:reset-works', !val?.includes('hotpink'), `value snippet="${(val || '').slice(0, 40)}"`, shot('code-preview-after-reset.png'));
        } else {
          record('code-preview:reset-button-present', false);
        }
      } else {
        record('code-preview:textarea-present', false);
      }
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------
  // 7. ConsentBanner - Europe/Berlin, fresh storage
  // ---------------------------------------------------------------
  for (const vp of [{ w: 390, h: 844, tag: 'mobile' }, { w: 1280, h: 800, tag: 'desktop' }]) {
    const ctx = await freshContext(browser, { viewport: { width: vp.w, height: vp.h }, timezoneId: 'Europe/Berlin' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const shown = await page.$('[aria-label="Cookie consent"]');
    await snap(page, shot(`consent-shown-${vp.tag}.png`));
    record(`consent-banner:${vp.tag}:shown-eu-tz`, !!shown, null, shot(`consent-shown-${vp.tag}.png`));

    if (shown) {
      // does it hide primary content on mobile? Check if banner overlaps main content area
      if (vp.tag === 'mobile') {
        const overlap = await page.evaluate(() => {
          const banner = document.querySelector('[aria-label="Cookie consent"]');
          const main = document.querySelector('main');
          if (!banner || !main) return null;
          const b = banner.getBoundingClientRect();
          const m = main.getBoundingClientRect();
          // does banner rect intersect main's rect area meaningfully AND cover interactive content?
          const overlapH = Math.max(0, Math.min(b.bottom, m.bottom) - Math.max(b.top, m.top));
          return { bannerHeight: b.height, overlapH, viewportH: window.innerHeight };
        });
        record(
          `consent-banner:${vp.tag}:overlap-info`,
          true,
          JSON.stringify(overlap),
          shot(`consent-shown-${vp.tag}.png`),
        );
      }

      // focusable check
      const acceptFocusable = await page.evaluate(() => {
        const btns = document.querySelectorAll('[aria-label="Cookie consent"] button');
        return btns.length === 2 && Array.from(btns).every((b) => b.tabIndex !== -1);
      });
      record(`consent-banner:${vp.tag}:buttons-focusable`, acceptFocusable, null);

      // Accept
      const buttons = await page.$$('[aria-label="Cookie consent"] button');
      // Decline is first, Accept is second per source
      await buttons[1].click();
      await page.waitForTimeout(200);
      const hiddenAfterAccept = (await page.$('[aria-label="Cookie consent"]')) === null;
      record(`consent-banner:${vp.tag}:accept-hides`, hiddenAfterAccept, null);

      // reopen via footer Cookie settings
      const footerBtn = await page.$('.sg-cookie-settings');
      if (footerBtn) {
        await footerBtn.scrollIntoViewIfNeeded();
        await footerBtn.click();
        await page.waitForTimeout(200);
        const reopened = (await page.$('[aria-label="Cookie consent"]')) !== null;
        await snap(page, shot(`consent-reopened-${vp.tag}.png`));
        record(`consent-banner:${vp.tag}:footer-reopens`, reopened, null, shot(`consent-reopened-${vp.tag}.png`));
        if (reopened) {
          const buttons2 = await page.$$('[aria-label="Cookie consent"] button');
          await buttons2[0].click(); // Decline
          await page.waitForTimeout(200);
          const hiddenAfterDecline = (await page.$('[aria-label="Cookie consent"]')) === null;
          record(`consent-banner:${vp.tag}:decline-hides`, hiddenAfterDecline, null);
        }
      } else {
        record(`consent-banner:${vp.tag}:footer-cookie-settings-present`, false, 'no .sg-cookie-settings element found in footer');
      }
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------
  // 8. MegaMenu, navbar drawer, search, sidebar, sticky CTA, hover/focus
  // ---------------------------------------------------------------
  for (const vp of [
    { w: 360, h: 740, tag: '360' },
    { w: 390, h: 844, tag: '390' },
    { w: 768, h: 1024, tag: '768' },
    { w: 1280, h: 800, tag: '1280' },
    { w: 1920, h: 1080, tag: '1920' },
  ]) {
    const ctx = await freshContext(browser, { viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await seedTheme(page, `${BASE}/`, 'light');

    const isDesktop = vp.w >= 996;

    if (isDesktop) {
      // MegaMenu hover
      const toggle = await page.$('.mega-menu__toggle');
      if (toggle) {
        await toggle.hover();
        await page.waitForTimeout(300);
        const panelOpen = await page.evaluate(() => !!document.querySelector('.mega-menu--open .mega-menu__panel'));
        await snap(page, shot(`megamenu-open-${vp.tag}.png`));
        record(`megamenu:${vp.tag}:hover-opens`, panelOpen, null, shot(`megamenu-open-${vp.tag}.png`));
        await page.mouse.move(10, 500);
        await page.waitForTimeout(500);
      } else {
        record(`megamenu:${vp.tag}:toggle-present`, false, 'no .mega-menu__toggle found');
      }

      // Search modal via button
      const searchPill = await page.$('.sg-search-pill');
      if (searchPill) {
        await searchPill.click();
        await page.waitForTimeout(300);
        const modalOpen = (await page.$('.sg-search-modal')) !== null;
        record(`search:${vp.tag}:opens-via-button`, modalOpen, null);
        if (modalOpen) {
          await page.keyboard.type('react');
          await waitForSearchSettled(page);
          await snap(page, shot(`search-results-${vp.tag}.png`));
          const hasResults = await page.evaluate(() => !!document.querySelector('.sg-search-result'));
          record(`search:${vp.tag}:typing-returns-results`, hasResults, null, shot(`search-results-${vp.tag}.png`));
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
      } else {
        record(`search:${vp.tag}:pill-present`, false);
      }

      // Search via keyboard shortcut Cmd/Ctrl+K
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);
      const modalOpenViaKbd = (await page.$('.sg-search-modal')) !== null;
      record(`search:${vp.tag}:opens-via-keyboard`, modalOpenViaKbd, null);
      if (modalOpenViaKbd) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }

      // DesktopStickyCTA on a money page
      const moneyUrl = `${BASE}/docs/pricing/`;
      await page.goto(moneyUrl, { waitUntil: 'networkidle' });
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(500);
      const sticky = await page.$('.desktop-sticky-cta');
      record(`sticky-cta:${vp.tag}:appears-on-money-page`, !!sticky, moneyUrl);
      if (sticky) {
        await snap(page, shot(`sticky-cta-${vp.tag}.png`));
        const overlapInfo = await page.evaluate(() => {
          const cta = document.querySelector('.desktop-sticky-cta');
          const toc = document.querySelector('.table-of-contents, [class*="tableOfContents"]');
          if (!cta) return null;
          const c = cta.getBoundingClientRect();
          if (!toc) return { ctaRect: c, tocFound: false };
          const t = toc.getBoundingClientRect();
          const overlapX = Math.max(0, Math.min(c.right, t.right) - Math.max(c.left, t.left));
          const overlapY = Math.max(0, Math.min(c.bottom, t.bottom) - Math.max(c.top, t.top));
          return { ctaRect: c, tocRect: t, overlapX, overlapY, tocFound: true };
        });
        record(`sticky-cta:${vp.tag}:toc-overlap-info`, true, JSON.stringify(overlapInfo), shot(`sticky-cta-${vp.tag}.png`));
      }

      // hover state on primary button
      const primaryBtn = await page.$('.desktop-sticky-cta a, .navbar-cta, a.button--primary');
      if (primaryBtn) {
        await primaryBtn.hover();
        await page.waitForTimeout(150);
        await snap(page, shot(`button-hover-${vp.tag}.png`));
        record(`button-hover:${vp.tag}:captured`, true, null, shot(`button-hover-${vp.tag}.png`));
      }

      // keyboard Tab through navbar, focus ring visibility
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      let focusRingVisible = false;
      let lastActiveTag = '';
      for (let i = 0; i < 6; i++) {
        const info = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;
          const style = getComputedStyle(el);
          return {
            tag: el.tagName,
            cls: el.className,
            outline: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow,
          };
        });
        if (info) {
          lastActiveTag = `${info.tag}.${info.cls}`;
          if ((info.outline !== 'none' && info.outlineWidth !== '0px') || info.boxShadow !== 'none') {
            focusRingVisible = true;
          }
        }
        await page.keyboard.press('Tab');
        await page.waitForTimeout(80);
      }
      await snap(page, shot(`navbar-tab-focus-${vp.tag}.png`), { keepFocus: true });
      record(`navbar:${vp.tag}:focus-ring-visible-during-tab`, focusRingVisible, `lastFocused=${lastActiveTag}`, shot(`navbar-tab-focus-${vp.tag}.png`));
    } else {
      // Mobile: navbar drawer via tap
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
      const toggle = await page.$('.navbar__toggle');
      if (toggle) {
        await toggle.click();
        await page.waitForTimeout(300);
        const drawerOpen = await page.evaluate(() => !!document.querySelector('.navbar-sidebar--show'));
        await snap(page, shot(`navbar-drawer-${vp.tag}.png`));
        record(`navbar-drawer:${vp.tag}:opens`, drawerOpen, null, shot(`navbar-drawer-${vp.tag}.png`));

        // The drawer renders "Resources" with the stock collapsible dropdown
        // (MegaMenu is desktop only). Tapping it must expand its links.
        const resources = page.locator('.navbar-sidebar .menu__list-item-collapsible', { hasText: 'Resources' }).first();
        if ((await resources.count()) > 0) {
          const item = resources.locator('xpath=..');
          const before = await item.evaluate((el) => el.classList.contains('menu__list-item--collapsed'));
          await resources.locator('.menu__link').first().click();
          await page.waitForTimeout(400);
          const after = await item.evaluate((el) => el.classList.contains('menu__list-item--collapsed'));
          const links = await item.locator('ul a[href]').evaluateAll((els) =>
            els.filter((e) => e.getBoundingClientRect().height > 0).length,
          );
          await snap(page, shot(`drawer-resources-${vp.tag}.png`));
          record(
            `navbar-drawer:${vp.tag}:resources-expands`,
            before === true && after === false && links > 0,
            `collapsed ${before} -> ${after}, ${links} visible links`,
            shot(`drawer-resources-${vp.tag}.png`),
          );
        } else {
          record(`navbar-drawer:${vp.tag}:resources-present`, false, 'no Resources collapsible in .navbar-sidebar');
        }
      } else {
        record(`navbar-drawer:${vp.tag}:toggle-present`, false);
      }
    }

    await ctx.close();
  }

  // /search/?q=react page
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const url = `${BASE}/search/?q=react`;
    const resp = await page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
    record('search-page:loads', !!resp && resp.status() < 400, `status=${resp ? resp.status() : 'error'}`);
    await page.waitForTimeout(500);
    await snap(page, shot('search-page-q-react.png'));
    const hasResults = await page.evaluate(() => document.body.textContent.toLowerCase().includes('react'));
    record('search-page:results-mention-query', hasResults, null, shot('search-page-q-react.png'));
    await ctx.close();
  }

  // Footer + docs sidebar collapse/expand
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const url = `${BASE}/docs/intro/`;
    await seedTheme(page, url, 'light');
    await page.evaluate(() => document.querySelector('footer')?.scrollIntoView());
    await page.waitForTimeout(200);
    await snap(page, shot('footer.png'));
    record('footer:rendered', !!(await page.$('footer')), null, shot('footer.png'));

    const category = await page.$('.theme-doc-sidebar-item-category .menu__link--sublist, .menu__list-item-collapsible');
    if (category) {
      await category.scrollIntoViewIfNeeded();
      await snap(page, shot('sidebar-before-collapse.png'));
      const wasCollapsed = await page.evaluate(
        (el) => el.closest('.menu__list-item')?.classList.contains('menu__list-item--collapsed'),
        category,
      );
      await category.click();
      await page.waitForTimeout(300);
      const isCollapsedNow = await page.evaluate(
        (el) => el.closest('.menu__list-item')?.classList.contains('menu__list-item--collapsed'),
        category,
      );
      await snap(page, shot('sidebar-after-toggle.png'));
      record('sidebar:category-toggles', wasCollapsed !== isCollapsedNow, `was=${wasCollapsed} now=${isCollapsedNow}`, shot('sidebar-after-toggle.png'));
    } else {
      record('sidebar:collapsible-category-present', false, url);
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------
  // Dark theme sweep of key surfaces: consent, megamenu, sticky, search, faq
  // ---------------------------------------------------------------
  {
    const ctx = await freshContext(browser, { viewport: { width: 1280, height: 800 }, timezoneId: 'Europe/Berlin' });
    const page = await ctx.newPage();
    const homeUrl = `${BASE}/`;
    await page.goto(homeUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      try {
        window.localStorage.setItem('theme', 'dark');
      } catch {}
    });
    await page.goto(homeUrl, { waitUntil: 'networkidle' });
    const dt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    record('dark-sweep:theme-applied', dt === 'dark', `data-theme=${dt}`);
    await page.waitForTimeout(300);
    await snap(page, shot('dark-consent-banner.png'));
    record('dark-sweep:consent-banner-shot', true, null, shot('dark-consent-banner.png'));

    // dismiss consent to see rest
    const acceptBtns = await page.$$('[aria-label="Cookie consent"] button');
    if (acceptBtns.length === 2) await acceptBtns[1].click();
    await page.waitForTimeout(200);

    const toggle = await page.$('.mega-menu__toggle');
    if (toggle) {
      await toggle.hover();
      await page.waitForTimeout(300);
      await snap(page, shot('dark-megamenu.png'));
      record('dark-sweep:megamenu-shot', true, null, shot('dark-megamenu.png'));
      await page.mouse.move(10, 500);
    }

    const searchPill = await page.$('.sg-search-pill');
    if (searchPill) {
      await searchPill.click();
      await page.waitForTimeout(300);
      await page.keyboard.type('react');
      await waitForSearchSettled(page);
      await snap(page, shot('dark-search.png'));
      record('dark-sweep:search-shot', true, null, shot('dark-search.png'));
      await page.keyboard.press('Escape');
    }

    await page.goto(`${BASE}/docs/pricing/`, { waitUntil: 'networkidle' });
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(400);
    await snap(page, shot('dark-sticky-cta.png'));
    record('dark-sweep:sticky-cta-shot', true, null, shot('dark-sticky-cta.png'));

    const faq = await page.$('.faq-accordion');
    if (faq) {
      await faq.scrollIntoViewIfNeeded();
      const q = await page.$('.faq-accordion__question');
      if (q) await q.click();
      await page.waitForTimeout(200);
      await snap(page, shot('dark-faq-open.png'));
      record('dark-sweep:faq-shot', true, null, shot('dark-faq-open.png'));
    }
    await ctx.close();
  }

  await browser.close();

  const findings = groupFindings(
    results.filter((r) => !r.pass).map((r) => ({ id: r.name, where: r.detail || r.name })),
  );
  const result = compareFindings({ findings, known: loadKnownIssues(KNOWN), harness: 'interactions', fullRun: true });
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, checks: results, ...result }, null, 2));
  console.log(`\n${results.length} checks, ${findings.length} failed.`);
  process.exitCode = report({ harness: 'interactions', result, fullRun: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
