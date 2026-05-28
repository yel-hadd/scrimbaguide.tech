# scrimbaguide.tech: Content & IA Overhaul Plan

Status: planning. Nothing in this document is implemented yet except one change (removal of `sidebar_label` from `scripts/generate-course-pages.mjs`). Execute in the batches at the end.

Editorial constraints that apply to every change below (from project memory): no em-dashes (use commas, periods, parentheses), never quote exact Scrimba prices (link to `https://scrimba.com/our-pricing`), all outbound Scrimba links go through `<AffiliateLink>`, the author is a catalog reviewer and has not completed the courses (never claim or imply completion).

---

## 1. Executive summary

The site has two content systems. The hand-authored docs (comparisons, pricing, paths, FAQ, practice, roadmaps) are well-written but titled like blog posts, inconsistent with each other, and arranged in a sidebar that does not follow a reader's decision path. The 73 generated course pages are the real problem: they are machine-assembled from thin, partly broken data, they repeat the same boilerplate, and several contain grammatically wrong sentences shipped to production.

The fix is not cosmetic. It is: re-scrape richer course data, retire the prose generator, hand-write every course page against a fixed archetype, unify all titles to a single doc-style convention, and re-sequence the sidebar around the buyer journey. Below is a dimension-by-dimension critique of why the current state fails, then the target standard, then a batched execution plan.

Guiding principle: design for the ideal long-term architecture, not to avoid work. We optimize for the structure that is correct for years, not for keeping Search Console undisturbed. Moving pages to where they belong and re-indexing the site once is an acceptable cost. The URL path should reflect the content hierarchy, so when a page belongs in a different section, the file moves and the old URL gets a 301. Redirects are a tool, not a thing to avoid.

---

## 2. In-depth critique of current state

Severity scale: Critical (ship-blocker quality), High, Medium, Low.

### 2.1 Content quality — Critical (course pages), Good (hand-authored)

The generated course pages contain prose that is not just bland but wrong:

- "level up their **Flexbox Tutorial** skills" (should be "Flexbox skills"). The generator splices the course title into a sentence slot meant for a skill noun.
- "complete beginners who want to learn **Learn SQL** from scratch" (the word "Learn" is part of the course name, producing "learn Learn SQL").
- On the AI Engineering page: "level up their **Intro to** skills" because the title-cleaning regex truncated "Intro to AI Engineering" mid-phrase.

Every page also repeats identical boilerplate: the instructor line ("an experienced educator on the Scrimba platform"), the prerequisites block (three hardcoded variants by level), and three templated FAQ answers. Seventy-three pages read like one page photocopied.

The hand-authored docs are the opposite: genuinely good, opinionated prose with real components (`VerdictBox`, `ComparisonTable`, `DisclosureNotice`). The problem there is not the body, it is the title and the page's place in the structure.

Verdict: course pages need a full rewrite. Hand-authored bodies are keepers.

### 2.2 Reader experience — High

- **Two titles per page.** Docusaurus shows the frontmatter `title` in the sidebar and the HTML `<title>`, but renders the body `# H1` as the visible heading. When they differ, the reader sees one name in the sidebar and a different one on the page. Example: sidebar "Scrimba vs Codecademy: An Honest Side-by-Side", page heading "Scrimba vs Codecademy, by what actually matters". This is disorienting and looks unfinished.
- **Inconsistent page openings.** Some pages open with a quick answer, some with a witty one-liner, some with a disclosure notice, some straight into prose. There is no predictable "what is this and is it for me" block at the top, which the use-apify docs have on every page.
- **Missing-data gaps on course pages.** Sections silently disappear when the scraped data is absent, so some course pages have a curriculum and a projects section and others have neither, producing a patchwork that feels broken rather than intentional.

Verdict: adopt one fixed opening pattern (title equals H1, then a one-line blurb, then a 40-60 word quick answer) across all pages.

### 2.3 SEO — High

- **Titles waste the strongest on-page signal.** Blog-style H1s like "Free forever, or pay so a teacher pauses with you" contain none of the query terms a person searches. The frontmatter title is better but is buried behind a colon tagline ("...: An Honest Side-by-Side") that pushes the keyword right and risks truncation.
- **Title/H1 mismatch dilutes relevance.** Search engines weigh the `<title>` and the H1 together; when they disagree, the page sends a mixed signal about what it is about.
- **Course-page descriptions are truncated mid-sentence** ("...You'll cover prompts, tokens, system...") because they were copied from Scrimba's own truncated metadata. A cut-off meta description is a weak SERP snippet.
- **Course ordering in the sidebar is alphabetical**, so crawl priority and internal-link emphasis do not reflect importance (a beginner "Learn React" sits below an advanced course alphabetically).

Verdict: topic-first titles that match search queries, title equals H1, real 150-160 char descriptions written by hand, course pages ordered beginner to advanced.

### 2.4 AI SEO (AEO/GEO) — High

Measured against the ai-seo skill's extractability checklist, the current pages fail on most counts:

- **No standalone answer blocks.** AI systems extract 40-60 word passages, not pages. Few pages lead a section with a self-contained answer.
- **Few statistics with sources.** The Princeton GEO research ranks "cite sources" (+40%) and "add statistics" (+37%) as the top citation boosters. The course pages assert generic benefits with no numbers; the comparison pages are better but uneven.
- **No machine-readable pricing file.** AI agents evaluating Scrimba cannot parse plan structure. A `/pricing.md` (no exact dollar amounts, just plan shape and what each tier unlocks) would make the site agent-readable.
- **Schema is partial.** Course pages emit `CourseSchema`, but FAQ schema coverage is inconsistent and there is no site-wide `Organization`/`WebSite` graph audit.

