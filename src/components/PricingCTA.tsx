import React from 'react';
import AffiliateLink from './AffiliateLink';

interface PricingCTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  variant?: 'inline' | 'banner';
  /** Use 'free' to link to free courses/signup instead of Pro. Affiliate code still applies. */
  ctaType?: 'pro' | 'free';
  showDiscountNote?: boolean;
}

export default function PricingCTA({
  title = 'Ready to start learning?',
  subtitle = 'Get full access to all Scrimba courses, paths, and community with Scrimba Pro.',
  buttonText,
  variant = 'inline',
  ctaType = 'pro',
  showDiscountNote = true,
}: PricingCTAProps): React.ReactElement {
  const isFree = ctaType === 'free';
  const defaultButtonText = isFree ? 'Try Scrimba Free' : 'Claim 20% Off Scrimba Pro';
  const href = isFree ? 'https://scrimba.com/?via=u42d4986' : 'https://scrimba.com/home?pricing&via=u42d4986';

  return (
    <div className={`pricing-cta pricing-cta--${variant}`}>
      <div className="pricing-cta__content">
        <h2 className="pricing-cta__title">{title}</h2>
        <p className="pricing-cta__subtitle">{subtitle}</p>
        {!isFree && showDiscountNote && (
          <p className="pricing-cta__note">Use our partner link to get 20% off the Pro plan.</p>
        )}
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
