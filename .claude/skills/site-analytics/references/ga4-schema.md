# GA4 schema as shipped

Property `properties/523469938`, stream `G-03WS2KR7EX`, time zone America/Los_Angeles. Step 5 shipped and deployed 2026-09-26 (PRs #111 and #112). The source of truth for the property, bot countries, hostname, AI regex, dimension registry and epochs is `scripts/analytics/tracking.json`; when this file and `tracking.json` disagree, `tracking.json` wins and this file gets fixed.

## Where events come from

- `plugins/analytics/index.js` emits one `<head>` script: Consent Mode v2 defaults (denied for the EEA, UK and Switzerland plus EU outer regions until the banner's Accept; analytics granted elsewhere; ad storage denied everywhere), a replay of the stored banner choice (`localStorage` key `sg-consent`), then `config` with `send_page_view:false` and the first `page_view` labelled with `content_group`. gtag.js loads only when `location.hostname` is `scrimbaguide.tech`.
- `plugins/analytics/client.js` sends SPA `page_view` on route change, with `content_group`.
- `content_group` rides at event scope on `page_view`, `affiliate_link_clicked`, `search`, every `path_advisor_*` event and `scrim_sandbox_run`. It is never set through `config` or `set`. Enhanced Measurement events (`click`, `scroll`, `session_start`, `first_visit`, `user_engagement`) carry none.
- `content_group` values come from `src/utils/contentGroupRules.json` (first match wins, path tested with a trailing slash): `home`, `blog-index`, `blog`, `course-hub`, `course`, `path`, `pricing`, `comparison`, `how-it-works`, `practice`, `roadmap`, `guide`, `faq-help`, else `other`. In reports it is the built-in `contentGroup` dimension.

## Events

| Event | Parameters | Fires when | Source |
|---|---|---|---|
| `page_view` | `content_group` | first load (head script) and every SPA route change | `plugins/analytics` |
| `affiliate_link_clicked` | `content_group`, `cta_type`, `destination_type`, `destination_slug`, `link_text`, `cta_location` (only when the `location` prop is set) | click on any `<AffiliateLink>`, or `trackAffiliateClick()` from a monetised link with its own markup (ComparisonTable) | `src/components/AffiliateLink.tsx` |
| `search` | `content_group`, `search_term`, `search_outcome` (`results`, `no-results`), `search_ui` (`modal`, `page`) | a query settles for 1.5 s, lower-cased, cut to 100 chars; skipped under 3 chars or when equal to the last tracked term | `src/utils/trackSearch.ts` |
| `path_advisor_start` | `content_group`, `event_category: path_advisor` | first answer | `src/components/PathAdvisor.tsx` |
| `path_advisor_step` | + `advisor_step` (1 to 4), `advisor_field` (`experience`, `goal`, `hours`, `situation`), `advisor_answer` | each answer | same |
| `path_advisor_complete` | + `recommended_path`, `secondary_path`, `cta_emphasis` | result shown, once per completion | same |
| `path_advisor_guide_click` | + `recommended_path`, `link` (`primary`, `secondary`) | click to our path guide | same |
| `path_advisor_scrimba_click` | + `type` (`free`, `pro`) | click on the result's Scrimba button; the same click also sends `affiliate_link_clicked` with `cta_type` `path-advisor` | same |
| `scrim_sandbox_run` | `content_group` | Run in the homepage sandbox | `src/components/ScrimSandbox.tsx` |
| `click` (Enhanced Measurement) | built-in `linkUrl`, `linkDomain`, `outbound` | any outbound link | GA4 automatic |

`secondary_path`, `cta_emphasis`, `link`, `type` and `event_category` are not registered as dimensions. `faq_open`, `sticky_dismiss` and `faq_question` were designed but not shipped. Before 2026-09-26 the advisor sent `step`/`field`/`value` (a string in `value`, which GA4 reserves for numbers); those rows read `(not set)` for the new dimensions.

### `cta_type` (closed list)

`sticky`, `pricing-cta`, `course-card`, `verdict-box`, `comparison-table`, `scrim-poster`, `code-preview`, `lightbox`, `path-advisor`, `calculator`, and the fallback `inline-<variant>` for plain MDX links (`inline-text`, `inline-button`, `inline-card`). Wrapping components pass their own `ctaType`; `(not set)` should never appear.

`cta_location` is free-form (about 180 values, prefixes such as `inline-`, `roundup-table-`, `sources-`, `rating-`). Inline links without `location` stay `(not set)` by design; money pages (`src/utils/moneyPagePaths.ts`) set it on every link.

### `destination_type` and `destination_slug`

From `src/utils/affiliateDestination.ts`. `destination_slug` is the first path segment of the destination URL, so `?via=` never reaches GA.

| `destination_type` | Rule |
|---|---|
| `udemy` | host `udemy.com` or any subdomain (`trk.udemy.com`) |
| `docs` | host `docs.scrimba.com` |
| `demo` | scrimba.com slug `s0v687325e` |
| `pricing` | slug contains `pricing`, or the query contains `pricing` (`/home?pricing`) |
| `home` | empty slug or `home` |
| `path` / `course` | slug ends in `-c0<id>`; `path` when it contains `-path-` |
| `instructor` | slug starts with `@` or matches `u0<id>` |
| `course` | legacy `/learn/<course>/` (slug is the second segment) |
| `catalog` | `allcourses`, `learn`, `topics` |
| `other` | anything else, including non-Scrimba hosts |

Scrimba clicks are every `destination_type` except `udemy`.

## Custom dimensions

Eleven event-scoped dimensions, all registered 2026-09-26 (listed with dates in `tracking.json` `custom_dimensions`): `cta_location`, `cta_type`, `destination_type`, `destination_slug`, `link_text`, `advisor_step`, `advisor_field`, `advisor_answer`, `recommended_path`, `search_outcome`, `search_ui`. Query them as `customEvent:<parameter>`. No backfill: nothing before 2026-09-26. `search_term` and `content_group` are built in (`searchTerm`, `contentGroup`). No custom metrics. `python3 scripts/analytics/ga4admin.py dims check` compares the registry with GA4 (exit 3 when some are missing).

The property also has the custom channel group "Business channels" (`sessionCustomChannelGroup:15847375853`). Do not use it as a table dimension (bug below).

## Key event

Exactly one: `affiliate_link_clicked`, marked 2026-09-26. `keyEvents:affiliate_link_clicked` is 0 for every earlier date (checked 2026-09-26: 137 events, 0 key events over 28 days). For any window before 2026-09-26, count `eventCount` with `eventName = affiliate_link_clicked`. Micro-conversions (advisor completes, searches) are watched as plain event counts and never marked.

## Humans filter

Every GA4 query except the host health check carries it. Values from `tracking.json` (`bot_countries`, `hostname`). analytics-mcp `run_report` form (snake_case):

```json
{"and_group": {"expressions": [
  {"not_expression": {"filter": {"field_name": "country", "in_list_filter": {"values": ["Singapore", "China", "(not set)"]}}}},
  {"filter": {"field_name": "hostName", "string_filter": {"match_type": "EXACT", "value": "scrimbaguide.tech"}}}
]}}
```

The REST form used by `gapi.humans_filter()` is the same tree in camelCase (`andGroup`, `notExpression`, `fieldName`, `inListFilter`, `stringFilter`, `matchType`). Add conditions by appending to `expressions`. The GA4 UI equivalents are the saved comparison "Humans" and the Explore segment "Humans".

Why: Singapore "Direct" is bots (1,016 blog landing sessions, 21 engaged, 2026-06-26 to 09-25), China and `(not set)` behave the same, and 126 page views came from localhost before the hostname guard.

## AI traffic

The regex is `tracking.json` `ai_source_regex`, matched on `sessionSource` (`PARTIAL_REGEXP`). Copilot (`copilot_regex`) is always reported on its own line: its bounce rate was 84% and it would drag any blended AI conversion rate.

**Classifier gap (checked 2026-09-26, 2026-06-28 to 2026-09-25, Humans filter).** The regex and GA4's default channel "AI Assistant" together found 657 sessions. The default group labelled 638 of them "AI Assistant". The regex caught 19 more that GA4 put elsewhere: `perplexity` 8, `gemini` 5 and `copilot.com` 4 as Unassigned, `chatgpt.com` 1 as Referral and 1 as Unassigned. No session labelled "AI Assistant" fell outside the regex. So the regex is a superset (about 3% more) and stays authoritative; the default group undercounts tagged sources (`utm_source=perplexity`, `gemini`) that have no medium.

## Epochs

Listed in `tracking.json` `epochs` and copied into every snapshot; `snapshot.epoch_warnings` names the ones a window crosses. As of 2026-09-26 all are live except `internal_traffic_filter` (pending, owner step): `page_view_dedupe` (2026-09-25, page views before 19:00 PT inflated), `cta_location`, `affiliate_key_event`, `udemy_affiliate`, `analytics_step5` and `consent_v2` (all 2026-09-26). `consent_v2` lowers observed EEA/UK numbers from its date; never "recover" them by removing the banner. A tracking PR adds its own epoch and dimensions to `tracking.json` in the same PR.

## Known GA4 bugs and limits

- "Business channels" returns 0 rows as a table or bar dimension; time series works. Compute business channels from `sessionSource`/`sessionMedium` (the snapshot does).
- Link domain and Page title are not offered as report-level filters in the UI report builder. The Data API accepts both (`linkDomain`, `pageTitle`).
- No scheduled email can be created in this property; the only email is a one-time PDF.
- The Realtime API rejects `customEvent:*` dimensions.
- `landingPage` drops the trailing slash; `pagePath` keeps it. `searchTerm` is an empty string (not `(not set)`) on non-search events.
- Enhanced Measurement `view_search_results` is unreliable here (SPA navigation to `/search/`); use the `search` event.
- Data API quota errors are per property per hour; batch with `batchRunReports` (5 per call) in scripts.
