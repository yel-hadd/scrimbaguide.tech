import React from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const AFFILIATE_PARAM = 'via=u42d4986';

interface AffiliateLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'button' | 'text' | 'card';
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function AffiliateLink({
  href,
  children,
  className = '',
  variant = 'text',
  onClick,
}: AffiliateLinkProps): React.ReactElement {
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
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const slug = window.location.pathname.replace(/^\/blog\//, '').replace(/\/$/, '');
      window.gtag('event', 'affiliate_link_clicked', {
        post_slug: slug || window.location.pathname,
        destination_url: url,
        link_text: typeof children === 'string' ? children : 'affiliate_link',
        page_location: window.location.href,
      });
    }
    onClick?.(e);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} ${variantClass} ${className}`.trim()}
      onClick={handleClick}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
