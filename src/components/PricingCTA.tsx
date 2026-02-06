import React from 'react';
import AffiliateLink from './AffiliateLink';

interface PricingCTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  variant?: 'inline' | 'banner';
}

export default function PricingCTA({
  title = 'Ready to start learning?',
  subtitle = 'Get full access to all Scrimba courses, paths, and community with Scrimba Pro.',
  buttonText = 'Start Scrimba Pro',
  variant = 'inline',
}: PricingCTAProps): React.ReactElement {
  return (
    <div className={`pricing-cta pricing-cta--${variant}`} role="region" aria-label={title}>
      <div className="pricing-cta__content">
        <p className="pricing-cta__title" role="heading" aria-level={2}>{title}</p>
        <p className="pricing-cta__subtitle">{subtitle}</p>
      </div>
      <AffiliateLink
        href="https://scrimba.com/home?pricing"
        variant="button"
        className="pricing-cta__button"
      >
        {buttonText}
      </AffiliateLink>
    </div>
  );
}
