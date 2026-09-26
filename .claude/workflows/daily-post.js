export const meta = {
  name: 'daily-post',
  description: 'Pick one non-cannibalizing, high-demand topic bridged to a Scrimba course (new post or refresh), validate with Google Trends, draft, fact-check, wire links; returns a PR-ready summary',
  whenToUse: 'Run through /daily-post after scripts/analytics/snapshot.py has refreshed .seo-cache/. args: {date: "YYYY-MM-DD", branch: "content/daily-YYYY-MM-DD", topic?: "optional seed", pending_files?: string[] (files in open content/daily-* PRs), chrome?: boolean (default true; false skips the Scrimba lens and Google Trends), snapshot_generated_at?: "generated_at of .seo-cache/analytics-snapshot.json, echoed in the return value"}',
  phases: [
    { title: 'Research', detail: 'GSC gaps and leaks, releases/news, community, AI-answer gaps, live Scrimba catalog via Chrome (Sonnet)' },
    { title: 'Select', detail: 'shortlist, then pick one with a Scrimba bridge, or skip (Opus)' },
    { title: 'Trends', detail: 'Google Trends validation in Chrome (Sonnet)' },
    { title: 'Guard', detail: 'adversarial cannibalization check (Sonnet)' },
    { title: 'Draft', detail: 'write or refresh the post (Sonnet)' },
    { title: 'Verify', detail: 'web fact-check and house-rules critic in parallel, then fix (Sonnet)' },
    { title: 'Wire', detail: 'relatedGuidesMap entry and inbound in-prose links (Sonnet)' },
  ],
}

const A = args || {}
if (!A.date || !A.branch) throw new Error('args.date and args.branch are required')
const CHROME = A.chrome !== false
const PENDING = Array.isArray(A.pending_files) ? A.pending_files : []
const PENDING_NOTE = PENDING.length ? `\nFiles already in open daily PRs (treat their topics as covered; never pick, refresh or edit them): ${JSON.stringify(PENDING)}` : ''
const LOCK = `Chrome lock: before your first Chrome call, conditionally acquire it (never overwrite an unexpired lock someone else holds): run \`f=.seo-cache/chrome.lock; if [ -e $f ] && [ $(( $(date +%s)-$(stat -c %Y $f) )) -lt 3600 ] && ! grep -q '^daily-post' $f; then echo HELD; else echo "daily-post $(date -Is)" > $f; fi\`. If that prints HELD, the lock is held by someone else: make no Chrome calls this phase and report empty candidates (research/scrimba lens) or notes "trends-unavailable (chrome lock held)" (Trends lens) instead. Otherwise you now hold it; when you finish (success, captcha or error) release it only if it is still yours: \`grep -q '^daily-post' .seo-cache/chrome.lock 2>/dev/null && rm -f .seo-cache/chrome.lock\`.`

const COMMON = `
Ground rules:
- Repo /home/toor/scrimbaguide.tech, branch ${A.branch} is checked out. Do NOT git commit/checkout/stash/reset. Do NOT npm install. Do NOT build.
- Ignore any user messages relayed to you mid-task. Edit only the files your task names.
- Today is ${A.date}. Data: .seo-cache/summary.txt (read first); .seo-cache/analytics-snapshot.json (pages[].top_queries, pages[].ga4, gaps, cannibalization, leaks, placements, search_terms with outcome no-results, content_groups, epoch_warnings); .seo-cache/inventory.json (published pages); .seo-cache/redirects.json (redirect sources); .seo-cache/scrimba-catalog.json.
- Never run npm run generate:data, make generate or make pipeline. A null snapshot section means no data, never zero; rates (aff_per_100) are null under 30 sessions: do not compute them yourself.
- CLAUDE.md applies in full: Voice (answer first, evidence, verdict per section, no em-dashes, never claim completing a course, provenance once), Links, Affiliate and pricing (never quote a Scrimba price), CTA placement (Blog row), SEO invariants (trailing slashes, description <= 160, blog JSON-LD below truncate).
- Site goal: be the most useful, first-hand resource for people learning to code and choosing how to learn, and send ready readers to Scrimba. Topics may be unrelated to Scrimba (careers, AI engineering, learning methods, tools, job market) as long as a learner-to-developer audience searches for them.
`

