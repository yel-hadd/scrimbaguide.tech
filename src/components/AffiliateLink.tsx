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
  /** Optional placement label, e.g. "hero-primary", "verdict-box", "final-cta". Sent
   *  to GA as `cta_location` so per-placement conversion can be compared. */
  location?: string;
}

export default function AffiliateLink({
  href,
  children,
  className = '',
  variant = 'text',
  onClick,
  location,
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
        ...(location && { cta_location: location }),
      });
    }
    onClick?.(e);
  };

  /** MDX often wraps multiline link text in `<p>`, which is invalid inside `<a>`. */
  const linkChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === 'p') {
      return (child.props as { children?: React.ReactNode }).children;
    }
    return child;
  });

  const rel = url.includes('scrimba.com')
    ? 'nofollow noopener noreferrer'
    : 'noopener noreferrer';

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
