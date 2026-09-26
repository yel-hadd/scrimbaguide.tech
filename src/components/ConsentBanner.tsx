import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './ConsentBanner.module.css';

/** Must match CONSENT_STORAGE_KEY in plugins/analytics/index.js. */
const STORAGE_KEY = 'sg-consent';
/** Footer (and privacy policy) buttons with this class reopen the banner. */
export const COOKIE_SETTINGS_CLASS = 'sg-cookie-settings';

type Choice = 'granted' | 'denied';

/**
 * Consent Mode v2 defaults to denied in the EEA, UK and Switzerland by IP
 * (plugins/analytics). The browser cannot see that region, so the banner uses
 * the time zone as a proxy: European zones (plus Cyprus and the EU's outermost
 * regions) get asked. A European visitor with
 * a non-European zone stays denied, which errs on the safe side.
 */
function inConsentRegion(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Asia\/(Nicosia|Famagusta)|Indian\/(Reunion|Mayotte)|America\/(Guadeloupe|Martinique|Cayenne|Marigot))/.test(
      tz,
    );
  } catch {
    return true;
  }
}

function readChoice(): Choice | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export default function ConsentBanner(): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);
  /** The footer button that reopened the banner, so focus can go back to it. */
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (readChoice() === null && inConsentRegion()) setOpen(true);
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const trigger = target?.closest<HTMLElement>(`.${COOKIE_SETTINGS_CLASS}`);
      if (trigger) {
        e.preventDefault();
        triggerRef.current = trigger;
        setOpen(true);
        setTimeout(() => acceptRef.current?.focus(), 0);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const choose = useCallback((choice: Choice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* Private mode: the choice holds for this page view only. */
    }
    window.gtag?.('consent', 'update', { analytics_storage: choice });
    setOpen(false);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger?.isConnected) setTimeout(() => trigger.focus(), 0);
  }, []);

  if (!open) return null;

  return (
    <section className={styles.banner} role="region" aria-label="Cookie consent">
      <p className={styles.text}>
        We use Google Analytics cookies to see which guides help readers. No ads, no selling data.{' '}
        <Link to="/legal/privacy-policy/">Privacy policy</Link>
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => choose('denied')}>
          Decline
        </button>
        <button type="button" ref={acceptRef} className={styles.button} onClick={() => choose('granted')}>
          Accept
        </button>
      </div>
    </section>
  );
}
