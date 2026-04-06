import React from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useLocation } from '@docusaurus/router';

export default function DisclosureNotice(): React.ReactElement {
  const { pathname } = useLocation();
  const isBlogListPreviewPage =
    pathname === '/blog/' ||
    pathname.startsWith('/blog/page/') ||
    pathname.startsWith('/blog/tags') ||
    pathname.startsWith('/blog/archive');

  if (isBlogListPreviewPage) {
    return <></>;
  }

  return (
    <BrowserOnly fallback={<div className="disclosure-notice" style={{ minHeight: '40px' }}></div>}>
      {() => (
        <div className="disclosure-notice" data-nosnippet>
          <p>
            <strong>Transparency:</strong> We may earn a commission if you buy through our links. 
            This helps support our work at no extra cost to you.{' '}
            <Link to="/legal/affiliate-disclosure">Read our full disclosure</Link>.
          </p>
        </div>
      )}
    </BrowserOnly>
  );
}
