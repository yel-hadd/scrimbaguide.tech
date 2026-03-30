import React from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function DisclosureNotice(): React.ReactElement {
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
