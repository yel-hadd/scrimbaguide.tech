import React from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { getRelatedGuides, RelatedGuide } from '../content/relatedGuidesMap';

interface RelatedGuidesProps {
  title?: string;
  guides?: RelatedGuide[];
}

export default function RelatedGuides({ 
  title = 'Related Guides', 
  guides: propGuides 
}: RelatedGuidesProps): React.ReactElement | null {
  const location = useLocation();
  
  // Use props if provided, otherwise look up by current path
  const guides = propGuides || getRelatedGuides(location.pathname);

  if (!guides || guides.length === 0) {
    return null;
  }

  return (
    <div className="related-guides">
      <h3 className="related-guides__title">{title}</h3>
      <div className="related-guides__grid">
        {guides.map((guide, i) => (
          <Link key={i} to={guide.href} className="related-guides__card">
            <div className="related-guides__content">
              <span className={`related-guides__badge related-guides__badge--${guide.type || 'doc'}`}>
                {guide.type === 'comparison' ? 'Comparison' : guide.type === 'blog' ? 'Guide' : 'Doc'}
              </span>
              <h4 className="related-guides__card-title">{guide.title}</h4>
              {guide.description && (
                <p className="related-guides__description">{guide.description}</p>
              )}
            </div>
            <div className="related-guides__arrow">→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
