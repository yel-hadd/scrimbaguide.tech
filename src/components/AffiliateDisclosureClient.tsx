import React, { useEffect, useState } from 'react';

/**
 * Affiliate disclosure rendered ONLY on the client, after hydration, and marked
 * data-nosnippet. Real users always see it (FTC compliance), but it is absent
 * from the server-rendered HTML, so search-engine snippets, plain-HTML crawlers,
 * and LLM scrapers that do not execute JavaScript never pick it up.
 *
 * Used in the homepage hero, where the full <DisclosureNotice> would be heavy
 * and the line is not something we want surfaced in a SERP snippet. There is no
 * server-rendered disclosure variant: <DisclosureNotice> gates on the same
 * `mounted` flag, so both are client-only and neither reaches a crawler or
 * llms-full.txt. That is by design; do not "fix" it by rendering either on the
 * server.
 */
export default function AffiliateDisclosureClient({
  className = '',
}: {
  className?: string;
}): React.ReactElement | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <p className={className} data-nosnippet>
      <small>
        Some links here are affiliate links. I may earn a commission if you upgrade, at no extra
        cost to you, and it never changes the verdict.
      </small>
    </p>
  );
}
