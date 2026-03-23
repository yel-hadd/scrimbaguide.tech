import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import AffiliateLink from '@site/src/components/AffiliateLink';
import {
  computePathRecommendation,
  PATHS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  HOURS_OPTIONS,
  SITUATION_OPTIONS,
  type Experience,
  type Goal,
  type Hours,
  type Situation,
} from '@site/src/content/whichScrimbaPath';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackAdvisorEvent(
  action: string,
  params?: Record<string, string | number | undefined>,
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const payload: Record<string, string | number> = { event_category: 'path_advisor', ...params };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });
  window.gtag('event', action, payload);
}

const TOTAL_STEPS = 4;

export interface PathAdvisorProps {
  /** When true, tighter layout for embedding in docs. */
  embedded?: boolean;
}

export default function PathAdvisor({ embedded = true }: PathAdvisorProps): React.ReactElement {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [hours, setHours] = useState<Hours | null>(null);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [startedTracked, setStartedTracked] = useState(false);
  const completionTracked = useRef(false);

  const result = useMemo(() => {
    if (!experience || !goal || !hours || !situation) return null;
    return computePathRecommendation({ experience, goal, hours, situation });
  }, [experience, goal, hours, situation]);

  const reset = useCallback(() => {
    setStep(0);
    setExperience(null);
    setGoal(null);
    setHours(null);
    setSituation(null);
    setStartedTracked(false);
    completionTracked.current = false;
  }, []);

  useEffect(() => {
    if (step !== TOTAL_STEPS) {
      completionTracked.current = false;
      return;
    }
    if (result && !completionTracked.current) {
      completionTracked.current = true;
      trackAdvisorEvent('path_advisor_complete', {
        primary_path: result.primary,
        secondary_path: result.secondary ?? '',
        cta_emphasis: result.ctaEmphasis,
      });
    }
  }, [result, step]);

  const onSelectExperience = (v: Experience) => {
    if (!startedTracked) {
      trackAdvisorEvent('path_advisor_start');
      setStartedTracked(true);
    }
    setExperience(v);
    trackAdvisorEvent('path_advisor_step', { step: 1, field: 'experience', value: v });
    setStep(1);
  };

  const onSelectGoal = (v: Goal) => {
    setGoal(v);
    trackAdvisorEvent('path_advisor_step', { step: 2, field: 'goal', value: v });
    setStep(2);
  };

  const onSelectHours = (v: Hours) => {
    setHours(v);
    trackAdvisorEvent('path_advisor_step', { step: 3, field: 'hours', value: v });
    setStep(3);
  };

  const onSelectSituation = (v: Situation) => {
    setSituation(v);
    trackAdvisorEvent('path_advisor_step', { step: 4, field: 'situation', value: v });
    setStep(4);
  };

  const wrapClass = embedded ? 'path-advisor path-advisor--embedded' : 'path-advisor';
  const currentStep = Math.min(step + 1, TOTAL_STEPS);
  const shortPathLabels: Record<keyof typeof PATHS, string> = {
    frontend: 'Frontend',
    fullstack: 'Fullstack',
    backend: 'Backend',
    ai: 'AI Engineer',
  };

  return (
    <div className={wrapClass}>
      <div className="path-advisor__header">
        <h2 className="path-advisor__title">Which Scrimba path fits you?</h2>
        <p className="path-advisor__lede">
          Answer 4 quick questions and get a personalized Scrimba path recommendation with a realistic timeline range.
          No signup needed.
        </p>
        {step < TOTAL_STEPS && (
          <div className="path-advisor__progress-wrap">
            <p className="path-advisor__progress-label">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
            <div className="path-advisor__progress" aria-hidden="true">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <span key={i} className={`path-advisor__progress-dot ${i < step ? 'path-advisor__progress-dot--active' : ''}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {step === 0 && (
        <div className="path-advisor__card">
          <h3 className="path-advisor__step-title">1. Where are you starting?</h3>
          {EXPERIENCE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="path-advisor__choice"
              onClick={() => onSelectExperience(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="path-advisor__card">
          <h3 className="path-advisor__step-title">2. What is the main goal?</h3>
          {GOAL_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" className="path-advisor__choice" onClick={() => onSelectGoal(value)}>
              {label}
            </button>
          ))}
          <button type="button" className="path-advisor__back" onClick={() => setStep(0)}>
            ← Back
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="path-advisor__card">
          <h3 className="path-advisor__step-title">3. How many hours can you study per week?</h3>
          <p className="path-advisor__hint">We use this to estimate how long the path may take at your pace.</p>
          {HOURS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="path-advisor__choice"
              onClick={() => onSelectHours(value)}
            >
              {label}
            </button>
          ))}
          <button type="button" className="path-advisor__back" onClick={() => setStep(1)}>
            ← Back
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="path-advisor__card">
          <h3 className="path-advisor__step-title">4. What best describes you right now?</h3>
          {SITUATION_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="path-advisor__choice"
              onClick={() => onSelectSituation(value)}
            >
              {label}
            </button>
          ))}
          <button type="button" className="path-advisor__back" onClick={() => setStep(2)}>
            ← Back
          </button>
        </div>
      )}

      {step === 4 && result && (
        <div className="path-advisor__card path-advisor__card--result">
          <p className="path-advisor__result-kicker">Your best fit</p>
          <h3 className="path-advisor__result-badge">{PATHS[result.primary].title}</h3>
          <p className="path-advisor__blurb">{PATHS[result.primary].blurb}</p>
          <p className="path-advisor__reasoning">{result.reasoning[0]}</p>
          <p className="path-advisor__pace">
            <strong>Estimated timeline:</strong> about {result.weeksEstimate.min}–{result.weeksEstimate.max} weeks at
            your stated pace (path length varies; treat this as a planning range, not a promise).
          </p>

          <div className="path-advisor__cta-row">
            <Link
              className="button button--primary path-advisor__cta-guide"
              to={PATHS[result.primary].doc}
              onClick={() =>
                trackAdvisorEvent('path_advisor_guide_click', { path: result.primary, link: 'primary' })
              }
            >
              Open {shortPathLabels[result.primary]} guide
            </Link>
            {result.ctaEmphasis === 'free' ? (
              <AffiliateLink
                href="https://scrimba.com/?via=u42d4986"
                variant="button"
                className="button button--secondary"
                onClick={() => trackAdvisorEvent('path_advisor_scrimba_click', { type: 'free' })}
              >
                Try Scrimba free
              </AffiliateLink>
            ) : (
              <AffiliateLink
                href="https://scrimba.com/home?pricing&via=u42d4986"
                variant="button"
                className="button button--secondary"
                onClick={() => trackAdvisorEvent('path_advisor_scrimba_click', { type: 'pro' })}
              >
                See Scrimba Pro pricing
              </AffiliateLink>
            )}
          </div>
          <p className="path-advisor__affiliate-note">{PATHS[result.primary].affiliateNote}</p>

          {result.secondary && (
            <div className="path-advisor__secondary alert alert--info">
              <strong>Also consider:</strong> {PATHS[result.secondary].title} — {PATHS[result.secondary].blurb}{' '}
              <Link
                to={PATHS[result.secondary].doc}
                onClick={() =>
                  trackAdvisorEvent('path_advisor_guide_click', { path: result.secondary ?? '', link: 'secondary' })
                }
              >
                Open guide
              </Link>
            </div>
          )}

          <div className="path-advisor__first-week">
            <strong>This week</strong>
            <p className="path-advisor__first-week-link">
              Start with the guide:{' '}
              <Link to={PATHS[result.primary].doc}>Open {PATHS[result.primary].title}</Link>
            </p>
            <ol>
              {result.firstWeekSteps.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>

          <button type="button" className="path-advisor__back path-advisor__restart path-advisor__restart-button" onClick={reset}>
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
