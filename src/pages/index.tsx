import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import AffiliateLink from '../components/AffiliateLink';

function HeroSection() {
  return (
    <section className="hero-section">
      <h1>The Unofficial Guide to Scrimba</h1>
      <p>
        Course reviews, learning path guides, pricing breakdowns, and honest
        comparisons. Everything you need to make the most of Scrimba.
      </p>
      <div className="hero-buttons">
        <Link className="affiliate-link affiliate-link--button" to="/docs/paths/">
          Explore Learning Paths
        </Link>
        <AffiliateLink href="https://scrimba.com/" variant="button">
          Try Scrimba Free
        </AffiliateLink>
      </div>
    </section>
  );
}

function PathsSection() {
  const paths = [
    {
      title: 'Frontend Developer Path',
      duration: '81.6 hrs',
      level: 'Beginner',
      description:
        'From zero to frontend developer. HTML, CSS, JavaScript, React, and career prep. Created with Mozilla MDN.',
      link: '/docs/paths/frontend-developer-path',
    },
    {
      title: 'Fullstack Developer Path',
      duration: '108.4 hrs',
      level: 'Beginner',
      description:
        'The most comprehensive path. Frontend + backend + databases + TypeScript + Next.js + AI engineering.',
      link: '/docs/paths/fullstack-developer-path',
    },
    {
      title: 'Backend Developer Path',
      duration: '30.1 hrs',
      level: 'Intermediate',
      description:
        'Node.js, Express, SQL, TypeScript, cybersecurity, DevOps. For developers adding backend skills.',
      link: '/docs/paths/backend-developer-path',
    },
    {
      title: 'AI Engineer Path',
      duration: '11.4 hrs',
      level: 'Intermediate',
      description:
        'Build AI-powered apps. Agents, RAG, MCP, context engineering, Vercel AI SDK, and multimodality.',
      link: '/docs/paths/ai-engineer-path',
    },
  ];

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

function CoursesSection() {
  const topics = [
    { name: 'React', count: '16 courses', link: '/docs/courses/react/' },
    { name: 'JavaScript', count: '15+ courses', link: '/docs/courses/javascript/' },
    { name: 'AI & ML', count: '12+ courses', link: '/docs/courses/ai/' },
    { name: 'CSS & Design', count: '12+ courses', link: '/docs/courses/css/' },
    { name: 'Backend', count: '10+ courses', link: '/docs/courses/backend/' },
    { name: 'TypeScript', count: '1 course', link: '/docs/courses/typescript/' },
  ];

  return (
    <section className="home-section home-section--shaded">
      <h2>87+ Interactive Courses</h2>
      <p className="home-section__subtitle">Browse courses by topic. About 20 are completely free.</p>
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
        Try 20 free courses or go Pro for full access to 87+ courses, 4 career paths, and community.
      </p>
      <div className="home-pricing__buttons">
        <Link to="/docs/pricing/" className="affiliate-link affiliate-link--button home-pricing__outline-btn">
          View Pricing Guide
        </Link>
        <AffiliateLink href="https://scrimba.com/home?pricing" variant="button">
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
            <p>20 completely free courses you can take without a subscription.</p>
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

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="The Unofficial Guide to Scrimba Courses & Learning Paths"
      description="Course reviews, learning path guides, pricing breakdowns, and honest comparisons. Everything you need to make the most of Scrimba."
    >
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
