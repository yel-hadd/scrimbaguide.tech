export const meta = {
  name: 'daily-post',
  description: 'Pick one top-of-funnel topic on a technology Scrimba teaches (own post, learner hub or refresh), check demand and SERP winnability, draft, fact-check, wire links; returns a PR-ready summary',
  whenToUse: 'Run through /daily-post after scripts/analytics/snapshot.py has refreshed .seo-cache/. args: {date: "YYYY-MM-DD" (from `date +%F`, never from memory; every window and year in the prompts derives from it), branch: "content/daily-YYYY-MM-DD", topic?: "optional seed", pending_files?: string[] (files in open content/daily-* PRs), chrome?: boolean (default true; false skips the Scrimba lens and Google Trends), followups_due?: [{followup_date, topic, primary_source}] (entries of .seo-cache/followups.json whose date has come), snapshot_generated_at?: "generated_at of .seo-cache/analytics-snapshot.json, echoed in the return value"}',
  phases: [
    { title: 'Research', detail: 'GSC, catalog-technology releases and errors, AI tools + hiring + seasonal calendar, community, live Scrimba catalog via Chrome (Sonnet)' },
    { title: 'Select', detail: 'shortlist by top-of-funnel value, then pick one shape (own post, hub, refresh) or skip (Opus)' },
    { title: 'Demand', detail: 'Google Trends in Chrome and SERP winnability via WebSearch, in parallel (Sonnet)' },
    { title: 'Guard', detail: 'adversarial cannibalization and shape check (Sonnet)' },
    { title: 'Draft', detail: 'write or refresh the post (Sonnet)' },
    { title: 'Verify', detail: 'web fact-check and house-rules critic in parallel, then fix (Sonnet)' },
    { title: 'Wire', detail: 'relatedGuidesMap entry and inbound in-prose links (Sonnet)' },
  ],
}

const A = args || {}
if (!A.date || !A.branch) throw new Error('args.date and args.branch are required')
if (!/^\d{4}-\d{2}-\d{2}$/.test(A.date) || isNaN(new Date(`${A.date}T00:00:00Z`))) throw new Error(`args.date must be YYYY-MM-DD, got ${A.date}`)

// Every date-relative instruction derives from args.date. Agents' training data ends before today, so they must be told the
// date, the year and the absolute research window, or they search for stale versions and write stale years.
const TODAY = new Date(`${A.date}T00:00:00Z`)
const iso = (d) => d.toISOString().slice(0, 10)
const daysAgo = (n) => iso(new Date(TODAY.getTime() - n * 86400000))
const YEAR = TODAY.getUTCFullYear()
const MONTH = TODAY.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
const WEEKDAY = TODAY.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' })
const daysAhead = (n) => iso(new Date(TODAY.getTime() + n * 86400000))
const WIN = { d7: daysAgo(7), d14: daysAgo(14), d30: daysAgo(30), ahead3: daysAhead(3), ahead21: daysAhead(21), ahead35: daysAhead(35) }
const DATE_RULES = `Date awareness: today is ${WEEKDAY} ${A.date} (${MONTH} ${YEAR}). Your training data ends before today, so what you remember as the latest version, release, model, report or course is probably out of date: confirm "latest" or "current" on the official source as of ${A.date} before using it. Put the month and year in time-sensitive searches (e.g. "Next.js release ${MONTH} ${YEAR}", "React security advisory ${YEAR}"). Research window for news: ${WIN.d30} to ${A.date}; "recent" means on or after ${WIN.d14}. Write every date as an absolute YYYY-MM-DD (from the source, or "undated"), never "last week", "recently" or "this year". The current year is ${YEAR}: a title, slug or description carrying another year is stale unless the topic is historical.`
const CHROME = A.chrome !== false
const PENDING = Array.isArray(A.pending_files) ? A.pending_files : []
const PENDING_NOTE = PENDING.length ? `\nFiles already in open daily PRs (treat their topics as covered; never pick, refresh or edit them): ${JSON.stringify(PENDING)}` : ''
const LOCK = `Chrome lock: before your first Chrome call, conditionally acquire it (never overwrite an unexpired lock someone else holds): run \`f=.seo-cache/chrome.lock; if [ -e $f ] && [ $(( $(date +%s)-$(stat -c %Y $f) )) -lt 3600 ] && ! grep -q '^daily-post' $f; then echo HELD; else echo "daily-post $(date -Is)" > $f; fi\`. If that prints HELD, the lock is held by someone else: make no Chrome calls this phase and report empty candidates (research/scrimba lens) or notes "trends-unavailable (chrome lock held)" (Trends lens) instead. Otherwise you now hold it; when you finish (success, captcha or error) release it only if it is still yours: \`grep -q '^daily-post' .seo-cache/chrome.lock 2>/dev/null && rm -f .seo-cache/chrome.lock\`.`

