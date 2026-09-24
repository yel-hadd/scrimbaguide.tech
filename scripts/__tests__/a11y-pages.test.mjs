import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const PORT = parseInt(process.env.PORT || '3017', 10);
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
    // give it a moment to release the port
    await new Promise((r) => setTimeout(r, 500));
  }
});

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Loads `url` with `theme` applied the only way that reflects a real user.
 *
 * Do NOT set document.documentElement's data-theme directly. Docusaurus applies
 * some colours (code-block backgrounds among them) as React inline styles, so
 * flipping the attribute produces a half-themed page no visitor ever sees. That
 * mistake manufactured two "confirmed" contrast defects in an earlier audit.
 * Writing localStorage and reloading is what actually happens when someone
 * clicks the theme toggle.
 */
async function pageInTheme(t, theme, url, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  t.after(async () => { await context.close(); });
  await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded' });
  await page.evaluate((v) => localStorage.setItem('theme', v), theme);
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle' });
  const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert.equal(applied, theme, `theme should be ${theme}, got ${applied}`);
  return page;
}

// One representative page per template. Each exercises a different set of
// components, so a regression in any one of them surfaces here.
const PAGES = [
  ['homepage',       '/'],
  ['course leaf',    '/docs/courses/react/learn-react/'],
  ['course hub',     '/docs/courses/'],
  ['path page',      '/docs/paths/frontend-developer-path/'],
  ['comparison leaf','/docs/comparisons/scrimba-vs-codecademy/'],
  ['pricing',        '/docs/pricing/'],
  ['blog post',      '/blog/best-coding-bootcamp-alternatives-2026/'],
  ['404',            '/this-route-does-not-exist/'],
];

// ── Tests ──────────────────────────────────────────────────────────

for (const theme of ['light', 'dark']) {
  for (const [label, url] of PAGES) {
    test(`${label} — ${theme}`, async (t) => {
      const page = await pageInTheme(t, theme, url);
      await assertNoAxeViolations(page, `${label} (${theme})`);
    });
  }
}

// Mobile viewport, where layout and touch targets differ from desktop.
for (const theme of ['light', 'dark']) {
  test(`course leaf at 390px — ${theme}`, async (t) => {
    const page = await pageInTheme(t, theme, '/docs/courses/react/learn-react/', { width: 390, height: 844 });
    await assertNoAxeViolations(page, `course leaf mobile (${theme})`);
  });
}

// The search dialog is aria-modal, so focus must not escape it. axe cannot see
// this: nothing in the markup is wrong, the behaviour is. Before the trap
// existed, one Shift+Tab from the input landed on a footer link behind the
// overlay, leaving the user navigating a page the dialog declares inert.
test('search modal traps focus (Shift+Tab)', async (t) => {
  const page = await pageInTheme(t, 'light', '/');
  await page.click('.sg-search-pill');
  await page.waitForSelector('.sg-search-modal');
  await page.waitForTimeout(200);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(80);
    const inside = await page.evaluate(() => {
      const m = document.querySelector('.sg-search-modal');
      return !!(m && document.activeElement && m.contains(document.activeElement));
    });
    assert.ok(inside, `focus escaped the modal after ${i + 1} Shift+Tab press(es)`);
  }
});

test('search modal traps focus (Tab)', async (t) => {
  const page = await pageInTheme(t, 'light', '/');
  await page.click('.sg-search-pill');
  await page.waitForSelector('.sg-search-modal');
  await page.waitForTimeout(200);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);
    const inside = await page.evaluate(() => {
      const m = document.querySelector('.sg-search-modal');
      return !!(m && document.activeElement && m.contains(document.activeElement));
    });
    assert.ok(inside, `focus escaped the modal after ${i + 1} Tab press(es)`);
  }
});

// The active filter was communicated by a CSS class alone.
test('search filter chips expose pressed state', async (t) => {
  const page = await pageInTheme(t, 'light', '/');
  await page.click('.sg-search-pill');
  await page.waitForSelector('.sg-search-modal');
  await page.fill('.sg-search-input', 'react');
  await page.waitForSelector('.sg-search-filter');
  const pressed = await page.evaluate(() =>
    [...document.querySelectorAll('.sg-search-filter')].map((b) => b.getAttribute('aria-pressed')));
  assert.ok(pressed.length > 0, 'expected filter chips');
  assert.ok(pressed.every((p) => p === 'true' || p === 'false'),
    `every chip needs aria-pressed, got ${JSON.stringify(pressed)}`);
  assert.equal(pressed.filter((p) => p === 'true').length, 1, 'exactly one chip is pressed');
});
