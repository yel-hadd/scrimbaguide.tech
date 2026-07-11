import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AffiliateLink from '../components/AffiliateLink';
import ScrimSandbox from '../components/ScrimSandbox';
import ScrimbaBlocksArt from '../components/ScrimbaBlocksArt';
import AffiliateDisclosureClient from '../components/AffiliateDisclosureClient';
import {
  totalCoursesLabel,
  freeCount,
  freeCountLabel,
  categoryCounts,
  pathDurations,
  totalContentHoursLabel,
} from '../utils/scrimbaFacts';
import { DEMO_SCRIM_URL, PRO_AFFILIATE_URL } from '../constants';

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
    { value: freeCountLabel, label: 'Free, no signup' },
    { value: '4', label: 'Career paths' },
    { value: totalContentHoursLabel, label: 'Hours of content' },
  ];

  return (
    <section className="hero-section">
      <div className="hero-section__inner hero-section__inner--split">
        <div className="hero-section__copy">
          <p className="hero-section__eyebrow">Independent Scrimba guide</p>
          <h1>Try a real Scrimba lesson before you trust any review.</h1>
          <p className="hero-section__lead">
            Start by editing a real lesson in your browser. Then use this guide to pick a path,
            see what Pro actually costs, and decide whether it is worth it for how you learn.
          </p>
          <div className="hero-buttons" role="group" aria-label="Primary actions">
            <AffiliateLink href={DEMO_SCRIM_URL} variant="button" location="home-hero-primary">
              Open a real lesson (2 min, no signup)
            </AffiliateLink>
            <Link
              className="cta-link cta-link--button hero-section__secondary-btn"
              to="/docs/paths/#path-advisor"
            >
              Find my path (2 min quiz)
            </Link>
          </div>
          <p className="hero-section__cta-note">
            No signup, nothing to install. A real lesson opens in your browser in about 30 seconds.
          </p>
          <ul className="hero-section__proof" aria-label="Trust signals">
            <li>Scrimba has <strong>2M+ learners</strong></li>
            <li>
              <strong>4.3/5</strong> on{' '}
              <a
                href="https://www.trustpilot.com/review/www.scrimba.com"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Trustpilot
              </a>
            </li>
            <li>Frontend path built with <strong>Mozilla MDN</strong></li>
          </ul>
          <AffiliateDisclosureClient className="hero-section__trust" />
        </div>

        <div className="hero-section__media">
          <AffiliateLink
            href={DEMO_SCRIM_URL}
            variant="card"
            className="hero-scrim-poster"
            location="home-hero-poster"
          >
            <span className="hero-scrim-poster__frame">
              <img
                className="hero-scrim-poster__img"
                src="/img/scrimba-lesson-preview.webp"
                alt="A real Scrimba lesson open in the browser: an in-browser code editor showing index.js that you can pause and edit."
                width={859}
                height={450}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <span className="hero-scrim-poster__play" aria-hidden="true">▶</span>
            </span>
            <span className="hero-scrim-poster__caption">
              Press play. A real lesson opens in your browser, no signup.
            </span>
          </AffiliateLink>
        </div>
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

function ScrimExplainerSection() {
  return (
    <section className="home-shell home-section scrim-explainer" aria-label="How scrims work">
      <div className="scrim-explainer__grid">
        <div className="scrim-explainer__copy">
          <p className="home-eyebrow">The format</p>
          <h2>What a scrim is. Try it, don't read about it.</h2>
          <p className="home-section__subtitle">
            A scrim is an interactive screencast: a recorded coding lesson you can pause at
            any point to edit and run the instructor's code directly in the browser. The
            player is the editor, so there is no local setup. No installing Node, no configuring
            an editor, no environment to break. You write and run real code from the first lesson.
          </p>
          <p>
            That one mechanic is why people pick Scrimba over passive video, and it is the
            thing the comparison pages on this site benchmark against. The editor on the
            right is real. Change the text, change the color, hit Run, and watch it update.
            It is closer to pair-programming with a recorded mentor than to watching a course.
          </p>
          <p>
            Liked that? It feels the same inside a full lesson. You can{' '}
            <AffiliateLink href={DEMO_SCRIM_URL} variant="text" location="home-scrim-explainer">
              open a real scrim in your browser
            </AffiliateLink>{' '}
            with no signup.
          </p>
        </div>
        <ScrimSandbox />
      </div>
    </section>
  );
}

const PATH_DESCRIPTIONS: Record<string, string> = {
  'frontend-developer-path':
    'From zero to frontend. HTML, CSS, JavaScript, React, and the job-search module. Co-created with Mozilla MDN.',
  'fullstack-developer-path':
    'The widest track. Frontend plus backend, databases, TypeScript, Next.js, and AI engineering.',
  'backend-developer-path':
    'Node.js, Express, SQL, TypeScript, cybersecurity, DevOps. For developers adding server skills.',
  'ai-engineer-path':
    'Build AI-powered apps. Agents, retrieval-augmented generation (RAG), the Model Context Protocol (MCP), context engineering, and the Vercel AI SDK.',
};

const PATH_TAGLINES: Record<string, string> = {
  'frontend-developer-path': 'Best for: complete beginners with no coding experience',
  'fullstack-developer-path': 'Best for: frontend devs who want to add backend and AI skills',
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
      <p className="home-eyebrow">Career paths</p>
      <h2>Which path fits your goal, and your starting point?</h2>
      <p className="home-section__subtitle">
        Four career tracks from beginner to job-ready. What you will build, how long it
        takes, and who each one is actually for.
      </p>
      <div className="section-grid section-grid--2col">
        {paths.map((path, i) => (
          <Link key={path.title} to={path.link} className="card-link">
            <div className={`section-card path-card ${path.accentClass}`}>
              <span className="path-card__index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{path.title}</h3>
              <p className="section-card__meta path-card__duration">
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
          Compare all four paths side by side &rarr;
        </Link>
      </div>
    </section>
  );
}

function CompareSection() {
  const comparisons = [
    {
      opponent: 'Codecademy',
      subtitle: 'Interactive scrims vs text-based lessons',
      verdict: 'Pick Scrimba if you want to code inside the lesson from day one',
      link: '/docs/comparisons/scrimba-vs-codecademy',
    },
    {
      opponent: 'Udemy',
      subtitle: 'Curated subscription vs open marketplace',
      verdict: 'Pick Scrimba if you want one curated path, not 800 instructor styles',
      link: '/docs/comparisons/scrimba-vs-udemy',
    },
    {
      opponent: 'freeCodeCamp',
      subtitle: 'Premium interactive vs free text-based',
      verdict: 'Pick Scrimba if you are willing to pay for guided in-lesson practice',
      link: '/docs/comparisons/scrimba-vs-freecodecamp',
    },
  ];

  return (
    <section className="home-shell home-section">
      <p className="home-eyebrow">Head to head</p>
      <h2>Scrimba next to the platforms you are already considering</h2>
      <p className="home-section__subtitle">
        Short comparisons aimed at one decision. Where Scrimba wins, where it does not, and
        who should pick which.
      </p>
      <div className="section-grid section-grid--3col">
        {comparisons.map((comparison) => (
          <Link key={comparison.opponent} to={comparison.link} className="card-link">
            <div className="section-card compare-card">
              <h3 className="compare-card__title">
                Scrimba
                <span className="compare-card__vs">vs</span>
                <span className="compare-card__opponent">{comparison.opponent}</span>
              </h3>
              <p>{comparison.subtitle}</p>
              <p className="compare-card__verdict">{comparison.verdict}</p>
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

function formatCount(n: number): string {
  if (n <= 0) return '0 courses';
  if (n === 1) return '1 course';
  return `${n}+ courses`;
}

function CoursesSection() {
  const topics = [
    {
      name: 'JavaScript',
      category: 'javascript',
      link: '/docs/courses/javascript/',
      description: 'From ES6 basics to deep dives and interview challenges.',
    },
    {
      name: 'AI & ML',
      category: 'ai',
      link: '/docs/courses/ai/',
      description: 'Agents, retrieval-augmented generation (RAG), the Model Context Protocol (MCP), prompt engineering, and LLM integration.',
    },
    {
      name: 'React',
      category: 'react',
      link: '/docs/courses/react/',
      description: 'Hooks, advanced patterns, testing, project-based courses.',
    },
    {
      name: 'CSS & Design',
      category: 'css',
      link: '/docs/courses/css/',
      description: 'Flexbox, Grid, Tailwind, animations, UI fundamentals.',
    },
    {
      name: 'Backend',
      category: 'backend',
      link: '/docs/courses/backend/',
      description: 'Node, SQL, Firebase, cybersecurity, API design.',
    },
    {
      name: 'TypeScript',
      category: 'typescript',
      link: '/docs/courses/typescript/',
      description: 'Type-safe JavaScript for frontend and fullstack work.',
    },
  ].map((t) => ({ ...t, count: formatCount(categoryCounts[t.category] ?? 0) }));

  return (
    <section className="home-shell home-section home-section--shaded">
      <p className="home-eyebrow">Browse by topic</p>
      <h2>Pick a topic, see what is worth your time</h2>
      <p className="home-section__subtitle">
        Each topic opens an index showing free vs Pro, instructor, duration, and which
        career path the course belongs to.
      </p>
      <div className="section-grid section-grid--3col">
        {topics.map((topic) => (
          <Link key={topic.name} to={topic.link} className="card-link">
            <div className="section-card topic-card">
              <h3>{topic.name}</h3>
              <p className="section-card__meta topic-card__count">{topic.count}</p>
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

function PricingSection() {
  return (
    <section className="pricing-cta home-pricing home-shell" aria-label="Pricing call to action">
      <p className="home-eyebrow home-eyebrow--on-tint">Pricing</p>
      <h2 className="pricing-cta__title">
        Free to try. Pro when you are ready for the full library.
      </h2>
      <p className="pricing-cta__subtitle">
        The free tier never expires and includes {freeCountLabel} full courses with no
        credit card. Pro adds every paid course, all four paths, certificates, and the
        Discord community. Annual billing has the best per-month rate.
      </p>
      <p className="pricing-cta__note">
        Our partner link applies 20% off automatically at checkout. Always confirm the
        final price on Scrimba, regional pricing varies. Pro is covered by Scrimba's{' '}
        <Link to="/docs/pricing/refund-policy">7-day refund on first purchase</Link>{' '}
        if the format does not fit how you learn.
      </p>
      <div className="home-pricing__buttons">
        <Link to="/docs/pricing/" className="cta-link cta-link--button home-pricing__outline-btn">
          See what Pro actually includes
        </Link>
        <AffiliateLink href={PRO_AFFILIATE_URL} variant="button" location="home-pricing-section">
          Open Scrimba with 20% off Pro
        </AffiliateLink>
      </div>
    </section>
  );
}

function FAQPreviewSection() {
  const faqs = [
    {
      q: 'Is Scrimba free?',
      a: `Partially. The free tier includes ${freeCount}+ full courses (Learn React, Learn JavaScript, Learn TypeScript among them) and up to ten interactive challenges. Career paths, unlimited challenges, Discord, and path certificates require Pro.`,
    },
    {
      q: 'Is Scrimba worth paying for?',
      a: 'Usually yes for learners who want a structured career path, access to the full ' + totalCoursesLabel + ' catalog, and a path certificate. Test the free courses first if you are unsure the format fits how you learn.',
    },
    {
      q: 'Is Scrimba good for beginners?',
      a: 'Yes, especially for complete beginners aiming at web development. The Frontend path starts from zero (HTML, CSS, JavaScript) and was built with Mozilla MDN. The pause-and-edit format keeps you typing code instead of passively watching, which is where most beginners stall. It is a weaker fit if you want languages outside the JavaScript and Python world.',
    },
    {
      q: 'How long does Scrimba take to complete?',
      a: 'It depends on the path and your pace. The four career paths range from roughly 11 to 108 hours of content. At five hours a week, a shorter path takes a couple of months and the longest closer to half a year. It is self-paced, with no cohort or deadlines, so you set the schedule.',
    },
    {
      q: 'How does Scrimba compare to a coding bootcamp?',
      a: 'Scrimba Pro costs a fraction of a typical bootcamp. The interactive format works well for self-motivated learners. Bootcamps add structure, cohort accountability, and career services that you will not get from a subscription product.',
    },
    {
      q: 'What does Scrimba actually teach?',
      a: 'Web development (HTML, CSS, JavaScript, React, TypeScript, Next.js), AI engineering (agents, RAG, MCP, LangChain.js), backend (Node, SQL, Express, Firebase), Python basics, and CSS frameworks. Roughly ' + totalCoursesLabel + ' courses across four career paths.',
    },
    {
      q: 'Do you get a certificate?',
      a: 'Yes. Completing a Scrimba career path earns a Certificate of Completion you can add to LinkedIn. Individual course certificates are also available. Hiring managers care about projects more than certificates, so think of it as a small bonus.',
    },
    {
      q: 'Can Scrimba get you hired?',
      a: 'It can sharpen your portfolio and interview readiness. Hiring still depends on execution, applications, networking, and market conditions. The career paths include job-search modules; the actual job-hunting work is yours.',
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
      <p className="home-eyebrow">FAQ</p>
      <h2>The questions people usually ask before subscribing</h2>
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
      <p className="home-eyebrow">From the blog</p>
      <h2>Read this before you pay for Pro</h2>
      <p className="home-section__subtitle">
        Long-form reviews and picks, no fluff, updated for 2026.
      </p>
      <div className="section-grid section-grid--3col">
        <Link to="/blog/scrimba-review" className="card-link">
          <div className="section-card blog-card">
            <p className="section-card__meta blog-card__read">12 min read</p>
            <h3>Scrimba Review 2026</h3>
            <p>What works, what does not, and who Scrimba is actually for.</p>
          </div>
        </Link>
        <Link to="/blog/is-scrimba-worth-it" className="card-link">
          <div className="section-card blog-card">
            <p className="section-card__meta blog-card__read">8 min read</p>
            <h3>Is Scrimba Worth It?</h3>
            <p>When Pro is worth it, and when free is enough for your goal.</p>
          </div>
        </Link>
        <Link to="/blog/best-free-scrimba-courses" className="card-link">
          <div className="section-card blog-card">
            <p className="section-card__meta blog-card__read">5 min read</p>
            <h3>Best Free Courses</h3>
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
        <ScrimbaBlocksArt className="home-final-cta__mark" />
        <h2>One last thing. Open a scrim before you decide anything.</h2>
        <p>
          Reading about an interactive learning format is the wrong way to evaluate it. The
          right way takes thirty seconds.
        </p>
        <div className="home-pricing__buttons">
          <AffiliateLink href={DEMO_SCRIM_URL} variant="button" location="home-final-cta">
            Open a 30-second scrim
          </AffiliateLink>
          <Link to="/docs/paths/" className="cta-link cta-link--button home-pricing__outline-btn">
            Or compare the four paths
          </Link>
        </div>
      </div>
    </section>
  );
}

const BASE_URL = 'https://scrimbaguide.tech';
const HOME_PAGE_TITLE = 'Is Scrimba Worth It? Paths, Pricing & Review (2026)';
const HOME_DESC =
  'A practical guide to Scrimba. Four career paths broken down, real pricing, side-by-side with Codecademy, Udemy, and freeCodeCamp. For developers picking a platform on substance, not slogans.';
// Note: site-level Organization + WebSite + SearchAction JSON-LD is injected globally
// via headTags in docusaurus.config.ts. Do not redefine it here or the homepage would
// emit duplicate nodes for @id #organization / #website.

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
        <ScrimExplainerSection />
        <PathsSection />
        <CompareSection />
        <CoursesSection />
        <PricingSection />
        <FAQPreviewSection />
        <BlogSection />
        <FinalCtaSection />
      </main>
    </Layout>
  );
}
