import React from 'react';

type Variant = 'blog' | 'docs';

interface EmailCaptureProps {
  variant?: Variant;
}

/**
 * Lead capture: scroll-depth on blog posts; exit-intent on money docs (desktop).
 * Set `customFields.newsletterFormAction` in docusaurus.config (e.g. Formspree/Mailchimp URL).
 * If unset, shows a mailto fallback for the path guide.
 * Disabled when `customFields.hideNewsletterLeadMagnet` is true (see `docusaurus.config.ts` and `HIDE_NEWSLETTER_LEAD_MAGNET` at build).
 */
export default function EmailCapture({ variant = 'blog' }: EmailCaptureProps): React.ReactElement | null {
  return null;
}
