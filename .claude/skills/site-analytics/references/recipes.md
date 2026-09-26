# Recipes

Each recipe names the snapshot field to read first. Query GA4 only when the snapshot does not answer the question (another window, a single page, a weekly trend). The bodies are the arguments of analytics-mcp `run_report`, in snake_case protobuf names, and were run against property 523469938 on 2026-09-26.

Conventions:

- Every body carries the Humans filter (`ga4-schema.md`): country not in Singapore, China, (not set), AND `hostName` exactly `scrimbaguide.tech`. Extra conditions are appended to the same `and_group.expressions` list. Recipe 8a is the only exception.
- Relative dates (`28daysAgo`, `yesterday`) resolve in the property time zone, America/Los_Angeles. Never end a window on `today`: today is partial. A range whose start is after its end is a 400 (a `2026-09-26` start with `yesterday` as the end fails on 2026-09-26 itself).
- Two named `date_ranges` add a `dateRange` dimension to every row, with the names you gave.
- Affiliate clicks are `eventCount` with `eventName = affiliate_link_clicked`. Do not use `keyEvents:affiliate_link_clicked` for any window before 2026-09-26: the key event was marked that day and returns 0 for earlier data (epoch `affiliate_key_event`).
- An `eventName` filter also narrows `sessions` to sessions that had that event. Pull sessions and event counts in separate bodies, never in one.
- `landingPage` drops the trailing slash (`/docs/pricing/student-discount`); `pagePath` and `landingPagePlusQueryString` keep it. Append `/` to `landingPage` before joining to inventory routes.
- `customEvent:*` dimensions have data only from their registration day, 2026-09-26 for all eleven (GA4 does not backfill). Start custom-dimension windows on 2026-09-27, the first full LA day. The Realtime API rejects them.
- Rates are per 100 sessions and only at 30 or more sessions. Raw counts go beside every rate.

## 1. Page or cluster

Read first: `pages[]` (by `route`: `ga4`, `gsc`, `top_queries`, `outbound`) and `content_groups[]`.

Drill-down, sessions by landing page for one route prefix (replace the prefix, given without the trailing slash for `landingPage`):

```json
{
  "property_id": "523469938",
  "date_ranges": [
    {"start_date": "28daysAgo", "end_date": "yesterday", "name": "cur"},
    {"start_date": "56daysAgo", "end_date": "29daysAgo", "name": "prev"}
  ],
  "dimensions": ["landingPage"],
  "metrics": ["sessions", "engagedSessions", "totalUsers"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "landingPage", "string_filter": {"match_type": "FULL_REGEXP", "value": "^/docs/pricing(/.*)?$"}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "sessions"}, "desc": true}],
  "limit": 100
}
```

Affiliate clicks by the page they happened on, same prefix:

```json
{
  "property_id": "523469938",
  "date_ranges": [
    {"start_date": "28daysAgo", "end_date": "yesterday", "name": "cur"},
    {"start_date": "56daysAgo", "end_date": "29daysAgo", "name": "prev"}
  ],
  "dimensions": ["pagePath"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "affiliate_link_clicked"}}},
    {"filter": {"field_name": "pagePath", "string_filter": {"match_type": "BEGINS_WITH", "value": "/docs/pricing/"}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "eventCount"}, "desc": true}],
  "limit": 100
}
```

For a cluster, prefer the route prefix over the `contentGroup` dimension: `contentGroup` exists only from 2026-09-26, while the snapshot's `content_group` is computed from `src/utils/contentGroupRules.json` for every date.

## 2. Before/after

Read first: `annotations[]` for the change date, `epoch_warnings`, then the route's `pages[].ga4` (`prev_*` versus current).

Drill-down with explicit dates. Windows are equal length; "after" starts on deploy day + 4. List the changed routes in the `in_list_filter` (as `landingPage`, no trailing slash); run it a second time with the filter wrapped in `not_expression` for the control.

```json
{
  "property_id": "523469938",
  "date_ranges": [
    {"start_date": "BEFORE_START", "end_date": "BEFORE_END", "name": "before"},
    {"start_date": "AFTER_START", "end_date": "AFTER_END", "name": "after"}
  ],
  "dimensions": ["landingPage"],
  "metrics": ["sessions", "engagedSessions"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "landingPage", "in_list_filter": {"values": ["/docs/pricing/student-discount", "/docs/pricing/pro-vs-free"]}}}
  ]}},
  "limit": 1000
}
```

