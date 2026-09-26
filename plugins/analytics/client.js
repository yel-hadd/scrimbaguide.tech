/**
 * SPA page_views, adapted from @docusaurus/plugin-google-gtag's client module.
 * content_group travels at event scope (see plugins/analytics/index.js);
 * AffiliateLink and trackSearch add it to their own events.
 *
 * Also field Core Web Vitals (RUM): after the page's load event, on the
 * production hostname only, it lazy-loads the web-vitals attribution build
 * (its own chunk, never in main.js) and sends one `web_vitals` event per
 * metric. Consent is untouched: the events go through gtag like every other
 * event, so Consent Mode applies as it does to page_view. Soft navigations
 * are not reported (web-vitals' default), so every metric belongs to the
 * landing page, the way CrUX counts it: the event carries the landing URL as
 * page_location and the landing page's content_group.
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { contentGroup } from '../../src/utils/contentGroup';
import { webVitalsParams, WEB_VITALS_SESSION_GUARD_MS } from '../../src/utils/webVitalsParams';

// Same value as SITE_HOSTNAME in ./index.js (scripts/__tests__/analytics.test.mjs checks).
const SITE_HOSTNAME = 'scrimbaguide.tech';

let lastPageViewAt = Date.now();

export function onRouteDidUpdate({ location, previousLocation }) {
  if (
    !previousLocation ||
    (location.pathname === previousLocation.pathname &&
      location.search === previousLocation.search &&
      location.hash === previousLocation.hash)
  ) {
    return;
  }
  // The document title updates a tick later (facebook/docusaurus#7420).
  setTimeout(() => {
    if (typeof window.gtag !== 'function') return;
    const group = contentGroup(location.pathname);
    window.gtag('event', 'page_view', { content_group: group });
    lastPageViewAt = Date.now();
  });
}

function startWebVitals() {
  const landingHref = window.location.href;
  const landingGroup = contentGroup(window.location.pathname);
  import(/* webpackChunkName: "web-vitals" */ 'web-vitals/attribution')
    .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (metric) => {
        if (typeof window.gtag !== 'function') return;
        if (Date.now() - lastPageViewAt > WEB_VITALS_SESSION_GUARD_MS) return;
        window.gtag('event', 'web_vitals', {
          ...webVitalsParams(metric, landingGroup),
          page_location: landingHref,
        });
      };
      onCLS(report);
      onINP(report);
      onLCP(report);
      onFCP(report);
      onTTFB(report);
    })
    .catch(() => {});
}

if (ExecutionEnvironment.canUseDOM && window.location.hostname === SITE_HOSTNAME) {
  const start = () => setTimeout(startWebVitals, 0);
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
