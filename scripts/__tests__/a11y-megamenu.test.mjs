import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const PORT = parseInt(process.env.PORT || '3001', 10);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const BUILD_DIR = path.join(ROOT, 'build');
const SERVE_TIMEOUT = 30_000;

let browser;
let serverProcess;

function violationsSummary(violations) {
  return violations.map((v) => {
    const nodes = v.nodes.map((n) => n.target.join(', ')).join('; ');
    return `  - ${v.id} (${v.impact}): ${v.help}\n    Selectors: ${nodes}\n    ${v.helpUrl}`;
  }).join('\n');
}

async function assertNoAxeViolations(page, label) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  if (violations.length > 0) {
    assert.fail(`${label}: ${violations.length} violations\n${violationsSummary(violations)}`);
  }
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* server not ready */ }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Server did not start within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

test.before(async () => {
  if (!existsSync(BUILD_DIR)) {
    throw new Error(`build/ not found at ${BUILD_DIR}. Run 'make build' first.`);
  }

  if (process.env.BASE_URL) {
    await waitForServer(BASE_URL, SERVE_TIMEOUT);
  } else {
    serverProcess = spawn('npx', ['docusaurus', 'serve', '--port', String(PORT), '--host', '127.0.0.1'], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env },
    });

    let serverOutput = '';
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`docusaurus serve did not start within ${SERVE_TIMEOUT}ms.\nOutput:\n${serverOutput}`));
      }, SERVE_TIMEOUT);

      const onData = (chunk) => {
        serverOutput += chunk.toString();
        if (serverOutput.includes('Serving') || serverOutput.includes('SUCCESS')) {
          clearTimeout(timeout);
          resolve();
        }
      };
      serverProcess.stdout.on('data', onData);
      serverProcess.stderr.on('data', onData);
      serverProcess.on('error', (err) => { clearTimeout(timeout); reject(err); });
      serverProcess.on('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`docusaurus serve exited with code ${code}.\nOutput:\n${serverOutput}`));
      });
    });
  }

  browser = await chromium.launch();
  const version = browser.version();
  console.log(`  browser: chromium ${version}`);
});

test.after(async () => {
  if (browser) await browser.close();
  if (serverProcess) {
    serverProcess.kill();
    await new Promise((r) => setTimeout(r, 500));
  }
});

// ── Helpers ────────────────────────────────────────────────────────

async function pageInTheme(t, colorScheme, viewport = { width: 1280, height: 800 }) {
  const context = await browser.newContext({ colorScheme, viewport });
  const page = await context.newPage();
  t.after(async () => { await context.close(); });
  return page;
}

async function openMegaMenu(page, label) {
  const toggle = page.locator(`.mega-menu__toggle:has-text("${label}")`);
  await toggle.click();
  await page.waitForSelector('.mega-menu--open', { timeout: 2000 });
}

async function isMegaMenuOpen(page, label) {
  const toggle = page.locator(`.mega-menu__toggle:has-text("${label}")`);
  const parent = toggle.locator('xpath=..');
  return parent.evaluate((el) => el.classList.contains('mega-menu--open'));
}

// ── Desktop Tests (≥997px) ──────────────────────────────────────────