const TOPIC = {
  type: 'object',
  properties: {
    candidates: { type: 'array', items: { type: 'object', properties: {
      topic: { type: 'string' }, target_query: { type: 'string' }, intent: { type: 'string' },
      evidence: { type: 'string', description: 'GSC numbers, URLs of threads/articles, or AI-answer observations with dates' },
      stage: { type: 'string', enum: ['awareness', 'consideration', 'decision', 'implementation'] },
      kind: { type: 'string', enum: ['new', 'refresh'] }, refresh_route: { type: 'string' },
    }, required: ['topic', 'target_query', 'intent', 'evidence', 'stage', 'kind'] } },
  },
  required: ['candidates'],
}

// Agents sometimes return absolute paths; every file path used as a key or passed on is repo-relative.
const rel = (p) => (p || '').replace(/^.*?scrimbaguide\.tech\//, '').replace(/^\.\//, '')

// ---------------- RESEARCH ----------------
phase('Research')
const seed = A.topic ? `\nThe owner seeded this run with: "${A.topic}". Include it as a candidate if it survives your checks.` : ''
const BRIDGE_RULE = `Every candidate needs a scrimba_bridge: the specific Scrimba course, path, module or feature that teaches or relates to the topic, from .seo-cache/scrimba-catalog.json (name, url, our review route, modules), with one sentence on why a reader of this topic would want it. If no honest bridge exists, the candidate can still qualify when search demand is strong, but say "none" and the selector will weigh it lower.`
const lenses = [
  { key: 'gsc', prompt: `Mine .seo-cache/analytics-snapshot.json and summary.txt. Inputs: gaps, pages[].top_queries, pages[].gsc, cannibalization, leaks (grouped by reason: striking_distance, falling_impr, low_aff_rate, outbound_leak), and search_terms whose outcome is "no-results" (on-site searches we cannot answer). Find (a) query gaps: queries with real impressions where our best page ranks below 10 or its intent does not match (a new page could own it), (b) refresh opportunities: striking_distance and falling_impr leaks, posts with high impressions at positions 8 to 20, (c) conversion leaks: low_aff_rate and outbound_leak pages with organic clicks where a refresh with a better Scrimba bridge would pay, (d) cannibalization rows where a consolidating refresh would help, (e) no-results search terms with durable demand. Give numbers.` },
  { key: 'releases', prompt: `Track what shipped or changed in the last 30 days that learners will search about for months: framework and tool releases (Next.js, React, TypeScript, Node.js, Vite, Tailwind, Python, Deno/Bun, Astro, Svelte, Vue), AI developer tooling and model releases relevant to builders (OpenAI, Anthropic, Google, Meta, Mistral APIs; Claude Code, Cursor, Copilot, Codex; MCP), and hiring-market reports (layoffs, junior hiring data, salary surveys). Use official sources first (release notes, changelogs, GitHub releases, official blogs) via WebSearch/WebFetch, then coverage. Prefer "what changed and what should a learner do about it" angles with lasting demand (e.g. "Next.js 16: what beginners need to know", "is X course still current after the Y release") over one-day news. Dates and URLs as evidence.` },
  { key: 'community', prompt: `What are people learning to code, switching careers, or early in their developer careers asking right now (last 30 days where possible)? WebSearch Reddit (r/learnprogramming, r/cscareerquestions, r/webdev, r/learnjavascript, r/reactjs, r/nextjs, r/Python, r/ExperiencedDevs), Hacker News, dev.to, Stack Overflow blog. Look for repeated questions and frustrations with durable search demand. Thread URLs and dates as evidence.` },
  { key: 'ai-answers', prompt: `Find questions in this audience's space where Google AI Overviews, ChatGPT or Perplexity currently cite thin, generic, stale-year or listicle sources without first-hand evidence. Use WebSearch to see what ranks and gets cited. Our edge: first-hand course reviews (docs/**, .seo-cache/scrimba-catalog.json). Evidence required.` },
  { key: 'scrimba', prompt: `What is new or changed at Scrimba that people will search for, and which catalog facts in our data are stale? Load the scrimba-browsing skill and use Chrome with the owner's logged-in Pro account to read the live course catalog and the four path pages on scrimba.com (course list, new courses, updated modules, new features such as Explain). Compare against .seo-cache/scrimba-catalog.json and docs/changelog.mdx. Also check Scrimba's public blog/roadmap for announcements (plain links only, never affiliate). Report (1) candidates (new course reviews belong in docs/courses/** and are out of scope here: propose blog angles around them instead, e.g. "is Scrimba's new X course worth it vs Y", or learner guides for the topic the new course teaches), and (2) every stale fact you saw in the top-level catalog_drift array as {slug, course, field, ours, live} (slug = our course slug from scrimba-catalog.json), never as a candidate, so the owner can run a catalog update as a separate PR. Chrome is shared: you are the only agent using it in this phase; close tabs you open. ${LOCK}` },
].filter(l => CHROME || l.key !== 'scrimba')
const CANDS = {
  type: 'object',
  properties: {
    candidates: { type: 'array', items: { type: 'object', properties: {
      topic: { type: 'string' }, target_query: { type: 'string' }, intent: { type: 'string' },
      evidence: { type: 'string', description: 'GSC numbers, URLs with dates, or observed AI answers' },
      stage: { type: 'string', enum: ['awareness', 'consideration', 'decision', 'implementation'] },
      kind: { type: 'string', enum: ['new', 'refresh'] }, refresh_route: { type: 'string' },
      scrimba_bridge: { type: 'string' },
    }, required: ['topic', 'target_query', 'intent', 'evidence', 'stage', 'kind', 'scrimba_bridge'] } },
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
const all = found.filter(Boolean).flatMap(f => f.candidates)
// Drift rows in the catalog-diff.mjs format [{slug, course, field, ours, live}]; the skill writes .seo-cache/drift-<date>.json.
const drift = found.filter(Boolean).flatMap(f => f.catalog_drift || [])
const candidates = all.filter(c => !/CATALOG DRIFT/i.test(c.topic))
log(`${candidates.length} candidates from ${found.filter(Boolean).length} lenses; ${drift.length ? `${drift.length} catalog drift rows` : 'no catalog drift reported'}`)
const base = { chrome: CHROME, drift, snapshot_generated_at: A.snapshot_generated_at || null }
if (!candidates.length) return { outcome: 'skip', reason: 'no candidates found', ...base }

// ---------------- SHORTLIST → TRENDS ----------------
phase('Select')
const SHORT = { type: 'object', properties: {
  shortlist: { type: 'array', items: { type: 'object', properties: {
    topic: { type: 'string' }, target_query: { type: 'string' }, alt_queries: { type: 'array', items: { type: 'string' } },
    kind: { type: 'string', enum: ['new', 'refresh'] }, refresh_route: { type: 'string' }, scrimba_bridge: { type: 'string' },
    score: { type: 'number' }, why: { type: 'string' },
  }, required: ['topic', 'target_query', 'alt_queries', 'kind', 'scrimba_bridge', 'score', 'why'] } },
}, required: ['shortlist'] }
const short = await agent(`${COMMON}
Task (report only): score and shortlist the best 5 candidates.
Candidates: ${JSON.stringify(candidates, null, 1)}
Score (marketing-skills:content-strategy weights): customer impact 40%, content-market fit 30% (strength of the scrimba_bridge: does the topic naturally lead a reader to a specific Scrimba course/path, and does our conversion data show that kind of page converts? read content_groups[].aff_per_100 and leaks in .seo-cache/analytics-snapshot.json, using only rows where aff_per_100 is non-null, i.e. at least 30 sessions; check epoch_warnings before comparing windows), search potential 20% (GSC impressions, query breadth, durable demand), resources 10% (first-hand evidence in docs/** or verifiable sources). Prefer refreshing a post ranking 8 to 20 or leaking conversions over writing a competitor to it. Check the last 10 files in blog/ and avoid a third consecutive post in the same cluster. Merge near-duplicate candidates. For each, list 2 to 4 alternative phrasings of the target query for trend comparison.`, { label: 'shortlist', phase: 'Select', schema: SHORT })
if (!short || !short.shortlist.length) return { outcome: 'skip', reason: 'nothing scored high enough', candidates: candidates, ...base }

phase('Trends')
const TR = { type: 'object', properties: {
  results: { type: 'array', items: { type: 'object', properties: {
    target_query: { type: 'string' }, best_phrasing: { type: 'string' },
    direction: { type: 'string', enum: ['rising', 'stable', 'declining', 'seasonal', 'too-low'] },
    rising_related: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' },
  }, required: ['target_query', 'best_phrasing', 'direction', 'rising_related', 'notes'] } },
}, required: ['results'] }
const trends = !CHROME
  ? { results: short.shortlist.map(s => ({ target_query: s.target_query, best_phrasing: s.target_query, direction: 'stable', rising_related: [], notes: 'trends-unavailable (chrome=false); weigh GSC evidence instead' })) }
  : await agent(`${COMMON}
Task (report only): validate demand with Google Trends in Chrome (load the claude-in-chrome skill; create your own tab; close it when done; you are the only agent using Chrome now). ${LOCK}
For each shortlisted item, open https://trends.google.com/trends/explore?date=today%2012-m&q=<up to 5 comma-separated phrasings, URL-encoded> (worldwide; then geo=US if worldwide is flat). Read the interest-over-time shape and the Related queries "Rising" list (read_page/get_page_text; screenshots only if needed). Report the best phrasing (use it as the target query), direction (rising, stable, declining, seasonal, too-low), and rising related queries worth covering as H2s. If Trends blocks automation (captcha or "unusual traffic"), stop immediately and report notes "trends-unavailable" for every item; never try to solve a captcha.
Shortlist: ${JSON.stringify(short.shortlist.map(s => ({ target_query: s.target_query, alt_queries: s.alt_queries })), null, 1)}`, { label: 'trends', phase: 'Trends', model: 'sonnet', schema: TR })

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
Task (report only): choose ONE piece to produce today from the shortlist, or skip.
Shortlist: ${JSON.stringify(short.shortlist, null, 1)}
Google Trends: ${JSON.stringify(trends || 'unavailable', null, 1)}
${rejected.length ? `Rejected this run (do not pick again): ${JSON.stringify(rejected, null, 1)}` : ''}
Drop declining or too-low topics unless GSC shows real impressions. Where Trends notes say trends-unavailable, judge demand on GSC impressions (gaps, pages[].top_queries) and the research evidence alone.${PENDING_NOTE} Use the Trends best phrasing as the target query and rising related queries as H2 candidates. Build a full brief: 10 title options then the pick; slug (short, lowercase, hyphenated, -2026 only if the query carries a year); description <= 160; outline; the scrimba_bridge with the exact course/path, its review route and the repo files that evidence it, and where in the post the bridge sits (the reader's natural "how do I actually learn this" moment); the CTA (PricingCTA ctaType, and the one inline link to the bridged course). Refresh: refresh_file must be the repo-relative path of the existing post. Also give annotation_title: a GA4 annotation title of 60 characters or fewer, e.g. "Blog: <short title>" or "Refresh: <short title>", no money figures. Skip rather than publish something thin.`, { label: `pick:${attempt}`, phase: 'Select', schema: BRIEF })
  if (!pick || pick.decision === 'skip') return { outcome: 'skip', reason: pick ? pick.reason : 'selector failed', shortlist: short.shortlist, trends, ...base }
  const missing = ['kind', 'title', 'slug', 'description', 'target_query'].filter(k => !pick[k])
  if (pick.kind === 'refresh' && !pick.refresh_file) missing.push('refresh_file')
  if (missing.length) {
    rejected.push({ title: pick.title, target_query: pick.target_query, verdict: 'weak', conflicts: [], reason: `incomplete brief: missing ${missing.join(', ')}` })
    continue
  }
  if (pick.refresh_file) pick.refresh_file = rel(pick.refresh_file)
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
Check every route in .seo-cache/inventory.json whose title, description or H2s overlap the target and secondary queries, and its pages[].top_queries in .seo-cache/analytics-snapshot.json (does it already rank for the target?); the snapshot's cannibalization rows for the target and secondary queries (a query already split across routes must not gain another); grep blog/ docs/ src/pages/ for the target phrase; redirect sources in .seo-cache/redirects.json, falling back to a grep of docusaurus.config.ts if that file is missing (a merged-away topic must not come back); files in open daily PRs are covered: ${JSON.stringify(PENDING)}; for a refresh, that the page's intent does not change. Search the target query on the web: does our angle add something the current top results lack? verdict=cannibalizes if another page serves the same intent; weak if demand evidence is thin or the angle adds nothing.`, { label: `guard:${attempt}`, phase: 'Guard', model: 'sonnet', schema: GUARD })
  if (guard && guard.verdict === 'clear') brief = { ...pick, guard: guard.notes }
  else rejected.push({ title: pick.title, target_query: pick.target_query, verdict: guard ? guard.verdict : 'unknown', conflicts: guard ? guard.conflicts : [] })
}
if (!brief) return { outcome: 'skip', reason: 'every pick failed the cannibalization guard', rejected, ...base }
log(`Chosen (${brief.kind}): ${brief.title}`)

// ---------------- DRAFT ----------------
phase('Draft')
const file = rel(brief.kind === 'refresh' ? brief.refresh_file : `blog/${A.date}-${brief.slug}.mdx`)
const draft = await agent(`${COMMON}
Task: ${brief.kind === 'refresh' ? `refresh the existing post ${file} (keep slug and date; set last_update.date ${A.date})` : `write a new blog post at ${file}`}.
Brief: ${JSON.stringify(brief, null, 1)}
Before writing, load marketing-skills:copywriting, marketing-skills:copy-editing, humanizer, marketing-skills:ai-seo, and read the Voice section of the scrimba-course-review skill. ${brief.kind === 'new' ? 'Copy the structure, frontmatter fields, imports and component usage of blog/2026-07-11-best-ai-engineering-courses.mdx (explicit slug:, authors, tags from blog/tags.yml only, image path /img/blog/<slug>.png which is generated at deploy, never create the PNG; hideFooterPricingCta as in the template; last_update with date and author).' : ''}
Scrimba bridge: data/courses.json can be stale. Before quoting any number (hours, lessons, modules, instructor) for the bridged course or path, re-scrape it live: write its scrimba URL to .seo-cache/bridge-urls.txt and run .venv/bin/python scraper/scrape.py --urls .seo-cache/bridge-urls.txt --output .seo-cache/bridge-scrape (if .venv is missing: python3 -m venv .venv && .venv/bin/pip install -q -r scraper/requirements.txt). Use the live values; if they differ from data/courses.json or our review page, list each difference in your final message under CATALOG DRIFT as a JSON row {slug, course, field, ours, live} (do not edit data/ or docs/). Put the bridge where the brief says: one or two concrete specifics from our review page (module, project, instructor) and an inline AffiliateLink to the course or path, plus a link to our review route. The bridge is a recommendation a reader would thank you for, not a pitch.
Requirements: answer the target query in a 40 to 60 word block under the intro; H2s phrased like real queries; tables for comparisons; every statistic dated and linked to its primary source (verify with WebFetch today); first-hand Scrimba evidence only from the repo files named in the brief; every named Scrimba course/path linked per CLAUDE.md; PricingCTA after the conclusion (ctaType="free" unless the brief says money post); FAQAccordion only if it adds real questions; {/* truncate */} after the intro, schema components below it; no em-dashes; description <= 160.
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
Task (report only): adversarial web fact-check of ${file}. For every statistic, date, named study, product claim and quote, open the cited source (WebFetch) or find the primary source (WebSearch) and confirm it says exactly that. Known failure modes from past runs: a regional salary sold as national, an inverted percentage, an event dated to the wrong year, a survey release date wrong, "average" vs median. Also confirm Scrimba facts against the repo docs pages and data/courses.json. Round ${round}.`, { label: `factcheck:r${round}`, phase: 'Verify', model: 'sonnet', schema: CHECK }),
    () => agent(`${COMMON}
Task (report only): critic for ${file} on house rules. Check frontmatter (slug, title, description <= 160, tags exist in blog/tags.yml, date, last_update), MDX validity and imports, voice (answer first, verdict per section, no hedging, no em-dashes, no AI tells per the humanizer skill), CTA budget and spacing (Blog row of CLAUDE.md), AffiliateLink usage and no prices, links (trailing slash, targets exist, every named course/path linked), truncate before schema components, search intent match with the brief's target query: ${brief.target_query}. Round ${round}.`, { label: `critic:r${round}`, phase: 'Verify', model: 'sonnet', schema: CHECK }),
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

return { outcome: 'ready', kind: brief.kind, file, route, brief, trends, draft, wire, annotation_title, minor: checks.flatMap(c => c.findings), ...base }
