import React, { useState, useMemo } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import AffiliateLink from '@site/src/components/AffiliateLink';

type Experience = 'beginner' | 'some' | 'junior' | 'senior';
type Goal = 'job' | 'backend' | 'ai' | 'explore';
type Hours = 'low' | 'mid' | 'high';

type PathKey = 'frontend' | 'fullstack' | 'backend' | 'ai';

const PATHS: Record<
  PathKey,
  { title: string; doc: string; blurb: string; affiliateNote: string }
> = {
  frontend: {
    title: 'Frontend Developer Career Path',
    doc: '/docs/paths/frontend-developer-path',
    blurb: 'Best if you are starting from zero or want a hireable React portfolio with MDN-backed curriculum.',
    affiliateNote: 'Start free, then upgrade through our partner link when you are ready for Pro.',
  },
  fullstack: {
    title: 'Fullstack Developer Career Path',
    doc: '/docs/paths/fullstack-developer-path',
    blurb: 'Best when you already know some frontend and want backend, databases, TypeScript, and AI engineering in one track.',
    affiliateNote: 'Heavy time investment—annual billing usually wins if you will stick with it 3+ months.',
  },
  backend: {
    title: 'Backend Developer Career Path',
    doc: '/docs/paths/backend-developer-path',
    blurb: 'Best if you are comfortable with JavaScript and want Node, SQL, security, and DevOps depth without redoing all of React.',
    affiliateNote: 'Pair with the Backend course hub for electives after the path intro.',
  },
  ai: {
    title: 'AI Engineer Career Path',
    doc: '/docs/paths/ai-engineer-path',
    blurb: 'Best for developers who already ship code and want agents, RAG, MCP, and AI app patterns—not a first programming course.',
    affiliateNote: 'If you are brand new to code, finish Frontend modules first so you can move faster here.',
  },
};

function recommendPath(exp: Experience, goal: Goal, _hours: Hours): { primary: PathKey; secondary?: PathKey } {
  if (goal === 'ai' && (exp === 'beginner' || exp === 'some')) {
    return { primary: 'frontend', secondary: 'ai' };
  }
  if (goal === 'backend' && exp === 'senior') {
    return { primary: 'backend' };
  }
  if (goal === 'backend' && (exp === 'junior' || exp === 'some')) {
    return { primary: 'fullstack', secondary: 'backend' };
  }
  if (goal === 'job' && exp === 'beginner') {
    return { primary: 'frontend' };
  }
  if (goal === 'job' && exp === 'some') {
    return { primary: 'fullstack', secondary: 'frontend' };
  }
  if (goal === 'job' && (exp === 'junior' || exp === 'senior')) {
    return { primary: 'fullstack' };
  }
  if (goal === 'explore') {
    return { primary: 'frontend' };
  }
  if (goal === 'ai') {
    return { primary: 'ai' };
  }
  return { primary: 'frontend' };
}

const PAGE_TITLE = 'Which Scrimba Path Should You Choose?';
const PAGE_TITLE_FULL = `${PAGE_TITLE} | Scrimba Guide`;
const PAGE_DESC =
  'Answer 3 quick questions—experience, goal, and weekly hours—to get a recommended Scrimba career path with next steps.';
const CANONICAL = 'https://scrimbaguide.tech/tools/which-scrimba-path';

export default function WhichScrimbaPath(): React.ReactElement {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [hours, setHours] = useState<Hours | null>(null);

  const result = useMemo(() => {
    if (!experience || !goal || !hours) return null;
    return recommendPath(experience, goal, hours);
  }, [experience, goal, hours]);

  const reset = (): void => {
    setStep(0);
    setExperience(null);
    setGoal(null);
    setHours(null);
  };

  return (
    <Layout title={PAGE_TITLE} description={PAGE_DESC}>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content={PAGE_TITLE_FULL} />
        <meta property="og:description" content={PAGE_DESC} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content="https://scrimbaguide.tech/img/social-card.png" />
        <meta property="og:site_name" content="Scrimba Guide" />
        <link rel="canonical" href={CANONICAL} />
        <meta name="twitter:title" content={PAGE_TITLE_FULL} />
      </Head>
      <main className="container margin-vert--lg" style={{ maxWidth: 640 }}>
        <h1>Which Scrimba path fits you?</h1>
        <p>Three questions. No signup. Use the result to open the right guide—or try Scrimba free first.</p>

        {step === 0 && (
          <div className="card padding--lg margin-top--md">
            <h2>1. Where are you starting?</h2>
            {(
              [
                ['beginner', 'Complete beginner — little or no code'],
                ['some', 'Some HTML/CSS/JS, still shaky'],
                ['junior', 'Junior developer shipping small features'],
                ['senior', 'Experienced dev adding a new stack'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="button button--block button--secondary margin-bottom--sm"
                onClick={() => {
                  setExperience(value);
                  setStep(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="card padding--lg margin-top--md">
            <h2>2. What is the main goal?</h2>
            {(
              [
                ['job', 'Get hired as a developer'],
                ['backend', 'Add serious backend / APIs / databases'],
                ['ai', 'Build AI-powered apps and agents'],
                ['explore', 'Explore coding before I commit'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="button button--block button--secondary margin-bottom--sm"
                onClick={() => {
                  setGoal(value);
                  setStep(2);
                }}
              >
                {label}
              </button>
            ))}
            <button type="button" className="button button--link margin-top--sm" onClick={() => setStep(0)}>
              Back
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card padding--lg margin-top--md">
            <h2>3. Realistic hours per week?</h2>
            {(
              [
                ['low', 'Under 5 hours'],
                ['mid', '5–15 hours'],
                ['high', '15+ hours'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="button button--block button--secondary margin-bottom--sm"
                onClick={() => {
                  setHours(value);
                  setStep(3);
                }}
              >
                {label}
              </button>
            ))}
            <button type="button" className="button button--link margin-top--sm" onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        )}

        {step === 3 && result && (
          <div className="card padding--lg margin-top--md">
            <h2>Your pick</h2>
            <p className="badge badge--success margin-bottom--md">Primary: {PATHS[result.primary].title}</p>
            <p>{PATHS[result.primary].blurb}</p>
            <p className="margin-top--md">{PATHS[result.primary].affiliateNote}</p>
            <div className="margin-top--lg button-group">
              <Link className="button button--primary" to={PATHS[result.primary].doc}>
                Read the full path guide
              </Link>
              <AffiliateLink href="https://scrimba.com/?via=u42d4986" variant="button" className="button button--secondary">
                Try Scrimba free
              </AffiliateLink>
            </div>
            {result.secondary && (
              <div className="alert alert--info margin-top--lg">
                <strong>Also consider:</strong> {PATHS[result.secondary].title} — {PATHS[result.secondary].blurb}{' '}
                <Link to={PATHS[result.secondary].doc}>(open guide)</Link>
              </div>
            )}
            <button type="button" className="button button--link margin-top--lg" onClick={reset}>
              Start over
            </button>
          </div>
        )}
      </main>
    </Layout>
  );
}
