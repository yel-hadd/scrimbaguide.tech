import React, { useState, useEffect } from 'react';
import AffiliateLink from './AffiliateLink';
import { useLocation } from '@docusaurus/router';
import { isMoneyPagePath } from '@site/src/utils/moneyPagePaths';

export default function MobileStickyCTA(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  const path = location.pathname;
  const isMoneyPage = isMoneyPagePath(path);

  useEffect(() => {
    if (!isMoneyPage) return;

    const handleScroll = () => {
      // Show after scrolling past hero (approx 300px)
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMoneyPage]);

  if (!isMoneyPage || !isVisible || isDismissed) return null;

  return (
    <div className="sticky-footer-cta">
      <div className="sticky-footer-cta__content">
        <span className="sticky-footer-cta__text">Get 20% Off Scrimba Pro</span>
        <AffiliateLink href="https://scrimba.com/home?pricing&via=u42d4986" variant="button" className="sticky-footer-cta__button">
          Claim Discount
        </AffiliateLink>
        <button 
          type="button"
          className="sticky-footer-cta__close" 
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss discount banner"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
