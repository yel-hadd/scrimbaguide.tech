import React from 'react';
import AffiliateLink from './AffiliateLink';

interface CourseCardProps {
  title: string;
  duration?: string;
  difficulty?: string;
  access?: 'Free' | 'Pro';
  modules?: number;
  lessons?: number;
  instructor?: string;
  /** Scrimba profile URL for the instructor; routed through AffiliateLink. */
  instructorUrl?: string;
  href: string;
  description?: string;
  /** Optional override for the GA `cta_location` tag. Defaults to a slug
   *  derived from `href` so per-card conversion can be measured across 100+
   *  generated course-detail pages without touching the generator. */
  location?: string;
}

/** Derive a stable analytics slug from a Scrimba course URL.
 *  e.g. `https://scrimba.com/learn-react-c0e?via=u42d4986` -> `learn-react-c0e`. */
function slugFromHref(href: string): string {
  try {
    const path = href.split('?')[0].replace(/\/$/, '');
    const last = path.substring(path.lastIndexOf('/') + 1);
    return last || 'unknown';
  } catch {
    return 'unknown';
  }
}

export default function CourseCard({
  title,
  duration,
  difficulty,
  access = 'Pro',
  modules,
  lessons,
  instructor,
  instructorUrl,
  href,
  description,
  location,
}: CourseCardProps): React.ReactElement {
  const ctaLocation = location || `course-card-${slugFromHref(href)}`;
  const isFree = access === 'Free';
  const ctaLabel = isFree ? 'Start free on Scrimba' : 'View on Scrimba';

  return (
    <article className="course-card" aria-label={title}>
      <div className="course-card__header">
        <h3 className="course-card__title">{title}</h3>
        <span
          className={`course-card__badge course-card__badge--${access.toLowerCase()}`}
          aria-label={isFree ? 'Free course' : 'Scrimba Pro course'}
        >
          {access}
        </span>
      </div>

      {instructor && (
        <p className="course-card__instructor">
          <span className="course-card__instructor-label">Taught by</span>{' '}
          {instructorUrl ? (
            <AffiliateLink href={instructorUrl} location={`${ctaLocation}-instructor`}>
              <strong className="course-card__instructor-name">{instructor}</strong>
            </AffiliateLink>
          ) : (
            <strong className="course-card__instructor-name">{instructor}</strong>
          )}
        </p>
      )}

      {description && (
        <p className="course-card__description">{description}</p>
      )}

      <div className="course-card__meta">
        {duration && <span className="course-card__meta-item">Duration: {duration}</span>}
        {difficulty && <span className="course-card__meta-item">Level: {difficulty}</span>}
        {modules !== undefined && <span className="course-card__meta-item">{modules} modules</span>}
        {lessons !== undefined && <span className="course-card__meta-item">{lessons} lessons</span>}
      </div>

      <AffiliateLink
        href={href}
        variant="button"
        className="course-card__cta"
        location={ctaLocation}
      >
        {ctaLabel}
      </AffiliateLink>
    </article>
  );
}
