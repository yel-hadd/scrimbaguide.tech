/** Inline CTA shown after blog posts (see BlogContextualCta). */

export type BlogCta = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export const DEFAULT_BLOG_CTA: BlogCta = {
  title: 'Decide on Pro with the pricing guide',
  body: 'Compare what Pro unlocks vs the free tier, then use our partner link if you upgrade.',
  href: '/docs/pricing/',
  linkLabel: 'Scrimba pricing (2026)',
};

const BY_SLUG: Record<string, BlogCta> = {
  'scrimba-review': {
    title: 'Ready to try or upgrade?',
    body: 'Use the pricing breakdown and Pro vs Free page after reading the review.',
    href: '/docs/pricing/',
    linkLabel: 'See Scrimba pricing',
  },
  'is-scrimba-worth-it': {
    title: 'Compare plans side by side',
    body: 'Line up Pro vs Free with your study hours before you pay.',
    href: '/docs/pricing/pro-vs-free',
    linkLabel: 'Pro vs Free comparison',
  },
  'scrimba-discount-codes-2026': {
    title: 'Confirm the live checkout price',
    body: 'Discounts apply at billing toggles and eligibility, not mystery coupon codes.',
    href: 'https://scrimba.com/home?pricing&via=u42d4986',
    linkLabel: 'Open Scrimba pricing',
  },
  'best-free-scrimba-courses': {
    title: 'When free is not enough',
    body: 'See exactly what Pro adds (paths, Discord, unlimited challenges).',
    href: '/docs/pricing/pro-vs-free',
    linkLabel: 'What Pro unlocks',
  },
  'scrimba-react-learning-path': {
    title: 'Follow the full Frontend path',
    body: 'See modules, hours, and projects in one place.',
    href: '/docs/paths/frontend-developer-path',
    linkLabel: 'Frontend Developer path',
  },
  'learn-ai-engineering-scrimba': {
    title: 'AI Engineer path overview',
    body: 'Compare modules and time estimates for Scrimba’s AI track.',
    href: '/docs/paths/ai-engineer-path',
    linkLabel: 'AI Engineer path',
  },
  'scrimba-frontend-vs-fullstack-path': {
    title: 'Compare both paths',
    body: 'Frontend vs Fullstack: hours, stack, and who each fits.',
    href: '/docs/paths/',
    linkLabel: 'All learning paths',
  },
  'scrimba-fullstack-path-reviews': {
    title: 'Fullstack path doc',
    body: 'Official structure, duration, and tech stack.',
    href: '/docs/paths/fullstack-developer-path',
    linkLabel: 'Fullstack Developer path',
  },
  'scrimba-backend-path-review': {
    title: 'Backend path breakdown',
    body: 'Node, SQL, security modules, see if it matches your goals.',
    href: '/docs/paths/backend-developer-path',
    linkLabel: 'Backend Developer path',
  },
  'scrimba-ai-engineer-path-guide': {
    title: 'AI path on Scrimba',
    body: 'Agents, RAG, MCP, map the curriculum before you start.',
    href: '/docs/paths/ai-engineer-path',
    linkLabel: 'AI Engineer path',
  },
  'typescript-for-beginners-scrimba': {
    title: 'TypeScript courses on Scrimba',
    body: 'Jump into the TypeScript topic index from the course catalog.',
    href: '/docs/courses/typescript/',
    linkLabel: 'TypeScript courses',
  },
  'how-to-learn-typescript-scrimba': {
    title: 'TypeScript topic hub',
    body: 'Pick a course order that matches your JS level.',
    href: '/docs/courses/typescript/',
    linkLabel: 'Browse TypeScript courses',
  },
  'frontend-developer-skills-2026': {
    title: 'Frontend path alignment',
    body: 'Match skills to the structured Frontend Developer path.',
    href: '/docs/paths/frontend-developer-path',
    linkLabel: 'Frontend path guide',
  },
  'frontend-interview-prep-scrimba': {
    title: 'Interview prep courses',
    body: 'Pair this article with JS/React drills in the catalog.',
    href: '/docs/courses/javascript/',
    linkLabel: 'JavaScript courses',
  },
  'portfolio-projects-get-hired-2026': {
    title: 'Build along a path',
    body: 'Career paths bundle portfolio-grade projects, start with Frontend or Fullstack.',
    href: '/docs/paths/',
    linkLabel: 'Choose a path',
  },
  'how-to-get-hired-with-scrimba': {
    title: 'Pricing + paths checklist',
    body: 'Make sure your plan includes the path and community you need for accountability.',
    href: '/docs/pricing/',
    linkLabel: 'Scrimba pricing',
  },
  'career-change-to-coding-2026': {
    title: 'Bootcamp cost vs Scrimba',
    body: 'Run the numbers before you commit to any bootcamp.',
    href: '/docs/pricing/scrimba-vs-bootcamps',
    linkLabel: 'Scrimba vs bootcamps',
  },
  'scrimba-vs-coding-bootcamps-cost': {
    title: 'Bootcamp alternative math',
    body: 'See how subscription cost stacks against cohort bootcamps.',
    href: '/docs/pricing/scrimba-vs-bootcamps',
    linkLabel: 'Open comparison',
  },
  'junior-developer-job-market-2026': {
    title: 'Stay sharp on the stack',
    body: 'Use paths + projects; pricing page helps you pick Pro when you’re consistent.',
    href: '/docs/pricing/',
    linkLabel: 'Scrimba pricing',
  },
  'scrimba-for-teams': {
    title: 'Pro features for teams',
    body: 'See what Pro includes for cohort-style learning.',
    href: '/docs/pricing/pro-vs-free',
    linkLabel: 'Pro vs Free',
  },
  'scrimba-instant-practice-no-setup': {
    title: 'Try the scrim format free',
    body: 'Start with Learn JavaScript or Learn React without installing tooling.',
    href: 'https://scrimba.com/?via=u42d4986',
    linkLabel: 'Try Scrimba free',
  },
  'scrimba-roadmap-whats-coming': {
    title: 'Current catalog',
    body: 'Browse live courses while you wait for upcoming releases.',
    href: '/docs/courses/',
    linkLabel: 'Course catalog',
  },
  'what-makes-scrimba-different': {
    title: 'Compare to other platforms',
    body: 'See where Scrimba wins on format vs breadth.',
    href: '/docs/comparisons/',
    linkLabel: 'All comparisons',
  },
  'scrimba-vs-youtube-coding': {
    title: 'Structured alternative',
    body: 'If YouTube wasn’t enough, map a Scrimba path next.',
    href: '/docs/paths/',
    linkLabel: 'Learning paths',
  },
  'escape-tutorial-hell-scrimba': {
    title: 'Pick a path, not random videos',
    body: 'Use a career path to force project milestones.',
    href: '/docs/paths/',
    linkLabel: 'Browse paths',
  },
  'build-coding-habit-scrimba': {
    title: 'Make Pro worth the habit',
    body: 'If you’ll study 3+ months, annual billing usually wins.',
    href: '/docs/pricing/',
    linkLabel: 'Pricing & billing options',
  },
  'scrimba-neurodivergent-learners': {
    title: 'Adjust pace with modular courses',
    body: 'Pick shorter modules from the catalog if long paths feel heavy.',
    href: '/docs/courses/',
    linkLabel: 'Course catalog',
  },
  'scrimba-success-stories': {
    title: 'Your next step',
    body: 'Match their playbook: path + portfolio + consistent hours.',
    href: '/docs/paths/',
    linkLabel: 'Start a path',
  },
  'projects-youll-build-on-scrimba': {
    title: 'See path projects',
    body: 'Each path page lists flagship builds you can cite in interviews.',
    href: '/docs/paths/',
    linkLabel: 'Learning paths',
  },
  'best-scrimba-courses-career-changers': {
    title: 'Career paths overview',
    body: 'Compare Frontend, Fullstack, Backend, and AI paths in one hub.',
    href: '/docs/paths/',
    linkLabel: 'Compare paths',
  },
  'complete-guide-scrimba-certificates': {
    title: 'Certificates FAQ',
    body: 'How certificates work, LinkedIn, and employer questions.',
    href: '/docs/how-it-works/certificates',
    linkLabel: 'Certificate FAQ',
  },
  'learn-to-code-full-time-job': {
    title: 'Timeboxed learning plan',
    body: 'Pair your schedule with a path’s hour estimate.',
    href: '/docs/paths/',
    linkLabel: 'Path durations',
  },
  'ai-tools-every-developer-should-know-2026': {
    title: 'AI engineering on Scrimba',
    body: 'Apply those tools inside the AI Engineer path projects.',
    href: '/docs/paths/ai-engineer-path',
    linkLabel: 'AI Engineer path',
  },
  'why-i-keep-renewing-scrimba-pro': {
    title: 'Renewal math',
    body: 'Stack annual billing + discounts against your hourly study rate.',
    href: '/blog/scrimba-discount-codes-2026',
    linkLabel: 'Legit Scrimba deals',
  },
  'how-to-learn-javascript-2026': {
    title: 'Start interactive JavaScript',
    body: 'Use Scrimba’s typing-in-lesson format, then add projects.',
    href: '/docs/courses/javascript/',
    linkLabel: 'JavaScript course hub',
  },
  'how-to-learn-react-2026': {
    title: 'Follow the Frontend path',
    body: 'Structured modules beat random YouTube playlists when you need hireable projects.',
    href: '/docs/paths/frontend-developer-path',
    linkLabel: 'Frontend Developer path',
  },
  'how-to-become-frontend-developer-2026': {
    title: 'Path + pricing in one place',
    body: 'Compare Pro vs Free once you commit to weekly study.',
    href: '/docs/pricing/pro-vs-free',
    linkLabel: 'Pro vs Free',
  },
  'javascript-vs-python-beginners-2026': {
    title: 'Pick your track on Scrimba',
    body: 'If JavaScript wins, jump into free modules before buying anything else.',
    href: 'https://scrimba.com/?via=u42d4986',
    linkLabel: 'Try Scrimba free',
  },
};

export function getBlogContextualCta(slug: string): BlogCta {
  return BY_SLUG[slug] ?? DEFAULT_BLOG_CTA;
}
