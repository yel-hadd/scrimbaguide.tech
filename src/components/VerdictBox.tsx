import React from 'react';
import AffiliateLink from './AffiliateLink';
import { DEMO_SCRIM_URL } from '@site/src/constants';

interface VerdictBoxProps {
  title?: string;
  rating?: string;
  verdict: string;
  pros?: string[];
  cons?: string[];
  ctaText?: string;
  ctaHref?: string;
  /** Optional GA `cta_location` tag for the verdict CTA. Defaults to
   *  `verdict-box` so per-page conversion can still be filtered. */
  location?: string;
}

/** VerdictBox lives at the bottom of upper-funnel comparison and review pages.
 *  At that point the reader is evaluating, not buying, so the default CTA is
 *  the no-signup demo scrim ("try the format"), not the Pro affiliate link.
 *  Comparison/review pages that want the Pro CTA pass it explicitly. */
export default function VerdictBox({
  title = 'The Verdict',
  rating,
  verdict,
  pros = [],
  cons = [],
  ctaText = 'Try a scrim in your browser (no signup)',
  ctaHref = DEMO_SCRIM_URL,
  location = 'verdict-box',
}: VerdictBoxProps): React.ReactElement {
  return (
    <div className="verdict-box">
      <div className="verdict-box__header">
        <h2 className="verdict-box__title">{title}</h2>
        {rating && <div className="verdict-box__rating">{rating}</div>}
      </div>

      <p className="verdict-box__summary">{verdict}</p>

      {(pros.length > 0 || cons.length > 0) && (
        <div className="verdict-box__lists">
          {pros.length > 0 && (
            <div className="verdict-box__list verdict-box__list--pros">
              <h3 className="verdict-box__list-title">
                <span className="verdict-box__list-icon" aria-hidden="true">+</span>
                Pros
              </h3>
              <ul>
                {pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>
          )}

          {cons.length > 0 && (
            <div className="verdict-box__list verdict-box__list--cons">
              <h3 className="verdict-box__list-title">
                <span className="verdict-box__list-icon" aria-hidden="true">−</span>
                Cons
              </h3>
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
        <AffiliateLink href={ctaHref} variant="button" location={location}>
          {ctaText}
        </AffiliateLink>
      </div>
    </div>
  );
}
