/**
 * GA4 `web_vitals` event parameters for one web-vitals metric.
 *
 * `plugins/analytics/client.js` loads the web-vitals attribution build after
 * the page's load event and calls this for every report. Kept free of any
 * web-vitals import so plain Node can test it and `tsc` never needs the
 * package's types.
 *
 * - `metric_value` is an integer: milliseconds for LCP, INP, FCP and TTFB,
 *   CLS x 1000 (a CLS of 0.103 becomes 103). It is registered as a custom
 *   metric, so GA4 sums it: the average is the sum over the event count for
 *   one `metric_name`.
 * - `debug_target` is the element web-vitals blames (LCP element, INP
 *   interaction target, CLS largest-shift source), cut to GA4's 100-character
 *   parameter limit and left out when there is none.
 * - `metric_id` is unique per metric per page load (for BigQuery de-dupes);
 *   it is sent but not registered as a dimension.
 */

/** The fields this module reads from a web-vitals 6 attribution-build metric. */
export interface VitalsMetric {
  name: string;
  value: number;
  rating: string;
  id: string;
  attribution?: {
    target?: string;
    url?: string;
    interactionTarget?: string;
    largestShiftTarget?: string;
  };
}

export interface WebVitalsParams {
  metric_name: string;
  metric_value: number;
  metric_rating: string;
  metric_id: string;
  content_group: string;
  debug_target?: string;
}

/**
 * A report is dropped once this long has passed since the last page_view.
 * CLS and INP report when the tab is hidden, which can be long after the
 * last hit; an event sent after GA4's 30-minute session timeout would open
 * a new session with no page_view and inflate the session count that every
 * affiliate rate divides by.
 */
export const WEB_VITALS_SESSION_GUARD_MS = 25 * 60 * 1000;

const GA4_PARAM_MAX = 100;

function debugTarget(metric: VitalsMetric): string {
  const a = metric.attribution ?? {};
  switch (metric.name) {
    case 'LCP':
      return a.target || a.url || '';
    case 'INP':
      return a.interactionTarget || '';
    case 'CLS':
      return a.largestShiftTarget || '';
    default:
      return '';
  }
}

export function webVitalsParams(metric: VitalsMetric, contentGroup: string): WebVitalsParams {
  const raw = metric.name === 'CLS' ? metric.value * 1000 : metric.value;
  const params: WebVitalsParams = {
    metric_name: metric.name,
    metric_value: Math.round(raw),
    metric_rating: metric.rating,
    metric_id: metric.id,
    content_group: contentGroup,
  };
  const target = debugTarget(metric).slice(0, GA4_PARAM_MAX);
  if (target) params.debug_target = target;
  return params;
}
