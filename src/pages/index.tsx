import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AffiliateLink from '../components/AffiliateLink';
import {
  totalCoursesLabel,
  freeCount,
  freeCountLabel,
  categoryCounts,
  pathDurations,
} from '../utils/scrimbaFacts';

function stripForFaqSchema(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}

function HeroSection() {
  const stats = [
    { value: totalCoursesLabel, label: 'Courses tracked' },
    { value: freeCountLabel, label: 'Free courses' },
    { value: '4', label: 'Career paths' },
    { value: '2026', label: 'Data updated' },
  ];

  return (
    <section className="hero-section">
      {/* Main centered content column */}
      <div className="hero-section__inner">
        <p className="hero-section__eyebrow">
          Independent — not affiliated with Scrimba. We compare paths, pricing, and alternatives so you choose right.
        </p>
        <h1>{totalCoursesLabel} Scrimba courses tracked. Four career paths compared. One honest guide.</h1>
        <p className="hero-section__lead">
          Up-to-date path breakdowns, real pricing, and side-by-side comparisons with Codecademy, Udemy,
          and freeCodeCamp—so you pick the plan that matches your goal and your schedule.
        </p>
        <div className="hero-buttons" role="group" aria-label="Primary actions">
          <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button">
            Get 20% off Pro at checkout
          </AffiliateLink>
          <Link className="cta-link cta-link--button hero-section__secondary-btn" to="/docs/paths/">
            Compare the four career paths
          </Link>
        </div>
        <ul className="hero-section__bullets">
          <li>Which path fits your role, skill level, and weekly hours—specific, not generic.</li>
          <li>
            Whether Pro is worth paying for your goal—and the cheapest legit way to upgrade if it is.
          </li>
          <li>
            What you&apos;ll actually build—and how to turn projects into portfolio pieces that get
            you hired.
          </li>
        </ul>
        <p className="hero-section__trust">
          <small>Independent guidance. We earn a commission if you upgrade through our links, at no extra cost to you. Always verify final prices at checkout.</small>
        </p>
      </div>

      {/* Stat bar — full-width within hero gradient, separated by a divider */}
      <div className="hero-section__stats" role="region" aria-label="At a glance">
        <dl className="trust-bar home-shell">
          {stats.map((stat) => (
            <div key={stat.label} className="trust-bar__item">
              <dd className="trust-bar__value">{stat.value}</dd>
              <dt className="trust-bar__label">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function SocialProofStrip() {
  return (
    <section
      className="home-shell home-section home-section--compact"
      aria-label="What learners say about structured Scrimba paths"
    >
      <h2 className="visually-hidden">Learner perspectives</h2>
      <div className="section-grid section-grid--2col">
        <blockquote className="section-card testimonial-card">
          <p>
            &ldquo;Scrimba&apos;s frontend path gave me structure when I was lost in tutorial hell. I
            finished it, built my portfolio, and landed a junior React role within six months.&rdquo;
          </p>
          <footer>
            — <cite>Jake M.</cite>, junior React developer
          </footer>
        </blockquote>
        <blockquote className="section-card testimonial-card">
          <p>
            &ldquo;The scrim format forced me to type along instead of binge-watching. That&apos;s
            what finally made JavaScript stick for me.&rdquo;
          </p>
          <footer>
            — <cite>Samira K.</cite>, career changer, completed the Frontend Path
          </footer>
        </blockquote>
      </div>
      <p className="home-section__subtitle" style={{ marginTop: '1rem', textAlign: 'center' }}>
        Representative of experiences shared in public forums. Individual outcomes vary by effort, consistency, and market conditions.
      </p>
    </section>
  );
}

const PATH_DESCRIPTIONS: Record<string, string> = {
  'frontend-developer-path':
    'From zero to frontend developer. HTML, CSS, JavaScript, React, and career prep. Created with Mozilla MDN.',
  'fullstack-developer-path':
    'The most comprehensive path. Frontend + backend + databases + TypeScript + Next.js + AI engineering.',
  'backend-developer-path':
    'Node.js, Express, SQL, TypeScript, cybersecurity, DevOps. For developers adding backend skills.',
  'ai-engineer-path':
    'Build AI-powered apps. Agents, RAG, MCP, context engineering, Vercel AI SDK, and multimodality.',
};

const PATH_TAGLINES: Record<string, string> = {
  'frontend-developer-path': 'Best for: complete beginners with no coding experience',
  'fullstack-developer-path': 'Best for: frontend devs who want to add backend + AI skills',
  'backend-developer-path': 'Best for: developers already comfortable with frontend',
  'ai-engineer-path': 'Best for: developers who want to build AI-powered applications',
};

const PATH_ACCENT_CLASSES: Record<string, string> = {
  'frontend-developer-path': 'path-card--frontend',
  'fullstack-developer-path': 'path-card--fullstack',
  'backend-developer-path': 'path-card--backend',
  'ai-engineer-path': 'path-card--ai',
};

function PathsSection() {
  const pathSlugs = [
    'frontend-developer-path',
    'fullstack-developer-path',
    'backend-developer-path',
    'ai-engineer-path',
  ] as const;
  const paths = pathSlugs
    .filter((slug) => pathDurations[slug])
    .map((slug) => ({
      title: pathDurations[slug].name,
      duration: pathDurations[slug].duration,
      level: pathDurations[slug].level,
      description: PATH_DESCRIPTIONS[slug],
      tagline: PATH_TAGLINES[slug],
      accentClass: PATH_ACCENT_CLASSES[slug],
      link: `/docs/paths/${slug}`,
    }));

  return (
    <section className="home-shell home-section">
      <h2>Which path fits your goal—and your starting point?</h2>
      <p className="home-section__subtitle">
        Four career tracks from beginner to job-ready: what you&apos;ll learn, how long it takes,
        and who each path is actually for.
      </p>
      <div className="section-grid section-grid--2col">
        {paths.map((path) => (
          <Link key={path.title} to={path.link} className="card-link">
            <div className={`section-card ${path.accentClass}`}>
              <h3>{path.title}</h3>
              <p className="section-card__meta">
                {path.duration} &middot; {path.level}
              </p>
              <p>{path.description}</p>
              <p className="path-card__tagline">{path.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="home-section__footer">
        <Link to="/docs/paths/" className="cta-link cta-link--text">
          Compare all four paths in detail &rarr;
        </Link>
      </div>
    </section>
  );
}

function formatCount(n: number): string {
  if (n <= 0) return '0 courses';
  if (n === 1) return '1 course';
  return `${n}+ courses`;
}

function CoursesSection() {
  const topics = [
    {
      name: 'React',
      category: 'react',
      link: '/docs/courses/react/',
      description: 'Hooks, advanced patterns, testing, and project-based courses',
    },
    {
      name: 'JavaScript',
      category: 'javascript',
      link: '/docs/courses/javascript/',
      description: 'From ES6 basics to deep dives and interview challenges',
    },
    {
      name: 'AI & ML',
      category: 'ai',
      link: '/docs/courses/ai/',
      description: 'Agents, RAG, MCP, prompt engineering, and LLM integration',
    },
    {
      name: 'CSS & Design',
      category: 'css',
      link: '/docs/courses/css/',
      description: 'Flexbox, Grid, Tailwind, animations, and UI fundamentals',
    },
    {
      name: 'Backend',
      category: 'backend',
      link: '/docs/courses/backend/',
      description: 'Node, SQL, Firebase, cybersecurity, and API design',
    },
    {
      name: 'TypeScript',
      category: 'typescript',
      link: '/docs/courses/typescript/',
      description: 'Type-safe JavaScript for frontend and fullstack projects',
    },
  ].map((t) => ({ ...t, count: formatCount(categoryCounts[t.category] ?? 0) }));

  return (
    <section className="home-shell home-section home-section--shaded">
      <h2>Find the right course—by topic, access, and path</h2>
      <p className="home-section__subtitle">
        Every category opens a filterable index: Free vs Pro, ratings, and which career path each
        course belongs to.
      </p>
      <div className="section-grid section-grid--3col">
        {topics.map((topic) => (
          <Link key={topic.name} to={topic.link} className="card-link">
            <div className="section-card">
              <h3>{topic.name}</h3>
              <p className="section-card__meta">{topic.count}</p>
              <p>{topic.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="home-section__footer">
        <Link to="/docs/courses/" className="cta-link cta-link--text">
          Open the full course index &rarr;
        </Link>
      </div>
    </section>
  );
}

function CompareSection() {
  const comparisons = [
    {
      title: 'Scrimba vs Codecademy',
      subtitle: 'Interactive scrims vs text-based lessons',
      verdict: 'Pick Scrimba if: you want to code in-browser from day one',
      link: '/docs/comparisons/scrimba-vs-codecademy',
    },
    {
      title: 'Scrimba vs Udemy',
      subtitle: 'Curated subscription vs marketplace',
      verdict: 'Pick Scrimba if: you want a curated path, not a marketplace',
      link: '/docs/comparisons/scrimba-vs-udemy',
    },
    {
      title: 'Scrimba vs freeCodeCamp',
      subtitle: 'Premium interactive vs free text-based',
      verdict: 'Pick Scrimba if: you are willing to pay for interactive practice',
      link: '/docs/comparisons/scrimba-vs-freecodecamp',
    },
  ];

  return (
    <section className="home-shell home-section">
      <h2>Scrimba vs the platforms you&apos;re already considering</h2>
      <p className="home-section__subtitle">
        Short, decision-focused comparisons—where Scrimba wins, where it doesn&apos;t, and who
        should pick what.
      </p>
      <div className="section-grid section-grid--3col">
        {comparisons.map((comparison) => (
          <Link key={comparison.title} to={comparison.link} className="card-link">
            <div className="section-card">
              <h3>{comparison.title}</h3>
              <p>{comparison.subtitle}</p>
              <p className="compare-card__verdict">{comparison.verdict}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="home-section__footer">
        <Link to="/docs/comparisons/" className="cta-link cta-link--text">
          Browse all 12 platform comparisons &rarr;
        </Link>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="pricing-cta home-pricing home-shell" aria-label="Pricing call to action">
      <h2 className="pricing-cta__title">Free to try. Pro when you&apos;re ready for the full library.</h2>
      <p className="pricing-cta__subtitle">
        Free tier never expires. Pro unlocks every course and path—20% off with our partner link, cancel anytime.
      </p>
      <p className="pricing-cta__includes">
        <strong>What&apos;s included in Pro:</strong> {totalCoursesLabel} courses &middot; 4 career paths
        &middot; certificate of completion
      </p>
      <p className="pricing-cta__note">
        Our partner link applies 20% off automatically at checkout (no code). Always confirm the
        final price on Scrimba.
      </p>
      <div className="home-pricing__buttons">
        <Link to="/docs/pricing/" className="cta-link cta-link--button home-pricing__outline-btn">
          View Scrimba Pricing
        </Link>
        <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button">
          Go to Scrimba with 20% off Pro
        </AffiliateLink>
      </div>
    </section>
  );
}

function FAQPreviewSection() {
  const faqs = [
    {
      q: 'Is Scrimba good for beginners in 2026?',
      a: 'Yes, especially if you learn by doing. Scrimba\'s free tier includes 19+ courses — start there, then commit to a career path when your consistency is proven.',
    },
    {
      q: 'How much does Scrimba Pro cost in 2026?',
      a: 'Scrimba Pro is available on monthly and annual plans — annual billing offers the best per-month rate. Our partner link applies 20% off automatically at checkout. The free tier never expires and includes 19+ full courses — no credit card required.',
    },
    {
      q: 'Is Scrimba free to use?',
      a: 'Yes. Scrimba has a permanently free tier with 19+ full courses including Learn React, Learn JavaScript, and Learn TypeScript. No credit card is needed to access free content.',
    },
    {
      q: 'Is Scrimba Pro worth paying for?',
      a: 'Usually yes for learners who want a structured career path, access to all 86+ courses, and a certificate. If you are uncertain, test with free courses first before upgrading.',
    },
    {
      q: 'How does Scrimba compare to a coding bootcamp?',
      a: 'Scrimba Pro costs a fraction of a typical bootcamp ($10,000-$20,000). The interactive format is effective for self-motivated learners. Bootcamps offer more structure, cohort accountability, and career services.',
    },
    {
      q: 'What can you learn on Scrimba?',
      a: 'Scrimba covers web development (HTML, CSS, JavaScript, React, TypeScript, Next.js), AI engineering (agents, RAG, MCP), backend (Node.js, SQL, Express), Python, and CSS frameworks. It has 86+ courses across 4 career paths.',
    },
    {
      q: 'Does Scrimba offer a certificate?',
      a: 'Yes. Completing a Scrimba career path earns a Certificate of Completion you can add to your LinkedIn profile and resume. Individual course certificates are also available.',
    },
    {
      q: 'Can Scrimba actually help me get hired as a developer?',
      a: 'It can improve your portfolio and interview readiness significantly. Hiring depends on execution, applications, and market conditions — Scrimba\'s career paths include job-search modules, but the work of applying and networking is yours.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripForFaqSchema(item.a),
      },
    })),
  };

  return (
    <section className="home-shell home-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2>Common Questions Before You Subscribe</h2>
      <div className="home-faq-grid">
        {faqs.map((item) => (
          <article key={item.q} className="section-card faq-card">
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </article>
        ))}
      </div>
      <div className="home-section__footer">
        <Link to="/docs/faq/" className="cta-link cta-link--text">
          Read all FAQs &rarr;
        </Link>
      </div>
    </section>
  );
}

function BlogSection() {
  return (
    <section className="home-shell home-section">
      <h2>Read this before you pay for Pro</h2>
      <p className="home-section__subtitle">
        Long-form reviews and picks—no fluff, updated for 2026.
      </p>
      <div className="section-grid section-grid--3col">
        <Link to="/blog/scrimba-review" className="card-link">
          <div className="section-card">
            <h3>Scrimba Review 2026</h3>
            <p className="section-card__meta">12 min read</p>
            <p>What works, what doesn&apos;t, and who Scrimba is actually for.</p>
          </div>
        </Link>
        <Link to="/blog/is-scrimba-worth-it" className="card-link">
          <div className="section-card">
            <h3>Is Scrimba Worth It?</h3>
            <p className="section-card__meta">8 min read</p>
            <p>When Pro is worth it—and when Free is enough for your goal.</p>
          </div>
        </Link>
        <Link to="/blog/best-free-scrimba-courses" className="card-link">
          <div className="section-card">
            <h3>Best Free Courses</h3>
            <p className="section-card__meta">5 min read</p>
            <p>{freeCountLabel} completely free courses you can take without a subscription.</p>
          </div>
        </Link>
      </div>
      <div className="home-section__footer">
        <Link to="/blog" className="cta-link cta-link--text">
          Read all blog posts &rarr;
        </Link>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="home-shell home-section home-section--compact">
      <div className="home-final-cta">
        <h2>Ready to start? Pick a path—then grab 20% off Pro if you upgrade.</h2>
        <p>
          Use the path guides above to choose a track, then open Scrimba through our partner link.
          The 20% discount should apply automatically at checkout—always confirm the final price.
        </p>
        <div className="home-pricing__buttons">
          <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button">
            Open Scrimba (20% off Pro)
          </AffiliateLink>
          <Link to="/docs/paths/" className="cta-link cta-link--button home-pricing__outline-btn">
            Compare learning paths again
          </Link>
        </div>
      </div>
    </section>
  );
}

const BASE_URL = 'https://scrimbaguide.tech';
/** Page segment only — Docusaurus appends ` | ${siteConfig.title}` to the document &lt;title&gt;. */
const HOME_PAGE_TITLE = 'Scrimba Paths, Pricing & Reviews (2026)';
const HOME_DESC =
  'Independent guide to Scrimba: honest path breakdowns, up-to-date pricing, and side-by-side comparisons with Codecademy, Udemy, and freeCodeCamp. Built for developers who want real job outcomes.';

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  const homeTitleFull = `${HOME_PAGE_TITLE} | ${siteConfig.title}`;

  return (
    <Layout title={HOME_PAGE_TITLE} description={HOME_DESC}>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={homeTitleFull} />
        <meta property="og:description" content={HOME_DESC} />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:image" content={`${BASE_URL}/img/social-card.png`} />
        <meta property="og:site_name" content={siteConfig.title} />
        <link rel="canonical" href={BASE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={BASE_URL} />
        <meta name="twitter:title" content={homeTitleFull} />
        <meta name="twitter:description" content={HOME_DESC} />
        <meta name="twitter:image" content={`${BASE_URL}/img/social-card.png`} />
      </Head>
      <main>
        <HeroSection />
        <SocialProofStrip />
        <PathsSection />
        <CoursesSection />
        <CompareSection />
        <PricingSection />
        <FAQPreviewSection />
        <BlogSection />
        <FinalCtaSection />
      </main>
    </Layout>
  );
}
