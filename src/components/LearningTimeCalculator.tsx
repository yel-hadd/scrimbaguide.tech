import React, { useState, useMemo } from 'react';

type Level = 'complete-beginner' | 'some-html' | 'basic-js';
type Path = 'frontend' | 'fullstack' | 'backend' | 'ai-engineer';

interface PathData {
  name: string;
  hours: number;
  prerequisiteHours: Record<Level, number>;
  slug: string;
}

const PATHS: Record<Path, PathData> = {
  frontend: {
    name: 'Frontend Developer',
    hours: 81.6,
    prerequisiteHours: {
      'complete-beginner': 0,
      'some-html': -10,
      'basic-js': -20,
    },
    slug: '/docs/paths/frontend-developer-path',
  },
  fullstack: {
    name: 'Fullstack Developer',
    hours: 108.4,
    prerequisiteHours: {
      'complete-beginner': 0,
      'some-html': -10,
      'basic-js': -20,
    },
    slug: '/docs/paths/fullstack-developer-path',
  },
  backend: {
    name: 'Backend Developer',
    hours: 90,
    prerequisiteHours: {
      'complete-beginner': 10,
      'some-html': 5,
      'basic-js': 0,
    },
    slug: '/docs/paths/backend-developer-path',
  },
  'ai-engineer': {
    name: 'AI Engineer',
    hours: 60,
    prerequisiteHours: {
      'complete-beginner': 30,
      'some-html': 20,
      'basic-js': 0,
    },
    slug: '/docs/paths/ai-engineer-path',
  },
};

const LEVEL_LABELS: Record<Level, string> = {
  'complete-beginner': 'Complete beginner (no coding experience)',
  'some-html': 'Know some HTML/CSS',
  'basic-js': 'Know basic JavaScript',
};

const HOURS_OPTIONS = [5, 10, 15, 20, 25, 30];

function weeksToJobReady(pathHours: number, hoursPerWeek: number): number {
  const pathWeeks = pathHours / hoursPerWeek;
  const projectWeeks = Math.max(4, pathHours / hoursPerWeek * 0.5);
  return Math.round(pathWeeks + projectWeeks);
}

