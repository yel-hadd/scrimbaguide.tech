import type { UserThemeConfig } from '@docusaurus/theme-common';
import { DEMO_SCRIM_URL_AFFILIATE } from '../src/constants';

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
    {
      title: 'Legal',
      items: [
        { label: 'Affiliate Disclosure', to: '/legal/affiliate-disclosure' },
        { label: 'Privacy Policy', to: '/legal/privacy-policy' },
        { label: 'Terms of Service', to: '/legal/terms-of-service' },
      ],
    },
  ],
  copyright: `Copyright © ${new Date().getFullYear()} Scrimba Guide. Not affiliated with Scrimba.`,
};
