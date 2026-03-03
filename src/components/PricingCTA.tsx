import React from 'react';
import AffiliateLink from './AffiliateLink';

interface PricingCTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  variant?: 'inline' | 'banner';
  /** Use 'free' to link to free courses/signup instead of Pro. Affiliate code still applies. */
  ctaType?: 'pro' | 'free';
}

export default function PricingCTA({
  title = 'Ready to start learning?',
  subtitle = 'Get full access to all Scrimba courses, paths, and community with Scrimba Pro.',
  buttonText,
  variant = 'inline',
  ctaType = 'pro',
}: PricingCTAProps): React.ReactElement {
  const isFree = ctaType === 'free';
  const defaultButtonText = isFree ? 'Try Scrimba Free' : 'Start Scrimba Pro';
  const href = isFree ? 'https://scrimba.com/?via=u42d4986' : 'https://scrimba.com/home?pricing&via=u42d4986';

  return (
    <div className={`pricing-cta pricing-cta--${variant}`} role="region" aria-label={title}>
      <div className="pricing-cta__content">
        <p className="pricing-cta__title" role="heading" aria-level={2}>{title}</p>
        <p className="pricing-cta__subtitle">{subtitle}</p>
      </div>
      <AffiliateLink
        href={href}
        variant="button"
        className="pricing-cta__button"
      >
        {buttonText ?? defaultButtonText}
      </AffiliateLink>
    </div>
  );
}
