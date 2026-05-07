import React, { useState, useEffect } from 'react';
import AffiliateLink from './AffiliateLink';
import { useLocation } from '@docusaurus/router';
import { isMoneyPagePath } from '@site/src/utils/moneyPagePaths';
import { isStickyCtaDismissed, dismissStickyCta, hasCookieConsentDecision } from '@site/src/utils/stickyCtaState';

export default function MobileStickyCTA(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [consentDecided, setConsentDecided] = useState(false);
  const location = useLocation();

  const path = location.pathname;
  const isMoneyPage = isMoneyPagePath(path);

  useEffect(() => {
    setIsDismissed(isStickyCtaDismissed());
    setConsentDecided(hasCookieConsentDecision());

    const mq = window.matchMedia('(max-width: 995px)');
    const updateViewport = () => setIsMobileViewport(mq.matches);
    updateViewport();
    mq.addEventListener('change', updateViewport);
    return () => mq.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!isMoneyPage || !isMobileViewport || isDismissed || !consentDecided) return;

    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMoneyPage, isMobileViewport, isDismissed, consentDecided]);

  if (!isMoneyPage || !isMobileViewport || !isVisible || isDismissed || !consentDecided) return null;

  const handleDismiss = () => {
    dismissStickyCta('sticky_mobile');
    setIsDismissed(true);
  };

  return (
    <div className="sticky-footer-cta">
      <div className="sticky-footer-cta__content">
        <span className="sticky-footer-cta__text">Get 20% Off Scrimba Pro</span>
        <AffiliateLink
          href="https://scrimba.com/home?pricing&via=u42d4986"
          variant="button"
          className="sticky-footer-cta__button"
          location="sticky_mobile"
        >
          Claim Discount
        </AffiliateLink>
        <button
          type="button"
          className="sticky-footer-cta__close"
          onClick={handleDismiss}
          aria-label="Dismiss discount banner"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