// Recurring news streams live on one learner hub each (year-free slug, newest-first dated log) instead of one post per event.
// hub-new may only seed a route from this list; the two existing files are grown in place.
const HUBS = [
  { stream: 'React releases, deprecations and upgrade errors', route: '/blog/react-updates-for-learners/', slug: 'react-updates-for-learners', file: 'blog/2026-09-28-react-updates-for-learners.mdx' },
  { stream: 'Next.js releases, Turbopack/upgrade errors, one-paragraph security notes', route: '/blog/nextjs-updates-for-learners/', slug: 'nextjs-updates-for-learners', file: null },
  { stream: 'AI coding tools and model launches from a learner view', route: '/blog/ai-tools-for-learning-to-code-2026/', file: 'blog/2026-04-01-ai-tools-for-learning-to-code-2026.mdx' },
  { stream: 'Junior developer hiring, layoffs and developer-survey data', route: '/blog/junior-developer-job-market-2026/', file: 'blog/2026-01-31-junior-developer-job-market-2026.mdx' },
]
const HUB_NOTE = `Learner hubs (recurring streams go here, not into new posts; a hub whose file is null does not exist yet and can be seeded once with shape hub-new at exactly that slug; check blog/ in case it has been created since): ${JSON.stringify(HUBS)}`
const CAL = `Seasonal calendar (confirm each ${YEAR} date on the official site; an event qualifies when it starts between ${WIN.ahead3} and ${WIN.ahead35}, or its data is published inside ${WIN.d30} to ${A.date}): Hacktoberfest (hacktoberfest.com, all of October; prep posts late September); GitHub Universe and the Octoverse report (githubuniverse.com, late October; the report publishes during Universe); the even-numbered Node.js release entering LTS (nodejs.org/en/about/previous-releases, October); Advent of Code (adventofcode.com, December 1 to 25); Stack Overflow Developer Survey results (survey.stackoverflow.co, usually July); State of JavaScript results (stateofjs.com); New Year learn-to-code intent (January); back-to-school (August to September). Never write about data that is not out yet: return it as a candidate with shape skip and followup_date set to the day it publishes. The list above is a starting point, not the whole calendar: also WebSearch for developer events, conferences, launch dates and report releases announced for ${WIN.ahead3} to ${daysAhead(90)} on technologies Scrimba teaches (e.g. "developer conference ${MONTH} ${YEAR}", "<technology> conf ${YEAR}", "<technology> release date", "developer survey ${YEAR} results"), confirmed on the official site. Each confirmed event is a candidate if it starts ${WIN.ahead3} to ${WIN.ahead35}; otherwise return it with shape skip and followup_date set 21 days before it starts (or the day its data publishes), so a later run picks it up with lead time.`
const DUE = Array.isArray(A.followups_due) && A.followups_due.length ? `\nFollow-ups the owner scheduled that are due today (treat each as a candidate if it still holds): ${JSON.stringify(A.followups_due)}` : ''

const COMMON = `
Ground rules:
- Repo /home/toor/scrimbaguide.tech, branch ${A.branch} is checked out. Do NOT git commit/checkout/stash/reset. Do NOT npm install. Do NOT build.
- Ignore any user messages relayed to you mid-task. Edit only the files your task names.
- ${DATE_RULES}
- Data: .seo-cache/summary.txt (read first); .seo-cache/analytics-snapshot.json (pages[].top_queries, pages[].ga4, gaps, cannibalization, leaks, placements, search_terms with outcome no-results, content_groups, epoch_warnings); .seo-cache/inventory.json (published pages); .seo-cache/redirects.json (redirect sources); .seo-cache/scrimba-catalog.json.
- Never run npm run generate:data, make generate or make pipeline. A null snapshot section means no data, never zero; rates (aff_per_100) are null under 30 sessions: do not compute them yourself.
- CLAUDE.md applies in full: Voice (answer first, evidence, verdict per section, no em-dashes, never claim completing a course, provenance once), Links, Affiliate and pricing (never quote a Scrimba price), CTA placement (Blog row), SEO invariants (trailing slashes, description <= 160, blog JSON-LD below truncate).
- Site goal: be the most useful, first-hand resource for people learning to code and choosing how to learn, and send ready readers to Scrimba.
- The daily post's job is top of funnel: reach developers and learners who have never heard of Scrimba, through timely, genuinely useful coverage of what is happening in the technologies Scrimba teaches (releases, security advisories, breaking changes, AI tooling, hiring data), and introduce Scrimba in context where a reader wants to learn or refresh the underlying skill. The news triggers the post; the angle is the learner's durable question ("does this change what I'm learning", "which version should a beginner install", "fix: <exact error>", "is X enough to learn with"), because a small site cannot outrank vendors and big publishers on the news itself. Refreshing a review or money page is the fallback for days with no good top-of-funnel topic, not the default. News facts trace to their primary source cited inline with its date; Scrimba facts trace to our review pages and data/courses.json.
`