Clicks for the same routes and windows: the same body with `"dimensions": ["pagePath"]`, `"metrics": ["eventCount"]`, the `eventName = affiliate_link_clicked` expression appended, and the route list in `pagePath` form (with the trailing slash).

Difference-in-differences: rate = clicks per 100 sessions per window; DiD = (after - before) for the changed routes minus (after - before) for the control. Report both raw pairs.

## 3. Leaks

Read first: `leaks[]` (each has a `reason`: `low_aff_rate`, `outbound_leak`, `falling_impr`, `striking_distance`) and `pages[].outbound`.

Drill-down, non-Scrimba outbound clicks by page and domain:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  "dimensions": ["pagePath", "linkDomain"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "click"}}},
    {"filter": {"field_name": "outbound", "string_filter": {"match_type": "EXACT", "value": "true"}}},
    {"not_expression": {"filter": {"field_name": "linkDomain", "string_filter": {"match_type": "ENDS_WITH", "value": "scrimba.com"}}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "eventCount"}, "desc": true}],
  "limit": 200
}
```

`trk.udemy.com` rows are paid Udemy links, not leaks. Plain `udemy.com` rows are unmonetized Udemy links: a fix candidate, not a competitor leak.

## 4. AI traffic

Read first: `ai_sources[]` (per source, `is_copilot`, `top_landings`) and the AI rows of `channels[]`.

Drill-down, weekly trend by source:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "90daysAgo", "end_date": "yesterday"}],
  "dimensions": ["isoYearIsoWeek", "sessionSource"],
  "metrics": ["sessions", "engagedSessions"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "sessionSource", "string_filter": {"match_type": "PARTIAL_REGEXP", "value": "chatgpt|openai|claude\\.ai|perplexity|gemini|copilot|deepseek|grok|you\\.com|phind"}}}
  ]}},
  "order_bys": [{"dimension": {"dimension_name": "isoYearIsoWeek"}}],
  "limit": 1000
}
```

Affiliate clicks from AI sessions: same filter plus `eventName = affiliate_link_clicked`, `"dimensions": ["sessionSource", "landingPage"]`, `"metrics": ["eventCount"]`. Split out every source that matches `copilot`.

## 5. Bot-excluded baseline

Read first: `site` (`cur`, `prev`, `week`, `prev_week`) and `channels[]`.

Drill-down, site totals over four windows (sessions side):

```json
{
  "property_id": "523469938",
  "date_ranges": [
    {"start_date": "28daysAgo", "end_date": "yesterday", "name": "cur"},
    {"start_date": "56daysAgo", "end_date": "29daysAgo", "name": "prev"},
    {"start_date": "7daysAgo", "end_date": "yesterday", "name": "week"},
    {"start_date": "14daysAgo", "end_date": "8daysAgo", "name": "prev_week"}
  ],
  "dimensions": [],
  "metrics": ["sessions", "engagedSessions", "totalUsers", "screenPageViews"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}}
  ]}}
}
```

Channels: `"dimensions": ["sessionSource", "sessionMedium"]`, `"metrics": ["sessions", "engagedSessions"]`, one `cur` range, then map rows to business channels in the snapshot's order (AI regex, Copilot flagged; medium `organic`; social list, matched by host or subdomain, never substring — see `SOCIAL_SOURCES`; medium `referral`; `(direct)`; other). Never use the "Business channels" custom group as a table dimension (it returns 0 rows). `screenPageViews` before 2026-09-25 19:00 PT is inflated (epoch `page_view_dedupe`).

## 6. Placements (from 2026-10-24 only)

Read first: `placements[]` (`per_1000_views` is null under 30 carrier views) and `destinations[]`.

Before 2026-10-24 the answer is "not enough data yet: cta_type and the step 5 parameters started 2026-09-26; the analysis is due 2026-10-24".

Drill-down, clicks by placement:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "2026-09-27", "end_date": "yesterday"}],
  "dimensions": ["pagePath", "customEvent:cta_type", "customEvent:cta_location", "customEvent:destination_type"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "affiliate_link_clicked"}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "eventCount"}, "desc": true}],
  "limit": 1000
}
```

Carrier views (the denominator): same filter with `eventName = page_view` instead, `"dimensions": ["pagePath"]`, `"metrics": ["eventCount"]`. Rate = clicks per 1,000 views of the page that carries the CTA; compare a `cta_type` only against the same `cta_type` on pages of the same content group. Start on 2026-09-27, the first full LA day after registration.

## 7. Click reconciliation

Read first: `health.reconciliation` (`em_clicks_scrimba`, `aff_clicks_scrimba`, `ratio`, `explain_clicks`, `untracked_urls`).

Drill-down, Enhanced Measurement clicks to Scrimba by URL:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  "dimensions": ["linkUrl", "pagePath"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "click"}}},
    {"filter": {"field_name": "linkDomain", "string_filter": {"match_type": "ENDS_WITH", "value": "scrimba.com"}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "eventCount"}, "desc": true}],
  "limit": 500
}
```

