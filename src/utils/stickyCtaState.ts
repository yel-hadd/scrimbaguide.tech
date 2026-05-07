/**
 * Shared dismissal state for the sticky affiliate CTAs (mobile + desktop).
 *
 * Dismissing either suppresses both for the cooldown window. The cookie-consent
 * gate avoids stacking the sticky CTA on top of the consent banner before the
 * user has decided.
 */

const DISMISS_KEY = 'sg-sticky-cta-dismissed-until';
const COOLDOWN_DAYS = 14;
const CONSENT_COOKIE = 'scrimbaguide-consent';

export function isStickyCtaDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const until = window.localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    const ts = Number(until);
    if (!Number.isFinite(ts)) return false;
    return Date.now() < ts;
  } catch {
    return false;
  }
}

export function dismissStickyCta(surface: 'sticky_mobile' | 'sticky_desktop'): void {
  if (typeof window === 'undefined') return;
  const until = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(until));
  } catch {
    /* localStorage unavailable — treat as session-only */
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'sticky_cta_dismissed', {
      surface,
      cooldown_days: COOLDOWN_DAYS,
    });
  }
}

/**
 * `docusaurus-plugin-cookie-consent` writes a cookie named `scrimbaguide-consent`
 * once the user accepts or rejects. We treat presence of any value as a decision
 * (the plugin does not distinguish accept/reject in the cookie name).
 */
export function hasCookieConsentDecision(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${CONSENT_COOKIE}=`));
}
