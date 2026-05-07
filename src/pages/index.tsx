import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AffiliateLink from '../components/AffiliateLink';
import WhyScrimba from '../components/WhyScrimba';
import {
  totalCoursesLabel,
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
      <div className="hero-section__inner">
        <p className="hero-section__eyebrow">The unofficial Scrimba guide — by self-taught devs</p>
        <h1>Pick the right Scrimba path before you pay for Pro.</h1>
        <p className="hero-section__lead">
          Side-by-side path breakdowns, real 2026 pricing, and comparisons with Codecademy, Udemy,
          and freeCodeCamp.
        </p>
        <div className="hero-buttons" role="group" aria-label="Primary actions">
          <Link className="cta-link cta-link--button" to="/docs/paths/">
            Compare the four paths
          </Link>
        </div>
        <p className="hero-section__secondary-link">
          <Link to="/docs/pricing/">or jump to pricing →</Link>
        </p>
      </div>

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

function WhyScrimbaSection() {
  return (
    <section className="home-shell home-section">
      <WhyScrimba />
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
      <h2>Which path fits your goal — and your starting point?</h2>
      <p className="home-section__subtitle">
        Four career tracks from beginner to job-ready: what you&apos;ll learn, how long it takes,
        and who each path is for.
      </p>
      <p className="home-section__advisor">
        Not sure which one?{' '}
        <Link to="/docs/paths/#path-advisor">Take the 60-second path quiz →</Link>
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
      verdict: 'Pick Scrimba if: you want to code in-browser from day one.',
      notFor: 'Skip if: you need C++, Java, or Go — Codecademy covers more languages.',
      link: '/docs/comparisons/scrimba-vs-codecademy',
    },
    {
      title: 'Scrimba vs Udemy',
      subtitle: 'Curated subscription vs marketplace',
      verdict: 'Pick Scrimba if: you want a curated career path, not a 200,000-course marketplace.',
      notFor: 'Skip if: you want lifetime access to one specific course for $15.',
      link: '/docs/comparisons/scrimba-vs-udemy',
    },
    {
      title: 'Scrimba vs freeCodeCamp',
      subtitle: 'Premium interactive vs free text-based',
      verdict: 'Pick Scrimba if: you learn faster with video and in-player coding.',
      notFor: 'Skip if: budget is zero — freeCodeCamp is genuinely free.',
      link: '/docs/comparisons/scrimba-vs-freecodecamp',
    },
    {
      title: 'Scrimba vs Frontend Masters',
      subtitle: 'Beginner-to-intermediate paths vs senior-level workshops',
      verdict: 'Pick Scrimba if: you are starting out or ramping into your first frontend role.',
      notFor: 'Skip if: you are mid/senior and want deep workshops on React internals or perf.',
      link: '/docs/comparisons/scrimba-vs-frontendmasters',
    },
  ];

  return (
    <section className="home-shell home-section">
      <h2>Scrimba vs the platforms you&apos;re already considering</h2>
      <p className="home-section__subtitle">
        Short, decision-focused comparisons — where Scrimba wins, where it doesn&apos;t, and who
        should pick what.
      </p>
      <div className="section-grid section-grid--2col">
        {comparisons.map((comparison) => (
          <Link key={comparison.title} to={comparison.link} className="card-link">
            <div className="section-card">
              <h3>{comparison.title}</h3>
              <p>{comparison.subtitle}</p>
              <p className="compare-card__verdict">{comparison.verdict}</p>
              <p className="compare-card__notfor">{comparison.notFor}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="home-section__footer">
        <Link to="/docs/comparisons/" className="cta-link cta-link--text">
          Browse all 13 platform comparisons &rarr;
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
        The free tier never expires. Pro unlocks every course and path; 20% off with our partner link, cancel anytime.
      </p>
      <p className="pricing-cta__includes">
        Pro includes: {totalCoursesLabel} courses &middot; 4 career paths &middot; certificate of completion
      </p>
      <p className="pricing-cta__note">
        Our partner link applies 20% off at checkout (no code). Confirm the final price on Scrimba.
      </p>
      <div className="home-pricing__buttons">
        <Link to="/docs/pricing/" className="cta-link cta-link--button home-pricing__outline-btn">
          View Scrimba pricing
        </Link>
        <AffiliateLink
          href="https://scrimba.com/home?pricing&via=u42d4986"
          variant="button"
          location="pricing_block"
        >
          Go to Scrimba with 20% off Pro
        </AffiliateLink>
      </div>
    </section>
  );
}

function FAQPreviewSection() {
  // FAQPage schema lives on /docs/faq only — homepage-level FAQPage markup duplicates it.
  const faqs = [
    {
      q: 'Is Scrimba good for beginners?',
      a: `Yes, especially if you learn by doing. The free tier covers ${freeCountLabel} courses — start there, then commit to a path once consistency is proven.`,
    },
    {
      q: 'How much does Scrimba Pro cost in 2026?',
      a: 'Pro runs roughly $200/year billed annually (monthly is also available, at a higher per-month rate). Our partner link applies 20% off automatically at checkout — verify the final price on Scrimba.',
    },
    {
      q: 'Is Scrimba free to use?',
      a: `Yes. The free tier never expires and includes ${freeCountLabel} full courses — Learn React, Learn JavaScript, Learn TypeScript and more. No credit card needed.`,
    },
    {
      q: 'Is Scrimba Pro worth paying for?',
      a: 'Yes, if you want a structured career path, all 86+ courses, and a certificate. Test the format on free courses first; upgrade once you trust your own consistency.',
    },
  ];

  return (
    <section className="home-shell home-section">
      <h2>Common questions before you subscribe</h2>
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
        Long-form reviews and picks, updated for 2026.
      </p>
      <div className="section-grid section-grid--3col">
        <Link to="/blog/scrimba-review" className="card-link">
          <div className="section-card">
            <h3>Scrimba Review 2026</h3>
            <p className="section-card__meta">12 min read</p>
            <p>What works, what doesn&apos;t, and who Scrimba is for.</p>
          </div>
        </Link>
        <Link to="/blog/is-scrimba-worth-it" className="card-link">
          <div className="section-card">
            <h3>Is Scrimba worth it?</h3>
            <p className="section-card__meta">8 min read</p>
            <p>When Pro is worth it, and when free is enough for your goal.</p>
          </div>
        </Link>
        <Link to="/blog/best-free-scrimba-courses" className="card-link">
          <div className="section-card">
            <h3>Best free courses</h3>
            <p className="section-card__meta">5 min read</p>
            <p>{freeCountLabel} courses you can take without a subscription.</p>
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
        <h2>Pick a path, then grab 20% off Pro if you upgrade.</h2>
        <p>
          Choose a track from the guides above, then open Scrimba through the partner link. The
          20% discount applies automatically at checkout — always confirm the final price.
        </p>
        <div className="home-pricing__buttons">
          <AffiliateLink
            href="https://scrimba.com/home?pricing&via=u42d4986"
            variant="button"
            location="final_cta"
          >
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
const HOME_PAGE_TITLE = 'Scrimba paths, pricing & honest reviews (2026)';
const HOME_DESC =
  'Pick the right Scrimba path before paying for Pro. Side-by-side path breakdowns, real 2026 pricing, and comparisons with Codecademy, Udemy, and freeCodeCamp.';

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  const homeTitleFull = `${HOME_PAGE_TITLE} | ${siteConfig.title}`;

  return (
    <Layout title={HOME_PAGE_TITLE} description={HOME_DESC} wrapperClassName="homepage">
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
        <CompareSection />
        <PathsSection />
        <CoursesSection />
        <WhyScrimbaSection />
        <PricingSection />
        <BlogSection />
        <FAQPreviewSection />
        <FinalCtaSection />
      </main>
    </Layout>
  );
}
