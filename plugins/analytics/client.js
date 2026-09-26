/**
 * SPA page_views, adapted from @docusaurus/plugin-google-gtag's client module.
 * `set` carries the new content_group onto every later event on the page
 * (affiliate clicks, search), not just this page_view.
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
    window.gtag('set', { content_group: contentGroup(location.pathname) });
    window.gtag('set', 'page_path', location.pathname + location.search + location.hash);
    window.gtag('event', 'page_view');
  });
}
