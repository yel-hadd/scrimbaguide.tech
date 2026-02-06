# ScrimbAGuide — Completion Plan

This document is a step-by-step, ordered checklist for an AI agent to bring the affiliate website to 100% completion. Each task includes context, file paths, data sources, and acceptance criteria.

---

## Table of Contents

1. [Phase 1: Fix Data Quality Issues in Generated Course Pages](#phase-1-fix-data-quality-issues-in-generated-course-pages)
2. [Phase 2: Fix Course Misclassifications](#phase-2-fix-course-misclassifications)
3. [Phase 3: Expand Placeholder Blog Posts](#phase-3-expand-placeholder-blog-posts)
4. [Phase 4: Create Missing Brand Assets](#phase-4-create-missing-brand-assets)
5. [Phase 5: SEO Hardening](#phase-5-seo-hardening)
6. [Phase 6: Affiliate Conversion Optimization](#phase-6-affiliate-conversion-optimization)
7. [Phase 7: Final Quality Assurance](#phase-7-final-quality-assurance)

---

## Conventions & Context

Before starting, the agent MUST understand these project conventions:

- **Affiliate code**: All outbound Scrimba links use `?via=u42d4986` via the `<AffiliateLink>` component in `src/components/AffiliateLink.tsx`
- **Components available**: `AffiliateLink`, `CourseCard`, `ComparisonTable`, `PricingCTA`, `FAQAccordion`, `ProBadge`, `CourseSchema` — barrel-exported from `src/components/index.ts`
- **MDX imports**: Every content page that uses components must import them from `@site/src/components/ComponentName`
- **Internal linking**: Hub-and-spoke model. Topic hubs (`docs/courses/{topic}/index.mdx`) link down to courses; courses link back up and to related courses. Every page should link to at least 3 other pages.
- **Blog slugs**: All blog posts MUST have `slug` in frontmatter for clean URLs (e.g., `slug: scrimba-review` → `/blog/scrimba-review`)
- **Blog authors**: Use `authors: [scrimbaguide]` (defined in `blog/authors.yml`)
- **Blog tags**: Use tags from `blog/tags.yml`: `review`, `comparison`, `guide`, `pricing`, `courses`, `career`, `ai`
- **Tone**: Honest, helpful, third-party reviewer. Not salesy. Acknowledge limitations alongside strengths.
- **onBrokenLinks**: Config is set to `'throw'`. Every internal link must resolve. Verify with `npm run build`.
- **Scraped data**: Raw data is in `output/index.json` (164 entries: 88 courses, 40 help, 16 topics, 16 marketing). Processed data is in `data/courses.json`.

---

## Phase 1: Fix Data Quality Issues in Generated Course Pages

**Priority: HIGH** — These are visible quality bugs on ~30+ pages.

### 1.1 Fix generic "Tutorial" link text in Related Courses

**Problem**: The `scripts/generate-course-pages.mjs` script uses the raw course title from scraped data for related course link text. Many titles start with "Tutorial:" which gets stripped to just "Tutorial", producing generic links like `- [Tutorial](/docs/courses/react/reusable-react-components)`.

**Affected**: 22 instances across generated course pages.

**Fix**: Edit `scripts/generate-course-pages.mjs`. In the related courses section, use the `docSlug` to generate a human-readable name if the title is too generic. Specifically:
1. Read the current logic that generates related course links (search for `relatedCourses`)
2. If the display title is just "Tutorial" or starts with "Tutorial:", replace it with the course's cleaned `docSlug` title-cased (e.g., `reusable-react-components` → `Reusable React Components`)
3. Re-run `node scripts/generate-course-pages.mjs` to regenerate all course pages

**Acceptance**: No link text in any `docs/courses/**/*.mdx` file should be just `[Tutorial]`.

### 1.2 Fix truncated descriptions

**Problem**: Some course descriptions are cut off mid-sentence because the scraped `meta_description` was truncated. Example from `advanced-react.mdx`: "This massive course aims to turn you into hireable React developer as fast as" (cuts off).

**Fix**: 
1. Grep for descriptions ending without punctuation: `rg 'description="[^"]*[a-z]"$' docs/courses/`
2. For each truncated description, check the scraped markdown in `output/scrimba.com/course/{slug}/index.md` for the full text
3. Update the description in the generated `.mdx` file, OR fix the generation script to handle truncation (append "..." or use the first full sentence)
4. Also fix the `<CourseCard description=...>` prop and the "About This Course" paragraph which use the same truncated text

**Acceptance**: No description in any course page ends mid-word or mid-sentence.

### 1.3 Fix incorrect duration for Advanced React

**Problem**: `docs/courses/react/advanced-react.mdx` shows `duration="109 min"` but the course is actually 13.2 hours (the 109 min is one module's duration, not the whole course). This is a parsing bug in `scripts/build-data.mjs`.

**Fix**:
1. In `scripts/build-data.mjs`, the `parseCourse()` function reads duration from body text lines matching `/^\d+(\.\d+)?\s*(hrs?|min)$/i`. It picks the first match, which may be a module duration, not the course total.
2. Fix the heuristic: prefer the first duration that appears BEFORE any h2 heading (this is typically the course-level metadata), not just the first match anywhere in the body
3. Re-run `node scripts/build-data.mjs && node scripts/generate-course-pages.mjs`
4. Spot-check 5 course pages against their scraped source to verify durations

**Acceptance**: Course duration on each page matches the total course duration shown on scrimba.com.

---

## Phase 2: Fix Course Misclassifications

**Priority: HIGH** — Tailwind CSS courses incorrectly appear under AI.

### 2.1 Move misclassified courses to correct categories

**Problem**: Two Tailwind CSS courses are classified under `docs/courses/ai/` instead of `docs/courses/css/`:
- `docs/courses/ai/tailwind-css.mdx` (Tailwind CSS tutorial)
- `docs/courses/ai/a-product-card-with-tailwind-css.mdx` (Build a product card with Tailwind)

The keyword `ai` in "Tailwind" matches the AI topic keyword list in `scripts/build-data.mjs`.

**Fix**:
1. In `scripts/build-data.mjs`, update the `TOPIC_KEYWORDS.AI` array: change `'ai'` to a more specific set like `'ai-engineer'`, `'openai'`, `'intro-to-ai'`. Or add negative matches: exclude slugs containing `tailwind` from AI classification.
2. Re-run: `node scripts/build-data.mjs && node scripts/generate-course-pages.mjs`
3. Verify the two Tailwind courses now appear under `docs/courses/css/` not `docs/courses/ai/`
4. Delete any orphaned files from `docs/courses/ai/tailwind-css.mdx` and `docs/courses/ai/a-product-card-with-tailwind-css.mdx` if the script doesn't clean them

**Acceptance**: `docs/courses/ai/` contains only actual AI/ML courses. Tailwind courses appear in `docs/courses/css/`.

### 2.2 Audit all category assignments

After fixing the keyword logic, manually verify these edge cases in `data/courses.json`:
- `Build a Support Agent with Vercel AI SDK` → should be `ai` (correct)
- `Learn Context Engineering` → should be `ai` (verify)
- `Intro to Model Context Protocol (MCP)` → should be `ai` (verify)
- `Build Websites with Figma, HTML, CSS, and JavaScript` → should be `css` (verify, could be `javascript`)
- `Learn Imba` → currently probably `javascript` (acceptable)
- `D3` → currently `javascript` (acceptable)

Fix any remaining misclassifications in the keyword map and regenerate.

---

## Phase 3: Expand Placeholder Blog Posts

**Priority: HIGH** — 10 of 13 blog posts are placeholders (300-500 words). They need to be expanded to 1,000-1,500+ words each to rank in search.

### Content Guidelines for All Blog Posts

- Minimum 1,000 words of real content (excluding frontmatter and component markup)
- Include at least one `<AffiliateLink>` CTA naturally within the post body
- End with a `<PricingCTA />` component
- Include a "Related Pages" section with 3-5 internal links
- Use `{/* truncate */}` after the first 2-3 paragraphs to set the blog excerpt
- Include at least one `<FAQAccordion>` with 3 FAQ items targeting long-tail search queries
- Every blog post must have: `slug`, `title`, `description`, `authors: [scrimbaguide]`, `tags`, `keywords` in frontmatter
- Reference specific course names, durations, and facts from `data/courses.json` and `output/index.json` for accuracy

### 3.1 Expand `2026-02-18-scrimba-react-learning-path.mdx`

**Current state**: ~400 words, reasonable structure but thin.

**Target**: 1,200+ words. Expand each week section with:
- Specific module names and lesson counts (from `output/scrimba.com/course/learn-react-c0e/index.md` etc.)
- What you'll build in each course (capstone projects)
- Difficulty progression tips
- Add a comparison table: React courses ranked by difficulty
- Add FAQ: "How long does it take to learn React on Scrimba?", "Is the free React course enough?", "What React version does Scrimba teach?"

**Data sources**: `output/scrimba.com/course/learn-react-c0e/index.md`, `output/scrimba.com/course/advanced-react-c02h/index.md`, `output/scrimba.com/course/learn-react-router-c06/index.md`

### 3.2 Expand `2026-02-22-learn-ai-engineering-scrimba.mdx`

**Current state**: ~500 words, reasonable outline.

**Target**: 1,200+ words. Add:
- Detailed breakdown of the AI Engineer Path (11.4 hrs, modules from scraped data)
- Individual course descriptions for all 12+ AI courses
- Prerequisites (JavaScript knowledge level needed)
- What tools/APIs you'll learn (OpenAI, LangChain, Mistral, Claude, RAG, MCP, Vercel AI SDK)
- Career outlook section for AI engineers
- Add FAQ: "Do I need Python for Scrimba's AI courses?", "What's the MCP course about?", "Can I build real AI apps after this path?"

**Data sources**: `output/scrimba.com/course/the-ai-engineer-path-c02v/index.md`, all AI course files in `output/scrimba.com/course/`

### 3.3 Expand `2026-02-25-scrimba-roadmap-whats-coming.mdx`

**Current state**: ~400 words placeholder.

**Target**: 1,000+ words. Cover:
- Reference Scrimba's public roadmap (scraped at `output/scrimba.com/marketing/roadmap/index.md`)
- Recent course additions (Context Engineering, MCP, Vercel AI SDK were recently added)
- Scrimba's growth trajectory (88 courses currently, 4 career paths)
- Feature wishlist / community requests (from Discord/help articles)
- Add FAQ: "Does Scrimba add new courses regularly?", "Will Scrimba add more languages?", "Is Scrimba still actively maintained?"

**Data source**: `output/scrimba.com/marketing/roadmap/index.md`

### 3.4 Expand `2026-03-01-how-to-get-hired-with-scrimba.mdx`

**Current state**: ~350 words, good structure but needs depth.

**Target**: 1,500+ words. This is a high-value career keyword. Expand:
- Detailed breakdown of the "Getting Hired" module (from Frontend Path data)
- Portfolio project ideas with specifics (name actual projects from courses)
- Interview prep: detail the JavaScript Interview Challenges (40 challenges) and React Interview Questions courses
- Success stories / framework for job search
- Timeline breakdown: realistic 6-month plan
- Add FAQ: "Can I get a job with just Scrimba?", "Do employers recognize Scrimba certificates?", "Should I do Frontend or Fullstack path for jobs?"

### 3.5 Expand `2026-03-05-scrimba-frontend-vs-fullstack-path.mdx`

**Current state**: ~400 words.

**Target**: 1,200+ words. Add:
- Side-by-side comparison table using `<ComparisonTable>` with: duration, modules, technologies covered, difficulty, career outcomes
- Detailed module-by-module breakdown of each path
- "Which path if..." decision matrix (career changer vs CS student vs bootcamp grad)
- Course overlap analysis (which courses appear in both paths)
- Add FAQ: "Can I switch paths mid-way?", "Is the Fullstack path too long?", "Do both paths include React?"

**Data sources**: `output/scrimba.com/course/frontend-path-c0j/index.md`, `output/scrimba.com/course/fullstack-path-c0fullstack/index.md`

### 3.6 Expand `2026-03-10-scrimba-discount-codes-2026.mdx`

**Current state**: ~350 words, decent structure.

**Target**: 1,000+ words. This targets high-intent commercial keywords. Expand:
- Specific pricing numbers if available (check scraped pricing/marketing pages)
- Annual vs monthly savings calculation
- Detailed GitHub Education redemption steps
- Scholarship eligibility and process
- "Is there a free trial?" section
- Comparison: Scrimba Pro value vs Codecademy Pro vs Udemy individual courses
- Add FAQ: "Does Scrimba have a free trial?", "Can I share a Pro account?", "Is there a money-back guarantee?"

**Data sources**: Help articles about pricing in `output/scrimba.helpscoutdocs.com/article/72-how-much-does-scrimba-cost/index.md`, `output/scrimba.helpscoutdocs.com/article/73-whats-the-difference-between-pro-and-free/index.md`

### 3.7 Expand `2026-03-15-complete-guide-scrimba-certificates.mdx`

**Current state**: ~400 words.

**Target**: 1,000+ words. Cover:
- Which courses/paths give certificates (career paths only, or all courses?)
- How to change your name on a certificate (from help article `44-how-do-i-change-my-name-on-my-certificate`)
- How to add certificate to LinkedIn (from help article `83-how-do-i-add-my-certificate-to-your-linkedin`)
- What the certificate looks like / what it says
- Whether employers value Scrimba certificates
- Add FAQ: "Are Scrimba certificates accredited?", "Can I get a certificate without Pro?", "How do I share my certificate?"

**Data sources**: `output/scrimba.helpscoutdocs.com/article/44-*/index.md`, `output/scrimba.helpscoutdocs.com/article/83-*/index.md`

### 3.8 Expand `2026-03-20-best-scrimba-courses-career-changers.mdx`

**Current state**: ~300 words, the shortest placeholder.

**Target**: 1,200+ words. This is a high-value keyword for career changers. Cover:
- Top 5 recommended courses for career changers (with reasons)
- Why the Frontend Developer Path is the best starting point (81.6 hrs, beginner-friendly, includes career prep)
- Free courses to try before committing (Learn JavaScript, Learn React, Learn HTML & CSS)
- Timeline expectations for career changers (6-12 months)
- Skills gap analysis: what career changers need vs what Scrimba teaches
- Add FAQ: "Am I too old to learn coding?", "Can I learn part-time while working?", "Which path has the shortest time to employment?"

### 3.9 Expand `2026-03-25-scrimba-for-teams.mdx`

**Current state**: ~300 words.

**Target**: 1,000+ words. Cover:
- What Scrimba Teams offers (reference `output/scrimba.com/marketing/teams/index.md`)
- Pricing for teams (if available in scraped data)
- Use cases: onboarding, upskilling, bootcamp replacement
- Comparison with other team learning platforms
- The Teacher Talent Program (reference `output/scrimba.com/marketing/talents/index.md`)
- Add FAQ: "How many seats minimum?", "Can I track my team's progress?", "Is there an enterprise plan?"

**Data source**: `output/scrimba.com/marketing/teams/index.md`

### 3.10 Expand `2026-03-30-projects-youll-build-on-scrimba.mdx`

**Current state**: ~400 words, good project list but thin descriptions.

**Target**: 1,200+ words. For each of the 10 projects:
- What technologies it uses
- How long it takes to build
- What skills it demonstrates to employers
- Which course it comes from (with internal link to the specific course page)
- Add 2-3 more projects to make it "12+ Projects"
- Add a "Portfolio Tips" section
- Add FAQ: "Can I put Scrimba projects on my resume?", "Are projects unique to each student?", "Can I customize projects?"

---

## Phase 4: Create Missing Brand Assets

**Priority: MEDIUM** — Professional appearance and social sharing.

### 4.1 Create a branded social card image

**Problem**: `static/img/docusaurus-social-card.jpg` is the default Docusaurus social card, not branded for ScrimbAGuide. This appears when pages are shared on social media.

**Fix**: Create a `static/img/social-card.png` (1200x630px) with:
- ScrimbAGuide name/logo
- Tagline: "The Unofficial Guide to Scrimba"
- Purple brand color (#5b3fd9)
- Update `docusaurus.config.ts` `themeConfig.image` from `img/docusaurus-social-card.jpg` to `img/social-card.png`

Since an AI agent cannot create images, either:
- Use an SVG-based approach (create an SVG in `static/img/social-card.svg` and reference it)
- Or note this as a manual task for the user

### 4.2 Fix author avatar

**Problem**: `blog/authors.yml` references `image: https://scrimbaguide.tech/img/logo.png` but no `logo.png` file exists (only `logo.svg`).

**Fix**: Either:
- Update `authors.yml` to reference `https://scrimbaguide.tech/img/logo.svg`
- Or export the SVG to PNG and save as `static/img/logo.png`

---

## Phase 5: SEO Hardening

**Priority: MEDIUM** — Maximize organic search visibility.

### 5.1 Add CourseSchema JSON-LD to all course pages

**Problem**: The `CourseSchema` component exists but is NOT used in the generated course pages. This means no Course schema markup appears in search results.

**Fix**: Edit `scripts/generate-course-pages.mjs` to include `<CourseSchema>` in the generated MDX output for each course page. Use these props:
```jsx
<CourseSchema
  name="{course title}"
  description="{course description}"
  url="https://scrimba.com/{scrimbaSlug}"
  duration="{course duration}"
  difficulty="{course difficulty}"
/>
```

Re-run the generation script. Verify with Google's Rich Results Test on a sample page.

**Acceptance**: Every `docs/courses/**/*.mdx` file (except index files) includes a `<CourseSchema>` component.

### 5.2 Add FAQ schema to comparison and path pages

**Problem**: Comparison pages and path pages have `<FAQAccordion>` components which already embed FAQPage JSON-LD. But only `scrimba-vs-codecademy.mdx` currently uses it. The other 4 comparison pages and 4 path detail pages do not have FAQ sections.

**Fix**: Add `<FAQAccordion>` with 3 relevant questions to each of:
- `docs/comparisons/scrimba-vs-udemy.mdx`
- `docs/comparisons/scrimba-vs-freecodecamp.mdx`
- `docs/comparisons/scrimba-vs-frontendmasters.mdx`
- `docs/comparisons/scrimba-vs-treehouse.mdx`
- `docs/paths/frontend-developer-path.mdx`
- `docs/paths/fullstack-developer-path.mdx`
- `docs/paths/backend-developer-path.mdx`
- `docs/paths/ai-engineer-path.mdx`

Each FAQ should target natural search queries like "Is Scrimba better than X?", "How long is the Y path?", etc.

### 5.3 Improve meta descriptions across all pages

Review and ensure every page has a unique, compelling `description` in frontmatter:
- Should be 150-160 characters
- Should include primary keyword
- Should include a value proposition or call-to-action
- Should NOT be truncated mid-sentence

Check with: `rg '^description:' docs/ blog/ | sort`

### 5.4 Add breadcrumb and page-level structured data

Docusaurus generates breadcrumbs in docs pages automatically. Verify this works correctly. For blog posts, consider adding Article schema via a new component or Docusaurus head tags.

---

## Phase 6: Affiliate Conversion Optimization

**Priority: MEDIUM** — Increase click-through on affiliate links.

### 6.1 Add contextual CTAs to topic hub pages

**Problem**: The topic hub index pages (e.g., `docs/courses/react/index.mdx`) have a single `<PricingCTA>` at the bottom, but no in-content CTAs.

**Fix**: For each of the 7 topic hub pages + `docs/courses/index.mdx`:
- Add an `<AffiliateLink>` button after the first course recommendation section
- Add a "Try This Course Free" CTA next to any free course listing
- Example: After listing free React course, add `<AffiliateLink href="https://scrimba.com/learn-react-c0e" variant="button">Start Learn React (Free)</AffiliateLink>`

### 6.2 Add comparison CTAs in path pages

Each path page should have an `<AffiliateLink>` button linking directly to that path on Scrimba. Currently path pages only have a generic `<PricingCTA>`.

Files to update:
- `docs/paths/frontend-developer-path.mdx` → link to `https://scrimba.com/frontend-path-c0j`
- `docs/paths/fullstack-developer-path.mdx` → link to `https://scrimba.com/fullstack-path-c0fullstack`
- `docs/paths/backend-developer-path.mdx` → link to `https://scrimba.com/the-backend-developer-path-c0tbi0l98f`
- `docs/paths/ai-engineer-path.mdx` → link to `https://scrimba.com/the-ai-engineer-path-c02v`

### 6.3 Add "Why Scrimba?" callout box component

Create a reusable component that highlights Scrimba's unique selling points:
- Interactive scrims (pause and edit instructor's code)
- 87+ courses, 4 career paths
- Active Discord community
- Certificate of completion

Use this in blog posts and comparison pages where it makes contextual sense.

---

## Phase 7: Final Quality Assurance

**Priority: HIGH** — Must pass before considering the site "complete."

### 7.1 Build verification

```bash
npm run build
```

Must complete with zero errors. `onBrokenLinks: 'throw'` ensures all internal links resolve.

### 7.2 Axe-core accessibility re-audit

Run an axe-core audit across key pages (homepage, a docs page, a blog post, a course page). The previous audit achieved 0 serious violations. Ensure no regressions were introduced.

```bash
# Install temporarily for audit
npm install --no-save puppeteer @axe-core/puppeteer
# Run audit script (see previous conversation for the Node.js script)
```

Target: 0 serious/critical violations across all pages.

### 7.3 Link integrity check

Verify all internal links work:
```bash
npm run build  # onBrokenLinks: 'throw' catches broken doc/blog links
```

Also manually check:
- All `<AffiliateLink>` hrefs point to valid scrimba.com pages
- All external links in comparison pages work
- Author avatar URL in `blog/authors.yml` resolves

### 7.4 Mobile responsiveness spot-check

Using browser dev tools or Puppeteer at 375px width, check:
- Homepage sections stack properly
- Course cards are readable
- Comparison tables scroll horizontally with the fade indicator
- Navbar hamburger menu works
- Blog posts are readable

### 7.5 Content consistency audit

Verify:
- Every course page has: CourseCard, About section, Related Courses, Related Pages, FAQAccordion, PricingCTA
- Every blog post has: frontmatter (slug, title, description, authors, tags, keywords), truncate marker, PricingCTA, Related Pages
- Every comparison page has: ComparisonTable, When to Choose sections, Verdict, Related Pages, FAQAccordion, PricingCTA
- Every path page has: duration/level metadata, module breakdown, Related Pages, PricingCTA
- No page has the default Docusaurus placeholder content

### 7.6 Search Console preparation

Create a `static/google-site-verification.html` or add a meta tag to `docusaurus.config.ts` headTags for Google Search Console verification (the user will provide the verification code).

Ensure `static/robots.txt` allows all crawling and points to the sitemap:
```
User-agent: *
Allow: /
Sitemap: https://scrimbaguide.tech/sitemap.xml
```

(Already done — verify it's still correct.)

---

## Execution Order Summary

The recommended execution order optimizes for dependency chains and impact:

1. **Phase 1** (data quality) → must be done before Phase 5.1 (schema) since course pages will be regenerated
2. **Phase 2** (misclassifications) → do alongside Phase 1, same script changes
3. **Phase 3** (blog expansion) → independent, can be done in parallel with 1+2, highest content ROI
4. **Phase 4** (brand assets) → independent, quick wins
5. **Phase 5** (SEO) → depends on Phase 1+2 completion for course pages
6. **Phase 6** (affiliate CTAs) → independent, do after content is stable
7. **Phase 7** (QA) → always last, validates everything

**Estimated scope**: ~40 file edits, 2 script modifications + regeneration, 10 blog post expansions, 8 FAQ additions.