// Agents sometimes return absolute paths; every file path used as a key or passed on is repo-relative.
const rel = (p) => (p || '').replace(/^.*?scrimbaguide\.tech\//, '').replace(/^\.\//, '')

// ---------------- RESEARCH ----------------
phase('Research')
const seed = (A.topic ? `\nThe owner seeded this run with: "${A.topic}". Include it as a candidate if it survives your checks.` : '') + DUE
const BRIDGE_RULE = `Every candidate needs a scrimba_bridge and a relevance tier, from .seo-cache/scrimba-catalog.json (name, url, review route, teaches, modules): direct = a catalog course teaches the affected technology or skill; adjacent = a course teaches a neighbouring skill; distant = only a path fits the reader's broader goal; none = nothing fits (the topic is dropped). Give review_route. Also give family (F1 is-my-course-still-current after a release, F2 AI and learning to code, F3 how-to on a trending tool, F4 error after an upgrade, F5 security advisory, F6 hiring and market data, F7 seasonal event, bofu = review, comparison or money-page refresh) and shape: own-post (a learner question with its own query, distinct from any hub's), hub-new or hub-update (a recurring stream, see the hub list), refresh (an existing post that is not a hub), or skip (a spike whose only reader action is "bump a dependency", or data not out yet). ${HUB_NOTE}`
const lenses = [
  { key: 'gsc', prompt: `Mine .seo-cache/analytics-snapshot.json and summary.txt. Inputs: gaps, pages[].top_queries, pages[].gsc, cannibalization, leaks (grouped by reason: striking_distance, falling_impr, low_aff_rate, outbound_leak), and search_terms whose outcome is "no-results" (on-site searches we cannot answer). Find (a) non-brand query gaps (no "scrimba" in the query) with real impressions where our best page ranks below 10 or its intent does not match, (b) top-of-funnel posts (career, AI, learning, tools) ranking 8 to 20 or with falling impressions, and each blog post already ranking 20 or better for a learner-news query (release, error, hiring, AI-tool question): these are hub-update or refresh candidates, (c) at most two bottom-of-funnel candidates (family bofu): the best striking_distance or low_aff_rate review or money page, kept as the fallback, (d) no-results search terms with durable demand. Give numbers.` },
  { key: 'releases', prompt: `Find what shipped, broke or changed between ${WIN.d30} and ${A.date} in the technologies Scrimba teaches. Build the watch list from .seo-cache/scrimba-catalog.json: the distinct teaches[] and topics[] values and the libraries or APIs named in modules[] (e.g. React, Next.js, Node.js, Express, TypeScript, Tailwind, Vite, SQL/Supabase, OpenAI and Anthropic APIs, Vercel AI SDK, MCP). For each: (1) releases and deprecations (GitHub releases, the official blog or changelog, npm version history); (2) the error messages learners hit after that release (search the exact error string with "${MONTH} ${YEAR}"; GitHub issues on the project and its docs repo are evidence); (3) security advisories (GitHub Security Advisories for the repo, nodejs.org/en/blog/vulnerability), reported only as shape hub-update (a dated note in the technology's hub) or as an evergreen "how to stay safe" angle, never as their own post. Prefer the learner angle over the news: "does X change what my course teaches", "which version should a beginner install", "fix: <exact error>". An item older than ${WIN.d30} qualifies only as shelf_life evergreen with a dated development inside the window, or a spec or major-version change learners still search for. For each candidate: event_date, primary_source (the official advisory, changelog or release notes, never a news article), shelf_life.` },
  { key: 'ai-market-calendar', prompt: `Three sources. (1) AI coding tools and model launches developers learn with, dated ${WIN.d30} to ${A.date} (Claude, OpenAI, Gemini, Cursor, Copilot, Claude Code, the MCP spec, Vercel AI SDK), framed as a learner question ("is the free tier enough to learn", "does this change whether I should learn to code"). A launch is a hook for a hub-update or refresh of an existing post (grep blog/ for AI, vibe coding, learn to code), not a new post, unless it opens a question no post answers. (2) Hiring and market reports published in the window (Indeed Hiring Lab, layoffs.fyi milestones, Handshake, developer surveys): always shape hub-update into the junior hiring hub unless another existing post is the literal fit. (3) ${CAL} For each candidate: event_date, primary_source (official page), shelf_life (seasonal for calendar events).` },
  { key: 'community', prompt: `What are people learning to code, switching careers, or early in their developer careers asking between ${WIN.d30} and ${A.date}? WebSearch Reddit (r/learnprogramming, r/cscareerquestions, r/webdev, r/learnjavascript, r/reactjs, r/nextjs, r/Python), Hacker News, dev.to, the Stack Overflow blog. Look for repeated questions and frustrations on technologies Scrimba teaches, with durable search demand. Thread URLs and dates as evidence; event_date is the date of the development that set the question off, or "evergreen".` },
  { key: 'scrimba', prompt: `What is new or changed at Scrimba that people will search for, and which catalog facts in our data are stale? Load the scrimba-browsing skill and use Chrome with the owner's logged-in Pro account to read the live course catalog and the four path pages on scrimba.com (course list, new courses, updated modules, new features such as Explain). Compare against .seo-cache/scrimba-catalog.json and docs/changelog.mdx. Also check Scrimba's public blog/roadmap for announcements (plain links only, never affiliate). Report (1) candidates (new course reviews belong in docs/courses/** and are out of scope here: propose learner guides for the topic a new course teaches instead), and (2) every stale fact you saw in the top-level catalog_drift array as {slug, course, field, ours, live} (slug = our course slug from scrimba-catalog.json), never as a candidate, so the owner can run a catalog update as a separate PR. Chrome is shared: you are the only agent using it in this phase; close tabs you open. ${LOCK}` },
].filter(l => CHROME || l.key !== 'scrimba')
// Carried from research through shortlist and brief, so Demand, Pick, Guard and Draft all see them as data.
const NEWS_FIELDS = {
  event_date: { type: 'string', description: 'YYYY-MM-DD of the release, advisory, report, event start or thread that makes this timely; "evergreen" when nothing dated drives it' },
  shelf_life: { type: 'string', enum: ['spike', 'months', 'evergreen', 'seasonal'], description: 'spike: searched for days; months: until the next major version or report; evergreen: no expiry; seasonal: a yearly event' },
  primary_source: { type: 'string', description: 'official URL (advisory, changelog, release notes, report, event site)' },
  family: { type: 'string', enum: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'bofu'] },
  shape: { type: 'string', enum: ['own-post', 'hub-new', 'hub-update', 'refresh', 'skip'] },
  hub: { type: 'string', description: 'hub route (hub-new) or file (hub-update)' },
  relevance: { type: 'string', enum: ['direct', 'adjacent', 'distant', 'none'] },
  review_route: { type: 'string', description: 'our review route for the bridged course or path' },
}
const CANDS = {
  type: 'object',
  properties: {
    candidates: { type: 'array', items: { type: 'object', properties: {
      topic: { type: 'string' }, target_query: { type: 'string' }, intent: { type: 'string' },
      evidence: { type: 'string', description: 'GSC numbers, URLs with dates, or observed AI answers' },
      stage: { type: 'string', enum: ['awareness', 'consideration', 'decision', 'implementation'] },
      kind: { type: 'string', enum: ['new', 'refresh'] }, refresh_route: { type: 'string' },
      scrimba_bridge: { type: 'string' },
      ...NEWS_FIELDS,
      followup_date: { type: 'string', description: 'YYYY-MM-DD when the data or event this depends on is published (shape skip only)' },
    }, required: ['topic', 'target_query', 'intent', 'evidence', 'stage', 'kind', 'scrimba_bridge', 'event_date', 'shelf_life', 'family', 'shape', 'relevance'] } },
    catalog_drift: { type: 'array', items: { type: 'object', properties: {
      slug: { type: 'string' }, course: { type: 'string' }, field: { type: 'string' }, ours: { type: 'string' }, live: { type: 'string' },
    }, required: ['slug', 'course', 'field', 'ours', 'live'] } },
  },
  required: ['candidates'],
}
if (!CHROME) log('chrome=false: Scrimba lens and Google Trends skipped')
const found = await parallel(lenses.map(l => () => agent(`${COMMON}
Task (report only, edit nothing): propose up to 6 content candidates through the ${l.key} lens.
${l.prompt}
${BRIDGE_RULE}${seed}
Skip anything the inventory already covers with the same intent (titles, descriptions and H2s in .seo-cache/inventory.json; grep blog/ and docs/ for the key phrase); a covered topic can come back only as kind "refresh" of that page. A redirect source in .seo-cache/redirects.json never comes back.${PENDING_NOTE}`, { label: `research:${l.key}`, phase: 'Research', model: 'sonnet', schema: CANDS })))
const all = found.filter(Boolean).flatMap(f => f.candidates || [])
// Drift rows in the catalog-diff.mjs format [{slug, course, field, ours, live}]; the skill writes .seo-cache/drift-<date>.json.
const drift = found.filter(Boolean).flatMap(f => f.catalog_drift || [])
const ISO = /^\d{4}-\d{2}-\d{2}$/
const followups = all.filter(c => ISO.test(c.followup_date || '') && c.followup_date > A.date)
  .map(c => ({ followup_date: c.followup_date, topic: c.topic, primary_source: c.primary_source || '' }))
