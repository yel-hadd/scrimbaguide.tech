/**
 * Lighthouse CI config for the static build (lab data, never field data).
 *
 * Runs against ./build through LHCI's own static server (compression on), so
 * it needs `npm run build` first. One form factor per run:
 *
 *   npm run lhci                              # mobile (Lighthouse default)
 *   LHCI_FORM_FACTOR=desktop npm run lhci     # desktop preset
 *
 * Assertions:
 *   - accessibility, SEO and best practices are errors at 1.0. Best practices
 *     is asserted here only because this is the local static build; the live
 *     site scores 0.96 for reasons outside the build and is never asserted.
 *   - /blog/ SEO is held at 0.92 (the "Read more" link-text audit) until the
 *     blog-list metadata PR raises it to 1.0.
 *   - LCP, TBT and CLS are warnings on the median of the runs. The numbers
 *     below are placeholders at the Core Web Vitals "good" boundaries. After
 *     14 days of CI runs, replace them with this runner's own week-one medians
 *     per page and switch them to error. If `/` mobile LCP spreads more than
 *     15% between runs, raise numberOfRuns to 5 before blocking on it.
 *   - uses-text-compression is off: the local server is not the CDN.
 */
'use strict';

const formFactor = process.env.LHCI_FORM_FACTOR === 'desktop' ? 'desktop' : 'mobile';

// The ten pages of the 2026-09-26 Lighthouse baseline.
const URLS = [
  '/',
  '/docs/pricing/',
  '/docs/pricing/student-discount/',
  '/docs/paths/ai-engineer-path/',
  '/docs/courses/',
  '/docs/courses/react/learn-react/',
  '/docs/comparisons/scrimba-vs-odin-project/',
  '/blog/scrimba-review/',
  '/blog/',
  '/docs/intro/',
];

// Placeholder budgets (warn only). See the header for when these change.
const BUDGETS = {
  lcpMs: 2500,
  tbtMs: 200,
  cls: 0.1,
};

// Every URL except the blog index. LHCI tests the pattern against the full
// http://localhost:<port>/... URL.
const ALL_BUT_BLOG_INDEX = '^https?://[^/]+/(?!blog/$).*$';
const BLOG_INDEX = '^https?://[^/]+/blog/$';

const shared = {
  'categories:accessibility': ['error', { minScore: 1 }],
  'categories:best-practices': ['error', { minScore: 1 }],
  'largest-contentful-paint': ['warn', { maxNumericValue: BUDGETS.lcpMs }],
  'total-blocking-time': ['warn', { maxNumericValue: BUDGETS.tbtMs }],
  'cumulative-layout-shift': ['warn', { maxNumericValue: BUDGETS.cls }],
  'uses-text-compression': 'off',
};

module.exports = {
  ci: {
    collect: {
      staticDistDir: './build',
      url: URLS,
      numberOfRuns: 3,
      settings: {
        ...(formFactor === 'desktop' ? { preset: 'desktop' } : {}),
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // LHCI adds --headless=new itself.
        chromeFlags: '--no-sandbox',
      },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: ALL_BUT_BLOG_INDEX,
          aggregationMethod: 'median',
          assertions: {
            ...shared,
            'categories:seo': ['error', { minScore: 1 }],
          },
        },
        {
          matchingUrlPattern: BLOG_INDEX,
          aggregationMethod: 'median',
          assertions: {
            ...shared,
            'categories:seo': ['error', { minScore: 0.92 }],
          },
        },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: `./.lighthouseci/reports-${formFactor}`,
    },
  },
};
