import React from 'react';

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

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} ${variantClass} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