// Deterministic drops, logged so nothing disappears silently.
const dropWhy = (c) => {
  if (/CATALOG DRIFT/i.test(c.topic)) return 'drift row'
  if (c.shape === 'skip') return 'shape skip'
  if (c.relevance === 'none' && c.family !== 'bofu') return 'no Scrimba relevance'
  const dated = ISO.test(c.event_date || '')
  if (!dated && c.event_date !== 'evergreen') return `bad event_date ${c.event_date}`
  if (!dated && c.shelf_life !== 'evergreen') return `timely claim without a date (${c.shelf_life})`
  if (dated && c.shelf_life === 'spike' && c.event_date < WIN.d14) return `spike older than ${WIN.d14}`
  if (dated && c.shelf_life === 'seasonal' && c.event_date > A.date && (c.event_date < WIN.ahead3 || c.event_date > WIN.ahead35)) return `seasonal event outside ${WIN.ahead3} to ${WIN.ahead35}`
  if (dated && c.event_date > WIN.ahead35) return 'event too far ahead'
  return null
}
const dropped = all.map(c => ({ c, why: dropWhy(c) })).filter(x => x.why)
if (dropped.length) log(`dropped ${dropped.length}: ${dropped.map(x => `${x.c.topic} [${x.why}]`).join('; ')}`)
const candidates = all.filter(c => !dropWhy(c))
log(`${candidates.length} candidates from ${found.filter(Boolean).length} lenses; ${followups.length} follow-ups; ${drift.length ? `${drift.length} catalog drift rows` : 'no catalog drift reported'}`)
// Radar: every dated candidate that survived the filters, soonest deadline first, so each run shows what is coming even
// when it picks something else. An upcoming event must be published 2 days before it starts; a past one within 14 (spike), 45 (months) or 90 days.
const radar = candidates.filter(c => ISO.test(c.event_date || ''))
  .map(c => ({ topic: c.topic, target_query: c.target_query, event_date: c.event_date, shelf_life: c.shelf_life, shape: c.shape, relevance: c.relevance, primary_source: c.primary_source || '',
    publish_by: c.event_date > A.date ? iso(new Date(new Date(`${c.event_date}T00:00:00Z`).getTime() - 2 * 86400000)) : iso(new Date(new Date(`${c.event_date}T00:00:00Z`).getTime() + ({ spike: 14, months: 45 }[c.shelf_life] || 90) * 86400000)) }))
  .sort((x, y) => x.publish_by.localeCompare(y.publish_by)).slice(0, 10)
const base = { date: A.date, window: WIN, chrome: CHROME, drift, followups, radar, snapshot_generated_at: A.snapshot_generated_at || null }
if (!candidates.length) return { outcome: 'skip', reason: 'no candidates found', ...base }

// ---------------- SHORTLIST → TRENDS ----------------
phase('Select')
const SHORT = { type: 'object', properties: {
  shortlist: { type: 'array', items: { type: 'object', properties: {
    topic: { type: 'string' }, target_query: { type: 'string' }, alt_queries: { type: 'array', items: { type: 'string' } },
    kind: { type: 'string', enum: ['new', 'refresh'] }, refresh_route: { type: 'string' }, scrimba_bridge: { type: 'string' },
    ...NEWS_FIELDS,
    score: { type: 'number' }, why: { type: 'string' },
  }, required: ['topic', 'target_query', 'alt_queries', 'kind', 'scrimba_bridge', 'event_date', 'shelf_life', 'family', 'shape', 'relevance', 'score', 'why'] } },
}, required: ['shortlist'] }
const short = await agent(`${COMMON}
Task (report only): score and shortlist the best 5 candidates.
Candidates: ${JSON.stringify(candidates, null, 1)}
Score 0 to 100 for top-of-funnel value: learner demand 30 (event reach and technology adoption; for events on or after ${WIN.d14}, coverage and thread volume stand in for GSC, which cannot have data yet), angle and usefulness 20 (a learner question the current results do not answer: what changed with its date, does it affect what they are learning, exact steps), durability 15 (evergreen 15, months 10, seasonal 10 when the event starts ${WIN.ahead3} to ${WIN.ahead21}, spike 0), Scrimba relevance 15 (direct 15, adjacent 9, distant 4), consolidation 10 (hub-update into a page already ranking 20 or better 10, hub-new 6, own-post or refresh 4), resources 10 (primary source plus first-hand review evidence). A needed web fact-check is not a penalty; Verify always runs one. SERP winnability is checked next and can veto.
Shape rules: F5 (security) only as hub-update or an evergreen safety guide; F6 (hiring data) only as hub-update or refresh; F2 new posts only when no existing post answers the question. Family bofu candidates are the fallback: shortlist the best one only if no top-of-funnel candidate scores 55 or more. When a timely direct-relevance candidate exists, keep at least one. Read the last 10 files in blog/ (tags and slugs) and avoid a third consecutive post in the same family. Merge near-duplicates. For each, list 2 to 4 alternative phrasings of the target query, including the literal string a learner types (exact error text, "for beginners", "is X enough to learn").`, { label: 'shortlist', phase: 'Select', schema: SHORT })
if (!short || !short.shortlist.length) return { outcome: 'skip', reason: 'nothing scored high enough', candidates: candidates, ...base }

