/**
 * SPA page_views, adapted from @docusaurus/plugin-google-gtag's client module.
 * content_group travels at event scope (see plugins/analytics/index.js);
 * AffiliateLink and trackSearch add it to their own events.
 */
import { contentGroup } from '../../src/utils/contentGroup';

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
  });
}
