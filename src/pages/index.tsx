import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import AffiliateLink from '../components/AffiliateLink';
import {
  totalCoursesLabel,
  freeCount,
  freeCountLabel,
  categoryCounts,
  pathDurations,
} from '../utils/scrimbaFacts';

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
        <p className="hero-section__eyebrow">Independent Scrimba guide - not affiliated with Scrimba</p>
        <h1>Pick the Right Scrimba Path. Save 20% on Pro.</h1>
        <p className="hero-section__lead">
          Honest path breakdowns, pricing clarity, and side-by-side comparisons - so you start with
          the right plan and do not waste money on the wrong subscription.
        </p>
        <div className="hero-buttons" role="group" aria-label="Primary actions">
          <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button">
            Claim 20% Off Pro
          </AffiliateLink>
          <Link className="cta-link cta-link--button hero-section__secondary-btn" to="/docs/paths/">
            Compare Learning Paths
          </Link>
        </div>
        <ul className="hero-section__bullets">
          <li>Which path matches your role, experience level, and available hours</li>
          <li>Whether Pro is actually worth it - and how to pay less if you go Pro</li>
          <li>What you will build and how to turn it into job applications</li>
        </ul>
        <p className="hero-section__trust">
          <small>Honest, independent guidance. Always verify final prices at checkout.</small>
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
      <h2>Which Scrimba Path Is Right for You?</h2>
      <p className="home-section__subtitle">
        Structured routes from beginner to job-ready, each with practical projects and a certificate.
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
          See full path breakdowns &rarr;
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
      <h2>Browse {totalCoursesLabel} Scrimba Courses by Topic</h2>
      <p className="home-section__subtitle">
        Each category links to our course index with free/Pro labels, ratings, and path fit.
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
          View full course catalog &rarr;
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
      <h2>How Scrimba Compares</h2>
      <p className="home-section__subtitle">Decision-focused breakdowns that highlight tradeoffs, not hype.</p>
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
          See all 12 comparisons &rarr;
        </Link>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="pricing-cta home-pricing home-shell" aria-label="Pricing call to action">
      <h2 className="pricing-cta__title">Start With the Plan That Fits Your Budget</h2>
      <p className="pricing-cta__subtitle">
        Scrimba Free is always free. Pro is ~$19/mo (full access, cancel anytime).
      </p>
      <p className="pricing-cta__includes">
        <strong>What&apos;s included in Pro:</strong> {totalCoursesLabel} courses &middot; 4 career paths
        &middot; certificate of completion
      </p>
      <p className="pricing-cta__note">Our partner link gives you 20% off at checkout - no code needed.</p>
      <div className="home-pricing__buttons">
        <Link to="/docs/pricing/" className="cta-link cta-link--button home-pricing__outline-btn">
          View Scrimba Pricing
        </Link>
        <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button">
          Claim 20% Off Pro
        </AffiliateLink>
      </div>
    </section>
  );
}

function FAQPreviewSection() {
  const faqs = [
    {
      q: 'Is Scrimba good for beginners in 2026?',
      a: 'Yes, especially if you learn by doing. Start with free courses, then commit to a path when your consistency is proven.',
    },
    {
      q: 'Is Pro worth paying for?',
      a: 'Usually yes for learners who want structure, all courses, and career paths. If you are uncertain, compare Pro vs Free first.',
    },
    {
      q: 'Can this actually help me get hired?',
      a: 'It can improve your portfolio and interview readiness, but hiring still depends on execution, applications, and market conditions.',
    },
  ];

  return (
    <section className="home-shell home-section">
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
      <h2>Essential Reading Before You Decide</h2>
      <p className="home-section__subtitle">Read these before committing to any plan or subscription.</p>
      <div className="section-grid section-grid--3col">
        <Link to="/blog/scrimba-review" className="card-link">
          <div className="section-card">
            <h3>Scrimba Review 2026</h3>
            <p className="section-card__meta">12 min read</p>
            <p>Our comprehensive assessment of Scrimba&apos;s platform, courses, and career paths.</p>
          </div>
        </Link>
        <Link to="/blog/is-scrimba-worth-it" className="card-link">
          <div className="section-card">
            <h3>Is Scrimba Worth It?</h3>
            <p className="section-card__meta">8 min read</p>
            <p>Honest analysis of the value proposition: what you get and whether it&apos;s worth the cost.</p>
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
        <h2>Start Scrimba for Less - Use Our Partner Discount</h2>
        <p>
          Pick a path from the guide above, then use our partner link to claim 20% off Pro. The
          discount applies automatically at checkout.
        </p>
        <div className="home-pricing__buttons">
          <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button">
            Claim 20% Off Pro
          </AffiliateLink>
          <Link to="/docs/paths/" className="cta-link cta-link--button home-pricing__outline-btn">
            Find Your Path
          </Link>
        </div>
      </div>
    </section>
  );
}

const BASE_URL = 'https://scrimbaguide.tech';
const HOME_TITLE = 'Scrimba Paths, Pricing & Reviews (2026)';
const HOME_DESC = 'Compare Scrimba paths, evaluate pricing, and pick the right roadmap with practical, up-to-date guidance built for real job outcomes.';

export default function Home(): React.ReactElement {
  return (
    <Layout title={HOME_TITLE} description={HOME_DESC}>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={HOME_TITLE} />
        <meta property="og:description" content={HOME_DESC} />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:image" content={`${BASE_URL}/img/social-card.png`} />
        <meta property="og:site_name" content="ScrimbaGuide" />
        <link rel="canonical" href={BASE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={BASE_URL} />
        <meta name="twitter:title" content={HOME_TITLE} />
        <meta name="twitter:description" content={HOME_DESC} />
        <meta name="twitter:image" content={`${BASE_URL}/img/social-card.png`} />
      </Head>
      <main>
        <HeroSection />
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
