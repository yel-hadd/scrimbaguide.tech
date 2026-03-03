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
  href: string;
  description?: string;
}

export default function CourseCard({
  title,
  duration,
  difficulty,
  access = 'Pro',
  modules,
  lessons,
  instructor,
  href,
  description,
}: CourseCardProps): React.ReactElement {
  return (
    <article className="course-card" aria-label={title}>
      <div className="course-card__header">
        <h3 className="course-card__title">{title}</h3>
        <span className={`course-card__badge course-card__badge--${access.toLowerCase()}`}>
          {access}
        </span>
      </div>

      {description && (
        <p className="course-card__description">{description}</p>
      )}

      <div className="course-card__meta">
        {duration && <span className="course-card__meta-item">Duration: {duration}</span>}
        {difficulty && <span className="course-card__meta-item">Level: {difficulty}</span>}
        {modules !== undefined && <span className="course-card__meta-item">{modules} modules</span>}
        {lessons !== undefined && <span className="course-card__meta-item">{lessons} lessons</span>}
        {instructor && <span className="course-card__meta-item">Instructor: {instructor}</span>}
      </div>

      <AffiliateLink href={href} variant="button" className="course-card__cta">
        View on Scrimba
      </AffiliateLink>
    </article>
  );
}