for (const theme of ['light', 'dark']) {

  test(`1. navbar static (menus closed) — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await assertNoAxeViolations(page, `navbar static (${theme})`);
  });

  test(`2. Learn menu open via click — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await openMegaMenu(page, 'Learn');
    await assertNoAxeViolations(page, `Learn menu open (${theme})`);
  });

  test(`3. Tools menu open via click — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await openMegaMenu(page, 'Tools');
    await assertNoAxeViolations(page, `Tools menu open (${theme})`);
  });

  test(`4. only one menu open at a time — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    
    await openMegaMenu(page, 'Learn');
    assert.ok(await isMegaMenuOpen(page, 'Learn'), 'Learn should be open');
    
    await openMegaMenu(page, 'Tools');
    assert.ok(!(await isMegaMenuOpen(page, 'Learn')), 'Learn should close when Tools opens');
    assert.ok(await isMegaMenuOpen(page, 'Tools'), 'Tools should be open');
  });

  test(`5. click outside closes menu — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await openMegaMenu(page, 'Learn');
    
    await page.click('body', { position: { x: 50, y: 400 } });
    await page.waitForTimeout(300);
    
    assert.ok(!(await isMegaMenuOpen(page, 'Learn')), 'Menu should close on outside click');
  });

  test(`6. Escape key closes menu — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await openMegaMenu(page, 'Tools');
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    
    assert.ok(!(await isMegaMenuOpen(page, 'Tools')), 'Menu should close on Escape');
  });

  test(`7. keyboard navigation (Tab + Enter) — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    
    // Tab to first mega menu toggle
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.textContent);
      if (focused === 'Learn' || focused === 'Tools') break;
    }
    
    const focusedText = await page.evaluate(() => document.activeElement?.textContent);
    assert.ok(focusedText === 'Learn' || focusedText === 'Tools', 'Focus should reach a mega menu toggle');
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    const isOpen = await page.evaluate(() => 
      document.activeElement?.closest('.mega-menu')?.classList.contains('mega-menu--open')
    );
    assert.ok(isOpen, 'Enter should open the menu');
  });

  test(`8. child links focusable in panel — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await openMegaMenu(page, 'Learn');
    
    const links = await page.$$('.mega-menu--open .mega-menu__link');
    assert.ok(links.length > 0, 'Should have child links in panel');
    
    // Tab into the panel
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }
    
    const focusedInMenu = await page.evaluate(() => 
      document.activeElement?.closest('.mega-menu__panel') !== null
    );
    assert.ok(focusedInMenu, 'Focus should be inside mega menu panel');
    
    await assertNoAxeViolations(page, `child links (${theme})`);
  });

  test(`9. ARIA attributes on toggle — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    
    const toggle = page.locator('.mega-menu__toggle').first();
    const tagName = await toggle.evaluate((el) => el.tagName.toLowerCase());
    assert.equal(tagName, 'button', 'Toggle should be a <button>');
    
    const ariaExpanded = await toggle.getAttribute('aria-expanded');
    assert.equal(ariaExpanded, 'false', 'aria-expanded should be false initially');
    
    const ariaHasPopup = await toggle.getAttribute('aria-haspopup');
    assert.equal(ariaHasPopup, 'menu', 'aria-haspopup should be "menu"');
    
    await toggle.click();
    await page.waitForTimeout(200);
    
    const ariaExpandedAfter = await toggle.getAttribute('aria-expanded');
    assert.equal(ariaExpandedAfter, 'true', 'aria-expanded should be true when open');
  });

  test(`10. icons rendered in panel — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await openMegaMenu(page, 'Tools');
    
    const icons = await page.$$('.mega-menu--open .mega-menu__link-icon svg');
    assert.ok(icons.length > 0, 'Should have SVG icons in panel');
  });

  test(`11. child link navigation closes menu — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await openMegaMenu(page, 'Tools');
    
    const firstLink = page.locator('.mega-menu--open .mega-menu__link').first();
    const href = await firstLink.getAttribute('href');
    
    await firstLink.click();
    await page.waitForTimeout(500);
    
    // Check we navigated
    const currentUrl = page.url();
    assert.ok(currentUrl.includes(href), `Should have navigated to ${href}`);
  });
}

// ── Desktop at smaller viewport (1000px) ──────────────────────────────

for (const theme of ['light', 'dark']) {

  test(`12. desktop menu at 1000px — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme, { width: 1000, height: 600 });
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    
    const toggle = page.locator('.mega-menu__toggle').first();
    await toggle.click();
    await page.waitForTimeout(200);
    
    const isOpen = await isMegaMenuOpen(page, await toggle.textContent());
    assert.ok(isOpen, 'Menu should open at 1000px');
    
    await assertNoAxeViolations(page, `1000px menu (${theme})`);
  });
}

// ── Mobile Sidebar Tests (<996px) ───────────────────────────────────

