export interface RelatedGuide {
  title: string;
  href: string;
  description?: string;
  type?: 'doc' | 'blog' | 'comparison';
}

export const relatedGuidesMap: Record<string, RelatedGuide[]> = {
  // --- 2026-09-08 ---
  '/docs/intro': [
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/blog/what-makes-scrimba-different': [
    { title: 'What Is Scrimba Explain?', href: '/blog/scrimba-explain-review', type: 'blog' },
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/blog/scrimba-explain-inside-courses': [
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'How to Prompt Scrimba Explain', href: '/blog/how-to-use-scrimba-explain-prompts-and-teaching-styles', type: 'blog' },
    { title: 'Learn RAG (course)', href: '/docs/courses/ai/rag', type: 'doc' },
  ],
  '/blog/scrimba-explain-vs-notebooklm-video-overviews': [
    { title: 'What Is Scrimba Explain? (tested)', href: '/blog/scrimba-explain-review', type: 'blog' },
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'comparison' },
  ],
  '/blog/how-to-use-scrimba-explain-prompts-and-teaching-styles': [
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'The Explain Button Inside Lessons', href: '/blog/scrimba-explain-inside-courses', type: 'blog' },
    { title: 'What Is Scrimba Explain? (tested)', href: '/blog/scrimba-explain-review', type: 'blog' },
  ],
  '/blog/scrimba-explain-claude-code-pr-explainers': [
    { title: 'What Is Scrimba Explain? (tested)', href: '/blog/scrimba-explain-review', type: 'blog' },
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'Reading Code Is the Skill AI Coders Skip', href: '/blog/how-to-get-better-at-reading-code-2026', type: 'blog' },
  ],
  '/docs/how-it-works/scrimba-explain': [
    { title: 'What Is Scrimba Explain? (tested)', href: '/blog/scrimba-explain-review', type: 'blog' },
    { title: 'The Explain Button Inside Lessons', href: '/blog/scrimba-explain-inside-courses', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Scrimba Explain vs NotebookLM', href: '/blog/scrimba-explain-vs-notebooklm-video-overviews', type: 'blog' },
  ],
  '/docs/how-it-works/how-scrims-work': [
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'How to Use Scrimba', href: '/docs/how-it-works/using-scrimba', type: 'doc' },
    { title: 'Escaping Tutorial Hell', href: '/docs/how-it-works/tutorial-hell', type: 'doc' },
  ],
  '/docs/how-it-works/using-scrimba': [
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'Community and Events', href: '/docs/help/community-and-events', type: 'doc' },
  ],
  '/docs/pricing/pro-vs-free': [
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'Scrimba Student Discount', href: '/docs/pricing/student-discount', type: 'doc' },
  ],
  '/blog/scrimba-explain-review': [
    { title: 'Scrimba Explain Guide', href: '/docs/how-it-works/scrimba-explain', type: 'doc' },
    { title: 'The Explain Button Inside Lessons', href: '/blog/scrimba-explain-inside-courses', type: 'blog' },
    { title: 'How to Prompt Scrimba Explain', href: '/blog/how-to-use-scrimba-explain-prompts-and-teaching-styles', type: 'blog' },
    { title: 'Claude Code PR Explainers', href: '/blog/scrimba-explain-claude-code-pr-explainers', type: 'blog' },
  ],
  '/blog/how-to-learn-devops-2026': [
    { title: 'Scrimba Backend Path Review', href: '/blog/scrimba-backend-path-review', type: 'blog' },
    { title: 'Coding Experience Without a Job', href: '/blog/how-to-get-coding-experience-without-a-job-2026', type: 'blog' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
  ],

  // --- Week 30 batch: one post per cluster (2026-07-23) ---
  '/blog/scrimba-vs-chatgpt-learn-to-code': [
    { title: 'Best Interactive Coding Platforms 2026', href: '/blog/best-interactive-coding-platforms-2026', type: 'blog' },
    { title: 'Reading Code Is the Skill AI Coders Skip', href: '/blog/how-to-get-better-at-reading-code-2026', type: 'blog' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/blog/which-coding-path-to-learn-2026': [
    { title: 'Scrimba Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'Scrimba Path Finder', href: '/tools/which-scrimba-path/', type: 'doc' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/blog/cost-to-become-a-developer-2026': [
    { title: 'Scrimba vs Bootcamps Cost', href: '/docs/pricing/scrimba-vs-bootcamps', type: 'doc' },
    { title: 'Bootcamp Cost Calculator', href: '/tools/bootcamp-cost-calculator/', type: 'doc' },
    { title: 'How Long to Learn Web Dev', href: '/blog/how-long-to-learn-web-development-2026', type: 'blog' },
  ],
  '/blog/how-to-get-coding-experience-without-a-job-2026': [
    { title: 'Portfolio Projects That Get You Hired', href: '/blog/portfolio-projects-get-hired-2026', type: 'blog' },
    { title: 'How to Get Your First Dev Job', href: '/blog/how-to-get-first-developer-job-2026', type: 'blog' },
    { title: 'Junior Developer Job Market 2026', href: '/blog/junior-developer-job-market-2026', type: 'blog' },
  ],
  '/blog/what-is-context-engineering': [
    { title: 'How to Become an AI Engineer', href: '/blog/how-to-become-ai-engineer-javascript-developer', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
  ],
  '/blog/how-to-get-better-at-reading-code-2026': [
    { title: 'Scrimba vs ChatGPT', href: '/blog/scrimba-vs-chatgpt-learn-to-code', type: 'blog' },
    { title: 'How to Learn Coding Without Depending on AI', href: '/blog/how-to-learn-coding-without-depending-on-ai', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/best-interactive-coding-platforms-2026': [
    { title: 'Scrimba vs ChatGPT', href: '/blog/scrimba-vs-chatgpt-learn-to-code', type: 'blog' },
    { title: 'Scrimba vs YouTube', href: '/blog/scrimba-vs-youtube-coding', type: 'blog' },
    { title: 'Scrimba Comparisons', href: '/docs/comparisons/', type: 'comparison' },
  ],
  '/blog/best-css-courses-2026': [
    { title: 'Learn HTML and CSS on Scrimba', href: '/docs/courses/css/html-and-css/', type: 'doc' },
    { title: 'Frontend Roadmap 2026', href: '/roadmaps/frontend-roadmap-2026/', type: 'doc' },
    { title: 'Best Free Scrimba Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
  ],

  // --- Week 27 batch (2026-06/07) ---
  '/blog/do-you-need-to-learn-to-code-if-ai-writes-it': [
    { title: 'Can AI Replace Junior Developers?', href: '/blog/can-ai-replace-junior-developers-2026', type: 'blog' },
    { title: 'How to Learn Coding Without Depending on AI', href: '/blog/how-to-learn-coding-without-depending-on-ai', type: 'blog' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/blog/is-software-engineering-dead-2026': [
    { title: 'Junior Developer Job Market 2026', href: '/blog/junior-developer-job-market-2026', type: 'blog' },
    { title: 'How to Get Your First Dev Job', href: '/blog/how-to-get-first-developer-job-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/learn-to-code-summer-2026': [
    { title: 'Escaping Tutorial Hell', href: '/docs/how-it-works/tutorial-hell', type: 'doc' },
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
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
    { title: 'AI Tools Every Developer Should Know', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/blog/is-react-still-worth-learning-2026': [
    { title: 'Scrimba React Learning Path', href: '/blog/scrimba-react-learning-path', type: 'blog' },
    { title: 'Frontend Developer Skills 2026', href: '/blog/frontend-developer-skills-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/how-to-learn-coding-without-depending-on-ai': [
    { title: 'Escaping Tutorial Hell', href: '/docs/how-it-works/tutorial-hell', type: 'doc' },
    { title: 'AI Tools for Learning to Code', href: '/blog/ai-tools-for-learning-to-code-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/how-to-become-ai-engineer-javascript-developer': [
    { title: 'Scrimba AI Engineer Path Guide', href: '/blog/scrimba-ai-engineer-path-guide', type: 'blog' },
    { title: 'Best TypeScript Courses', href: '/blog/best-typescript-courses', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/blog/developer-specialization-job-market-2026': [
    { title: 'Which Coding Path to Learn', href: '/blog/which-coding-path-to-learn-2026', type: 'blog' },
    { title: 'Scrimba Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'Which Scrimba Path Fits You?', href: '/tools/which-scrimba-path/', type: 'doc' },
  ],

  // --- Blog Posts: Money Pages ---
  '/blog/scrimba-review': [
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/blog/why-i-keep-renewing-scrimba-pro': [
    { title: 'Scrimba vs Bootcamps Cost', href: '/docs/pricing/scrimba-vs-bootcamps', type: 'doc' },
    { title: 'Fullstack Career Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Discount Codes', href: '/blog/scrimba-discount-codes-2026', type: 'blog' },
  ],
  // --- Blog Posts: Guides ---
  '/blog/best-free-scrimba-courses': [
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba for Beginners', href: '/docs/for/beginners', type: 'doc' },
    { title: 'Scrimba vs freeCodeCamp', href: '/docs/comparisons/scrimba-vs-freecodecamp', type: 'comparison' },
  ],

  // --- Blog: new comparison posts ---
  '/blog/best-typescript-courses': [
    { title: 'TypeScript Courses Hub', href: '/docs/courses/typescript/', type: 'doc' },
    { title: 'Learn TypeScript (course)', href: '/docs/courses/typescript/learn-typescript', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/best-nextjs-courses': [
    { title: 'Scrimba React Learning Path', href: '/blog/scrimba-react-learning-path', type: 'blog' },
    { title: 'Learn Next.js (course)', href: '/docs/courses/javascript/nextjs', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/best-ai-engineering-courses': [
    { title: 'Scrimba AI Engineer Path Guide', href: '/blog/scrimba-ai-engineer-path-guide', type: 'blog' },
    { title: 'AI Courses Hub', href: '/docs/courses/ai', type: 'doc' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],

  // --- Docs: Paths ---
  '/docs/paths': [
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Which Coding Path to Learn', href: '/blog/which-coding-path-to-learn-2026', type: 'blog' },
  ],
  '/docs/paths/frontend-developer-path': [
    { title: 'Scrimba Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'Study Plan', href: '/docs/paths/study-plan', type: 'doc' },
    { title: 'Best Scrimba Courses for Career Changers', href: '/blog/best-scrimba-courses-career-changers', type: 'blog' },
  ],
  '/docs/paths/fullstack-developer-path': [
    { title: 'Scrimba Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
  ],
  '/docs/paths/ai-engineer-path': [
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
    { title: 'AI Tools for Developers', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
  ],

  // --- Docs: AI course leaves → funnel into the AI Engineer Path money page ---
  '/docs/courses/ai': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Learn AI Agents', href: '/docs/courses/ai/ai-agents', type: 'doc' },
    { title: 'Scrimba AI Engineer Path Guide', href: '/blog/scrimba-ai-engineer-path-guide', type: 'blog' },
  ],
  '/docs/courses/python': [
    { title: 'Learn Python', href: '/docs/courses/python/learn-python', type: 'doc' },
    { title: 'Best Python Courses for Beginners', href: '/docs/courses/python/best-python-courses-for-beginners', type: 'doc' },
    { title: 'Scrimba vs freeCodeCamp', href: '/docs/comparisons/scrimba-vs-freecodecamp', type: 'comparison' },
    { title: 'Best Udemy Python Courses', href: '/blog/best-udemy-python-courses', type: 'blog' },
  ],
  '/docs/courses/python/learn-python': [
    { title: 'Best Python Courses for Beginners', href: '/docs/courses/python/best-python-courses-for-beginners', type: 'doc' },
    { title: 'Python Course Catalog', href: '/docs/courses/python/', type: 'doc' },
    { title: 'For Beginners', href: '/docs/for/beginners', type: 'doc' },
  ],
  '/docs/courses/python/best-python-courses-for-beginners': [
    { title: 'Learn Python', href: '/docs/courses/python/learn-python', type: 'doc' },
    { title: 'For Beginners', href: '/docs/for/beginners', type: 'doc' },
    { title: 'Scrimba vs Codecademy', href: '/docs/comparisons/scrimba-vs-codecademy', type: 'comparison' },
  ],
  '/docs/courses/ai/ai-agents': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Learn RAG', href: '/docs/courses/ai/rag', type: 'doc' },
    { title: 'Scrimba AI Engineer Path Guide', href: '/blog/scrimba-ai-engineer-path-guide', type: 'blog' },
  ],
  '/docs/courses/ai/rag': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Learn AI Agents', href: '/docs/courses/ai/ai-agents', type: 'doc' },
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
  ],
  '/docs/courses/ai/ai-engineering': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Prompt Engineering', href: '/docs/courses/ai/prompt-engineering-for-web-developers', type: 'doc' },
    { title: 'Best AI Engineering Courses', href: '/blog/best-ai-engineering-courses', type: 'blog' },
  ],
  '/docs/courses/ai/prompt-engineering-for-web-developers': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Intro to AI Engineering', href: '/docs/courses/ai/ai-engineering', type: 'doc' },
    { title: 'AI Tools for Developers', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
  ],
  '/docs/courses/ai/context-engineering': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Learn RAG', href: '/docs/courses/ai/rag', type: 'doc' },
    { title: 'Model Context Protocol (MCP)', href: '/docs/courses/ai/model-context-protocol-mcp', type: 'doc' },
  ],
  '/docs/courses/ai/model-context-protocol-mcp': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Learn AI Agents', href: '/docs/courses/ai/ai-agents', type: 'doc' },
    { title: 'Context Engineering', href: '/docs/courses/ai/context-engineering', type: 'doc' },
  ],

  // --- Docs: TypeScript → link both fullstack AND frontend paths ---
  '/docs/courses/typescript': [
    { title: 'Learn TypeScript', href: '/docs/courses/typescript/learn-typescript', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/docs/courses/typescript/learn-typescript': [
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Best TypeScript Courses', href: '/blog/best-typescript-courses', type: 'blog' },
  ],

  // --- Docs: Comparisons ---
  '/docs/comparisons/scrimba-vs-udemy': [
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-codecademy': [
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-freecodecamp': [
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba for Beginners', href: '/docs/for/beginners', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-odin-project': [
    { title: 'Scrimba for CS Students', href: '/docs/for/cs-students', type: 'doc' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/docs/comparisons/scrimba-vs-youtube': [
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free/', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-coursera': [
    { title: 'Scrimba for CS Students', href: '/docs/for/cs-students', type: 'doc' },
    { title: 'Certificates Guide', href: '/blog/complete-guide-scrimba-certificates', type: 'blog' },
    { title: 'Scrimba Student Discount', href: '/docs/pricing/student-discount/', type: 'doc' },
  ],
  '/docs/comparisons/scrimba-vs-boot-dev': [
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs Codecademy', href: '/docs/comparisons/scrimba-vs-codecademy', type: 'comparison' },
  ],
  '/docs/comparisons/scrimba-vs-educative': [
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs Codecademy', href: '/docs/comparisons/scrimba-vs-codecademy', type: 'comparison' },
  ],
  '/docs/comparisons/scrimba-vs-fireship': [
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs YouTube', href: '/docs/comparisons/scrimba-vs-youtube', type: 'comparison' },
  ],
  '/docs/comparisons/scrimba-vs-frontendmasters': [
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
  ],
  '/docs/comparisons/scrimba-vs-pluralsight': [
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
  ],
  '/docs/comparisons/scrimba-vs-treehouse': [
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs Codecademy', href: '/docs/comparisons/scrimba-vs-codecademy', type: 'comparison' },
  ],
  '/docs/comparisons/scrimba-vs-zerotomastery': [
    { title: 'All Comparisons', href: '/docs/comparisons/', type: 'doc' },
    { title: 'Fullstack Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
  ],

  // --- Docs: Programmatic Pages ---
  '/docs/for/designers': [
    { title: 'Learn CSS Grid', href: '/docs/practice/practice-css-grid', type: 'doc' },
    { title: 'Learn Flexbox', href: '/docs/practice/practice-flexbox', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Best CSS Courses 2026', href: '/blog/best-css-courses-2026', type: 'blog' },
  ],
  '/docs/for/marketers': [
    { title: 'Learn HTML & CSS', href: '/docs/courses/css/html-and-css', type: 'doc' },
    { title: 'AI Tools for Developers', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
  ],
  '/docs/for/beginners': [
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path/', type: 'doc' },
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
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Student Discount', href: '/docs/pricing/student-discount', type: 'doc' },
    { title: 'Refund Policy', href: '/docs/pricing/refund-policy', type: 'doc' },
  ],

  // --- Docs: Backend course leaves → funnel into the Backend Developer Path ---
  '/docs/courses/backend/sql': [
    { title: 'Backend Courses', href: '/docs/courses/backend/', type: 'doc' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
    { title: 'Learn Supabase', href: '/docs/courses/backend/supabase', type: 'doc' },
    { title: 'Scrimba vs Boot.dev', href: '/docs/comparisons/scrimba-vs-boot-dev', type: 'comparison' },
  ],
  '/docs/courses/backend/supabase': [
    { title: 'Backend Courses', href: '/docs/courses/backend/', type: 'doc' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
    { title: 'Learn SQL', href: '/docs/courses/backend/sql', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
  ],
  '/docs/courses/backend/regular-expressions': [
    { title: 'Backend Courses', href: '/docs/courses/backend/', type: 'doc' },
    { title: 'Learn JavaScript', href: '/docs/courses/javascript/learn-javascript', type: 'doc' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
  ],
  '/docs/courses/backend/a-mobile-app-with-firebase': [
    { title: 'Backend Courses', href: '/docs/courses/backend/', type: 'doc' },
    { title: 'Learn Firebase', href: '/docs/courses/javascript/firebase', type: 'doc' },
    { title: 'Learn Supabase', href: '/docs/courses/backend/supabase', type: 'doc' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
  ],

  // --- Docs: JavaScript flagship free course → funnel into frontend/fullstack paths ---
  '/docs/courses/javascript/learn-javascript': [
    { title: 'JavaScript Courses', href: '/docs/courses/javascript/', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Best Free Scrimba Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
  ],
  '/blog/developer-job-without-degree-2026': [
    { title: 'Junior Developer Job Market 2026', href: '/blog/junior-developer-job-market-2026', type: 'blog' },
    { title: 'How to Get Your First Dev Job', href: '/blog/how-to-get-first-developer-job-2026', type: 'blog' },
    { title: 'Developer Specialization Job Market 2026', href: '/blog/developer-specialization-job-market-2026', type: 'blog' },
  ],

  // --- Blog health consolidation (2026-09-26): entries for published posts that had none ---
  '/blog/ai-tools-every-developer-should-know-2026': [
    { title: 'AI Tools for Learning to Code', href: '/blog/ai-tools-for-learning-to-code-2026', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
  ],
  '/blog/ai-tools-for-learning-to-code-2026': [
    { title: 'AI Tools Every Developer Should Know', href: '/blog/ai-tools-every-developer-should-know-2026', type: 'blog' },
    { title: 'How to Learn Coding Without Depending on AI', href: '/blog/how-to-learn-coding-without-depending-on-ai', type: 'blog' },
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
  ],
  '/blog/best-coding-bootcamp-alternatives-2026': [
    { title: 'Coding Bootcamps Closing in 2026', href: '/blog/coding-bootcamps-closing-2026', type: 'blog' },
    { title: 'Scrimba vs Bootcamps Cost', href: '/docs/pricing/scrimba-vs-bootcamps', type: 'doc' },
    { title: 'Bootcamp Cost Calculator', href: '/tools/bootcamp-cost-calculator/', type: 'doc' },
    { title: 'Best Udemy Coding Courses', href: '/blog/best-udemy-coding-courses', type: 'blog' },
  ],
  '/blog/best-scrimba-courses-career-changers': [
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: '6-Month Study Plan', href: '/docs/paths/study-plan', type: 'doc' },
    { title: 'Is Software Engineering Dead in 2026?', href: '/blog/is-software-engineering-dead-2026', type: 'blog' },
  ],
  '/blog/best-udemy-ai-courses': [
    { title: 'Best AI Engineering Courses', href: '/blog/best-ai-engineering-courses', type: 'blog' },
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
  ],
  '/blog/best-udemy-javascript-courses': [
    { title: 'JavaScript Courses (Scrimba)', href: '/docs/courses/javascript/', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
    { title: 'Scrimba Learning Paths', href: '/docs/paths/', type: 'doc' },
  ],
  '/blog/best-udemy-python-courses': [
    { title: 'Python Courses (Scrimba)', href: '/docs/courses/python/', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
  ],
  '/blog/best-udemy-react-courses': [
    { title: 'React Courses (Scrimba)', href: '/docs/courses/react/', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Best Udemy JavaScript Courses', href: '/blog/best-udemy-javascript-courses', type: 'blog' },
  ],
  '/blog/best-udemy-web-development-courses': [
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
    { title: 'JavaScript Courses (Scrimba)', href: '/docs/courses/javascript/', type: 'doc' },
  ],
  '/blog/build-coding-habit-scrimba': [
    { title: 'Escaping Tutorial Hell', href: '/docs/how-it-works/tutorial-hell', type: 'doc' },
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Why I Keep Renewing Scrimba Pro', href: '/blog/why-i-keep-renewing-scrimba-pro', type: 'blog' },
  ],
  '/blog/can-ai-replace-junior-developers-2026': [
    { title: 'Junior Developer Job Market 2026', href: '/blog/junior-developer-job-market-2026', type: 'blog' },
    { title: 'Is Software Engineering Dead in 2026?', href: '/blog/is-software-engineering-dead-2026', type: 'blog' },
    { title: 'Do You Need to Learn to Code if AI Writes It?', href: '/blog/do-you-need-to-learn-to-code-if-ai-writes-it', type: 'blog' },
  ],
  '/blog/complete-guide-scrimba-certificates': [
    { title: 'Scrimba vs Coursera', href: '/docs/comparisons/scrimba-vs-coursera', type: 'comparison' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Scrimba for CS Students', href: '/docs/for/cs-students', type: 'doc' },
  ],
  '/blog/frontend-developer-skills-2026': [
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Frontend Interview Prep', href: '/blog/frontend-interview-prep-scrimba', type: 'blog' },
    { title: 'Best Udemy Web Development Courses', href: '/blog/best-udemy-web-development-courses', type: 'blog' },
  ],
  '/blog/frontend-interview-prep-scrimba': [
    { title: 'Frontend Developer Skills 2026', href: '/blog/frontend-developer-skills-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Portfolio Projects That Get You Hired', href: '/blog/portfolio-projects-get-hired-2026', type: 'blog' },
  ],
  '/blog/how-long-to-learn-web-development-2026': [
    { title: 'Learn to Code This Summer', href: '/blog/learn-to-code-summer-2026', type: 'blog' },
    { title: 'Scrimba Study Plan', href: '/docs/paths/study-plan', type: 'doc' },
    { title: 'Cost to Become a Developer 2026', href: '/blog/cost-to-become-a-developer-2026', type: 'blog' },
  ],
  '/blog/how-to-get-first-developer-job-2026': [
    { title: 'How to Get Coding Experience Without a Job', href: '/blog/how-to-get-coding-experience-without-a-job-2026', type: 'blog' },
    { title: 'Junior Developer Job Market 2026', href: '/blog/junior-developer-job-market-2026', type: 'blog' },
    { title: 'Portfolio Projects That Get You Hired', href: '/blog/portfolio-projects-get-hired-2026', type: 'blog' },
  ],
  '/blog/javascript-projects-for-beginners-2026': [
    { title: 'Learn JavaScript (course)', href: '/docs/courses/javascript/learn-javascript', type: 'doc' },
    { title: 'How Long to Learn Web Development', href: '/blog/how-long-to-learn-web-development-2026', type: 'blog' },
    { title: 'Best Udemy JavaScript Courses', href: '/blog/best-udemy-javascript-courses', type: 'blog' },
  ],
  '/blog/junior-developer-job-market-2026': [
    { title: 'Can AI Replace Junior Developers?', href: '/blog/can-ai-replace-junior-developers-2026', type: 'blog' },
    { title: 'How to Get Your First Dev Job', href: '/blog/how-to-get-first-developer-job-2026', type: 'blog' },
    { title: 'Developer Specialization Job Market 2026', href: '/blog/developer-specialization-job-market-2026', type: 'blog' },
  ],
  '/blog/portfolio-projects-get-hired-2026': [
    { title: 'How to Get Coding Experience Without a Job', href: '/blog/how-to-get-coding-experience-without-a-job-2026', type: 'blog' },
    { title: 'How to Get Your First Dev Job', href: '/blog/how-to-get-first-developer-job-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
  '/blog/projects-youll-build-on-scrimba': [
    { title: 'JavaScript Projects for Beginners 2026', href: '/blog/javascript-projects-for-beginners-2026', type: 'blog' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/blog/scrimba-ai-engineer-path-guide': [
    { title: 'AI Engineer Path', href: '/docs/paths/ai-engineer-path', type: 'doc' },
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
    { title: 'Best AI Engineering Courses', href: '/blog/best-ai-engineering-courses', type: 'blog' },
  ],
  '/blog/scrimba-backend-path-review': [
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba vs Boot.dev', href: '/docs/comparisons/scrimba-vs-boot-dev', type: 'comparison' },
  ],
  '/blog/scrimba-discount-codes-2026': [
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/blog/scrimba-for-teams': [
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
  ],
  '/blog/scrimba-fullstack-path-reviews': [
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path', type: 'doc' },
    { title: 'Scrimba Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'Backend Developer Path', href: '/docs/paths/backend-developer-path', type: 'doc' },
  ],
  '/blog/scrimba-instant-practice-no-setup': [
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
  ],
  '/blog/scrimba-neurodivergent-learners': [
    { title: 'How Scrims Work', href: '/docs/how-it-works/how-scrims-work', type: 'doc' },
    { title: 'Scrimba for Beginners', href: '/docs/for/beginners', type: 'doc' },
    { title: 'Build a Coding Habit', href: '/blog/build-coding-habit-scrimba', type: 'blog' },
  ],
  '/blog/scrimba-react-learning-path': [
    { title: 'React Courses (Scrimba)', href: '/docs/courses/react/', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Best Udemy React Courses', href: '/blog/best-udemy-react-courses', type: 'blog' },
  ],
  '/blog/scrimba-roadmap-whats-coming': [
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
    { title: 'What Makes Scrimba Different', href: '/blog/what-makes-scrimba-different', type: 'blog' },
    { title: 'Scrimba AI Courses', href: '/docs/courses/ai/', type: 'doc' },
  ],
  '/blog/scrimba-success-stories': [
    { title: 'Best Scrimba Courses for Career Changers', href: '/blog/best-scrimba-courses-career-changers', type: 'blog' },
    { title: 'Escaping Tutorial Hell', href: '/docs/how-it-works/tutorial-hell', type: 'doc' },
    { title: 'Build a Coding Habit', href: '/blog/build-coding-habit-scrimba', type: 'blog' },
  ],
  '/blog/scrimba-vs-coding-bootcamps-cost': [
    { title: 'Scrimba vs Bootcamps Cost (doc)', href: '/docs/pricing/scrimba-vs-bootcamps', type: 'doc' },
    { title: 'Best Bootcamp Alternatives 2026', href: '/blog/best-coding-bootcamp-alternatives-2026', type: 'blog' },
    { title: 'Scrimba Review 2026', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/blog/scrimba-vs-youtube-coding': [
    { title: 'Scrimba vs YouTube', href: '/docs/comparisons/scrimba-vs-youtube', type: 'comparison' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
    { title: 'Escaping Tutorial Hell', href: '/docs/how-it-works/tutorial-hell', type: 'doc' },
  ],
  '/blog/what-is-vibe-coding-2026': [
    { title: 'How to Learn Coding Without Depending on AI', href: '/blog/how-to-learn-coding-without-depending-on-ai', type: 'blog' },
    { title: 'Escaping Tutorial Hell', href: '/docs/how-it-works/tutorial-hell', type: 'doc' },
    { title: 'Do You Need to Learn to Code if AI Writes It?', href: '/blog/do-you-need-to-learn-to-code-if-ai-writes-it', type: 'blog' },
  ],
};

const sectionFallbacks: Record<string, RelatedGuide[]> = {
  '/docs/pricing/': [
    { title: 'Scrimba Free Trial', href: '/docs/pricing/scrimba-free-trial', type: 'doc' },
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free', type: 'doc' },
    { title: 'Scrimba Discount Codes', href: '/blog/scrimba-discount-codes-2026', type: 'blog' },
  ],
  '/docs/courses/': [
    { title: 'Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free/', type: 'doc' },
    { title: 'Best Free Courses', href: '/blog/best-free-scrimba-courses', type: 'blog' },
  ],
  '/docs/faq/': [
    { title: 'Scrimba Pricing', href: '/docs/pricing/', type: 'doc' },
    { title: 'Scrimba Student Discount', href: '/docs/pricing/student-discount/', type: 'doc' },
    { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
  ],
  '/docs/learn-react/': [
    { title: 'React Course Catalog', href: '/docs/courses/react/', type: 'doc' },
    { title: 'Frontend Developer Path', href: '/docs/paths/frontend-developer-path/', type: 'doc' },
    { title: 'Scrimba React Learning Path', href: '/blog/scrimba-react-learning-path', type: 'blog' },
  ],
  '/docs/learn-nextjs/': [
    { title: 'JavaScript Courses', href: '/docs/courses/javascript/', type: 'doc' },
    { title: 'Fullstack Developer Path', href: '/docs/paths/fullstack-developer-path/', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
    { title: 'Best Next.js Courses', href: '/blog/best-nextjs-courses', type: 'blog' },
  ],
  '/blog/best-udemy-coding-courses': [
    { title: 'Scrimba vs Udemy', href: '/docs/comparisons/scrimba-vs-udemy', type: 'comparison' },
    { title: 'Learning Paths', href: '/docs/paths/', type: 'doc' },
    { title: 'JavaScript courses (Scrimba)', href: '/docs/courses/javascript/', type: 'doc' },
  ],
  '/docs/practice/': [
    { title: 'Practice Guides', href: '/docs/practice/practice-react-projects', type: 'doc' },
    { title: 'All Courses', href: '/docs/courses/', type: 'doc' },
    { title: 'Frontend Path', href: '/docs/paths/frontend-developer-path', type: 'doc' },
  ],
};

/* eslint-disable @typescript-eslint/no-require-imports */
const catalog = require('../../data/courses.json') as Array<{
  cleanName: string;
  docSlug: string;
  category: string;
  isPath: boolean;
  pathMembership?: string[];
  relatedCourses?: Array<{ docSlug: string; category: string }>;
}>;

const CATEGORY_HUBS: Record<string, string> = {
  react: 'Scrimba React Courses',
  javascript: 'Scrimba JavaScript Courses',
  css: 'Scrimba CSS Courses',
  ai: 'Scrimba AI Courses',
  backend: 'Scrimba Backend Courses',
  python: 'Scrimba Python Courses',
  typescript: 'Scrimba TypeScript Courses',
};

const PATH_TITLES: Record<string, string> = {
  'frontend-developer-path': 'Frontend Developer Path',
  'fullstack-developer-path': 'Fullstack Developer Path',
  'backend-developer-path': 'Backend Developer Path',
  'ai-engineer-path': 'AI Engineer Path',
};

const CATEGORY_DEFAULT_PATH: Record<string, string> = {
  react: 'frontend-developer-path',
  javascript: 'frontend-developer-path',
  css: 'frontend-developer-path',
  ai: 'ai-engineer-path',
  backend: 'backend-developer-path',
  python: 'backend-developer-path',
  typescript: 'fullstack-developer-path',
};

/**
 * Category-aware fallback for course leaves (`/docs/courses/<cat>/<slug>`).
 * Every leaf links back up to its category hub (hub-and-spoke), forward to the
 * path that contains it, and sideways to one sibling course, so no course page
 * is a dead end even without a hand-written entry above.
 */
function courseLeafFallback(slug: string): RelatedGuide[] | null {
  const m = /^\/docs\/courses\/([^/]+)\/([^/]+)\/?$/.exec(slug);
  if (!m) return null;
  const [, category, docSlug] = m;
  const hubTitle = CATEGORY_HUBS[category];
  if (!hubTitle) return null;
  const course = catalog.find((c) => c.docSlug === docSlug && !c.isPath);
  const pathSlug =
    course?.pathMembership?.find((p) => PATH_TITLES[p]) ?? CATEGORY_DEFAULT_PATH[category];
  const guides: RelatedGuide[] = [
    { title: PATH_TITLES[pathSlug], href: `/docs/paths/${pathSlug}/`, type: 'doc' },
    { title: hubTitle, href: `/docs/courses/${category}/`, type: 'doc' },
  ];
  const sibling = course?.relatedCourses
    ?.filter((rc) => rc.category === category && rc.docSlug !== docSlug)
    .map((rc) => catalog.find((c) => c.docSlug === rc.docSlug && !c.isPath))
    .find((c) => c);
  if (sibling) {
    guides.push({ title: sibling.cleanName, href: `/docs/courses/${sibling.category}/${sibling.docSlug}/`, type: 'doc' });
  } else {
    guides.push({ title: 'Is Scrimba Free? Pro vs Free', href: '/docs/pricing/pro-vs-free/', type: 'doc' });
  }
  return guides;
}

/** Never suggest the page the reader is already on. */
function withoutSelf(guides: RelatedGuide[], slug: string): RelatedGuide[] {
  const norm = (p: string) => p.replace(/\/$/, '');
  return guides.filter((g) => norm(g.href) !== norm(slug));
}

// Helper to get guides with fallback logic
export function getRelatedGuides(slug: string): RelatedGuide[] {
  return withoutSelf(resolveRelatedGuides(slug), slug);
}

function resolveRelatedGuides(slug: string): RelatedGuide[] {
  // 1. Direct match
  if (relatedGuidesMap[slug]) return relatedGuidesMap[slug];

  // 2. Clean slug (remove trailing slash)
  const cleanSlug = slug.replace(/\/$/, '');
  if (relatedGuidesMap[cleanSlug]) return relatedGuidesMap[cleanSlug];

  // 3. Course leaves: category hub + containing path + sibling course
  const courseGuides = courseLeafFallback(slug);
  if (courseGuides) return courseGuides;

  // 4. Section-level deterministic fallbacks
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
      { title: 'Scrimba Review', href: '/blog/scrimba-review', type: 'blog' },
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
