import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';

export default function FrontendRoadmap(): React.ReactElement {
  const steps = [
    { title: '1. HTML & CSS', desc: 'The building blocks of the web.', link: '/docs/courses/css/html-and-css' },
    { title: '2. JavaScript', desc: 'Make it interactive.', link: '/docs/courses/javascript/' },
    { title: '3. React', desc: 'Build modern web apps.', link: '/docs/courses/react/' },
    { title: '4. Advanced React', desc: 'Hooks, Context, Performance.', link: '/docs/courses/react/advanced-react' },
    { title: '5. APIs & Data', desc: 'Fetch data from servers.', link: '/docs/courses/javascript/' },
    { title: '6. Portfolio', desc: 'Build real projects.', link: '/docs/paths/frontend-developer-path' },
  ];
  const pageTitle = 'Frontend Developer Roadmap 2026 | ScrimbaGuide';
  const pageDescription = 'Interactive roadmap for becoming a frontend developer in 2026 with a practical sequence of Scrimba learning resources.';
  const canonicalUrl = 'https://scrimbaguide.tech/roadmaps/frontend-roadmap-2026';
  const socialImage = 'https://scrimbaguide.tech/img/social-card.png';

  return (
    <Layout title={pageTitle} description={pageDescription}>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="og:site_name" content="ScrimbaGuide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={socialImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <main>
      <div className="container margin-vert--lg text--center">
        <h1>Frontend Developer Roadmap 2026</h1>
        <p>Follow this path to go from zero to job-ready.</p>

        <div className="roadmap-container">
          {steps.map((step, i) => (
            <div key={i} className="roadmap-step card margin-bottom--md padding--md">
              <Link to={step.link} className="roadmap-step__link">
                <h2 className="roadmap-step__title">{step.title}</h2>
                <p>{step.desc}</p>
                <span className="button button--sm button--outline button--primary">Start Learning &rarr;</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
      </main>
    </Layout>
  );
}
