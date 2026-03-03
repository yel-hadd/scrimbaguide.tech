#!/usr/bin/env node
/**
 * Axe-Core Accessibility Audit Script
 *
 * Crawls all pages from the build sitemap and runs axe-core
 * in strict WCAG 2.1 AA mode across 4 configs:
 *   - Desktop Light (1440x900)
 *   - Desktop Dark  (1440x900)
 *   - Mobile Light  (375x812)
 *   - Mobile Dark   (375x812)
 *
 * Usage:
 *   node scripts/axe-audit.mjs [--base-url http://localhost:3030]
 *
 * Output:
 *   - axe-report.json   (full results)
 *   - Console summary   (grouped by rule)
 */

import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Config ---
const BASE_URL = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'http://localhost:3030';

const CONFIGS = [
  { name: 'desktop-light', width: 1440, height: 900, theme: 'light' },
  { name: 'desktop-dark',  width: 1440, height: 900, theme: 'dark' },
  { name: 'mobile-light',  width: 375,  height: 812, theme: 'light' },
  { name: 'mobile-dark',   width: 375,  height: 812, theme: 'dark' },
];

// Concurrency limit to avoid overwhelming the server
const CONCURRENCY = 4;

// --- Extract routes from sitemap ---
function getRoutes() {
  const sitemapPath = join(ROOT, 'build', 'sitemap.xml');
  const xml = readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  return locs.map(url => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  });
}

// --- Run axe on a single page+config ---
async function auditPage(page, route, config) {
  const url = `${BASE_URL}${route}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Set Docusaurus theme
    await page.evaluate((theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    }, config.theme);

    // Small wait for theme CSS to apply
    await page.waitForTimeout(300);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    return {
      url: route,
      config: config.name,
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 3).map(n => n.target.join(' > ')),
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.length,
    };
  } catch (err) {
    return {
      url: route,
      config: config.name,
      error: err.message,
      violations: [],
      passes: 0,
      incomplete: 0,
    };
  }
}

// --- Main ---
async function main() {
  console.log('🔍 Axe-Core Accessibility Audit');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Configs: ${CONFIGS.map(c => c.name).join(', ')}`);

  const routes = getRoutes();
  console.log(`   Routes: ${routes.length}`);
  console.log(`   Total evaluations: ${routes.length * CONFIGS.length}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const allResults = [];
  let completed = 0;
  const total = routes.length * CONFIGS.length;

  // Process in batches for each config
  for (const config of CONFIGS) {
    console.log(`📋 Running: ${config.name} (${config.width}x${config.height})...`);

    // Process routes in chunks
    for (let i = 0; i < routes.length; i += CONCURRENCY) {
      const chunk = routes.slice(i, i + CONCURRENCY);
      const promises = chunk.map(async (route) => {
        const context = await browser.newContext({
          viewport: { width: config.width, height: config.height },
          colorScheme: config.theme === 'dark' ? 'dark' : 'light',
        });
        const page = await context.newPage();
        const result = await auditPage(page, route, config);
        await context.close();
        return result;
      });

      const results = await Promise.all(promises);
      allResults.push(...results);
      completed += chunk.length;

      // Progress
      const pct = Math.round((completed / total) * 100);
      const violations = results.reduce((sum, r) => sum + r.violations.length, 0);
      process.stdout.write(`\r   Progress: ${completed}/${total} (${pct}%) | Violations in batch: ${violations}`);
    }
    console.log('');
  }

  await browser.close();

  // --- Summarize ---
  console.log('\n' + '='.repeat(70));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(70));

  // Group violations by rule ID
  const ruleMap = {};
  let totalViolationNodes = 0;
  for (const result of allResults) {
    for (const v of result.violations) {
      if (!ruleMap[v.id]) {
        ruleMap[v.id] = {
          id: v.id,
          impact: v.impact,
          description: v.description,
          helpUrl: v.helpUrl,
          pages: new Set(),
          totalNodes: 0,
          configs: new Set(),
        };
      }
      ruleMap[v.id].pages.add(result.url);
      ruleMap[v.id].totalNodes += v.nodes;
      ruleMap[v.id].configs.add(result.config);
      totalViolationNodes += v.nodes;
    }
  }

  // Sort by impact severity
  const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const sortedRules = Object.values(ruleMap).sort((a, b) =>
    (impactOrder[a.impact] ?? 4) - (impactOrder[b.impact] ?? 4)
  );

  const errorPages = allResults.filter(r => r.error);
  const pagesWithViolations = new Set(
    allResults.filter(r => r.violations.length > 0).map(r => r.url)
  );

  console.log(`\nTotal pages audited: ${routes.length}`);
  console.log(`Total evaluations: ${allResults.length}`);
  console.log(`Pages with violations: ${pagesWithViolations.size}/${routes.length}`);
  console.log(`Unique rules violated: ${sortedRules.length}`);
  console.log(`Total violation nodes: ${totalViolationNodes}`);
  if (errorPages.length > 0) {
    console.log(`Errors: ${errorPages.length}`);
  }

  console.log('\n--- Violations by Rule (sorted by severity) ---\n');
  console.log('Impact     | Rule ID                        | Pages | Nodes | Configs          | Description');
  console.log('-'.repeat(130));

  for (const rule of sortedRules) {
    const impact = (rule.impact || 'unknown').padEnd(10);
    const id = rule.id.padEnd(30);
    const pages = String(rule.pages.size).padStart(5);
    const nodes = String(rule.totalNodes).padStart(5);
    const configs = [...rule.configs].join(', ').padEnd(16);
    const desc = rule.description.substring(0, 60);
    console.log(`${impact} | ${id} | ${pages} | ${nodes} | ${configs} | ${desc}`);
  }

  // Per-config summary
  console.log('\n--- Violations by Config ---\n');
  for (const config of CONFIGS) {
    const configResults = allResults.filter(r => r.config === config.name);
    const configViolations = configResults.reduce((sum, r) => sum + r.violations.length, 0);
    const configPages = new Set(configResults.filter(r => r.violations.length > 0).map(r => r.url)).size;
    console.log(`  ${config.name}: ${configViolations} violations across ${configPages} pages`);
  }

  // Save full report
  const reportPath = join(ROOT, 'axe-report.json');
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalPages: routes.length,
    totalEvaluations: allResults.length,
    summary: {
      pagesWithViolations: pagesWithViolations.size,
      uniqueRules: sortedRules.length,
      totalViolationNodes,
    },
    rulesSummary: sortedRules.map(r => ({
      ...r,
      pages: [...r.pages],
      configs: [...r.configs],
    })),
    results: allResults,
  }, null, 2));

  console.log(`\n✅ Full report saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
