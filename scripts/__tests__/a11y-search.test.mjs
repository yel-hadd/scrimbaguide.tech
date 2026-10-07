import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawn, execSync } from 'node:child_process';
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
    // The docusaurus binary directly, in its own process group: killing an `npx`
    // wrapper leaves the real server running with our pipes open, and the
    // test process then never exits (CI hung to its 60-minute timeout).
    serverProcess = spawn(path.join(ROOT, 'node_modules', '.bin', 'docusaurus'), ['serve', '--port', String(PORT), '--host', '127.0.0.1'], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env },
      detached: true,
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
    try { process.kill(-serverProcess.pid, 'SIGTERM'); } catch { serverProcess.kill(); }
    serverProcess.stdout?.destroy();
    serverProcess.stderr?.destroy();
    serverProcess.unref();
    // give it a moment to release the port
    await new Promise((r) => setTimeout(r, 500));
  }
});

// ── Helpers ────────────────────────────────────────────────────────

async function pageInTheme(t, colorScheme) {
  const context = await browser.newContext({ colorScheme });
  const page = await context.newPage();
  t.after(async () => { await context.close(); });
  return page;
}

async function openSearch(page) {
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
  await page.click('.sg-search-pill');
  await page.waitForSelector('.sg-search-modal');
}

// ── Tests ──────────────────────────────────────────────────────────

for (const theme of ['light', 'dark']) {

  test(`1. homepage (no modal) — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' });
    await assertNoAxeViolations(page, `homepage (${theme})`);
  });

  test(`2. modal open, empty query — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    await page.waitForSelector('.sg-search-status');
    await assertNoAxeViolations(page, `modal empty (${theme})`);
  });

  test(`3. modal, results loaded — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    const input = page.locator('.sg-search-input');
    await input.fill('react');
    // wait for results — the worker responds with a 200ms debounce
    await page.waitForSelector('.sg-search-result', { timeout: 5000 });
    // let axe settle
    await page.waitForTimeout(100);
    await assertNoAxeViolations(page, `modal results (${theme})`);
  });

  test(`4. modal, filter chip applied — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    const input = page.locator('.sg-search-input');
    await input.fill('react');
    await page.waitForSelector('.sg-search-result', { timeout: 5000 });
    // click the Blog filter chip
    await page.click('.sg-search-filter:not(.sg-search-filter--empty)', { timeout: 3000 });
    await page.waitForTimeout(100);
    await assertNoAxeViolations(page, `modal filtered (${theme})`);
  });

  test(`5. modal, arrow key navigation — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    const input = page.locator('.sg-search-input');
    await input.fill('react');
    await page.waitForSelector('.sg-search-result', { timeout: 5000 });
    // press arrow down several times to highlight a result
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
    }
    await assertNoAxeViolations(page, `modal keyboard nav (${theme})`);
  });

  test(`6. close modal via Escape — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    await page.keyboard.press('Escape');
    await page.waitForSelector('.sg-search-overlay', { state: 'detached', timeout: 2000 });
    await assertNoAxeViolations(page, `post-escape (${theme})`);
    // Escape is a same-page dismissal: focus must return to the search pill,
    // not fall through to <body>.
    const focusedOnPill = await page.evaluate(
      () => document.activeElement?.classList.contains('sg-search-pill') ?? false,
    );
    assert.equal(focusedOnPill, true, `Escape (${theme}): focus did not return to .sg-search-pill`);
  });

  test(`7. close modal via × button — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    await page.click('.sg-search-clear');
    await page.waitForSelector('.sg-search-overlay', { state: 'detached', timeout: 2000 });
    await assertNoAxeViolations(page, `post-close-button (${theme})`);
    const focusedOnPill = await page.evaluate(
      () => document.activeElement?.classList.contains('sg-search-pill') ?? false,
    );
    assert.equal(focusedOnPill, true, `close button (${theme}): focus did not return to .sg-search-pill`);
  });

  test(`7b. close modal via backdrop click — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    // A corner of the overlay outside the modal card; the modal itself
    // stops propagation, so this only hits the backdrop's own onClick.
    await page.mouse.click(5, 5);
    await page.waitForSelector('.sg-search-overlay', { state: 'detached', timeout: 2000 });
    await assertNoAxeViolations(page, `post-backdrop-click (${theme})`);
    const focusedOnPill = await page.evaluate(
      () => document.activeElement?.classList.contains('sg-search-pill') ?? false,
    );
    assert.equal(focusedOnPill, true, `backdrop click (${theme}): focus did not return to .sg-search-pill`);
  });

  test(`9. See all does not restore focus to the pill — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    const input = page.locator('.sg-search-input');
    await input.fill('react');
    await page.waitForSelector('.sg-search-result', { timeout: 5000 });
    await page.click('.sg-search-footer-link', { timeout: 3000 });
    await page.waitForFunction("window.location.pathname.startsWith('/search')", { timeout: 5000 });
    // handleSeeAll() does not call closeSearch({ restoreFocus: true }), so
    // nothing here schedules a focus move onto the pill; route focus
    // management on the /search page owns focus instead.
    const focusedOnPill = await page.evaluate(
      () => document.activeElement?.classList.contains('sg-search-pill') ?? false,
    );
    assert.equal(focusedOnPill, false, `See all (${theme}): focus was forced back onto the pill instead of route focus management`);
  });

  test(`8. See all navigates to /search page — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme);
    await openSearch(page);
    const input = page.locator('.sg-search-input');
    await input.fill('react');
    await page.waitForSelector('.sg-search-result', { timeout: 5000 });
    // click the "See all" link
    await page.click('.sg-search-footer-link', { timeout: 3000 });
    await page.waitForFunction("window.location.pathname.startsWith('/search')", { timeout: 5000 });
    await page.waitForTimeout(200);
    await assertNoAxeViolations(page, `/search page (${theme})`);
  });
}