// ---------------- DEMAND: Trends (Chrome) and SERP (WebSearch) in parallel ----------------
phase('Demand')
const TR = { type: 'object', properties: {
  results: { type: 'array', items: { type: 'object', properties: {
    target_query: { type: 'string' }, best_phrasing: { type: 'string' },
    direction: { type: 'string', enum: ['rising', 'stable', 'declining', 'seasonal', 'too-low', 'too-low-new'] },
    peak_week: { type: 'string', description: 'seasonal items: the week the yearly peak usually falls' },
    rising_related: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' },
  }, required: ['target_query', 'best_phrasing', 'direction', 'rising_related', 'notes'] } },
}, required: ['results'] }
const SERP = { type: 'object', properties: {
  results: { type: 'array', items: { type: 'object', properties: {
    target_query: { type: 'string' }, better_phrasing: { type: 'string' },
    top_results: { type: 'array', items: { type: 'object', properties: {
      domain: { type: 'string' }, kind: { type: 'string', enum: ['official', 'vendor', 'big-publisher', 'security-press', 'small-blog', 'forum', 'video', 'ours'] },
    }, required: ['domain', 'kind'] } },
    small_site_present: { type: 'boolean' }, ai_overview: { type: 'boolean' }, our_rank: { type: 'string' },
    gap: { type: 'string' }, winnability: { type: 'string', enum: ['high', 'medium', 'low'] },
  }, required: ['target_query', 'better_phrasing', 'top_results', 'small_site_present', 'gap', 'winnability'] } },
}, required: ['results'] }
const demandItems = short.shortlist.map(s => ({ target_query: s.target_query, alt_queries: s.alt_queries, event_date: s.event_date, shelf_life: s.shelf_life }))
const [trends, serp] = await parallel([
  () => !CHROME
    ? Promise.resolve({ results: short.shortlist.map(s => ({ target_query: s.target_query, best_phrasing: s.target_query, direction: 'stable', rising_related: [], notes: 'trends-unavailable (chrome=false); weigh SERP and GSC evidence instead' })) })
    : agent(`${COMMON}
Task (report only): validate demand with Google Trends in Chrome (load the claude-in-chrome skill; create your own tab; close it when done; you are the only agent using Chrome now). ${LOCK}
For each item open https://trends.google.com/trends/explore?date=<range>&q=<up to 5 comma-separated phrasings, URL-encoded> (worldwide; then geo=US if worldwide is flat), choosing the range by the item's event_date and shelf_life: evergreen or months with an older event, today%2012-m; an event dated on or after ${WIN.d30}, today%201-m, where too-low is expected for a term that did not exist until the event (report direction too-low-new; it is not a drop reason); seasonal, today%205-y, and report peak_week. Read the interest-over-time shape and the Related queries "Rising" list (read_page/get_page_text; screenshots only if needed). Report the best phrasing, direction, and rising related queries that are learner questions (H2 candidates). If Trends blocks automation (captcha or "unusual traffic"), stop immediately and report notes "trends-unavailable" for every item; never try to solve a captcha.
Items: ${JSON.stringify(demandItems, null, 1)}`, { label: 'trends', phase: 'Demand', model: 'sonnet', schema: TR }),
  () => agent(`${COMMON}
Task (report only): SERP winnability for a small, young review site (scrimbaguide.tech). For each item, WebSearch the target query and each alt query, adding "${YEAR}" where the query is time-sensitive. Classify the top 10 results by domain kind. winnability: high when a small independent site or forum ranks and no result answers the learner's actual question (does it affect what I am learning, what exactly do I type); medium when small sites rank but already answer it; low when official docs, vendors, big publishers or security press hold every slot. Note whether an AI Overview appears and our_rank if scrimbaguide.tech appears. better_phrasing is the literal string a learner types (exact error text, "for beginners", "is X enough to learn"), not the feature name.
Items: ${JSON.stringify(demandItems, null, 1)}`, { label: 'serp', phase: 'Demand', model: 'sonnet', schema: SERP }),
])
if (!serp) log('SERP check returned nothing; Pick judges winnability from research evidence')

// ---------------- PICK → GUARD (loop) ----------------
const BRIEF = {
  type: 'object',
  properties: {
    decision: { type: 'string', enum: ['write', 'skip'] },
    reason: { type: 'string' },
    kind: { type: 'string', enum: ['new', 'refresh'] },
    refresh_file: { type: 'string' },
    title_options: { type: 'array', items: { type: 'string' } },
    title: { type: 'string' }, slug: { type: 'string' }, description: { type: 'string' },
    target_query: { type: 'string' }, secondary_queries: { type: 'array', items: { type: 'string' } },
    intent: { type: 'string' }, outline: { type: 'array', items: { type: 'string' } },
    scrimba_bridge: { type: 'object', properties: {
      course_or_path: { type: 'string' }, scrimba_url: { type: 'string' }, review_route: { type: 'string' },
      where_in_post: { type: 'string' }, evidence_files: { type: 'array', items: { type: 'string' } },
    } },
    sources: { type: 'array', items: { type: 'string' } },
    internal_links: { type: 'array', items: { type: 'string' } },
    cta: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
    annotation_title: { type: 'string', description: 'GA4 annotation title, <= 60 chars' },
    ...NEWS_FIELDS,
  },
  required: ['decision', 'reason'],
}
const GUARD = { type: 'object', properties: {
  verdict: { type: 'string', enum: ['clear', 'cannibalizes', 'weak'] },
  conflicts: { type: 'array', items: { type: 'object', properties: { route: { type: 'string' }, why: { type: 'string' } }, required: ['route', 'why'] } },
  notes: { type: 'string' },
}, required: ['verdict', 'conflicts', 'notes'] }

