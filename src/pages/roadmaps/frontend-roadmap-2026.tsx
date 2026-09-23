import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';

export default function FrontendRoadmap(): React.ReactElement {
  const steps = [
    {
      title: '1. HTML & CSS',
      desc: 'The building blocks of the web.',
      link: '/docs/courses/css/html-and-css/',
      detail:
        'Semantic HTML, the box model, Flexbox and Grid, responsive breakpoints, and enough accessibility to avoid the common mistakes. Skip CSS frameworks for now.',
      done: 'You can rebuild a landing page you like from scratch, responsive, without copying layout code.',
      hours: 'PT40H',
      hoursLabel: 'about 30 to 50 hours',
    },
    {
      title: '2. JavaScript',
      desc: 'Make it interactive.',
      link: '/docs/courses/javascript/',
      detail:
        'Variables, functions, arrays and objects, the DOM, events, and asynchronous code with promises and async/await. This is the longest stage and the one people rush.',
      done: 'You can build an interactive app (quiz, to-do, calculator) without following a tutorial.',
      hours: 'PT80H',
      hoursLabel: 'about 60 to 100 hours',
    },
    {
      title: '3. React',
      desc: 'Build modern web apps.',
      link: '/docs/courses/react/',
      detail:
        'Components, props, state, conditional rendering, lists and keys, and forms. Learn why React exists by having felt the DOM pain in stage two first.',
      done: 'You can break a design into components and manage state without prop-drilling everything.',
      hours: 'PT50H',
      hoursLabel: 'about 40 to 60 hours',
    },
    {
      title: '4. Advanced React',
      desc: 'Hooks, Context, Performance.',
      link: '/docs/courses/react/advanced-react/',
      detail:
        'Custom hooks, context, routing, and the performance work that separates a demo from a product: memoisation and spotting needless re-renders.',
      done: 'You can explain why a component re-rendered and fix it.',
      hours: 'PT40H',
      hoursLabel: 'about 30 to 50 hours',
    },
    {
      title: '5. APIs & Data',
      desc: 'Fetch data from servers.',
      link: '/docs/courses/javascript/',
      detail:
        'Fetch, REST, JSON, authentication headers, and handling the three states every request has: loading, success, and error. Most junior interviews probe this.',
      done: 'Your app handles a failed request gracefully instead of showing a blank screen.',
      hours: 'PT25H',
      hoursLabel: 'about 20 to 30 hours',
    },
    {
      title: '6. Portfolio',
      desc: 'Build real projects.',
      link: '/docs/paths/frontend-developer-path/',
      detail:
        'Two or three projects you can talk about in depth, deployed, with a readable README. Depth beats count: three finished projects outperform ten abandoned ones.',
      done: 'A stranger can open your project, understand what it does, and use it without you present.',
      hours: 'PT60H',
      hoursLabel: 'about 40 to 80 hours',
    },
  ];
  const pageTitle = 'Frontend Developer Roadmap 2026';
  const pageTitleFull = `${pageTitle} | Scrimba Guide`;
  const pageDescription = 'Interactive roadmap for becoming a frontend developer in 2026 with a practical sequence of Scrimba learning resources.';
  const canonicalUrl = 'https://scrimbaguide.tech/roadmaps/frontend-roadmap-2026';
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
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            '@id': `${canonicalUrl}/#howto`,
            name: 'Frontend Developer Roadmap 2026',
            description:
              'A six-stage sequence for going from zero to job-ready as a frontend developer, with an approximate time budget and a completion test for each stage.',
            totalTime: 'PT295H',
            step: steps.map((s, i) => ({
              '@type': 'HowToStep',
              position: i + 1,
              name: s.title.replace(/^\d+\.\s*/, ''),
              text: s.detail,
              timeRequired: s.hours,
              url: `https://scrimbaguide.tech${s.link}`,
            })),
          })}
        </script>
      </Head>
      <main>
      <div className="container margin-vert--lg">
        <h1>Frontend Developer Roadmap 2026</h1>
        <p>
          Six stages from zero to job-ready, in order. The sequence matters more than the
          resources: each stage exists because the next one is painful without it. Budget
          roughly 250 to 350 hours in total, which is six to nine months at a steady ten
          hours a week.
        </p>
        <p>
          Every stage below lists what to actually learn, roughly how long it takes, and a
          concrete test for whether you are done. Use the test, not the hours. People move at
          very different speeds, and time spent is a poor signal of whether something stuck.
        </p>

        <div className="roadmap-container">
          {steps.map((step, i) => (
            <div key={i} className="roadmap-step card margin-bottom--md padding--md">
              <h2 className="roadmap-step__title">{step.title}</h2>
              <p><strong>{step.desc}</strong> {step.detail}</p>
              <p><em>Time:</em> {step.hoursLabel}</p>
              <p><em>You are done when:</em> {step.done}</p>
              <Link to={step.link} className="roadmap-step__link">
                <span className="button button--sm button--outline button--primary">Start Learning &rarr;</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="margin-top--xl">
          <h2>How to use this roadmap</h2>
          <p>
            Go in order and resist skipping ahead to React. The most common failure pattern
            is jumping to a framework before JavaScript is solid, which turns every React
            error into a mystery instead of a bug you can reason about. If you find yourself
            copying solutions without understanding them, drop back a stage.
          </p>
          <p>
            Build something small at the end of each stage. The completion tests above are
            written as builds for that reason: recall under real conditions is what moves
            knowledge from recognised to known.
          </p>

          <h2>Frequently asked questions</h2>
          <h3>How long does this frontend roadmap take?</h3>
          <p>
            Roughly 250 to 350 hours of focused study, which is six to nine months at ten
            hours a week, or three to four months close to full time. Career changers
            studying evenings and weekends should plan for the longer end.
          </p>
          <h3>Do I need a degree to follow this?</h3>
          <p>
            No. Frontend is one of the more credential-agnostic areas of software, and
            portfolio evidence carries more weight than a diploma. See{' '}
            <Link to="/blog/developer-job-without-degree-2026">
              getting a developer job without a degree
            </Link>.
          </p>
          <h3>Should I learn TypeScript as part of this?</h3>
          <p>
            Add it after stage three, once React feels comfortable. Learning types and a
            component model at the same time doubles the confusion for no benefit, but most
            job listings now expect TypeScript, so do not leave it out entirely.
          </p>
          <h3>Is this roadmap still accurate for 2026?</h3>
          <p>
            The sequence is stable because it follows dependencies rather than trends. What
            changes year to year is tooling around the edges. HTML, CSS, JavaScript, then a
            component framework has been the correct order for a decade.
          </p>
        </div>
      </div>
      </main>
    </Layout>
  );
}
