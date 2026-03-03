import React, { useState, useEffect } from 'react';
import AffiliateLink from './AffiliateLink';
import { useLocation } from '@docusaurus/router';

export default function MobileStickyCTA(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  // Only show on money pages (comparisons, pricing, reviews)
  const isMoneyPage = 
    location.pathname.includes('/comparisons/') || 
    location.pathname.includes('/pricing/') || 
    location.pathname.includes('review') || 
    location.pathname.includes('worth-it');

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
        <span className="sticky-footer-cta__text">Start Learning for Free</span>
        <AffiliateLink href="https://scrimba.com/?via=u42d4986" variant="button" className="sticky-footer-cta__button">
          Try Scrimba
        </AffiliateLink>
        <button 
          className="sticky-footer-cta__close" 
          onClick={() => setIsDismissed(true)}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
