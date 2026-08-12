import type { UserThemeConfig } from '@docusaurus/theme-common';
import { DEMO_SCRIM_URL_AFFILIATE } from '../src/constants';
import { currentLocaleCoverage } from './locale-coverage.mjs';

/**
 * Legal pages are English-only in every locale (I18N-PLAN.md section 1, wired up
 * as `alwaysExcluded` in i18n/tiers.json): translated legal text creates real
 * exposure and has zero SEO value. `unrestricted` is true exactly when this
 * build does serve them, i.e. English and the `I18N_COVERAGE=full` QA hatch.
 */
const servesLegalPages = currentLocaleCoverage().unrestricted;

/**
 * Header navigation. Rendered through the `MegaMenu` swizzle, which is why the
 * dropdown items carry extra `icon` / `description` fields that Docusaurus's
 * own navbar item type does not know about (hence the `as any`).
 */
export const navbar: UserThemeConfig['navbar'] = {
  title: 'Scrimba Guide',
  logo: {
    alt: 'Scrimba Guide logo',
    src: 'img/logo.svg',
  },
  items: [
    // Paths and Courses are the two primary content pillars (and the main
    // conversion funnel), so they sit top-level rather than buried in a
    // dropdown. Secondary info pages stay grouped under "Learn".
    { to: '/docs/paths/', label: 'Paths', position: 'left' },
    { to: '/docs/courses/', label: 'Courses', position: 'left' },
    {
      type: 'dropdown',
      label: 'Learn',
      position: 'left',
      items: [
        { to: '/docs/intro', label: 'What is Scrimba?', icon: 'BookOpen', description: "How Scrimba's interactive scrims work and why they're different" },
        { to: '/docs/comparisons/', label: 'Comparisons', icon: 'Scale', description: 'How Scrimba stacks up against Codecademy, Udemy, and others' },
        { to: '/docs/pricing/', label: 'Pricing', icon: 'Tag', description: 'Compare Pro vs Free plans and find the best value' },
        { to: '/docs/faq/', label: 'FAQ', icon: 'CircleHelp', description: 'Answers to the most common questions about Scrimba' },
      ] as any,
    },
    { to: '/blog', label: 'Blog', position: 'left' },
    {
      type: 'dropdown',
      label: 'Tools',
      position: 'left',
      items: [
        { to: '/tools/', label: 'All Tools', icon: 'LayoutGrid', description: 'Browse every interactive tool and calculator' },
        { to: '/docs/paths/#path-advisor', label: 'Path Finder', icon: 'Compass', description: "Not sure where to start? Get a personalized recommendation" },
        { to: '/tools/bootcamp-cost-calculator', label: 'Cost Calculator', icon: 'Calculator', description: 'Compare bootcamp costs vs Scrimba Pro' },
        { to: '/roadmaps/frontend-roadmap-2026', label: 'Frontend Roadmap', icon: 'Map', description: 'Step-by-step frontend development learning path' },
      ] as any,
    },
    {
      // Same interactive demo scrim as the homepage hero CTA. Uses the shared
      // constant because navbar hrefs do not route through <AffiliateLink>.
      href: DEMO_SCRIM_URL_AFFILIATE,
      label: 'Try Scrimba for free',
      position: 'right',
      className: 'navbar-cta',
      rel: 'nofollow noopener noreferrer',
      'aria-label': 'Try Scrimba for free, opens a real interactive lesson in a new tab',
    },
  ],
};

/**
 * The Legal column. Present only in builds that actually serve `/legal/*`.
 *
 * Under `onBrokenLinks: 'throw'` these three links are not a cosmetic problem in
 * a locale that excludes the legal pages: the footer renders on every page, so
 * the footer alone kills the build. Dropping the column is therefore mandatory,
 * not tidiness, and it must never be "fixed" by pointing the links at the
 * English pages: the language switcher is the only cross-locale link on the site
 * (invariant 6).
 */
const legalColumn = {
  title: 'Legal',
  items: [
    { label: 'Affiliate Disclosure', to: '/legal/affiliate-disclosure' },
    { label: 'Privacy Policy', to: '/legal/privacy-policy' },
    { label: 'Terms of Service', to: '/legal/terms-of-service' },
  ],
};

/**
 * The replacement notice, carried on the copyright line.
 *
 * It has to live here rather than in a fourth footer item because a footer item
 * is either a link (`to`/`href` plus `label`) or raw `html`, and raw `html` is
 * the one footer field Docusaurus does NOT extract for translation
 * (`getFooterTranslationFile` covers column titles, link labels, `copyright` and
 * `logo.alt`, nothing else). Appending to `copyright` keeps the sentence inside
 * the normal `footer.json` translation pipeline under a stable key, instead of
 * inventing a second, hand-maintained translation surface for one line.
 */
const LEGAL_NOTICE = 'Legal notices and terms are published in English.';

const copyrightBase =
  `Copyright © ${new Date().getFullYear()} Scrimba Guide. Not affiliated with Scrimba.`;

/**
 * Footer navigation. `copyright` interpolates the year at config load, so the
 * built site always carries the year it was deployed in.
 */
export const footer: UserThemeConfig['footer'] = {
  style: 'dark',
  links: [
    {
      title: 'Learn',
      items: [
        { label: 'All Courses', to: '/docs/courses' },
        { label: 'Learning Paths', to: '/docs/paths' },
        { label: 'Scrimba Pricing', to: '/docs/pricing' },
        { label: 'FAQ', to: '/docs/faq/' },
        { label: 'Changelog', to: '/docs/changelog' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About Us', to: '/about' },
        { label: 'Contact', to: '/contact' },
        { label: 'Blog', to: '/blog' },
      ],
    },
    ...(servesLegalPages ? [legalColumn] : []),
  ],
  copyright: servesLegalPages ? copyrightBase : `${copyrightBase} ${LEGAL_NOTICE}`,
};