Verdict: lead every section with an extractable answer, add cited numbers, ship `/pricing.md`, complete the schema graph.

### 2.5 Completeness — Critical (data), Medium (coverage)

The scraped dataset cannot support "complete" course pages:

- Only **28 of 73** courses have module-level data. The other 45 have empty `modules` arrays.
- The `projects` array is **empty for every course**, so "what you'll build" is always generic.
- There are **no lesson titles, no learning outcomes, no instructor bios** in the data, only names.
- **Descriptions are truncated at the source** (verified: Scrimba's own JSON-LD and `og:description` cut off mid-sentence), so the full text exists only in the rendered DOM.

This is why the plan starts with a re-scrape. Writing "complete" pages from the current data is impossible without inventing facts, which violates the truthfulness constraint.

Verdict: re-scrape rendered pages for full descriptions, exact lesson counts and durations, instructor profile URLs, and full module lists before writing.

### 2.6 Truthfulness — Medium

- The instructor boilerplate ("an experienced educator on the Scrimba platform") is asserted for every instructor without basis. Low harm, but it is filler stated as fact.
- Generic FAQ answers ("You will build practical projects using X concepts") imply project work that may not exist for that course.
- Positive: the project already enforces no exact prices and the author-voice constraint, and a content guardrail (`check-content.mjs`) catches em-dashes and price leaks. Recent commits fixed factual errors (Backend path duration).

Verdict: the rewrite must only state what the re-scrape verifies. Drop instructor boilerplate unless we have a real bio. Tie "what you'll build" to actual scraped projects or omit it.

### 2.7 Modularity — Medium

- Good: reusable components exist (`CourseCard`, `CourseCurriculum`, `CourseSchema`, `FAQAccordion`, `ComparisonTable`, `VerdictBox`, `PricingCTA`).
- Bad: the generated prose is monolithic and templated rather than composed of intentional, reusable blocks. The "quick answer", "verdict", "who it's for" patterns are not applied consistently, so there is no modular spine a reader or an AI can rely on.

Verdict: define the archetype as a fixed sequence of named blocks (facts in components, prose hand-written) so every page is modular in the same way.

### 2.8 Continuity — High

- **No "next step" wayfinding.** The use-apify docs use a `next_steps` frontmatter field to push readers down a funnel. Our pages end with a flat "Related Pages" list, not a guided next move.
- **Roadmaps risk losing their teaching order.** The React and Next.js roadmap pages are pedagogical sequences (quick start, then describing UI, then state, then escape hatches). If the sidebar autogenerates or sorts these alphabetically, the learning order breaks.
- **No beginner-to-advanced arc in course categories.** A learner landing on the React hub gets an alphabetical list, not a path from "Learn React" to "Advanced React".

Verdict: add explicit ordering (sidebar position or manual lists), add a "where this fits / what's next" link on every course and path page.

### 2.9 Consistency — High

- **Casing is mixed.** Some titles are Title Case, some H1s are sentence case, some headings are Title Case (an AI-writing tell per the humanizer skill).
- **Title formulas are mixed.** Course hubs use three different patterns: "Best Scrimba X Courses", "...: The Honest Catalog Map", and "Scrimba X Course Review". Paths mix "...Path Review" with bare names.
- **Practice pages** have clean frontmatter titles but blog-style H1s ("Own map, filter, and reduce before React humbles you").
- **Audience pages are split** across two sections: "Scrimba for designers/marketers/CS students/beginners" live under Paths, but "Scrimba for busy professionals" lives under FAQ.

Verdict: one title convention, one casing rule, one home for audience pages.

### 2.10 Blog (56 posts) — High

- **Topic cannibalization is the headline problem.** Multiple posts target the same query intent and split each other's authority: three "escape tutorial hell" posts (`2026-02-07-escape-tutorial-hell-scrimba`, `2026-03-27-how-to-escape-tutorial-hell-2026`, plus the vibe-coding survival post), four "vibe coding" posts, roughly eight "get hired / job market / first dev job / career change" posts, and six "best Udemy X courses" posts published the same day with a thin 496-word hub. Several also overlap docs (the web-development-roadmap post vs the roadmap docs, the hiring posts vs the paths). Google ranks one and buries the rest.
- **Same title/H1 mismatch as the docs**, in roughly 40 percent of posts. Some duplicate the title as a plain-text line under the H1, some drop the year, some change case.
- **Frontmatter is inconsistent.** No `date` or `last_update` field on any post (freshness matters for salary and job-market posts), several posts missing `tags`, a couple missing `keywords`. Single `authors: [scrimbaguide]` with no `authors.yml` and no author bio, which is an E-E-A-T miss the ai-seo and seo-audit skills both flag.
- **Mixed register.** Most posts have a genuine first-person voice (good), but the Udemy hub and roadmap posts read like docs, not articles.

Verdict: define blog topic clusters, consolidate the duplicates into pillar-plus-supporting with 301s, fix title equals H1, add `date` and `last_update` and consistent tags, add a real author identity, and set a clear canonical relationship wherever a post overlaps a doc.

### 2.11 MDX and custom components — High

There are 25 components in `src/components/` plus 11 theme swizzles. The library is capable but has real defects.

- **Two FAQ schema emitters.** `FAQAccordion` emits `FAQPage` JSON-LD by default and `DocFaqSchema` emits it separately. A page using both ships two `FAQPage` blocks, which is exactly the duplicate structured data the schema-markup skill warns against. Comparison pages appear to use both.
- **CTA stacking.** `PricingCTA`, `VerdictBox` (embedded CTA), `DesktopStickyCTA` (auto-injected on money pages), and `BlogContextualCta` (auto-injected on posts) fire independently. A single review post can show three or four competing CTAs with no conflict detection, which dilutes conversion (page-cro).
- **Invalid schema risk.** `CourseSchema`'s `toISODuration()` returns the raw string when it cannot parse it, so a value like "2 weeks" ships as an invalid `timeRequired` and Google rejects the block.
- **Hardcoded data that should be sourced.** `LearningTimeCalculator` hardcodes path hours that already live in `data/courses.json` (drift risk), and `WhyScrimba` and `DesktopStickyCTA` hardcode marketing copy.
- **Accessibility gaps.** `LearningTimeCalculator` range input has no real `<label for>` association, `ProBadge` has no aria context, `VisualProofPlaceholder` relies on emoji with no fallback.
- **Dead or stub components.** `ProBadge`, `VisualProofPlaceholder`, and the disabled `EmailCapture` stub are unused. Either wire them in or delete them.
- **Inconsistent analytics.** The GA `location` prop has different defaults across `AffiliateLink`, `PricingCTA`, `CourseCard`, and `VerdictBox`, so conversion reporting is fragmented.
- **Styling drift.** Most components use global classes in `custom.css`, but `LearningTimeCalculator` ships a 150-line embedded `<style>` block that re-declares theme variables.

Verdict: one FAQ schema per page, one CTA per context with suppression flags, fix the schema fallback, centralize data and copy, close the a11y gaps, remove dead components, standardize the analytics prop.

### 2.12 Navbar, custom pages, and tools — High

- **Tools are orphaned or broken.** `/tools/which-scrimba-path` is a redirect stub to `/docs/paths#path-advisor`, yet the homepage's "Find my path" button points at it, so the primary self-segmentation CTA bounces through a dead page. The bootcamp cost calculator is not linked from the navbar, homepage, or pricing page. The `/roadmaps/frontend-roadmap-2026` page duplicates the frontend path page with no added value and is undiscoverable.
- **Navbar labels do not match the rest of the site.** Navbar "Comparisons" vs sidebar "Scrimba vs Alternatives" vs homepage "Scrimba next to the platforms you are already considering"; "Learning Paths" vs "Path Advisor" vs individual path names. The "Tools" dropdown holds only doc anchors, not tools. "Start Here" is ambiguous.
- **Homepage is strong but leaks.** The hero and copy are good and honest, but social proof is thin (a Trustpilot number, no learner outcomes or testimonials), the secondary CTA hits the broken tool, and the newsletter capture is disabled so there is no lead magnet. Course descriptions use unexplained jargon (RAG, MCP).
- **Trust pages are buried or wrong.** About is not in the navbar, and the Contact page's Twitter link points to Scrimba's official account, not the guide's.
- **Theme is cohesive but generic.** Purple plus sans-serif reads like default Docusaurus and like several competitors; accessible and clean, but no distinct visual identity.

Verdict: build a real `/tools/` hub and surface it, make the path finder an actual tool (or link straight to the advisor), unify navbar labels with the sidebar, add real social proof to the homepage, decide the newsletter question, and fix the trust-page placement and the Contact link.

---

## 3. Target standard

### 3.1 Doc title convention

1. One title per page: frontmatter `title` equals body `# H1`. No `sidebar_label`, no second heading. (Proven safe: `faq/billing.mdx` already does this.)
2. Topic-first and query-matching. Lead with what a searcher types. No taglines or personality in the title.
3. Demote the witty current H1s to the opening sentence or a section heading. Voice stays in the body, off the title.
4. Concise, at most about 50 characters, so the sidebar does not truncate. The theme appends " | Scrimba Guide" to the HTML title, yielding a clean ~60-char SERP title.
5. Page titles in Title Case; section H2/H3 in sentence case.
6. SEO and AI-SEO richness lives in the description, the H2s, the body, and the schema, not the title. Every page still opens with a 40-60 word extractable quick answer.
7. No year stamps in titles. Freshness goes in `last_update`.

### 3.2 Information architecture (sidebar, URLs, redirects)

Re-sequence the top level around the reader's decision path, and make the URL namespace match each group. Pages that belong in a new section move there, and the old URLs get 301s. Sidebar grouping and breadcrumbs both come from `sidebars.ts`, but we still move the files so the URL reflects the hierarchy (a page under "How Scrimba Works" should live at `/docs/how-it-works/...`, not `/docs/faq/...`). Course-page order inside a category is set explicitly (an ordered `doc` list or `sidebar_position`), not left to alphabetical autogeneration.

The ideal top level, with its URL namespace:

```
1.  Start Here            /docs/intro          What is Scrimba?
2.  How Scrimba Works     /docs/how-it-works/  how scrims work, using Scrimba, is it free,
                                                accreditation, certificates, learning speed, tutorial hell
3.  Pricing               /docs/pricing/       pro vs free, student discount, refund policy, vs coding bootcamps
4.  Scrimba vs Alternatives /docs/comparisons/ index + 13 comparisons
5.  Learning Paths        /docs/paths/         frontend, backend, fullstack, AI engineer, 6-month study plan
6.  Who It's For          /docs/for/           beginners, CS students, designers, marketers, busy professionals
7.  Courses by Topic      /docs/courses/       catalog + 7 category hubs + course pages (beginner to advanced)
8.  Practice              /docs/practice/      the "Practice X" set + project ideas
9.  React Roadmap         /docs/learn-react/   pedagogical order (quick start ... server components)
10. Next.js Roadmap       /docs/learn-nextjs/  pedagogical order (getting started, routing, rendering, data)
11. Help & Support        /docs/help/          billing, troubleshooting, community and events
12. Updates               /docs/changelog      changelog
```

The FAQ index `/docs/faq/` stays as a curated FAQ hub (FAQPage schema, links to the distributed answers) because "scrimba faq" is a valuable query. Everything else under `/docs/faq/` moves to its logical home.

Redirect map (old URL to new URL, each a 301 added to client-redirects; repoint inbound internal links because `onBrokenLinks` is `throw`):

```
/docs/faq/how-scrims-work            -> /docs/how-it-works/how-scrims-work
/docs/faq/how-to-use-scrimba         -> /docs/how-it-works/using-scrimba
/docs/faq/is-scrimba-free            -> /docs/how-it-works/is-scrimba-free
/docs/faq/scrimba-accreditation      -> /docs/how-it-works/accreditation
/docs/faq/certificates               -> /docs/how-it-works/certificates
/docs/faq/learning-speed             -> /docs/how-it-works/learning-speed
/docs/faq/tutorial-hell              -> /docs/how-it-works/tutorial-hell
/docs/faq/billing                    -> /docs/help/billing
/docs/faq/platform-issues            -> /docs/help/troubleshooting
/docs/faq/community-and-events       -> /docs/help/community-and-events
/docs/faq/discord-community          -> /docs/help/community-and-events   (merge)
/docs/faq/scrimba-for-busy-professionals -> /docs/for/busy-professionals
/docs/paths/scrimba-for-beginners    -> /docs/for/beginners
/docs/paths/scrimba-for-cs-students  -> /docs/for/cs-students
/docs/paths/scrimba-for-designers    -> /docs/for/designers
/docs/paths/scrimba-for-marketers    -> /docs/for/marketers
```

Course-page ordering within a category uses an explicit ordered `doc` list in `sidebars.ts` or `sidebar_position` frontmatter, beginner to advanced, never alphabetical autogeneration.

### 3.3 Course-page archetype

Hand-written prose wrapped around factual components.

```
frontmatter: clean title (= H1), real 150-char description, keywords, last_update
# H1 (clean course name)
one-line human blurb
## Quick answer            40-60 words, extractable
<CourseCard>               facts only: duration, lessons, level, access, instructor + profile link
## Is it worth your time?  honest verdict
## What you'll learn       <CourseCurriculum> real modules + prose framing the arc
## Who it's for / skip if
## Prerequisites
## Where it fits           link to relevant Learning Path
## Free vs Pro             link to /our-pricing, never an exact price
## Strengths and limits    honest pros and cons
## Related courses & comparisons
## FAQ                     real Q&A, FAQPage schema
CTA <AffiliateLink> / <PricingCTA>
<CourseSchema>             factual JSON-LD
```

Target length about 900 to 1,400 words. Sections appear only when we have truthful material for them.

### 3.4 Blog standard

- Title equals H1, same convention as docs. Remove duplicated title lines under the H1.
- Frontmatter on every post: `title`, `description`, `slug`, `authors`, `tags`, `keywords`, `image`, `image_alt`, `date`, `last_update`.
- One real author identity in `authors.yml` with a bio and links (E-E-A-T), reused across posts.
- Topic clusters with a clear canonical per intent. Each cluster has one pillar post; supporting posts link up to the pillar and target a distinct long-tail or narrative angle. Where a post overlaps a doc, the doc is canonical for the head term and the post takes the narrative or news angle and links to the doc.
- Consolidations (pillar plus 301s): merge the three tutorial-hell posts into one, the four vibe-coding posts into a pillar plus at most one supporting angle, the eight hiring posts into a "get hired" pillar with a few supporting posts, and expand the thin Udemy hub or fold it into the six topic posts.

### 3.5 Component consolidation

- One FAQ schema per page. `FAQAccordion` is the single source (it renders the visible accordion and emits the schema). Retire `DocFaqSchema`, or make it render-only with no JSON-LD. Never emit two `FAQPage` blocks.
- One CTA per context. Decide a single CTA per page type, and have auto-injected CTAs (`DesktopStickyCTA`, `BlogContextualCta`, footer `PricingCTA`) suppress themselves when a page-level CTA is present, via frontmatter flags.
- `CourseSchema.toISODuration()` omits `timeRequired` when it cannot produce valid ISO 8601 rather than shipping a raw string.
- Centralize data: `LearningTimeCalculator` reads path hours from `scrimbaFacts`/`data`, not hardcoded; marketing copy (`WhyScrimba`, sticky CTA) moves to a content config.
- Accessibility: real `<label for>` on the calculator input, aria context on `ProBadge`, non-emoji fallback on `VisualProofPlaceholder`.
- Remove or wire in dead components (`ProBadge`, `VisualProofPlaceholder`, `EmailCapture`).
- Standardize the GA `location` prop and its defaults across all CTA components.
- Move the `LearningTimeCalculator` embedded styles into `custom.css`.

### 3.6 Navbar, pages, and tools

- Navbar: `Logo | Learn (dropdown: Paths, Courses, Comparisons, Pricing, FAQ) | Blog | Tools (dropdown: Path Finder, Cost Calculator, Roadmaps) | [right] Get Pro CTA`. Labels match the sidebar category names exactly.
- Tools: build a real `/tools/` hub page; make the path finder a genuine standalone quiz (or point the homepage CTA directly at `/docs/paths#path-advisor` and drop the stub); surface the bootcamp calculator from the navbar and the pricing and vs-bootcamps pages; either differentiate the roadmap pages from the path pages or fold them into the docs roadmaps.
- Homepage: add a real social-proof block (learner outcomes or quotes, the Trustpilot link), fix the secondary CTA target, resolve the newsletter question (enable a lead magnet or remove the stub), and expand jargon (RAG, MCP) into plain language.
- Trust: add About to the navbar or a prominent footer slot; fix the Contact Twitter link to the guide's own account.
- Labels: one name per concept across navbar, sidebar, and homepage headings.

---

## 4. Full title map (before to after)

In every row the new title and the H1 become the same string.

### Comparisons (clean "Scrimba vs X", which is also the exact search query)

| file | new title = H1 |
|---|---|
| index | Scrimba vs Alternatives |
| scrimba-vs-boot-dev | Scrimba vs Boot.dev |
| scrimba-vs-codecademy | Scrimba vs Codecademy |
| scrimba-vs-coursera | Scrimba vs Coursera |
| scrimba-vs-educative | Scrimba vs Educative |
| scrimba-vs-fireship | Scrimba vs Fireship |
| scrimba-vs-freecodecamp | Scrimba vs freeCodeCamp |
| scrimba-vs-frontendmasters | Scrimba vs Frontend Masters |
| scrimba-vs-odin-project | Scrimba vs The Odin Project |
| scrimba-vs-pluralsight | Scrimba vs Pluralsight |
| scrimba-vs-treehouse | Scrimba vs Treehouse |
| scrimba-vs-udemy | Scrimba vs Udemy |
| scrimba-vs-youtube | Scrimba vs YouTube |
| scrimba-vs-zerotomastery | Scrimba vs Zero to Mastery |

### Pricing

| file | new title = H1 |
|---|---|
| index | Scrimba Pricing |
| pro-vs-free | Scrimba Pro vs Free |
| student-discount | Scrimba Student Discount |
| refund-policy | Scrimba Refund Policy |
| scrimba-vs-bootcamps | Scrimba vs Coding Bootcamps |

### Learning Paths

| file | new title = H1 |
|---|---|
| index | Scrimba Learning Paths |
| frontend-developer-path | Scrimba Frontend Developer Path |
| backend-developer-path | Scrimba Backend Developer Path |
| fullstack-developer-path | Scrimba Fullstack Developer Path |
| ai-engineer-path | Scrimba AI Engineer Path |
| study-plan | Scrimba 6-Month Study Plan |

### Who It's For (audience)

All five move into the `/docs/for/` namespace (see redirect map in 3.2). New slugs drop the `scrimba-for-` prefix since the namespace carries it.

| current file | new URL | new title = H1 |
|---|---|---|
| paths/scrimba-for-beginners | /docs/for/beginners | Scrimba for Beginners |
| paths/scrimba-for-cs-students | /docs/for/cs-students | Scrimba for CS Students |
| paths/scrimba-for-designers | /docs/for/designers | Scrimba for Designers |
| paths/scrimba-for-marketers | /docs/for/marketers | Scrimba for Marketers |
| faq/scrimba-for-busy-professionals | /docs/for/busy-professionals | Scrimba for Busy Professionals |

### How Scrimba Works and Help (was FAQ)

The understanding pages move to `/docs/how-it-works/` and the support pages to `/docs/help/` (see 3.2). The FAQ index stays at `/docs/faq/` as a curated hub.

| current file | new URL | new title = H1 |
|---|---|---|
| faq/index | /docs/faq/ (hub, stays) | Scrimba FAQ |
| faq/how-scrims-work | /docs/how-it-works/how-scrims-work | How Scrimba Scrims Work |
| faq/how-to-use-scrimba | /docs/how-it-works/using-scrimba | How to Use Scrimba |
| faq/is-scrimba-free | /docs/how-it-works/is-scrimba-free | Is Scrimba Free? |
| faq/scrimba-accreditation | /docs/how-it-works/accreditation | Is Scrimba Accredited? |
| faq/certificates | /docs/how-it-works/certificates | Scrimba Certificates |
| faq/learning-speed | /docs/how-it-works/learning-speed | How Long to Learn Coding on Scrimba |
| faq/tutorial-hell | /docs/how-it-works/tutorial-hell | Escaping Tutorial Hell |
| faq/billing | /docs/help/billing | Scrimba Billing & Payments |
| faq/platform-issues | /docs/help/troubleshooting | Scrimba Troubleshooting |
| faq/community-and-events | /docs/help/community-and-events | Scrimba Community & Events (absorbs the old Discord page) |

Merge: `faq/discord-community` is folded into `community-and-events` with a 301. The combined page keeps a dedicated Discord section and absorbs the Discord-specific FAQ entries, removing the cannibalization between two thin pages both targeting "scrimba discord".

### Practice Guides (consistent "Practice X"; demote blog-y H1s to intro lines)

| file | new title = H1 |
|---|---|
| practice-css-grid | Practice CSS Grid |
| practice-flexbox | Practice CSS Flexbox |
| practice-tailwind-css | Practice Tailwind CSS |
| practice-javascript-arrays | Practice JavaScript Arrays |
| practice-api-calls | Practice API Calls |
| practice-react-hooks | Practice React Hooks |
| practice-typescript | Practice TypeScript |
| practice-ai-engineering | Practice AI Engineering |
| practice-react-projects | React Practice Projects |
| react-portfolio-project-ideas | React Portfolio Project Ideas |
| build-a-weather-app-interactively | Build a Weather App in React |

### React Roadmap (keep pedagogical order in the sidebar)

| file | new title = H1 |
|---|---|
| index | React Learning Roadmap |
| quick-start | React Quick Start |
| describing-ui | Describing the UI |
| adding-interactivity | Adding Interactivity |
| managing-state | Managing State |
| escape-hatches | Escape Hatches |
| server-components | React Server Components |

### Next.js Roadmap

| file | new title = H1 |
|---|---|
| index | Next.js Learning Roadmap |
| getting-started | Getting Started with Next.js |
| routing | Next.js Routing |
| rendering | Next.js Rendering |
| data-fetching | Next.js Data Fetching |

### Course category hubs (drop "Best...2026" and "Honest Catalog Map" flavor)

| file | new title = H1 |
|---|---|
| courses/index | All Scrimba Courses |
| react/index | Scrimba React Courses |
| javascript/index | Scrimba JavaScript Courses |
| css/index | Scrimba CSS & Design Courses |
| ai/index | Scrimba AI Courses |
| backend/index | Scrimba Backend Courses |
| python/index | Scrimba Python Courses |
| typescript/index | Scrimba TypeScript Courses |

### Intro

`What is Scrimba? The Complete Guide` becomes `What is Scrimba?`

### 73 course pages

Not a retitle, a rewrite (section 5). New title equals the bare clean course name from the JSON-LD breadcrumb, for example `Advanced React`, `Advanced JavaScript`, `Learn SQL` (H1 identical). No "Scrimba" prefix and no "...on Scrimba" suffix: the category already namespaces these ("Scrimba React Courses"), the theme appends " | Scrimba Guide" to the HTML title, and the body plus `Course` schema carry the brand. Bare names keep the sidebar clean and let each category read as a beginner-to-advanced sequence.

---

## 5. Course-page rewrite and data plan

### 5.1 Re-scrape (verified necessary)

Scrimba truncates its own descriptions, so the full overview text exists only in the rendered DOM. Extend `scraper/scrape.py` to render each course page and capture, per course:

- clean name (BreadcrumbList JSON-LD, position 3)
- full overview text (rendered DOM, not the truncated meta)
- exact lesson count and `timeRequired` (JSON-LD, ISO 8601 duration)
- level, free vs Pro (`educationalLevel`, `isAccessibleForFree`)
- instructor name and profile URL (JSON-LD `instructor`)
- `teaches` / keywords, `datePublished`, `dateModified`
- full module list: names, durations, lesson counts (rendered `toc-group.l0`)
- probe for lesson-level titles inside modules; use if present, omit if not (never invent)

Then rebuild `data/courses.json` via `build-data.mjs`.

### 5.2 Retire the generator's prose

Keep `generate-course-pages.mjs` only as an optional scaffold that emits frontmatter plus the factual components (`CourseCard`, `CourseCurriculum`, `CourseSchema`), or drop it entirely. All prose is hand-written against the archetype in section 3.3.

### 5.3 Editorial guardrails (already partly enforced)

No em-dashes, no exact prices (link to `/our-pricing`), affiliate links via `<AffiliateLink>`, catalog-reviewer voice (no completion claims). Run the humanizer final pass on a sample of each category before shipping it.

---

## 6. Cross-cutting work (apply once, site-wide)

- Schema: `Course` plus `BreadcrumbList` on course pages, `FAQPage` on every page with a FAQ, `Article` on guides, `Organization` and `WebSite` site-wide. Validate in the Rich Results Test (curl cannot see JS-injected schema; use the rendered build or the test tool).
- Internal linking: hub and spoke. Each category hub links to all its course pages; each course page links back to the hub, the relevant path, two or three siblings, and a comparison. No orphan pages.
- AI agent files: add `/pricing.md` (plan shape and what each tier unlocks, no exact dollar amounts), regenerate `llms.txt` and `llms-full.txt` from the new sitemap.
- Freshness: `last_update` on every page.

---

## 7. Interlinking strategy

A hub-and-spoke mesh layered with a forward funnel. Now that URLs match the hierarchy, breadcrumbs and grouping reinforce it for free.

### 7.1 Hubs (pillars)

`/docs/courses/` (catalog) links to the 7 category hubs. Each category hub (`/docs/courses/{topic}/`) links to every course in it, ordered beginner to advanced. `/docs/paths/`, `/docs/comparisons/`, `/docs/pricing/`, and `/docs/for/` are the other hubs. The blog has one pillar per topic cluster.

### 7.2 Spoke rules by page type

- **Course page:** up to its category hub and the catalog; across to 2-3 sibling courses (same category, adjacent level), one relevant comparison, and one practice guide; out to the path(s) it belongs to. Carried by the archetype's "Where it fits" and "Related courses & comparisons" sections.
- **Category hub:** down to all its courses (ordered), across to 1-2 sibling categories, up to the catalog, plus the most relevant path and comparison.
- **Path page:** to each course in its curriculum in sequence, to `/docs/pricing/`, to the matching `/docs/for/` audience page, and to 1-2 relevant comparisons.
- **Audience page (`/docs/for/X`):** to the recommended path, 2-3 starter courses, pricing, and the relevant practice guides.
- **Comparison page:** to the courses and paths that back its claims, to pricing; the comparisons index links to all 13.
- **Pricing pages:** to paths, to free courses (`is-scrimba-free`), to `vs-coding-bootcamps` and the cost calculator.
- **How-it-works pages:** to pricing, paths, and relevant courses; `tutorial-hell` links to practice and paths.
- **Practice page:** to the courses that teach the skill and the matching roadmap step.
- **Roadmap step:** previous and next within the sequence, plus the courses covering that step.
- **Blog post:** to the canonical doc for its head term, a path or pricing CTA, and its cluster (pillar and supporting posts link both ways).

### 7.3 Mechanisms

- **`next_steps` frontmatter** (adopt the use-apify pattern): 2-4 curated forward links per page, rendered as a "Next steps" block. This is the funnel spine.
- **`RelatedGuides`** (already auto-injected on docs): curate through `relatedGuidesMap.ts` so it is intentional, not random.
- **Breadcrumbs** from the sidebar, on every page, now meaningful because URLs match the hierarchy.
- **In-prose contextual links** with descriptive anchor text, roughly 5-10 per 1,000 words, never "click here".
- The course archetype's "Where it fits" and "Related courses & comparisons" blocks.

### 7.4 Anti-cannibalization and no orphans

- One canonical page per query intent. When a blog post and a doc compete, the doc owns the head term and the post links to it and takes a narrative angle.
- Consolidate duplicate blog clusters with 301s (section 3.4).
- No orphan pages. Every page is reachable from at least one hub and from `next_steps` or `RelatedGuides`. Fix the orphaned tools, roadmap, and About page by linking them from the navbar, footer, homepage, and relevant docs.

### 7.5 Equity and anchor text

- Point the most internal links at the money pages: paths, pricing, the catalog, and the category hubs.
- Vary anchor text naturally around the target's primary term; no exact-match spam.

---

## 8. Skills, tooling, and references

### 8.1 Skills to load

Load via the Skill tool using these exact names. Load the writing and SEO core at the start of any content batch; load the rest as the batch needs them.

Writing and SEO core:

- `humanizer` — strip AI-writing tells (significance inflation, rule of three, -ing analyses, em-dashes, Title Case headings, boldface lists) and add voice. Run as a final pass on every page before shipping.
- `marketing-skills:copywriting` — headlines, value-first prose, CTA copy, page structure.
- `marketing-skills:copy-editing` — line-level polish pass after the draft.
- `marketing-skills:ai-seo` — extractable 40-60 word answer blocks, GEO citation tactics (cite sources, add statistics), the `/pricing.md` machine file, `llms.txt`.
- `marketing-skills:seo-audit` — titles, meta descriptions, heading hierarchy, internal links, indexation, canonicalization.
- `marketing-skills:schema-markup` — `Course`, `FAQPage`, `BreadcrumbList`, `Organization`, `WebSite` JSON-LD.
- `marketing-skills:site-architecture` — sidebar IA, URL structure, hub-and-spoke internal linking, breadcrumb alignment.
- `marketing-skills:page-cro` — verdict and CTA placement, trust signals, objection handling, scannability.

Optional, situational:

- `marketing-skills:marketing-psychology` — persuasion framing for verdict and CTA sections.
- `marketing-skills:content-strategy` — only if reworking topic clusters or planning new pages.

QA (slash skills, run before each PR):

- `verify` — launch the build and confirm pages render as intended.
- `code-review` — review the diff for correctness before opening the PR.

### 8.2 Skills per batch

| Batch | Load these skills |
|---|---|
| 1 (titles = H1) | copywriting, copy-editing, seo-audit, humanizer |
| 2 (IA restructure + moves) | site-architecture, seo-audit |
| 3 (re-scrape) | none (data work) |
| 4 (component consolidation) | schema-markup, page-cro |
| 5 and 6 (course rewrites) | copywriting, ai-seo, page-cro, schema-markup, humanizer, copy-editing |
| 7 (category hubs) | copywriting, site-architecture, ai-seo, humanizer |
| 8 (blog overhaul) | content-strategy, copywriting, copy-editing, seo-audit, humanizer |
| 9 (navbar, pages, tools) | site-architecture, page-cro, copywriting |
| 10 (interlinking, schema, AI files) | site-architecture, schema-markup, ai-seo, seo-audit |
| 11 (build, PR, deploy, GSC) | verify, code-review |

### 8.3 Tooling and commands

```
make install         Node + Python deps (.venv + node_modules)
make dev             local server on :3000
make build           docusaurus build + generate llms.txt / llms-full.txt
make typecheck       tsc, no emit
make serve           build then serve the static output

make scrape          full Selenium crawl (re-scrape, batch 3)
make scrape-resume   resume an interrupted scrape
make generate-data   output/index.json -> data/*.json
make generate-pages  data/courses.json -> docs/courses/**/*.mdx (only if keeping a scaffold)
make pipeline        scrape -> generate -> build end to end
```

Tests and guardrails:

- `npm run test:llms`, or a single file with `node --test scripts/__tests__/<file>.test.mjs`.
- `scripts/check-content.mjs` runs as a `prebuild` hook and fails the build on em-dashes and exact-price leaks. Keep it green.
- Node 20+ required. The scraper runs in the Python `.venv`.
- After a build, verify titles and schema from the local `build/` directory, not the live site.

### 8.4 References and constraints

- Editorial memory (must follow): no em-dashes, no exact Scrimba prices (link to `https://scrimba.com/our-pricing`), Scrimba links via `<AffiliateLink>` only, catalog-reviewer voice with no completion claims.
- `docusaurus.config.ts`: `trailingSlash: true` is canonical; `SITEMAP_EXCLUDED_PATHS` and `SITEMAP_EXCLUDED_DOC_ALIASES` exclude redirect stubs; `sitemapPriority()` sets per-path priority; client-redirects are spread from `data/course-redirects.json`. Add new legacy URLs as redirects, not pages.
- Schema validation: `curl` and `web_fetch` cannot see JS-injected JSON-LD. Validate with the Google Rich Results Test or by reading the rendered `build/` output.
- Components live in `src/components/`; swizzled theme overrides in `src/theme/`; global styles in `src/css/custom.css`.

---

## 9. Batch execution order

| Batch | Scope | Redirects | Depends on |
|---|---|---|---|
| 1 | Title equals H1 unification across all hand-authored docs (the map in section 4) | none | none |
| 2 | IA restructure: move files into `/docs/how-it-works/`, `/docs/help/`, `/docs/for/`; merge `discord-community`; set explicit sidebar order in `sidebars.ts`; add all 301s and repoint inbound links | ~19 (see 3.2) | 1 |
| 3 | Re-scrape enrichment, rebuild `data/courses.json` | none | none |
| 4 | Component consolidation (FAQ schema dedup, CTA suppression, schema fallback, data and copy centralization, a11y, remove dead components, GA prop, styles) and retire generator prose | none | 3 |
| 5 | Rewrite React course pages (pilot), then review | none | 3, 4 |
| 6 | Rewrite remaining categories: JS, CSS, AI, Backend, Python, TS | none | 5 |
| 7 | Rewrite the 8 category hub pages | none | 6 |
| 8 | Blog overhaul: title equals H1, frontmatter (`date`, `last_update`, tags), `authors.yml` and bio, consolidate the cannibalizing clusters with 301s, set doc-vs-post canonicals | several (cluster consolidations) | none |
| 9 | Navbar, pages, and tools: navbar reorg and label unification, `/tools/` hub, real path finder, surface the cost calculator, roadmap decision, homepage social proof and secondary CTA and newsletter and jargon, About in nav, Contact link fix | minimal | 2 |
| 10 | Interlinking (section 7: `next_steps`, `RelatedGuides` curation, hub and spoke), schema graph, `/pricing.md`, llms.txt | none | 6, 7, 8, 9 |
| 11 | Build, PR, deploy, one-time GSC re-index | n/a | all |

Batches 1, 3, and 8 have no dependencies and can start in parallel. Batch 2 carries the redirect load: do it deliberately and repoint every inbound internal link, because `onBrokenLinks` is `throw`. Batch 10 is the integration pass and must come last.

---

## 10. Resolved decisions

These are settled. The plan above already reflects them. The overarching call: optimize for the ideal long-term architecture and accept a one-time GSC re-index. URLs reflect the hierarchy even when that means moving files and adding 301s.

1. **FAQ split: move files into `/docs/how-it-works/` and `/docs/help/` with 301s.** The understanding pages (how scrims work, using Scrimba, is it free, accreditation, certificates, learning speed, tutorial hell) move to `/docs/how-it-works/`; the support pages (billing, troubleshooting, community) move to `/docs/help/`. The URL must match the section, so we move the files rather than only regrouping the sidebar. The FAQ index stays at `/docs/faq/` as a curated hub. See the redirect map in section 3.2.

2. **Audience pages: consolidate all of them under `/docs/for/` with 301s.** Move `paths/scrimba-for-*` out of `/docs/paths/` and `faq/scrimba-for-busy-professionals` out of `/docs/faq/` into one clean `/docs/for/` namespace (`/docs/for/beginners`, `/docs/for/designers`, and so on). One home, one URL pattern, correct hierarchy.

3. **Course-page titles: bare clean course name** (for example "Advanced React"), title equal to H1. The category namespaces them, the theme appends " | Scrimba Guide", and the body plus schema carry the brand. Bare names keep the sidebar clean and let each category read beginner to advanced. No "Scrimba" prefix, no "...on Scrimba" suffix.

4. **Merge `discord-community` into `community-and-events` with a 301.** Two thin pages both targeting "scrimba discord" cannibalize each other. One authoritative "Scrimba Community & Events" page with a dedicated Discord section ranks for both queries and consolidates link equity. This is the only redirect the overhaul introduces, and it is consolidation rather than relocation.
