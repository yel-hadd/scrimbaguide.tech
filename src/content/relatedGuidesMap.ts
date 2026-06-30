export interface RelatedGuide {
  title: string;
  href: string;
  description?: string;
  type?: 'doc' | 'blog' | 'comparison';
}

export const relatedGuidesMap: Record<string, RelatedGuide[]> = {
  // --- Week 27 batch (2026-06/07) ---
  '/blog/do-you-need-to-learn-to-code-if-ai-writes-it': [
    { title: 'Can AI Replace Junior Developers?', href: '/blog/can-ai-replace-junior-developers-2026', type: 'blog' },
    { title: 'From Vibe Coder to Real Developer', href: '/blog/vibe-coder-to-real-developer-2026', type: 'blog' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/blog/is-software-engineering-dead-2026': [
    { title: 'Junior Developer Job Market 2026', href: '/blog/junior-developer-job-market-2026', type: 'blog' },
    { title: 'How to Get Your First Dev Job', href: '/blog/how-to-get-first-developer-job-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/learn-to-code-summer-2026': [
    { title: 'Web Development Roadmap 2026', href: '/blog/web-development-roadmap-2026', type: 'blog' },
    { title: 'How Long to Learn Web Dev', href: '/blog/how-long-to-learn-web-development-2026', type: 'blog' },
    { title: 'Scrimba Study Plan', href: '/docs/paths/study-plan', type: 'doc' },
  ],
  '/blog/coding-bootcamps-closing-2026': [
    { title: 'Best Bootcamp Alternatives 2026', href: '/blog/best-coding-bootcamp-alternatives-2026', type: 'blog' },
    { title: 'Scrimba vs Bootcamps Cost', href: '/docs/pricing/scrimba-vs-bootcamps', type: 'doc' },
    { title: 'Bootcamp Cost Calculator', href: '/tools/bootcamp-cost-calculator/', type: 'doc' },
  ],
  '/blog/cheapest-way-to-learn-ai-agents-2026': [
    { title: 'Scrimba AI Engineer Path Guide', href: '/blog/scrimba-ai-engineer-path-guide', type: 'blog' },
    { title: 'Best Udemy AI Courses', href: '/blog/best-udemy-ai-courses', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/blog/how-to-build-ai-agent-beginners-2026': [
    { title: 'Learn AI Engineering on Scrimba', href: '/blog/learn-ai-engineering-scrimba', type: 'blog' },
    { title: 'AI Tools Every Developer Should Know', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/blog/is-react-still-worth-learning-2026': [
    { title: 'Scrimba React Learning Path', href: '/blog/scrimba-react-learning-path', type: 'blog' },
    { title: 'Frontend Developer Skills 2026', href: '/blog/frontend-developer-skills-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/how-to-learn-coding-without-depending-on-ai': [
    { title: 'Escape Tutorial Hell in 2026', href: '/blog/how-to-escape-tutorial-hell-2026', type: 'blog' },
    { title: 'AI Tools for Learning to Code', href: '/blog/ai-tools-for-learning-to-code-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/how-to-become-ai-engineer-javascript-developer': [
    { title: 'Scrimba AI Engineer Path Guide', href: '/blog/scrimba-ai-engineer-path-guide', type: 'blog' },
    { title: 'Should JS Devs Learn TypeScript?', href: '/blog/should-javascript-developers-learn-typescript-2026', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/blog/developer-specialization-job-market-2026': [
    { title: 'Developer Salary Guide 2026', href: '/blog/developer-salary-guide-2026', type: 'blog' },
    { title: 'Frontend vs Fullstack Path', href: '/blog/scrimba-frontend-vs-fullstack-path', type: 'blog' },
    { title: 'Which Scrimba Path Fits You?', href: '/tools/which-scrimba-path/', type: 'doc' },
  ],

  // --- Blog Posts: Money Pages ---
  '/blog/scrimba-review': [
    { title: 'Is Scrimba Worth It?', href: '/blog/is-scrimba-worth-it', type: 'blog' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/blog/is-scrimba-worth-it': [
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Pro vs Free Comparison', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
  ],
  '/blog/why-i-keep-renewing-scrimba-pro': [
    { title: 'Scrimba vs Bootcamps Cost', href: '/docs/pricing/scrimba-vs-bootcamps', type: 'doc' },
    { title: 'Fullstack Career Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Discount Codes', href: '/blog/scrimba-discount-codes-2026', type: 'blog' },
  ],
  // --- Blog Posts: Guides ---
  '/blog/career-change-to-coding-2026': [
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: '6-Month Study Plan', href: '/docs/paths/study-plan', type: 'doc' },
    { title: 'Success Stories', href: '/blog/scrimba-success-stories', type: 'blog' },
  ],
  '/blog/how-to-escape-tutorial-hell-2026': [
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Scrimba vs YouTube', href: '/docs/comparisons/scrimba-vs-youtube', type: 'comparison' },
    { title: 'Build a Coding Habit', href: '/blog/build-coding-habit-scrimba', type: 'blog' },
  ],
  '/blog/best-free-scrimba-courses': [
    { title: 'Pro vs Free Comparison', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba for Beginners', href: '/docs/for/beginners', type: 'doc' },
    { title: 'Scrimba vs freeCodeCamp', href: '/docs/comparisons/scrimba-vs-freecodecamp', type: 'comparison' },
  ],

  // --- Docs: Paths ---
  '/docs/paths': [
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Frontend vs Fullstack', href: '/blog/scrimba-frontend-vs-fullstack-path', type: 'blog' },
  ],
  '/docs/paths/frontend-developer-path': [
    { title: 'Fullstack vs Frontend Path', href: '/blog/scrimba-frontend-vs-fullstack-path', type: 'blog' },
    { title: 'Study Plan', href: '/docs/paths/study-plan', type: 'doc' },
    { title: 'Career Change Guide', href: '/blog/career-change-to-coding-2026', type: 'blog' },
  ],
  '/docs/paths/fullstack-developer-path': [
    { title: 'Frontend vs Fullstack Path', href: '/blog/scrimba-frontend-vs-fullstack-path', type: 'blog' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/docs/paths/ai-engineer-path': [
    { title: 'Learn AI Engineering', href: '/blog/learn-ai-engineering-scrimba', type: 'blog' },
    { title: 'AI Tools for Developers', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
  ],

  // --- Docs: Comparisons ---
  '/docs/comparisons/scrimba-vs-udemy': [
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Is Scrimba Worth It?', href: '/blog/is-scrimba-worth-it', type: 'blog' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-codecademy': [
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-freecodecamp': [
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba for Beginners', href: '/docs/for/beginners', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-the-odin-project': [
    { title: 'Scrimba for CS Students', href: '/docs/for/cs-students', type: 'doc' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/docs/comparisons/scrimba-vs-odin-project': [
    { title: 'Scrimba for CS Students', href: '/docs/for/cs-students', type: 'doc' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/docs/comparisons/scrimba-vs-youtube': [
    { title: 'Escape Tutorial Hell', href: '/blog/how-to-escape-tutorial-hell-2026', type: 'blog' },
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
  ],
  '/docs/comparisons/scrimba-vs-coursera': [
    { title: 'Scrimba for CS Students', href: '/docs/for/cs-students', type: 'doc' },
    { title: 'Certificates Guide', href: '/blog/complete-guide-scrimba-certificates', type: 'blog' },
    { title: 'Career Change Guide', href: '/blog/career-change-to-coding-2026', type: 'blog' },
  ],

  // --- Docs: Programmatic Pages ---
  '/docs/for/designers': [
    { title: 'Learn CSS Grid', href: '/docs/practice/practice-css-grid', type: 'doc' },
    { title: 'Learn Flexbox', href: '/docs/practice/practice-flexbox', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/docs/for/marketers': [
    { title: 'Learn HTML & CSS', href: '/docs/courses/css/html-and-css', type: 'doc' },
    { title: 'AI Tools for Developers', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/docs/for/beginners': [
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Frontend Roadmap', href: '/roadmaps/frontend-roadmap-2026', type: 'doc' },
  ],

  // --- Docs: Practice Pages ---
  '/docs/practice/practice-css-grid': [
    { title: 'Scrimba for Designers', href: '/docs/for/designers', type: 'doc' },
    { title: 'Practice Flexbox', href: '/docs/practice/practice-flexbox', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/docs/practice/practice-react-hooks': [
    { title: 'React Learning Path', href: '/blog/scrimba-react-learning-path', type: 'blog' },
    { title: 'Practice API Calls', href: '/docs/practice/practice-api-calls', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/docs/pricing/scrimba-free-trial': [
    { title: 'Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Student Discount', href: '/docs/pricing/student-discount', type: 'doc' },
    { title: 'Refund Policy', href: '/docs/pricing/refund-policy', type: 'doc' },
  ],
};

const sectionFallbacks: Record<string, RelatedGuide[]> = {
  '/docs/pricing/': [
    { title: 'Scrimba Free Trial', href: '/docs/pricing/scrimba-free-trial', type: 'doc' },
    { title: 'Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba Discount Codes', href: '/blog/scrimba-discount-codes-2026', type: 'blog' },
  ],
  '/docs/courses/': [
    { title: 'All Courses', href: '/docs/courses/', type: 'doc' },
    { title: 'Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
  ],
  '/docs/faq/': [
    { title: 'Scrimba FAQ', href: '/docs/faq/', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/docs/learn-react/': [
    { title: 'Learn React Roadmap', href: '/docs/learn-react/', type: 'doc' },
    { title: 'React Course Catalog', href: '/docs/courses/react/', type: 'doc' },
    { title: 'Scrimba React Learning Path', href: '/blog/scrimba-react-learning-path', type: 'blog' },
  ],
  '/docs/learn-nextjs/': [
    { title: 'Learn Next.js Roadmap', href: '/docs/learn-nextjs/', type: 'doc' },
    { title: 'JavaScript Courses', href: '/docs/courses/javascript/', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/best-udemy-coding-courses': [
    { title: 'Best Udemy coding courses', href: '/blog/best-udemy-coding-courses', type: 'blog' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
    { title: 'JavaScript courses (Scrimba)', href: '/docs/courses/javascript/', type: 'doc' },
  ],
  '/docs/practice/': [
    { title: 'Practice Guides', href: '/docs/practice/practice-react-projects', type: 'doc' },
    { title: 'All Courses', href: '/docs/courses/', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/roadmaps/': [
    { title: 'Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'All Courses', href: '/docs/courses/', type: 'doc' },
    { title: 'Frontend Interview Prep', href: '/blog/frontend-interview-prep-scrimba', type: 'blog' },
  ],
  '/tools/': [
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs Bootcamps', href: '/docs/pricing/scrimba-vs-bootcamps', type: 'doc' },
    { title: 'Is Scrimba Worth It?', href: '/blog/is-scrimba-worth-it', type: 'blog' },
  ],
};

// Helper to get guides with fallback logic
export function getRelatedGuides(slug: string): RelatedGuide[] {
  // 1. Direct match
  if (relatedGuidesMap[slug]) return relatedGuidesMap[slug];

  // 2. Clean slug (remove trailing slash)
  const cleanSlug = slug.replace(/\/$/, '');
  if (relatedGuidesMap[cleanSlug]) return relatedGuidesMap[cleanSlug];

  // 3. Section-level deterministic fallbacks
  for (const sectionPath of Object.keys(sectionFallbacks)) {
    if (slug.startsWith(sectionPath)) {
      return sectionFallbacks[sectionPath];
    }
  }

  // 4. Fallback based on path segments
  if (slug.includes('/comparisons/')) {
    return [
      { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
      { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
      { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    ];
  }

  if (slug.includes('/paths/')) {
    return [
      { title: 'All Learning Paths', href: '/docs/paths/', type: 'doc' },
      { title: 'Study Plan', href: '/docs/paths/study-plan', type: 'doc' },
      { title: 'Is Scrimba Worth It?', href: '/blog/is-scrimba-worth-it', type: 'blog' },
    ];
  }
  
  if (slug.includes('/practice/')) {
    return [
      { title: 'All Courses', href: '/docs/courses/', type: 'doc' },
      { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
      { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
    ];
  }

  // Default fallback for blog posts
  if (slug.startsWith('/blog/')) {
    return [
      { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
      { title: 'Learning Paths', href: '/docs/paths/', type: 'doc' },
      { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    ];
  }

  return [];
}
