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
  return (
    <section className="hero-section">
      <h1>ScrimbaGuide: The Unofficial Guide to Scrimba</h1>
      <p>
        <strong>ScrimbaGuide</strong> is the unofficial guide to <strong>Scrimba</strong>—the interactive coding platform that teaches React, JavaScript, AI, and web development. Don&apos;t just watch tutorials—<b>write code</b>. Honest reviews, learning paths, and pro tips to help you get hired.
      </p>
      <div className="hero-buttons">
        <Link className="affiliate-link affiliate-link--button" to="/docs/paths/">
          Find Your Career Path
        </Link>
        <AffiliateLink href="https://scrimba.com/?via=u42d4986" variant="button">
          Start Coding for Free
        </AffiliateLink>
      </div>
      <p className="hero-section__trust">
        <small>Rated 4.7/5 on G2 &middot; Used by developers at Google, Meta, and startups worldwide</small>
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
      link: `/docs/paths/${slug}`,
    }));

  return (
    <section className="home-section">
      <h2>4 Career Paths to Choose From</h2>
      <p className="home-section__subtitle">
        Structured learning from beginner to job-ready, each with a certificate of completion.
      </p>
      <div className="section-grid">
        {paths.map((path) => (
          <Link key={path.title} to={path.link} className="card-link">
            <div className="section-card">
              <h3>{path.title}</h3>
              <p className="section-card__meta">
                {path.duration} &middot; {path.level}
              </p>
              <p>{path.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="home-section__footer">
        <Link to="/docs/paths/" className="affiliate-link affiliate-link--text">
          Compare all learning paths &rarr;
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
    { name: 'React', category: 'react', link: '/docs/courses/react/' },
    { name: 'JavaScript', category: 'javascript', link: '/docs/courses/javascript/' },
    { name: 'AI & ML', category: 'ai', link: '/docs/courses/ai/' },
    { name: 'CSS & Design', category: 'css', link: '/docs/courses/css/' },
    { name: 'Backend', category: 'backend', link: '/docs/courses/backend/' },
    { name: 'TypeScript', category: 'typescript', link: '/docs/courses/typescript/' },
  ].map((t) => ({ ...t, count: formatCount(categoryCounts[t.category] ?? 0) }));

  return (
    <section className="home-section home-section--shaded">
      <h2>{totalCoursesLabel} Interactive Courses</h2>
      <p className="home-section__subtitle">
        Browse courses by topic. About {freeCount} are completely free.
      </p>
      <div className="section-grid">
        {topics.map((topic) => (
          <Link key={topic.name} to={topic.link} className="card-link">
            <div className="section-card">
              <h3>{topic.name}</h3>
              <p>{topic.count}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="home-section__footer">
        <Link to="/docs/courses/" className="affiliate-link affiliate-link--text">
          View full course catalog &rarr;
        </Link>
      </div>
    </section>
  );
}

function CompareSection() {
  return (
    <section className="home-section">
      <h2>How Does Scrimba Compare?</h2>
      <p className="home-section__subtitle">Honest, detailed comparisons with other coding platforms.</p>
      <div className="section-grid">
        <Link to="/docs/comparisons/scrimba-vs-codecademy" className="card-link">
          <div className="section-card">
            <h3>Scrimba vs Codecademy</h3>
            <p>Interactive scrims vs text-based lessons</p>
          </div>
        </Link>
        <Link to="/docs/comparisons/scrimba-vs-udemy" className="card-link">
          <div className="section-card">
            <h3>Scrimba vs Udemy</h3>
            <p>Curated subscription vs marketplace</p>
          </div>
        </Link>
        <Link to="/docs/comparisons/scrimba-vs-freecodecamp" className="card-link">
          <div className="section-card">
            <h3>Scrimba vs freeCodeCamp</h3>
            <p>Premium interactive vs free text-based</p>
          </div>
        </Link>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="pricing-cta home-pricing" aria-label="Pricing call to action">
      <h2 className="pricing-cta__title">Ready to start learning?</h2>
      <p className="pricing-cta__subtitle">
        Try {freeCount} free courses or go Pro for full access to {totalCoursesLabel} courses, 4 career
        paths, and community.
      </p>
      <div className="home-pricing__buttons">
        <Link to="/docs/pricing/" className="affiliate-link affiliate-link--button home-pricing__outline-btn">
          View Pricing Guide
        </Link>
        <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button">
          Start Scrimba Pro
        </AffiliateLink>
      </div>
    </section>
  );
}

function BlogSection() {
  return (
    <section className="home-section">
      <h2>Latest Guides</h2>
      <div className="section-grid">
        <Link to="/blog/scrimba-review" className="card-link">
          <div className="section-card">
            <h3>Scrimba Review 2026</h3>
            <p>Our comprehensive assessment of Scrimba&apos;s platform, courses, and career paths.</p>
          </div>
        </Link>
        <Link to="/blog/is-scrimba-worth-it" className="card-link">
          <div className="section-card">
            <h3>Is Scrimba Worth It?</h3>
            <p>Honest analysis of the value proposition: what you get and whether it&apos;s worth the cost.</p>
          </div>
        </Link>
        <Link to="/blog/best-free-scrimba-courses" className="card-link">
          <div className="section-card">
            <h3>Best Free Courses</h3>
            <p>{freeCountLabel} completely free courses you can take without a subscription.</p>
          </div>
        </Link>
      </div>
      <div className="home-section__footer">
        <Link to="/blog" className="affiliate-link affiliate-link--text">
          Read all guides &rarr;
        </Link>
      </div>
    </section>
  );
}

const BASE_URL = 'https://scrimbaguide.tech';
const HOME_TITLE = 'ScrimbaGuide: The Unofficial Guide to Scrimba Courses & Learning Paths';
const HOME_DESC = 'Course reviews, learning path guides, pricing breakdowns, and honest comparisons. Everything you need to make the most of Scrimba.';

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
        <meta name="twitter:card" content="summary_large_image" />
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
        <BlogSection />
      </main>
    </Layout>
  );
}
