import React, { useMemo, useState, useCallback, useEffect, useRef, useId } from 'react';
import Link from '@docusaurus/Link';
import AffiliateLink from '@site/src/components/AffiliateLink';
import { DEMO_SCRIM_URL } from '@site/src/constants';
import {
  computePathRecommendation,
  answerRecap,
  PATHS,
  PATH_MODULES,
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

type ChoiceOption<T extends string> = {
  value: T;
  label: string;
};

interface ChoiceStepProps<T extends string> {
  title: string;
  options: readonly ChoiceOption<T>[];
  onSelect: (value: T) => void;
  /** The already-chosen value for this step (set when navigating Back), so the
   *  radiogroup can reflect the selection to assistive tech and rove tabindex. */
  selected?: T;
  hint?: string;
  onBack?: () => void;
  /**
   * Move keyboard focus to the first option on mount. Off for the very first
   * step on initial page load, otherwise focusing an embedded, below-the-fold
   * quiz scrolls the page down to it unprompted (e.g. landing on /docs/paths/).
   * Enabled once the user has started, so step-to-step transitions stay
   * keyboard-accessible.
   */
  autoFocus?: boolean;
}

function ChoiceStep<T extends string>({
  title,
  options,
  onSelect,
  selected,
  hint,
  onBack,
  autoFocus = false,
}: ChoiceStepProps<T>): React.ReactElement {
  const titleId = useId();
  const hintId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (autoFocus) buttonRefs.current[0]?.focus();
  }, [autoFocus]);

  const focusByIndex = (targetIndex: number) => {
    const total = options.length;
    if (!total) return;
    const normalized = ((targetIndex % total) + total) % total;
    buttonRefs.current[normalized]?.focus();
  };

  const onChoiceKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      focusByIndex(index + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      focusByIndex(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusByIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusByIndex(options.length - 1);
    }
  };

  return (
    <div className="path-advisor__card">
      <h3 id={titleId} className="path-advisor__step-title">{title}</h3>
      {hint && <p id={hintId} className="path-advisor__hint">{hint}</p>}
      <div role="radiogroup" aria-labelledby={titleId} aria-describedby={hint ? hintId : undefined}>
        {options.map(({ value, label }, index) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected === value}
            tabIndex={selected != null ? (selected === value ? 0 : -1) : index === 0 ? 0 : -1}
            className="path-advisor__choice"
            onClick={() => onSelect(value)}
            onKeyDown={(event) => onChoiceKeyDown(event, index)}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {onBack && (
        <button type="button" className="path-advisor__back" onClick={onBack}>
          ← Back
        </button>
      )}
    </div>
  );
}

export default function PathAdvisor({ embedded = true }: PathAdvisorProps): React.ReactElement {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [hours, setHours] = useState<Hours | null>(null);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [startedTracked, setStartedTracked] = useState(false);
  // True once the user has made any selection. Drives per-step autofocus so the
  // embedded quiz never steals focus (and scroll) on initial page load.
  const [interacted, setInteracted] = useState(false);
  const completionTracked = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const result = useMemo(() => {
    if (!experience || !goal || !hours || !situation) return null;
    return computePathRecommendation({ experience, goal, hours, situation });
  }, [experience, goal, hours, situation]);

  const recap = useMemo(
    () =>
      experience && goal && hours && situation
        ? answerRecap({ experience, goal, hours, situation })
        : [],
    [experience, goal, hours, situation],
  );

  const reset = useCallback(() => {
    setStep(0);
    setExperience(null);
    setGoal(null);
    setHours(null);
    setSituation(null);
    setStartedTracked(false);
    setInteracted(false);
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

  useEffect(() => {
    if (step === TOTAL_STEPS) {
      resultHeadingRef.current?.focus();
    }
  }, [step]);

  const onSelectExperience = (v: Experience) => {
    if (!startedTracked) {
      trackAdvisorEvent('path_advisor_start');
      setStartedTracked(true);
    }
    setInteracted(true);
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
            <p className="path-advisor__progress-label" aria-live="polite">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
            <div
              className="path-advisor__progress"
              role="progressbar"
              aria-label="Path advisor progress"
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={currentStep}
            >
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <span key={i} className={`path-advisor__progress-dot ${i < step ? 'path-advisor__progress-dot--active' : ''}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {step === 0 && (
        <ChoiceStep
          title="1. Where are you starting?"
          options={EXPERIENCE_OPTIONS}
          onSelect={onSelectExperience}
          selected={experience ?? undefined}
          autoFocus={interacted}
        />
      )}

      {step === 1 && (
        <ChoiceStep
          title="2. What is the main goal?"
          options={GOAL_OPTIONS}
          onSelect={onSelectGoal}
          selected={goal ?? undefined}
          onBack={() => setStep(0)}
          autoFocus={interacted}
        />
      )}

      {step === 2 && (
        <ChoiceStep
          title="3. How many hours can you study per week?"
          options={HOURS_OPTIONS}
          hint="We use this to estimate how long the path may take at your pace."
          onSelect={onSelectHours}
          selected={hours ?? undefined}
          onBack={() => setStep(1)}
          autoFocus={interacted}
        />
      )}

      {step === 3 && (
        <ChoiceStep
          title="4. What best describes you right now?"
          options={SITUATION_OPTIONS}
          onSelect={onSelectSituation}
          selected={situation ?? undefined}
          onBack={() => setStep(2)}
          autoFocus={interacted}
        />
      )}

      {step === 4 && result && (
        <div className="path-advisor__card path-advisor__card--result">
          <p className="path-advisor__result-kicker">Your best fit</p>
          <h3 ref={resultHeadingRef} tabIndex={-1} className="path-advisor__result-badge">{PATHS[result.primary].title}</h3>
          <p className="path-advisor__result-meta">{PATH_MODULES[result.primary]} modules in this path</p>
          {recap.length > 0 && (
            <ul className="path-advisor__recap" aria-label="Based on your answers">
              {recap.map((tag) => (
                <li key={tag} className="path-advisor__recap-chip">{tag}</li>
              ))}
            </ul>
          )}
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
                href={DEMO_SCRIM_URL}
                variant="button"
                className="button button--secondary"
                onClick={() => trackAdvisorEvent('path_advisor_scrimba_click', { type: 'free' })}
              >
                Try a free lesson (2 min, no signup)
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
              <strong>Also consider:</strong> {PATHS[result.secondary].title}. {PATHS[result.secondary].blurb}{' '}
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
