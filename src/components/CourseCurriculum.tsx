import React from 'react';

export interface CurriculumModule {
  name: string;
  /** e.g. "2.4 hrs" or "108 min" */
  duration?: string;
  lessons?: number;
}

interface CourseCurriculumProps {
  modules: CurriculumModule[];
  title?: string;
}

/** Parse a Scrimba duration string ("2.4 hrs" / "108 min") into minutes. */
function toMinutes(duration?: string): number {
  if (!duration) return 0;
  const hrs = duration.match(/([\d.]+)\s*hrs?/i);
  if (hrs) return Math.round(parseFloat(hrs[1]) * 60);
  const min = duration.match(/([\d.]+)\s*min/i);
  if (min) return Math.round(parseFloat(min[1]));
  return 0;
}

/**
 * Visual module-by-module breakdown for a course or path. Each module shows a
 * bar sized relative to the longest module, plus its duration and lesson count.
 * Data comes from the scraped table of contents (data/courses.json modules).
 */
export default function CourseCurriculum({
  modules,
  title = 'Course curriculum',
}: CourseCurriculumProps): React.ReactElement | null {
  if (!modules || modules.length === 0) return null;

  const minutes = modules.map((m) => toMinutes(m.duration));
  const maxMinutes = Math.max(1, ...minutes);
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons || 0), 0);

  // Summary uses exact counts (modules + lessons). Summed hours are omitted on
  // purpose: rounding the per-module durations drifts a few minutes from the
  // course's published total shown elsewhere on the page. Each row still lists
  // its own duration, and the bars stay proportional to it.
  const summaryParts = [`${modules.length} modules`];
  if (totalLessons > 0) summaryParts.push(`${totalLessons} lessons`);

  return (
    <section className="curriculum" aria-label={title || 'Course curriculum'}>
      <div className="curriculum__head">
        {title ? <h3 className="curriculum__title">{title}</h3> : null}
        <p className="curriculum__summary">{summaryParts.join(' · ')}</p>
      </div>
      <ol className="curriculum__list">
        {modules.map((m, i) => {
          const mins = minutes[i];
          const pct = mins > 0 ? Math.max(10, Math.round((mins / maxMinutes) * 100)) : 0;
          return (
            <li className="curriculum__item" key={`${m.name}-${i}`}>
              <div className="curriculum__row">
                <span className="curriculum__index" aria-hidden="true">{i + 1}</span>
                <span className="curriculum__name">{m.name}</span>
                <span className="curriculum__meta">
                  {m.duration && <span className="curriculum__duration">{m.duration}</span>}
                  {m.lessons ? (
                    <span className="curriculum__lessons">{m.lessons} lessons</span>
                  ) : null}
                </span>
              </div>
              {pct > 0 && (
                <div className="curriculum__bar" aria-hidden="true">
                  <span className="curriculum__bar-fill" style={{ width: `${pct}%` }} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
