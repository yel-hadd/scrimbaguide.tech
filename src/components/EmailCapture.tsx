import React, { useState, useEffect, useCallback } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';

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
  const { siteConfig } = useDocusaurusContext();
  const location = useLocation();

  if (siteConfig.customFields?.hideNewsletterLeadMagnet === true) {
    return null;
  }

  const formAction =
    (siteConfig.customFields?.newsletterFormAction as string | undefined) ?? '';

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const norm = location.pathname.replace(/\/$/, '') || '/';
  const isBlogPost = variant === 'blog' && /^\/blog\/[^/]+$/.test(norm);

  const isMoneyDoc =
    variant === 'docs' &&
    (location.pathname.includes('/docs/pricing') ||
      location.pathname.includes('/docs/comparisons'));

  const activate = useCallback(() => {
    if (dismissed || submitted) return;
    setVisible(true);
  }, [dismissed, submitted]);

  useEffect(() => {
    if (!isBlogPost) return;

    const onScroll = (): void => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const ratio = window.scrollY / scrollable;
      if (ratio >= 0.5) activate();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isBlogPost, activate]);

  useEffect(() => {
    if (!isMoneyDoc || typeof window === 'undefined') return;
    // Exit intent: desktop only (coarse check)
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) return;

    const onLeave = (e: MouseEvent): void => {
      if (e.clientY <= 12) activate();
    };

    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => document.documentElement.removeEventListener('mouseleave', onLeave);
  }, [isMoneyDoc, activate]);

  if ((!isBlogPost && !isMoneyDoc) || !visible || dismissed || submitted) {
    return null;
  }

  return (
    <div
      className="email-capture margin-top--lg padding--md"
      style={{
        border: '2px solid var(--ifm-color-primary)',
        borderRadius: 12,
        background: 'var(--ifm-background-surface-color)',
        maxWidth: 480,
      }}
    >
      <h3 className="margin-bottom--sm">Not sure which path to take?</h3>
      <p className="margin-bottom--md">
        Get our one-page <strong>Scrimba path comparison</strong>—free. We&apos;ll only email when we
        publish major pricing or path updates.
      </p>
      {formAction ? (
        <form
          action={formAction}
          method="POST"
          className="email-capture__form"
          onSubmit={() => setSubmitted(true)}
        >
          <label htmlFor="sg-email-capture" className="sr-only">
            Email address
          </label>
          <input
            id="sg-email-capture"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="margin-bottom--sm"
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6 }}
          />
          <input type="hidden" name="source" value={`scrimbaguide-${location.pathname}`} />
          <div className="button-group">
            <button type="submit" className="button button--primary">
              Send me the guide
            </button>
            <button type="button" className="button button--secondary margin-left--sm" onClick={() => setDismissed(true)}>
              No thanks
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="margin-bottom--md">
            <a
              className="button button--primary"
              href="mailto:hello@scrimbaguide.tech?subject=Send%20the%20Scrimba%20path%20guide"
            >
              Email me the guide
            </a>
          </p>
          <p className="text--sm text--secondary">
            Site owner: set <code>NEWSLETTER_FORM_ACTION</code> at build time and{' '}
            <code>customFields.newsletterFormAction</code> in <code>docusaurus.config.ts</code> to use a
            hosted form (Formspree, Mailchimp, etc.).
          </p>
          <button type="button" className="button button--link margin-top--sm" onClick={() => setDismissed(true)}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