Against it, Scrimba affiliate clicks: `eventName = affiliate_link_clicked` plus `{"not_expression": {"filter": {"field_name": "customEvent:destination_type", "string_filter": {"match_type": "EXACT", "value": "udemy"}}}}`, `"metrics": ["eventCount"]`, no dimensions. `/explain` URLs are plain by policy (`expected: true`); subtract them. Any other `linkUrl` with `?via=` missing is a link that bypasses `<AffiliateLink>`: name the page and propose the wrap.

## 8. Tracking health

Read first: `health` (thresholds live in `/site-health` routines; this skill reports them).

8a. Hosts, the one query without the Humans filter:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "7daysAgo", "end_date": "yesterday"}],
  "dimensions": ["hostName"],
  "metrics": ["screenPageViews"],
  "order_bys": [{"metric": {"metric_name": "screenPageViews"}, "desc": true}],
  "limit": 50
}
```

Any host other than `scrimbaguide.tech` after 2026-09-26 means the hostname guard in `plugins/analytics` leaks.

8b. Paths without a trailing slash (Humans filter on):

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "7daysAgo", "end_date": "yesterday"}],
  "dimensions": ["pagePath"],
  "metrics": ["screenPageViews"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"not_expression": {"filter": {"field_name": "pagePath", "string_filter": {"match_type": "FULL_REGEXP", "value": ".*/|.*\\..*"}}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "screenPageViews"}, "desc": true}],
  "limit": 100
}
```

8c. `(not set)` share of the step 5 parameters on affiliate clicks:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "7daysAgo", "end_date": "yesterday"}],
  "dimensions": ["contentGroup", "customEvent:cta_type", "customEvent:destination_type"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "affiliate_link_clicked"}}}
  ]}},
  "limit": 500
}
```

`cta_type` should never be `(not set)` (AffiliateLink falls back to `inline-<variant>`). `cta_location` is often `(not set)` on inline links by design; only money pages must carry it. `contentGroup` of `other` on a real route means `contentGroupRules.json` needs a rule (`health.content_group_other_routes`).

8d. Page Not Found: `health.not_found`. Drill-down: Humans filter plus `{"filter": {"field_name": "pageTitle", "string_filter": {"match_type": "BEGINS_WITH", "value": "Page Not Found"}}}`, `"dimensions": ["pagePath", "pageReferrer"]`, `"metrics": ["screenPageViews"]`. Page title works as an API filter even though the GA4 report builder does not offer it.

## 9. Scrimbassadors funnel

Read first: `affiliate.reconciliation.scrimba` (`days`, `ga4_aff_scrimba`, `visitors_delta`, `ratio`). `affiliate.reconciliation.landing_join` is not computed yet and always reads `null`; the per-page join below is manual. `affiliate.scrimba_affiliate` is `null` until `/site-health` has saved two readings.

- `ratio = visitors_delta / ga4_aff_scrimba` over the same LA dates. At or above 1 is expected (Scrimba counts every `?via=` visitor, adblock-proof, including the README and Discord). It should rise after `consent_v2` because GA4 observes fewer EEA/UK clicks.
- Below 0.8 means our clicks are losing `?via=`: run `python3 scripts/analytics/links.py --outbound` (ships with `/site-health`) and recipe 7.

Drill-down for the landing join, Scrimba clicks by day and destination slug:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "28daysAgo", "end_date": "yesterday"}],
  "dimensions": ["date", "customEvent:destination_slug", "customEvent:destination_type"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "affiliate_link_clicked"}}},
    {"not_expression": {"filter": {"field_name": "customEvent:destination_type", "string_filter": {"match_type": "EXACT", "value": "udemy"}}}}
  ]}},
  "order_bys": [{"dimension": {"dimension_name": "date"}}],
  "limit": 5000
}
```

Join to `secrets/ops/scrimbassadors-visitors-YYYY-MM.json` on (`date`, Scrimba landing page = `destination_slug`). It is approximate: never present it as per-page commission.

## 10. Udemy funnel

Read first: `affiliate.reconciliation.udemy` (`ga4_aff_udemy`, `impact_clicks`, `ratio`) and `affiliate.udemy_impact.per_link`. Below 0.7 means links are broken or not monetized.