export default function LearningTimeCalculator(): React.ReactElement {
  const [level, setLevel] = useState<Level>('complete-beginner');
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [selectedPath, setSelectedPath] = useState<Path>('frontend');

  const result = useMemo(() => {
    const path = PATHS[selectedPath];
    const adjustedHours = Math.max(20, path.hours + path.prerequisiteHours[level]);
    const pathWeeks = adjustedHours / hoursPerWeek;
    const projectWeeks = Math.max(3, pathWeeks * 0.5);
    const totalWeeks = Math.round(pathWeeks + projectWeeks);
    const totalMonths = Math.round(totalWeeks / 4.33);

    return {
      pathHours: Math.round(adjustedHours),
      pathWeeks: Math.round(pathWeeks),
      projectWeeks: Math.round(projectWeeks),
      totalWeeks,
      totalMonths,
    };
  }, [level, hoursPerWeek, selectedPath]);

  return (
    <div className="ltc-wrapper">
      <div className="ltc-card">
        <div className="ltc-header">
          <h3>How Long Will It Take to Learn Web Development?</h3>
          <p>Anchored to Scrimba&rsquo;s actual path hours. Adjust inputs to your situation.</p>
        </div>

        <div className="ltc-inputs">
          <div className="ltc-field">
            <label htmlFor="ltc-level">Your current level</label>
            <select
              id="ltc-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
            >
              {(Object.entries(LEVEL_LABELS) as [Level, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="ltc-field">
            <label htmlFor="ltc-path">Target career path</label>
            <select
              id="ltc-path"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value as Path)}
            >
              {(Object.entries(PATHS) as [Path, PathData][]).map(([val, data]) => (
                <option key={val} value={val}>{data.name} Path</option>
              ))}
            </select>
          </div>

          <div className="ltc-field">
            <label htmlFor="ltc-hours">
              Hours per week: <strong>{hoursPerWeek}h</strong>
            </label>
            <input
              id="ltc-hours"
              type="range"
              min={5}
              max={30}
              step={5}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            />
            <div className="ltc-range-labels">
              {HOURS_OPTIONS.map((h) => (
                <span key={h} className={h === hoursPerWeek ? 'active' : ''}>{h}h</span>
              ))}
            </div>
          </div>
        </div>

        <div className="ltc-result">
          <div className="ltc-result-headline">
            <span className="ltc-months">{result.totalMonths} months</span>
            <span className="ltc-weeks">({result.totalWeeks} weeks)</span>
          </div>
          <p className="ltc-result-label">estimated time to job-ready</p>

          <div className="ltc-breakdown">
            <div className="ltc-breakdown-item">
              <span className="ltc-breakdown-value">{result.pathHours}h</span>
              <span className="ltc-breakdown-label">path content ({result.pathWeeks} weeks)</span>
            </div>
            <div className="ltc-breakdown-sep">+</div>
            <div className="ltc-breakdown-item">
              <span className="ltc-breakdown-value">{result.projectWeeks} weeks</span>
              <span className="ltc-breakdown-label">portfolio projects + job prep</span>
            </div>
          </div>
        </div>

        <div className="ltc-cta">
          <a
            href={`https://scrimba.com/home?pricing&via=u42d4986&utm_source=scrimbaguide&utm_medium=calculator&utm_campaign=learning-time-calculator&utm_content=${selectedPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ltc-cta-btn"
          >
            Start the {PATHS[selectedPath].name} Path free &rarr;
          </a>
          <a href={PATHS[selectedPath].slug} className="ltc-cta-link">
            See full path breakdown
          </a>
        </div>

        <p className="ltc-disclaimer">
          Estimates based on Scrimba&rsquo;s published path hours (Frontend: 81.6h, Fullstack: 108.4h) plus project time.
          Actual timeline depends on consistency, prior experience, and job-search effort.
          Individual results vary.
        </p>
      </div>

      <style>{`
        .ltc-wrapper {
          margin: 2rem 0;
          container-type: inline-size;
        }
        .ltc-card {
          background: var(--ifm-card-background-color, #fff);
          border: 1px solid var(--ifm-color-emphasis-200, #e2e8f0);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .ltc-header {
          background: linear-gradient(135deg, var(--ifm-color-primary, #2b6cb0), var(--ifm-color-primary-dark, #1a4a8a));
          color: white;
          padding: 1.25rem 1.5rem;
        }
        .ltc-header h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: white;
        }
        .ltc-header p {
          font-size: 0.82rem;
          opacity: 0.85;
          margin: 0;
        }
        .ltc-inputs {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-bottom: 1px solid var(--ifm-color-emphasis-200, #e2e8f0);
        }
        .ltc-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .ltc-field label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--ifm-color-content-secondary, #4a5568);
        }
        .ltc-field select {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--ifm-color-emphasis-300, #cbd5e0);
          border-radius: 6px;
          font-size: 0.9rem;
          background: var(--ifm-background-color, #fff);
          color: var(--ifm-color-content, #1a202c);
          cursor: pointer;
        }
        .ltc-field input[type="range"] {
          width: 100%;
          cursor: pointer;
          accent-color: var(--ifm-color-primary, #2b6cb0);
        }
        .ltc-range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--ifm-color-content-secondary, #718096);
        }
        .ltc-range-labels .active {
          color: var(--ifm-color-primary, #2b6cb0);
          font-weight: 700;
        }
        .ltc-result {
          padding: 1.5rem 1.5rem 1.25rem;
          text-align: center;
          background: var(--ifm-color-emphasis-100, #f7fafc);
          border-bottom: 1px solid var(--ifm-color-emphasis-200, #e2e8f0);
        }
        .ltc-result-headline {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .ltc-months {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--ifm-color-primary, #2b6cb0);
          line-height: 1;
        }
        .ltc-weeks {
          font-size: 1rem;
          color: var(--ifm-color-content-secondary, #718096);
        }
        .ltc-result-label {
          font-size: 0.82rem;
          color: var(--ifm-color-content-secondary, #718096);
          margin-bottom: 1rem;
        }
        .ltc-breakdown {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .ltc-breakdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ltc-breakdown-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ifm-color-content, #1a202c);
        }
        .ltc-breakdown-label {
          font-size: 11px;
          color: var(--ifm-color-content-secondary, #718096);
        }
        .ltc-breakdown-sep {
          font-size: 1.25rem;
          color: var(--ifm-color-emphasis-400, #a0aec0);
        }
        .ltc-cta {
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .ltc-cta-btn {
          display: inline-block;
          padding: 0.55rem 1rem;
          background: var(--ifm-color-primary, #2b6cb0);
          color: white !important;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none !important;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .ltc-cta-btn:hover {
          background: var(--ifm-color-primary-dark, #1a4a8a);
        }
        .ltc-cta-link {
          font-size: 0.82rem;
          color: var(--ifm-color-primary, #2b6cb0);
          text-decoration: none;
        }
        .ltc-cta-link:hover { text-decoration: underline; }
        .ltc-disclaimer {
          padding: 0 1.5rem 1rem;
          font-size: 11px;
          color: var(--ifm-color-content-secondary, #718096);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
