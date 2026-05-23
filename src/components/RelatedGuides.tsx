import React from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { getRelatedGuides, RelatedGuide } from '../content/relatedGuidesMap';

interface RelatedGuidesProps {
  title?: string;
  guides?: RelatedGuide[];
}

/** Pick the strongest "next step" from a list of related guides for a given
 *  page path. Implements Hick's Law: surface ONE primary path so the reader
 *  does not have to weigh several equal-weight options. */
function pickFeatured(
  guides: RelatedGuide[],
  pathname: string,
): { featured: RelatedGuide; rest: RelatedGuide[] } {
  const isReactCourse =
    pathname.includes('/courses/react/') || pathname.includes('/learn-react');
  const isFullstackCue =
    pathname.includes('/fullstack') ||
    pathname.includes('/backend') ||
    pathname.includes('/node');

  const matchFrontend = (g: RelatedGuide): boolean =>
    g.href.includes('/paths/frontend-developer-path');
  const matchFullstack = (g: RelatedGuide): boolean =>
    g.href.includes('/paths/fullstack-developer-path');

  // For React course pages, the obvious next step is Frontend Path.
  // For fullstack-cued pages, prefer Fullstack Path.
  if (isReactCourse) {
    const idx = guides.findIndex(matchFrontend);
    if (idx > -1) {
      return {
        featured: guides[idx],
        rest: guides.filter((_, i) => i !== idx),
      };
    }
  }
  if (isFullstackCue) {
    const idx = guides.findIndex(matchFullstack);
    if (idx > -1) {
      return {
        featured: guides[idx],
        rest: guides.filter((_, i) => i !== idx),
      };
    }
  }

  // Default: first guide in the curated list is the editorially chosen primary.
  return { featured: guides[0], rest: guides.slice(1) };
}

export default function RelatedGuides({
  title = 'Related Guides',
  guides: propGuides,
}: RelatedGuidesProps): React.ReactElement | null {
  const location = useLocation();

  // Use props if provided, otherwise look up by current path
  const guides = propGuides || getRelatedGuides(location.pathname);

  if (!guides || guides.length === 0) {
    return null;
  }

  const { featured, rest } = pickFeatured(guides, location.pathname);
  const featuredType = featured.type || 'doc';
  const featuredLabel =
    featuredType === 'comparison'
      ? 'Comparison'
      : featuredType === 'blog'
        ? 'Blog'
        : 'Docs';

  return (
    <div className="related-guides">
      <h3 className="related-guides__title">{title}</h3>

      <Link
        to={featured.href}
        className="related-guides__featured"
        aria-label={`Next step: ${featured.title}`}
      >
        <div className="related-guides__content">
          <span className="related-guides__featured-eyebrow">Next step</span>
          <h4 className="related-guides__featured-title">{featured.title}</h4>
          {featured.description && (
            <p className="related-guides__description">{featured.description}</p>
          )}
          <span
            className={`related-guides__badge related-guides__badge--${featuredType}`}
          >
            {featuredLabel}
          </span>
        </div>
        <div className="related-guides__arrow" aria-hidden="true">→</div>
      </Link>

      {rest.length > 0 && (
        <ul className="related-guides__list">
          {rest.map((guide, i) => {
            const t = guide.type || 'doc';
            const tLabel =
              t === 'comparison' ? 'Comparison' : t === 'blog' ? 'Blog' : 'Docs';
            return (
              <li key={i} className="related-guides__list-item">
                <Link to={guide.href} className="related-guides__list-link">
                  <span
                    className={`related-guides__badge related-guides__badge--${t}`}
                  >
                    {tLabel}
                  </span>
                  <span className="related-guides__list-title">{guide.title}</span>
                  <span className="related-guides__arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