let brief = null, rejected = []
for (let attempt = 1; attempt <= 3 && !brief; attempt++) {
  phase('Select')
  const pick = await agent(`${COMMON}
Task (report only): choose ONE piece to produce today from the shortlist (data at the end), or skip.
Decide in order. (1) Skip an item when: SERP winnability is low, unless its shape is hub-update or a refresh of a page with our_rank 20 or better; it is a spike whose only reader action is "bump a dependency"; its Trends direction is declining (too-low-new is not a drop reason, and too-low is one only when GSC shows no impressions either). (2) hub-update when the item belongs to a recurring stream whose hub exists: add a dated entry and update the "Current state as of ${A.date}" table; it qualifies only with at least 150 words of new, sourced substance, otherwise pick something else. (3) hub-new when the stream's hub does not exist yet: slug exactly as in the hub list. (4) own-post when the learner question has its own query distinct from every hub's, the shelf life is months, evergreen, or a seasonal event starting ${WIN.ahead3} to ${WIN.ahead21}, winnability is medium or high, and relevance is direct or adjacent. (5) bofu refresh only as the fallback.
${HUB_NOTE}
${PENDING_NOTE} Target query: SERP better_phrasing when Trends is too-low, too-low-new or unavailable, otherwise the Trends best phrasing; rising related learner questions become H2 candidates. For a timely pick, sources start with the primary_source and the outline answers what happened (with its date), whether it changes what someone learning the technology does, what to do (exact steps), then the Scrimba bridge per its relevance tier. Build a full brief: carry event_date, shelf_life, primary_source, family, shape, hub, relevance and review_route; 10 title options then the pick; Scrimba never appears in the title, description or slug of a top-of-funnel post; slug short, lowercase, hyphenated, year-free for hubs, -${YEAR} only if the query carries a year; description <= 160; outline; the scrimba_bridge with the exact course/path, review route, the repo files that evidence it, and where it sits (the reader's "how do I learn or refresh this" moment); the CTA (PricingCTA ctaType="free" for top-of-funnel; bofu keeps the page's existing CTA rules). Refresh: refresh_file must be the repo-relative path of the existing post. Also give annotation_title: a GA4 annotation title of 60 characters or fewer, e.g. "Blog: <short title>" or "Refresh: <short title>", no money figures. Titles and descriptions use ${YEAR} when they carry a year. Skip rather than publish something thin.
Shortlist: ${JSON.stringify(short.shortlist, null, 1)}
Google Trends: ${JSON.stringify(trends || 'unavailable', null, 1)}
SERP: ${JSON.stringify(serp || 'unavailable', null, 1)}
${rejected.length ? `Rejected this run (do not pick again): ${JSON.stringify(rejected, null, 1)}` : ''}`, { label: `pick:${attempt}`, phase: 'Select', schema: BRIEF })
  if (!pick || pick.decision === 'skip') return { outcome: 'skip', reason: pick ? pick.reason : 'selector failed', shortlist: short.shortlist, trends, ...base }
  const missing = ['kind', 'title', 'slug', 'description', 'target_query'].filter(k => !pick[k])
  if (pick.kind === 'refresh' && !pick.refresh_file) missing.push('refresh_file')
  if (missing.length) {
    rejected.push({ title: pick.title, target_query: pick.target_query, verdict: 'weak', conflicts: [], reason: `incomplete brief: missing ${missing.join(', ')}` })
    continue
  }
  if (pick.refresh_file) pick.refresh_file = rel(pick.refresh_file)
  const hubSlugs = HUBS.filter(h => !h.file).map(h => h.slug)
  const shapeError =
    (pick.shape === 'hub-update' || pick.shape === 'refresh') && pick.kind !== 'refresh' ? `${pick.shape} must be kind refresh` :
    (pick.shape === 'own-post' || pick.shape === 'hub-new') && pick.kind !== 'new' ? `${pick.shape} must be kind new` :
    pick.shape === 'hub-new' && !hubSlugs.includes(pick.slug) ? `hub-new slug ${pick.slug} is not an approved hub slug (${hubSlugs.join(', ')})` :
    pick.family !== 'bofu' && pick.relevance === 'none' ? 'no Scrimba relevance' : null
  if (shapeError) {
    rejected.push({ title: pick.title, target_query: pick.target_query, verdict: 'weak', conflicts: [], reason: shapeError })
    continue
  }
  if (pick.kind === 'refresh' && pick.refresh_file && !/^blog\/.+\.mdx$/.test(pick.refresh_file)) {
    rejected.push({ title: pick.title, target_query: pick.target_query, verdict: 'weak', conflicts: [], reason: `refresh_file is not a blog post: ${pick.refresh_file}` })
    continue
  }
  if (pick.refresh_file && PENDING.includes(pick.refresh_file)) {
    rejected.push({ title: pick.title, target_query: pick.target_query, verdict: 'cannibalizes', conflicts: [{ route: pick.refresh_file, why: 'already in an open daily PR' }] })
    continue
  }

  phase('Guard')
  const guard = await agent(`${COMMON}
Task (report only): try hard to prove this brief cannibalizes or duplicates an existing page, or is too weak to publish.
Brief: ${JSON.stringify(pick, null, 1)}
Check every route in .seo-cache/inventory.json whose title, description or H2s overlap the target and secondary queries, and its pages[].top_queries in .seo-cache/analytics-snapshot.json (does it already rank for the target?); the snapshot's cannibalization rows for the target and secondary queries (a query already split across routes must not gain another); grep blog/ docs/ src/pages/ for the target phrase; redirect sources in .seo-cache/redirects.json, falling back to a grep of docusaurus.config.ts if that file is missing (a merged-away topic must not come back); files in open daily PRs are covered: ${JSON.stringify(PENDING)}; for a refresh, that the page's intent does not change. Shape: for hub-update, the hub file exists and the new entry's query is the hub's intent; for hub-new, the slug is an approved hub slug and no existing post already owns that stream (${HUB_NOTE}); for own-post, no hub or existing post covers the query; a top-of-funnel hub or post must not start competing with a course leaf (docs/courses/**) or a money page for its query. SERP winnability for this item: ${JSON.stringify(serp ? serp.results.filter(r => r.target_query === pick.target_query || r.better_phrasing === pick.target_query) : 'unavailable')}. verdict=cannibalizes if another page serves the same intent; weak if demand evidence is thin, the angle adds nothing, or winnability is low for a new page.`, { label: `guard:${attempt}`, phase: 'Guard', model: 'sonnet', schema: GUARD })
  if (guard && guard.verdict === 'clear') brief = { ...pick, guard: guard.notes }
  else rejected.push({ title: pick.title, target_query: pick.target_query, verdict: guard ? guard.verdict : 'unknown', conflicts: guard ? guard.conflicts : [] })
}
if (!brief) return { outcome: 'skip', reason: 'every pick failed the cannibalization guard', rejected, ...base }
log(`Chosen (${brief.kind}): ${brief.title}`)

