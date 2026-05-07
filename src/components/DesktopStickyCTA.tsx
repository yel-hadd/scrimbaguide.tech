import React, { useState, useEffect } from 'react';
import AffiliateLink from './AffiliateLink';
import { useLocation } from '@docusaurus/router';
import { isMoneyPagePath } from '@site/src/utils/moneyPagePaths';
import {
  isStickyCtaDismissed,
  dismissStickyCta,
  hasCookieConsentDecision,
} from '@site/src/utils/stickyCtaState';

/**
 * Desktop-only floating CTA aligned with the navbar mobile breakpoint.
 *
 * Hidden whenever an inline `.pricing-cta` block is in the viewport — avoids
 * showing two affiliate CTAs at once.
 */
export default function DesktopStickyCTA(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [consentDecided, setConsentDecided] = useState(false);
  const [pricingCtaInView, setPricingCtaInView] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const isMoneyPage = isMoneyPagePath(path);

  useEffect(() => {
    setIsDismissed(isStickyCtaDismissed());
    setConsentDecided(hasCookieConsentDecision());

    const mq = window.matchMedia('(min-width: 996px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isMoneyPage || !isDesktop || isDismissed || !consentDecided) return;

    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMoneyPage, isDesktop, isDismissed, consentDecided]);

  useEffect(() => {
    if (!isMoneyPage || !isDesktop || isDismissed || !consentDecided) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const targets = document.querySelectorAll<HTMLElement>('.pricing-cta');
    if (targets.length === 0) {
      setPricingCtaInView(false);
      return;
    }

    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setPricingCtaInView(visible.size > 0);
      },
      { threshold: 0.1 },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [isMoneyPage, isDesktop, isDismissed, consentDecided, location.pathname]);

  if (!isMoneyPage || !isDesktop || !isVisible || isDismissed || !consentDecided || pricingCtaInView) {
    return null;
  }

  const handleDismiss = () => {
    dismissStickyCta('sticky_desktop');
    setIsDismissed(true);
  };

  return (
    <div className="desktop-sticky-cta" role="complementary" aria-label="Scrimba Pro discount">
      <div className="desktop-sticky-cta__card">
        <p className="desktop-sticky-cta__title">20% off Scrimba Pro</p>
        <p className="desktop-sticky-cta__sub">Partner checkout — verify price before paying.</p>
        <AffiliateLink
          href="https://scrimba.com/home?pricing&via=u42d4986"
          variant="button"
          className="desktop-sticky-cta__button"
          location="sticky_desktop"
        >
          Continue to Scrimba
        </AffiliateLink>
        <button
          type="button"
          className="desktop-sticky-cta__close"
          onClick={handleDismiss}
          aria-label="Dismiss discount reminder"
        >
          ×
        </button>
      </div>
    </div>
  );
}
