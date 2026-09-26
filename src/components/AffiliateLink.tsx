import React from 'react';
import { AFFILIATE_PARAM, MONETISED_HOSTS } from '@site/src/constants';
import { affiliateDestination } from '@site/src/utils/affiliateDestination';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends `affiliate_link_clicked`. Exported for monetised links that keep their own markup. */
export function trackAffiliateClick({
  url,
  ctaType,
  location,
  linkText,
}: {
  url: string;
  ctaType: string;
  location?: string;
  linkText: string;
}): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const destination = affiliateDestination(url);
  window.gtag('event', 'affiliate_link_clicked', {
    cta_type: ctaType,
    destination_type: destination.type,
    destination_slug: destination.slug,
    link_text: linkText,
    ...(location && { cta_location: location }),
  });
}

interface AffiliateLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'button' | 'text' | 'card';
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  /** Optional placement label, e.g. "hero-primary", "verdict-box", "final-cta". Sent
   *  to GA as `cta_location` so per-placement conversion can be compared. */
  location?: string;
  /** GA `cta_type`: the CTA format, from a closed list (`sticky`, `pricing-cta`,
   *  `course-card`, `verdict-box`, `comparison-table`, `scrim-poster`,
   *  `code-preview`, `lightbox`, `path-advisor`). Wrapping components set it;
   *  inline MDX links fall back to `inline-<variant>`. */
  ctaType?: string;
}

export default function AffiliateLink({
  href,
  children,
  className = '',
  variant = 'text',
  onClick,
  location,
  ctaType,
}: AffiliateLinkProps): React.ReactElement {
  /* Scrimba links get the `via=` param appended. Other monetised merchants
     (e.g. Udemy via Impact) arrive already tracked in the href, so they are
     passed through untouched but still marked as paid links below. */
  /* eslint-disable no-nested-ternary */
  const url = href.includes('scrimba.com')
    ? href.includes('via=')
      ? href
      : `${href}${href.includes('?') ? '&' : '?'}${AFFILIATE_PARAM}`
    : href;
  /* eslint-enable no-nested-ternary */

  const baseClass = 'cta-link';
  const variantClass = `${baseClass}--${variant}`;

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    trackAffiliateClick({
      url,
      ctaType: ctaType ?? `inline-${variant}`,
      location,
      linkText: typeof children === 'string' ? children : 'affiliate_link',
    });
    onClick?.(e);
  };

  /** MDX often wraps multiline link text in `<p>`, which is invalid inside `<a>`. */
  const linkChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === 'p') {
      return (child.props as { children?: React.ReactNode }).children;
    }
    return child;
  });

  /* Every monetised destination must carry rel="nofollow" (FTC disclosure is
     separate; this is the Google paid-link requirement). Add new merchants here. */
  const isMonetised = MONETISED_HOSTS.some((host) => url.includes(host));
  const rel = isMonetised ? 'nofollow noopener noreferrer' : 'noopener noreferrer';

  return (
    <a
      href={url}
      target="_blank"
      rel={rel}
      className={`${baseClass} ${variantClass} ${className}`.trim()}
      onClick={handleClick}
    >
      {linkChildren}
      <span className="cta-link__external-icon" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
