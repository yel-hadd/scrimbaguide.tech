import React from 'react';

const AFFILIATE_PARAM = 'via=u42d4986';

interface AffiliateLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'button' | 'text' | 'card';
}

export default function AffiliateLink({
  href,
  children,
  className = '',
  variant = 'text',
}: AffiliateLinkProps): React.ReactElement {
  const url = href.includes('scrimba.com')
    ? `${href}${href.includes('?') ? '&' : '?'}${AFFILIATE_PARAM}`
    : href;

  const baseClass = 'affiliate-link';
  const variantClass = `${baseClass}--${variant}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`${baseClass} ${variantClass} ${className}`.trim()}
      data-affiliate="scrimba"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
