import React, { useState, useEffect } from 'react';
import AffiliateLink from './AffiliateLink';
import { useLocation } from '@docusaurus/router';
import { isMoneyPagePath } from '@site/src/utils/moneyPagePaths';

/**
 * Desktop/tablet-only floating CTA (mobile uses MobileStickyCTA).
 */
export default function DesktopStickyCTA(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const isMoneyPage = isMoneyPagePath(path);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isMoneyPage || !isDesktop) return;

    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMoneyPage, isDesktop]);

  if (!isMoneyPage || !isDesktop || !isVisible || isDismissed) return null;

  return (
    <div className="desktop-sticky-cta" role="complementary" aria-label="Scrimba Pro discount">
      <div className="desktop-sticky-cta__card">
        <p className="desktop-sticky-cta__title">20% off Scrimba Pro</p>
        <p className="desktop-sticky-cta__sub">Partner checkout — verify price before paying.</p>
        <AffiliateLink
          href="https://scrimba.com/home?pricing&via=u42d4986"
          variant="button"
          className="desktop-sticky-cta__button"
        >
          Continue to Scrimba
        </AffiliateLink>
        <button
          type="button"
          className="desktop-sticky-cta__close"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss discount reminder"
        >
          ×
        </button>
      </div>
    </div>
  );
}