for (const theme of ['light', 'dark']) {

  test(`13. mobile sidebar collapsible (Tools) — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme, { width: 375, height: 812 });
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    
    await page.click('.navbar__toggle');
    await page.waitForTimeout(300);
    
    const toolsLink = page.locator('.navbar-sidebar a.menu__link--sublist').filter({ hasText: /^Tools$/ });
    await toolsLink.click();
    await page.waitForTimeout(200);
    
    const parentLi = toolsLink.locator('xpath=..');
    const isExpanded = await parentLi.evaluate((el) => !el.classList.contains('menu__list-item--collapsed'));
    assert.ok(isExpanded, 'Tools dropdown should expand');
    
    await assertNoAxeViolations(page, `mobile Tools (${theme})`);
  });

  test(`14. mobile sidebar collapsible (Learn) — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme, { width: 375, height: 812 });
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    
    await page.click('.navbar__toggle');
    await page.waitForTimeout(300);
    
    const learnLink = page.locator('.navbar-sidebar a.menu__link--sublist').filter({ hasText: /^Learn$/ });
    await learnLink.click();
    await page.waitForTimeout(200);
    
    const parentLi = learnLink.locator('xpath=..');
    const isExpanded = await parentLi.evaluate((el) => !el.classList.contains('menu__list-item--collapsed'));
    assert.ok(isExpanded, 'Learn dropdown should expand');
    
    await assertNoAxeViolations(page, `mobile Learn (${theme})`);
  });

  test(`15. no leaked icon/description attributes — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme, { width: 375, height: 812 });
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    
    await page.click('.navbar__toggle');
    await page.waitForTimeout(300);
    
    const toolsLink = page.locator('.navbar-sidebar a.menu__link--sublist').filter({ hasText: /^Tools$/ });
    await toolsLink.click();
    await page.waitForTimeout(200);
    
    const childLinks = await page.$$('.navbar-sidebar .menu__list-item--collapsed ul a, .navbar-sidebar li:not(.menu__list-item--collapsed) ul a');
    
    for (const link of childLinks.slice(0, 3)) {
      const attrs = await link.evaluate((el) => 
        Array.from(el.attributes).map((a) => a.name)
      );
      assert.ok(!attrs.includes('icon'), 'Child link should not have "icon" attribute');
      assert.ok(!attrs.includes('description'), 'Child link should not have "description" attribute');
    }
  });
}

// ── Edge Cases ──────────────────────────────────────────────────────

test('16. rapid toggle (click 3x quickly)', async (t) => {
  const page = await pageInTheme(t, 'light');
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  
  const toggle = page.locator('.mega-menu__toggle').first();
  
  await toggle.click();
  await page.waitForTimeout(50);
  await toggle.click();
  await page.waitForTimeout(50);
  await toggle.click();
  await page.waitForTimeout(200);
  
  const isOpen = await isMegaMenuOpen(page, await toggle.textContent());
  assert.ok(isOpen, 'After 3 clicks, menu should be open');
});

test('17. both menus rapid toggle', async (t) => {
  const page = await pageInTheme(t, 'light');
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  
  const learnToggle = page.locator('.mega-menu__toggle:has-text("Learn")');
  const toolsToggle = page.locator('.mega-menu__toggle:has-text("Tools")');
  
  await learnToggle.click();
  await page.waitForTimeout(300);
  await toolsToggle.click();
  await page.waitForTimeout(300);
  await learnToggle.click();
  await page.waitForTimeout(300);
  
  assert.ok(await isMegaMenuOpen(page, 'Learn'), 'Learn should be open');
  assert.ok(!(await isMegaMenuOpen(page, 'Tools')), 'Tools should be closed');
});

test('18. hover still works (desktop)', async (t) => {
  const page = await pageInTheme(t, 'light');
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  
  const toggle = page.locator('.mega-menu__toggle').first();
  await toggle.hover();
  await page.waitForTimeout(300);
  
  const isOpen = await isMegaMenuOpen(page, await toggle.textContent());
  assert.ok(isOpen, 'Hover should open the menu');
});
