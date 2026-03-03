import React from 'react';
import AffiliateLink from './AffiliateLink';

interface VerdictBoxProps {
  title?: string;
  rating?: string;
  verdict: string;
  pros?: string[];
  cons?: string[];
  ctaText?: string;
  ctaHref?: string;
}

export default function VerdictBox({
  title = 'The Verdict',
  rating,
  verdict,
  pros = [],
  cons = [],
  ctaText = 'Try Scrimba Pro',
  ctaHref = 'https://scrimba.com/home?pricing&via=u42d4986',
}: VerdictBoxProps): React.ReactElement {
  return (
    <div className="verdict-box">
      <div className="verdict-box__header">
        <div className="verdict-box__title" role="heading" aria-level={2}>{title}</div>
        {rating && <div className="verdict-box__rating">{rating}</div>}
      </div>
      
      <p className="verdict-box__summary">{verdict}</p>
      
      {(pros.length > 0 || cons.length > 0) && (
        <div className="verdict-box__lists">
          {pros.length > 0 && (
            <div className="verdict-box__list verdict-box__list--pros">
              <div className="verdict-box__list-title" role="heading" aria-level={3}>Pros</div>
              <ul>
                {pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>
          )}
          
          {cons.length > 0 && (
            <div className="verdict-box__list verdict-box__list--cons">
              <div className="verdict-box__list-title" role="heading" aria-level={3}>Cons</div>
              <ul>
                {cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="verdict-box__cta">
        <AffiliateLink href={ctaHref} variant="button">
          {ctaText}
        </AffiliateLink>
      </div>
    </div>
  );
}
