import React from 'react';
import AffiliateLink from './AffiliateLink';

/** Avoid repeating the discount line when the subtitle already states it (layout + many MDX CTAs). */
export function subtitleMentionsPartnerOrDiscount(subtitle: string): boolean {
  const s = subtitle.toLowerCase();
  return (
    s.includes('partner link') ||
    s.includes('20%') ||
    s.includes('discount') ||
    s.includes('off pro') ||
    s.includes('off scrimba pro') ||
    (s.includes('claim') && s.includes('off'))
  );
}

interface PricingCTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  variant?: 'inline' | 'banner';
  headingLevel?: 2 | 3;
  /** Use 'free' to link to free courses/signup instead of Pro. Affiliate code still applies. */
  ctaType?: 'pro' | 'free';
  showDiscountNote?: boolean;
}

export default function PricingCTA({
  title = 'When Pro is worth it (and the 20% partner link)',
  subtitle = 'Pro unlocks every course, all four paths, and Discord access. Use our partner link to apply 20% off automatically at checkout.',
  buttonText,
  variant = 'inline',
  headingLevel = 2,
  ctaType = 'pro',
  showDiscountNote = true,
}: PricingCTAProps): React.ReactElement {
  const isFree = ctaType === 'free';
  const defaultButtonText = isFree ? 'Try Scrimba Free' : 'Claim 20% Off Scrimba Pro';
  const href = isFree ? 'https://scrimba.com/?via=u42d4986' : 'https://scrimba.com/home?pricing&via=u42d4986';
  const showDiscountLine =
    !isFree &&
    showDiscountNote &&
    !subtitleMentionsPartnerOrDiscount(subtitle);
  const TitleTag = headingLevel === 3 ? 'h3' : 'h2';

  return (
    <div className={`pricing-cta pricing-cta--${variant}`} data-nosnippet>
      <div className="pricing-cta__content">
        <TitleTag className="pricing-cta__title">{title}</TitleTag>
        <p className="pricing-cta__subtitle">{subtitle}</p>
        {showDiscountLine && (
          <p className="pricing-cta__note">Use our partner link to get 20% off the Pro plan.</p>
        )}
      </div>
      <AffiliateLink
        href={href}
        variant="button"
        className="pricing-cta__button"
        location="pricing_block"
      >
        {buttonText ?? defaultButtonText}
      </AffiliateLink>
    </div>
  );
}
