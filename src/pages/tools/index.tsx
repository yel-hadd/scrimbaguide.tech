import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';

const TOOLS = [
  {
    title: 'Path Finder',
    desc: 'Answer a few questions and get pointed to the Scrimba learning path that fits your goal, frontend, fullstack, backend, or AI.',
    to: '/docs/paths/#path-advisor',
    cta: 'Find my path',
  },
  {
    title: 'Bootcamp Cost Calculator',
    desc: 'Compare the real cost of a coding bootcamp (tuition plus loan interest) against a Scrimba subscription over the same months.',
    to: '/tools/bootcamp-cost-calculator',
    cta: 'Open the calculator',
  },
  {
    title: 'Frontend Roadmap',
    desc: 'A practical, ordered sequence of Scrimba courses for going from zero to a job-ready frontend developer.',
    to: '/roadmaps/frontend-roadmap-2026',
    cta: 'View the roadmap',
  },
];

export default function ToolsHub(): React.ReactElement {
  const pageTitle = 'Scrimba Guide Tools';
  const pageTitleFull = `${pageTitle} | Scrimba Guide`;
  const pageDescription =
    'Free tools to plan your learning: a path finder, a bootcamp cost calculator, and an interactive frontend roadmap.';
  const canonicalUrl = 'https://scrimbaguide.tech/tools/';
  const socialImage = 'https://scrimbaguide.tech/img/social-card.png';

  return (
    <Layout title={pageTitle} description={pageDescription}>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitleFull} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="og:site_name" content="Scrimba Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitleFull} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={socialImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <main className="container margin-vert--lg">
        <h1>Tools</h1>
        <p>
          Small, free tools to help you plan what to learn and decide whether
          Scrimba is the right spend for you.
        </p>
        <div className="row">
          {TOOLS.map((tool) => (
            <div className="col col--4 margin-bottom--lg" key={tool.to}>
              <div className="card" style={{ height: '100%' }}>
                <div className="card__header">
                  <h2>{tool.title}</h2>
                </div>
                <div className="card__body">
                  <p>{tool.desc}</p>
                </div>
                <div className="card__footer">
                  <Link className="button button--primary button--block" to={tool.to}>
                    {tool.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