Drill-down, Udemy affiliate clicks by page and link (from 2026-09-27):

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "2026-09-27", "end_date": "yesterday"}],
  "dimensions": ["pagePath", "customEvent:destination_slug", "customEvent:link_text"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "affiliate_link_clicked"}}},
    {"filter": {"field_name": "customEvent:destination_type", "string_filter": {"match_type": "EXACT", "value": "udemy"}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "eventCount"}, "desc": true}],
  "limit": 500
}
```

Before step 5, Udemy clicks are Enhanced Measurement `click` events: recipe 3's body with `linkDomain` in `["trk.udemy.com", "udemy.com"]` (`in_list_filter`) instead of the not-Scrimba condition.

## 11. Index state

Read first: `health.index` (`as_of`, `counts`, `changed`, `money_not_indexed`, `pending_recheck`) and `sources.url_inspection`.

Baseline (2026-09-23 inspection): 148 indexed, 61 crawled-not-indexed. Compare `counts` with it and with the previous file; a money page in `money_not_indexed` is the first thing to report. GA4 has nothing to add. A fresh inspection is `indexing.py inspect` (ships with `/site-health`); the scheduled re-check window is 2026-10-21 to 2026-11-04.

## 12. Cannibalization

Read first: `cannibalization[]` (queries with at least 50 impressions where 2 or more routes each hold at least 15%, one of them at position 20 or better). Cross-check `.seo-cache/redirects.json` before proposing a merge: if every qualifying route is the same redirect target, or a redirect source and its own target, the row is in `redirect_lag[]` instead — that pair already merged and just hasn't rolled off GSC's 90-day window yet.

Drill-down (no MCP; scratch script importing `gapi`), one query's pages over the GSC window:

```python
import sys; sys.path.insert(0, "scripts/analytics"); import gapi
sess = gapi.session(gapi.GSC)
rows = gapi.gsc_query(sess, "START", "END", ["query", "page"], row_limit=25000)
print([r for r in rows if r["keys"][0] == "QUERY"])
```

The underlying request body (POST `.../sites/sc-domain%3Ascrimbaguide.tech/searchAnalytics/query`):

```json
{"startDate": "START", "endDate": "END", "dimensions": ["query", "page"],
 "dimensionFilterGroups": [{"filters": [{"dimension": "query", "operator": "equals", "expression": "QUERY"}]}],
 "rowLimit": 25000}
```

No country filter, ever. END is today minus 3 days. A fix (merge, redirect, retitle) is a proposal for the owner, not an edit.

## 13. Search terms to content ideas

Read first: `search_terms[]` with `outcome` `no-results`, crossed with `gaps[]` (queries with at least 20 impressions where our best page sits below position 10).

Drill-down:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "2026-09-27", "end_date": "yesterday"}],
  "dimensions": ["searchTerm", "customEvent:search_outcome", "customEvent:search_ui"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "string_filter": {"match_type": "EXACT", "value": "search"}}}
  ]}},
  "order_bys": [{"metric": {"metric_name": "eventCount"}, "desc": true}],
  "limit": 500
}
```

A term that is `no-results` on site and also in `gaps` is the strongest content idea. Terms are lower-cased and cut to 100 characters by `trackSearch`; a term shorter than 3 characters is never sent. Before 2026-09-26 no `search` event exists.

## 14. Path Advisor drop-off

Read first: `advisor` (`starts`, `completes`, `scrimba_clicks`, `guide_clicks`, `by_step`, `by_path`).

Drill-down:

```json
{
  "property_id": "523469938",
  "date_ranges": [{"start_date": "2026-09-27", "end_date": "yesterday"}],
  "dimensions": ["eventName", "customEvent:advisor_step", "customEvent:recommended_path"],
  "metrics": ["eventCount"],
  "dimension_filter": {"and_group": {"expressions": [
    {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
    {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}},
    {"filter": {"field_name": "eventName", "in_list_filter": {"values": ["path_advisor_start", "path_advisor_step", "path_advisor_complete", "path_advisor_scrimba_click", "path_advisor_guide_click"]}}}
  ]}},
  "limit": 500
}
```

Funnel: start, step 1 to 4 (`advisor_step`), complete, then scrimba_click or guide_click. Advisor events before 2026-09-26 carry the old `step`/`value` params and show `(not set)` for `advisor_step`. The advisor's Scrimba buttons also send `affiliate_link_clicked` with `cta_type` `path-advisor`; count clicks from that event, not from `path_advisor_scrimba_click`, when comparing with other CTAs.
