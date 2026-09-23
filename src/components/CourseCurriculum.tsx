import React from 'react';

export interface CurriculumModule {
  name: string;
  /** e.g. "2.4 hrs" or "108 min" */
  duration?: string;
  lessons?: number;
  /** Optional one clause on what this module actually has you build. */
  note?: string;
}

interface CourseCurriculumProps {
  modules: CurriculumModule[];
  title?: string;
  /** Replace the automatic "N modules · N lessons" line (e.g. when the grouping is editorial). */
  summary?: string;
}

/**
 * Module-by-module breakdown for a course, from the scraped table of contents
 * (data/courses.json modules).
 *
 * Deliberately has no bars. Each row used to carry a filled bar sized by the
 * module's share of total runtime, which was a false affordance (a filled bar
 * in a course reads as *progress*), redundant with the duration printed beside
 * it, and floored at 10% so short modules were not even proportional. The
 * duration text carries that information honestly and in less space.
 */
export default function CourseCurriculum({
  modules,
  title = 'Course curriculum',
  summary,
}: CourseCurriculumProps): React.ReactElement | null {
  if (!modules || modules.length === 0) return null;

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons || 0), 0);

  // Summary uses exact counts (modules + lessons). Summed hours are omitted on
  // purpose: rounding the per-module durations drifts a few minutes from the
  // course's published total shown elsewhere on the page.
  const summaryParts = [`${modules.length} modules`];
  if (totalLessons > 0) summaryParts.push(`${totalLessons} lessons`);

  return (
    <section className="curriculum" aria-label={title || 'Course curriculum'}>
      <div className="curriculum__head">
        {title ? <h3 className="curriculum__title">{title}</h3> : null}
        <p className="curriculum__summary">{summary ?? summaryParts.join(' · ')}</p>
      </div>
      <ol className="curriculum__list">
        {modules.map((m, i) => (
          <li className="curriculum__item" key={`${m.name}-${i}`}>
            <div className="curriculum__row">
              <span className="curriculum__index" aria-hidden="true">{i + 1}</span>
              <span className="curriculum__name">{m.name}</span>
              <span className="curriculum__meta">
                {m.duration && <span className="curriculum__duration">{m.duration}</span>}
                {m.lessons ? (
                  <span className="curriculum__lessons">
                    {m.lessons} {m.lessons === 1 ? 'lesson' : 'lessons'}
                  </span>
                ) : null}
              </span>
            </div>
            {m.note ? <p className="curriculum__note">{m.note}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