// ---------------- DRAFT ----------------
phase('Draft')
const file = rel(brief.kind === 'refresh' ? brief.refresh_file : `blog/${A.date}-${brief.slug}.mdx`)
const TOFU = brief.family !== 'bofu'
// Structure by shape; bofu keeps the money-listicle template it always used.
const TEMPLATE = {
  'own-post': `Copy frontmatter fields and imports from blog/2026-07-07-is-react-still-worth-learning-2026.mdx (explicit slug:, authors, tags from blog/tags.yml only, image /img/blog/<slug>.png generated at deploy, never create the PNG; last_update with date and author). Structure: 40 to 60 word answer block (what happened with its date, whether it changes what someone learning the technology does, what to do); {/* truncate */}; "## What changed on YYYY-MM-DD" linking the primary_source; "## Does this change what you're learning?"; "## What to do" with numbered steps and exact commands, versions copied from the source as of ${A.date}; a fix section per exact error string when there is one; the Scrimba bridge per tier; "## Bottom line" with a verdict; PricingCTA ctaType="free"; an FAQ only from real Trends or SERP learner questions.`,
  'hub-new': `Copy frontmatter fields and imports from blog/2026-07-07-is-react-still-worth-learning-2026.mdx (slug exactly ${brief.slug}, year-free; the year goes in the title; tags from blog/tags.yml only; image /img/blog/<slug>.png generated at deploy, never create the PNG). Structure: 40 to 60 word answer block; {/* truncate */}; "## Current state as of ${A.date}" table (latest stable version, what a beginner should install, whether a typical course still matches, each cell sourced); "## What to do" steps; the Scrimba bridge per tier; "## Update log" newest first, one "### YYYY-MM-DD: <event>" entry per event with its primary source link (today's event is the first entry); "## Bottom line"; PricingCTA ctaType="free".`,
  'hub-update': `This file is a learner hub. Edit only: the "Current state as of" table (retitle it "as of ${A.date}"), one new "### YYYY-MM-DD: <event>" entry at the top of the update log with its primary source link and at least 150 words of new, sourced substance, the answer block if the verdict changed, and last_update.date ${A.date}. If the file has no current-state table or update log yet, add both below the existing opening without rewriting other sections. Never touch the slug; change the title year only if the year changed.`,
  'refresh': `Keep the post's intent, slug and date; set last_update.date ${A.date}; update stale facts and years with dated, sourced replacements.`,
}
const TIER = {
  direct: `Bridge (direct): an H2 at the reader's "how do I learn or refresh this" moment, after "What to do" and before the conclusion; 2 to 4 sentences with one or two first-hand specifics from our review page (module, scrim count, project); link the review route ${brief.review_route || ''} on first mention and add ONE inline <AffiliateLink location="tofu-bridge-direct" href="<course url>"> in that section.`,
  adjacent: `Bridge (adjacent): one or two sentences inside "What to do" (or the nearest next-step section), linking the review route ${brief.review_route || ''} only; no inline AffiliateLink, no H2.`,
  distant: `Bridge (distant): one sentence in the conclusion linking the path review route ${brief.review_route || ''} only; no inline AffiliateLink.`,
}
const BRIDGE = TOFU
  ? `${TIER[brief.relevance] || TIER.distant} Scrimba never appears in the title, description, slug, first H2 or the answer block. The only counted CTA is the closing PricingCTA ctaType="free" (no CourseCard, ScrimPoster or VerdictBox). State provenance once, inside the bridge, for Scrimba claims only; news facts cite their primary source inline with its date.`
  : `Put the bridge where the brief says: one or two concrete specifics from our review page (module, project, instructor) and an inline AffiliateLink to the course or path, plus a link to our review route.`
const draft = await agent(`${COMMON}
Task: ${brief.kind === 'refresh' ? `refresh the existing post ${file} (keep slug and date; set last_update.date ${A.date})` : `write a new blog post at ${file}`}.
Brief: ${JSON.stringify(brief, null, 1)}
Before writing, load marketing-skills:copywriting, marketing-skills:copy-editing, humanizer, marketing-skills:ai-seo, and read the Voice section of the scrimba-course-review skill. ${TOFU ? TEMPLATE[brief.shape] || TEMPLATE['own-post'] : ''} ${!TOFU && brief.kind === 'new' ? 'Copy the structure, frontmatter fields, imports and component usage of blog/2026-07-11-best-ai-engineering-courses.mdx (explicit slug:, authors, tags from blog/tags.yml only, image path /img/blog/<slug>.png which is generated at deploy, never create the PNG; hideFooterPricingCta as in the template; last_update with date and author).' : ''}
Scrimba bridge: data/courses.json can be stale. Before quoting any number (hours, lessons, modules, instructor) for the bridged course or path, re-scrape it live: write its scrimba URL to .seo-cache/bridge-urls.txt and run .venv/bin/python scraper/scrape.py --urls .seo-cache/bridge-urls.txt --output .seo-cache/bridge-scrape (if .venv is missing: python3 -m venv .venv && .venv/bin/pip install -q -r scraper/requirements.txt). Use the live values; if they differ from data/courses.json or our review page, list each difference in your final message under CATALOG DRIFT as a JSON row {slug, course, field, ours, live} (do not edit data/ or docs/). ${BRIDGE} The bridge is a recommendation a reader would thank you for, not a pitch.
Requirements: answer the target query in a 40 to 60 word block under the intro; H2s phrased like real queries; tables for comparisons; every statistic dated and linked to its primary source (verify with WebFetch on ${A.date}); version numbers, affected and patched versions, and "latest" claims copied from the official source as of ${A.date}, never from memory; state the as-of date once for anything that will change (e.g. "as of ${A.date}, the patched release is ..."); first-hand Scrimba evidence only from the repo files named in the brief; every named Scrimba course/path linked per CLAUDE.md; PricingCTA after the conclusion (ctaType="free" unless the brief is a bofu money post); FAQAccordion only if it adds real questions; {/* truncate */} after the intro, schema components below it; no em-dashes; description <= 160.
Then run npm run check:content and node scripts/audit-course-links.mjs --file ${file}; fix everything they flag.
Edit only ${file}. Final message: summary plus every factual claim with its source.`, { label: 'draft', phase: 'Draft', model: 'sonnet' })

