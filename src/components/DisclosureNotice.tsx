import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';

export default function DisclosureNotice(): React.ReactElement | null {
  const { pathname } = useLocation();
  // Render only on the client, after hydration, so the disclosure is visible to
  // real users (FTC) but absent from the server-rendered HTML. Combined with
  // data-nosnippet, that keeps it out of SERP snippets, plain-HTML crawlers, and
  // LLM scrapers that do not execute JavaScript, while staying transparent to
  // anyone actually reading the page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isBlogListPreviewPage =
    pathname === '/blog/' ||
    pathname.startsWith('/blog/page/') ||
    pathname.startsWith('/blog/tags') ||
    pathname.startsWith('/blog/archive');

  if (!mounted || isBlogListPreviewPage) {
    return null;
  }

  return (
    <div className="disclosure-notice" data-nosnippet>
      <p>
        <strong>Transparency:</strong> We may earn a commission if you buy through our links.
        This helps support our work at no extra cost to you.{' '}
        <Link to="/legal/affiliate-disclosure">Read our full disclosure</Link>.
      </p>
    </div>
  );
}
