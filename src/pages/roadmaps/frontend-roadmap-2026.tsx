import React from 'react';
import Layout from '@theme/Layout';
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

  return (
    <Layout title="Frontend Developer Roadmap 2026" description="Interactive roadmap to becoming a frontend developer in 2026.">
      <main>
      <div className="container margin-vert--lg text--center">
        <h1>Frontend Developer Roadmap 2026</h1>
        <p>Follow this path to go from zero to job-ready.</p>

        <div className="roadmap-container" style={{maxWidth: '800px', margin: '0 auto', position: 'relative'}}>
          {steps.map((step, i) => (
            <div key={i} className="roadmap-step card margin-bottom--md padding--md" style={{borderLeft: '5px solid var(--ifm-color-primary)'}}>
              <Link to={step.link} style={{textDecoration: 'none', color: 'inherit', display: 'block'}}>
                <h2 style={{fontSize: '1.25rem'}}>{step.title}</h2>
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
