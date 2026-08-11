import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { PluginConfig } from '@docusaurus/types';

/**
 * 301 redirects for retired course pages (de-listed from Scrimba's catalogue).
 * Maintained in data/course-redirects.json so the old URLs redirect to the
 * category hub instead of 404ing.
 */
const courseRedirects: { from: string; to: string }[] = (() => {
  try {
    const p = path.join(process.cwd(), 'data', 'course-redirects.json');
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : [];
  } catch {
    return [];
  }
})();

/**
 * `@docusaurus/plugin-client-redirects` entry.
 *
 * Consolidation is done with redirects, never deletion: every URL that once
 * ranked keeps resolving to whichever page absorbed its intent.
 */
export const clientRedirectsPlugin: PluginConfig = [
  '@docusaurus/plugin-client-redirects',
  {
    redirects: [
      {
        from: '/blog/scrimba-vs-odin-project',
        to: '/docs/comparisons/scrimba-vs-odin-project',
      },
      {
        from: '/blog/scrimba-vs-bootcamps-cost-comparison',
        to: '/docs/pricing/scrimba-vs-bootcamps',
      },
      {
        from: '/blog/scrimba-for-cs-students',
        to: '/docs/for/cs-students/',
      },
      {
        from: '/blog/blog/javascript-roadmap-for-beginners-2026',
        to: '/docs/courses/javascript/',
      },
      {
        from: '/blog/blog/react-vs-nextjs-for-beginners-2026',
        to: '/docs/learn-nextjs/',
      },
      {
        from: '/blog/blog/frontend-portfolio-checklist-2026',
        to: '/blog/portfolio-projects-get-hired-2026',
      },
      {
        from: '/blog/blog/bootdev-vs-odin-vs-scrimba-2026',
        to: '/docs/comparisons/scrimba-vs-boot-dev/',
      },
      {
        from: '/blog/blog/best-coding-platforms-for-beginners-2026',
        to: '/docs/comparisons/',
      },
      {
        from: '/blog/blog/scrimba-pro-pricing-explained-2026',
        to: '/docs/pricing/',
      },
      {
        from: '/blog/javascript-vs-python-beginners-2026',
        to: '/docs/courses/javascript/',
      },
      {
        from: '/blog/frontend-portfolio-checklist-2026',
        to: '/blog/portfolio-projects-get-hired-2026',
      },
      {
        from: '/blog/react-vs-nextjs-for-beginners-2026',
        to: '/docs/learn-nextjs/',
      },
      {
        from: '/blog/bootdev-vs-odin-vs-scrimba-2026',
        to: '/docs/comparisons/scrimba-vs-boot-dev/',
      },
      {
        from: '/blog/best-coding-platforms-for-beginners-2026',
        to: '/docs/comparisons/',
      },
      {
        from: '/blog/scrimba-pro-pricing-explained-2026',
        to: '/docs/pricing/',
      },
      {
        from: '/blog/how-to-learn-react-2026',
        to: '/docs/courses/react/',
      },
      {
        from: '/blog/how-to-become-frontend-developer-2026',
        to: '/docs/paths/frontend-developer-path/',
      },
      {
        from: '/blog/javascript-roadmap-for-beginners-2026',
        to: '/docs/courses/javascript/',
      },
      {
        from: '/blog/how-to-learn-javascript-2026',
        to: '/docs/courses/javascript/',
      },
      // Blog cluster consolidation (2026-05-28): cannibalizing posts merged
      // into pillars (tutorial hell, vibe coding, get hired).
      {
        from: '/blog/escape-tutorial-hell-scrimba',
        to: '/blog/how-to-escape-tutorial-hell-2026/',
      },
      {
        from: '/blog/vibe-coding-guide',
        to: '/blog/what-is-vibe-coding-2026/',
      },
      {
        from: '/blog/vibe-coding-javascript-survival-guide-2026',
        to: '/blog/what-is-vibe-coding-2026/',
      },
      {
        from: '/blog/how-to-get-hired-with-scrimba',
        to: '/blog/how-to-get-first-developer-job-2026/',
      },
      {
        from: '/blog/learn-to-code-full-time-job',
        to: '/blog/how-to-get-first-developer-job-2026/',
      },
      // Udemy guides moved from /docs/udemy/* to /blog/* (2026-05-24).
      {
        from: '/docs/udemy',
        to: '/blog/best-udemy-coding-courses/',
      },
      {
        from: '/docs/udemy/best-udemy-javascript-courses',
        to: '/blog/best-udemy-javascript-courses/',
      },
      {
        from: '/docs/udemy/best-udemy-react-courses',
        to: '/blog/best-udemy-react-courses/',
      },
      {
        from: '/docs/udemy/best-udemy-python-courses',
        to: '/blog/best-udemy-python-courses/',
      },
      {
        from: '/docs/udemy/best-udemy-web-development-courses',
        to: '/blog/best-udemy-web-development-courses/',
      },
      {
        from: '/docs/udemy/best-udemy-ai-courses',
        to: '/blog/best-udemy-ai-courses/',
      },
      // IA restructure (2026-05-27): FAQ split into How Scrimba Works + Help,
      // audience pages consolidated under /for/, discord merged into community.
      { from: '/docs/faq/how-scrims-work', to: '/docs/how-it-works/how-scrims-work/' },
      { from: '/docs/faq/how-to-use-scrimba', to: '/docs/how-it-works/using-scrimba/' },
      { from: '/docs/faq/is-scrimba-free', to: '/docs/how-it-works/is-scrimba-free/' },
      { from: '/docs/faq/scrimba-accreditation', to: '/docs/how-it-works/accreditation/' },
      { from: '/docs/faq/certificates', to: '/docs/how-it-works/certificates/' },
      { from: '/docs/faq/learning-speed', to: '/docs/how-it-works/learning-speed/' },
      { from: '/docs/faq/tutorial-hell', to: '/docs/how-it-works/tutorial-hell/' },
      { from: '/docs/faq/billing', to: '/docs/help/billing/' },
      { from: '/docs/faq/platform-issues', to: '/docs/help/troubleshooting/' },
      { from: '/docs/faq/community-and-events', to: '/docs/help/community-and-events/' },
      { from: '/docs/faq/discord-community', to: '/docs/help/community-and-events/' },
      { from: '/docs/faq/scrimba-for-busy-professionals', to: '/docs/for/busy-professionals/' },
      { from: '/docs/paths/scrimba-for-beginners', to: '/docs/for/beginners/' },
      { from: '/docs/paths/scrimba-for-cs-students', to: '/docs/for/cs-students/' },
      { from: '/docs/paths/scrimba-for-designers', to: '/docs/for/designers/' },
      { from: '/docs/paths/scrimba-for-marketers', to: '/docs/for/marketers/' },
      // Cannibalization cleanup (2026-05-29): thin React/Next.js concept
      // stubs consolidated into their roadmap index (one canonical owner
      // for "learn react free" / "learn next.js" intent).
      { from: '/docs/learn-react/quick-start', to: '/docs/learn-react/' },
      { from: '/docs/learn-react/describing-ui', to: '/docs/learn-react/' },
      { from: '/docs/learn-react/adding-interactivity', to: '/docs/learn-react/' },
      { from: '/docs/learn-react/managing-state', to: '/docs/learn-react/' },
      { from: '/docs/learn-react/escape-hatches', to: '/docs/learn-react/' },
      { from: '/docs/learn-react/server-components', to: '/docs/learn-react/' },
      { from: '/docs/learn-nextjs/getting-started', to: '/docs/learn-nextjs/' },
      { from: '/docs/learn-nextjs/routing', to: '/docs/learn-nextjs/' },
      { from: '/docs/learn-nextjs/rendering', to: '/docs/learn-nextjs/' },
      { from: '/docs/learn-nextjs/data-fetching', to: '/docs/learn-nextjs/' },
      ...courseRedirects,
    ],
  },
];
