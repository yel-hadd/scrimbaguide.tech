/** Inline CTA shown after blog posts (see BlogContextualCta). */

export type BlogCta = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export const DEFAULT_BLOG_CTA: BlogCta = {
  title: 'Not sure yet? Try a real lesson first',
  body: 'You can open a Scrimba lesson free with no signup. A one-time 20%-off Pro banner pops up first; close it and the lesson is yours to explore. Compare the plans here before you pay for anything.',
  href: '/docs/pricing/',
  linkLabel: 'See Scrimba pricing (2026)',
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
    title: 'See your real price with the discount applied',
    body: 'There is no code to type. Our partner link applies 20% off Pro at checkout, and a one-time banner confirms it. Open the pricing page to check your regional price before you decide.',
    href: 'https://scrimba.com/home?pricing&via=u42d4986',
    linkLabel: 'Open Scrimba pricing (20% applied)',
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
    title: 'Start the free TypeScript course',
    body: 'The Learn TypeScript course by Bob Ziroll is free and runs in your browser, no signup. A 20%-off Pro banner shows first; close it and work through every lesson for free. Upgrade only if you want the full path.',
    href: 'https://scrimba.com/learn-typescript-c03c',
    linkLabel: 'Open Learn TypeScript (free)',
  },
  'how-to-learn-typescript-scrimba': {
    title: 'Open Learn TypeScript free',
    body: 'It runs in your browser with no signup. You will see a one-time 20%-off Pro popup; close it and the whole course is open to explore for free.',
    href: 'https://scrimba.com/learn-typescript-c03c',
    linkLabel: 'Start Learn TypeScript',
  },
  'should-javascript-developers-learn-typescript-2026': {
    title: 'Try TypeScript in the browser',
    body: 'Decide for yourself in ten minutes: Learn TypeScript is free and needs no signup. Close the one-time 20%-off Pro banner and the full course is yours.',
    href: 'https://scrimba.com/learn-typescript-c03c',
    linkLabel: 'Open the free TypeScript course',
  },
  'best-typescript-courses': {
    title: 'Start the free TypeScript course',
    body: 'Skip the video backlog: Learn TypeScript is free and interactive, no signup. Close the one-time 20%-off Pro banner and the whole course stays open.',
    href: 'https://scrimba.com/learn-typescript-c03c',
    linkLabel: 'Open Learn TypeScript (free)',
  },
  'best-nextjs-courses': {
    title: 'Build a Next.js app for free',
    body: 'Learn Next.js is free and interactive, no signup. Close the one-time 20%-off Pro banner and build a real app in the browser.',
    href: 'https://scrimba.com/learn-nextjs-c02moisq6a',
    linkLabel: 'Open Learn Next.js (free)',
  },
  'best-ai-engineering-courses': {
    title: 'See the AI Engineer Path',
    body: 'One structured track from calling an API to shipping an AI app. Try the interactive format free first; our partner link takes 20% off Pro if you upgrade.',
    href: '/docs/paths/ai-engineer-path',
    linkLabel: 'AI Engineer Path overview',
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
  // --- Week 27 batch (2026-06/07) ---
  'do-you-need-to-learn-to-code-if-ai-writes-it': {
    title: 'Build the skill that gets hired',
    body: 'Reading and verifying code is the part AI cannot do for you. Practice it by editing real programs.',
    href: '/docs/pricing/',
    linkLabel: 'See Scrimba pricing',
  },
  'is-software-engineering-dead-2026': {
    title: 'Start a projects-first path',
    body: 'The entry door is narrower, so prove you can ship. The Frontend path is built around real projects.',
    href: '/docs/paths/frontend-developer-path',
    linkLabel: 'Frontend Developer path',
  },
  'learn-to-code-summer-2026': {
    title: 'Follow a week-by-week plan',
    body: 'A structured study plan keeps a summer of learning from drifting into tutorial hell.',
    href: '/docs/paths/study-plan',
    linkLabel: 'Scrimba study plan',
  },
  'coding-bootcamps-closing-2026': {
    title: 'A lower-risk way to learn',
    body: 'No five-figure upfront tuition. Run the numbers against a cohort bootcamp first.',
    href: '/docs/pricing/scrimba-vs-bootcamps',
    linkLabel: 'Scrimba vs bootcamps',
  },
  'cheapest-way-to-learn-ai-agents-2026': {
    title: 'Lowest-cost coherent path',
    body: 'One subscription covers agents, RAG, and MCP end to end, in JavaScript.',
    href: '/docs/paths/ai-engineer-path',
    linkLabel: 'AI Engineer path',
  },
  'how-to-build-ai-agent-beginners-2026': {
    title: 'Go past the toy agent',
    body: 'The AI Engineer path sequences agents, RAG, and MCP so your second agent holds up.',
    href: '/docs/paths/ai-engineer-path',
    linkLabel: 'AI Engineer path',
  },
  'is-react-still-worth-learning-2026': {
    title: 'Learn modern React in order',
    body: 'Skip the 2021 tutorials. The Frontend path teaches current React with real projects.',
    href: '/docs/paths/frontend-developer-path',
    linkLabel: 'Frontend Developer path',
  },
  'how-to-learn-coding-without-depending-on-ai': {
    title: 'Practice where you cannot paste',
    body: 'The scrim format makes you type and fix code yourself, which is how recall actually forms.',
    href: '/docs/paths/frontend-developer-path',
    linkLabel: 'Frontend Developer path',
  },
  'how-to-become-ai-engineer-javascript-developer': {
    title: 'A JavaScript-first AI path',
    body: 'No Python detour. Agents, RAG, and MCP in JavaScript and TypeScript.',
    href: '/docs/paths/ai-engineer-path',
    linkLabel: 'AI Engineer path',
  },
  'developer-specialization-job-market-2026': {
    title: 'Find your specialization',
    body: 'Answer a few questions and get matched to a path that fits your goals.',
    href: '/tools/which-scrimba-path/',
    linkLabel: 'Path Advisor',
  },
};

export function getBlogContextualCta(slug: string): BlogCta {
  return BY_SLUG[slug] ?? DEFAULT_BLOG_CTA;
}
