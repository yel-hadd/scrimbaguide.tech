import React from 'react';
import Link from '@docusaurus/Link';

export default function DisclosureNotice(): React.ReactElement {
  return (
    <div className="disclosure-notice">
      <p>
        <strong>Transparency:</strong> We may earn a commission if you buy through our links. 
        This helps support our work at no extra cost to you. 
        <Link to="/legal/affiliate-disclosure">Read our full disclosure</Link>.
      </p>
    </div>
  );
}