// ---------------- VERIFY (parallel lenses) → FIX ----------------
phase('Verify')
const CHECK = { type: 'object', properties: {
  pass: { type: 'boolean' },
  findings: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, issue: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' } }, required: ['severity', 'issue', 'evidence', 'fix'] } },
}, required: ['pass', 'findings'] }
const annotation_title = (brief.annotation_title || `${brief.kind === 'refresh' ? 'Refresh' : 'Blog'}: ${brief.title || file}`).slice(0, 60)
const verify = async (round) => {
  const r = await parallel([
    () => agent(`${COMMON}
Task (report only): adversarial web fact-check of ${file}. For every statistic, date, named study, product claim and quote, open the cited source (WebFetch) or find the primary source (WebSearch) and confirm it says exactly that. Known failure modes from past runs: a regional salary sold as national, an inverted percentage, an event dated to the wrong year, a survey release date wrong, "average" vs median. Also confirm Scrimba facts against the repo docs pages and data/courses.json. Date checks (today is ${A.date}): every event date matches its source; every "latest", "current" or "newest" version, model or report is still the latest on the official source today; any year that is not ${YEAR} is either historical or a blocker; for a security topic, affected and patched versions match the advisory exactly. Security content: the CVE/GHSA id exists in the GitHub Advisory Database or NVD and matches the project; affected and patched ranges match the advisory character for character; the patch date matches; no exploit mechanics beyond the advisory's own summary; no claim that the reader "is affected", only how to check; no severity word stronger than the advisory's CVSS rating; any mismatch is a blocker. Releases: the version is still the latest on the official releases page as of ${A.date}; "no breaking changes" is quoted from the release notes or cut. Hubs: every earlier update-log entry still links a live source. Round ${round}.`, { label: `factcheck:r${round}`, phase: 'Verify', model: 'sonnet', schema: CHECK }),
    () => agent(`${COMMON}
Task (report only): critic for ${file} on house rules. Check frontmatter (slug, title, description <= 160, tags exist in blog/tags.yml, date, last_update), MDX validity and imports, voice (answer first, verdict per section, no hedging, no em-dashes, no AI tells per the humanizer skill), CTA budget and spacing (Blog row of CLAUDE.md), AffiliateLink usage and no prices, links (trailing slash, targets exist, every named course/path linked), truncate before schema components, search intent match with the brief's target query: ${brief.target_query}; relative time words ("recently", "last month", "this year", "new") without an absolute date nearby, and a title, description or slug carrying a year other than ${YEAR}, are major findings. ${TOFU ? `Top-of-funnel rules: the Scrimba bridge matches relevance "${brief.relevance}" (an inline AffiliateLink only when direct, with location tofu-bridge-direct); no Scrimba mention in the title, description, slug, first H2 or answer block; exactly one counted CTA, the closing PricingCTA ctaType="free"; structure matches shape "${brief.shape}".` : ''} Round ${round}.`, { label: `critic:r${round}`, phase: 'Verify', model: 'sonnet', schema: CHECK }),
  ])
  return { checks: r.filter(Boolean), failed: r.length - r.filter(Boolean).length }
}
const verifyFailedBlock = (round, failed) => ({
  outcome: 'blocked', file, brief, draft, annotation_title, ...base,
  open: [{ severity: 'blocker', issue: `verification agent failed (round ${round}, ${failed} of 2 lenses returned nothing)`, evidence: '', fix: 're-run verify' }],
})
let { checks, failed } = await verify(1)
if (checks.length < 2) return verifyFailedBlock(1, failed)
for (let round = 1; round <= 2; round++) {
  const findings = checks.flatMap(c => c.findings).filter(f => f.severity !== 'minor' || round === 1)
  if (!findings.length) break
  await agent(`${COMMON}
Task: fix ${file}. Verify each finding first; apply the real ones; cut any claim you cannot source. Re-run npm run check:content and node scripts/audit-course-links.mjs --file ${file}.
Findings: ${JSON.stringify(findings, null, 1)}
Edit only ${file}. Final message: applied vs rejected.`, { label: `fix:r${round}`, phase: 'Verify', model: 'sonnet' })
  ;({ checks, failed } = await verify(round + 1))
  if (checks.length < 2) return verifyFailedBlock(round + 1, failed)
}
const open = checks.flatMap(c => c.findings).filter(f => f.severity !== 'minor')
if (open.length) return { outcome: 'blocked', file, brief, open, draft, annotation_title, ...base }

// ---------------- WIRE ----------------
phase('Wire')
const route = brief.kind === 'refresh' ? null : `/blog/${brief.slug}/`
const wire = await agent(`${COMMON}
Task: connect ${file} to the site.
1. src/content/relatedGuidesMap.ts: ${route ? `add an entry for '${route.replace(/\/$/, '')}' (3 to 4 relevant guides, existing format and key style)` : 'check the refreshed post still has a good entry'}; add it as a related guide on 1 to 2 of the most relevant existing entries (no self-references, no duplicates).
2. Add ONE in-prose link to ${route || 'the refreshed post'} from each of 2 to 3 relevant published pages (docs or blog), choosing donors by pages[].ga4.sessions in .seo-cache/analytics-snapshot.json (highest first among relevant pages; if ga4 is null, use pages[].gsc clicks). Never use as a donor a file in an open daily PR: ${JSON.stringify(PENDING.filter(f => f !== 'src/content/relatedGuidesMap.ts'))}. src/content/relatedGuidesMap.ts is always edited in step 1 regardless of pending_files; any conflicts with another open daily PR's edits to it are resolved at rebase, not by skipping it here. Inside an existing sentence or one short new sentence; descriptive anchor text; trailing slash; max one new link per page; bump last_update.date to ${A.date} on edited pages.
3. Run npm run typecheck, npm run check:content, node scripts/audit-course-links.mjs --file on each edited page.
Final message: files changed and the sentences added.`, { label: 'wire', phase: 'Wire', model: 'sonnet' })

return { outcome: 'ready', kind: brief.kind, shape: brief.shape, family: brief.family, relevance: brief.relevance, file, route, brief, trends, serp, draft, wire, annotation_title, minor: checks.flatMap(c => c.findings), ...base }
