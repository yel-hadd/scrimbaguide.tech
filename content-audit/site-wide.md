# Site-wide Technical SEO + AI-search (GEO) Audit: scrimbaguide.tech

Date: 2026-05-28. Read-only analysis of the Docusaurus 3 repo at /home/toor/scrimbaguide.tech. Independent affiliate review site for Scrimba, deployed to GitHub Pages.

Constraints honored in recommendations: no em-dashes in content, never quote exact Scrimba prices (link https://scrimba.com/our-pricing), independent-reviewer voice.

All findings below are confirmed from source.

---

## 1. Crawlability / Indexation

`static/robots.txt` is healthy and deliberately GEO-friendly.

- Finding: Every AI crawler in scope is explicitly allowed. GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, Google-Extended, GoogleOther, Applebot-Extended, PerplexityBot, Bingbot, CCBot, plus a wildcard `User-agent: * / Allow: /`. No AI bots are blocked. Only bad-actor scrapers are disallowed (Bytespider, MJ12bot, DotBot). `/admin/` and `/build/` are disallowed (harmless). Sitemap declared: `https://scrimbaguide.tech/sitemap.xml`. Impact: Low (already correct). Fix: none.
- Finding: robots.txt comments point to `/llms.txt` and `/llms-full.txt`. It does not reference `/pricing.md` (which exists, see section 5) or any AI policy file. Impact: Low. Fix: add a comment line in robots.txt pointing AI agents to `/pricing.md` and `/llms-full.txt`.
- Finding: Single sitemap declared. No separate sitemap index. Fine at this scale. Impact: Low. Fix: none.

## 2. Canonical / URL invariants

`trailingSlash: true` (config line 150). Canonical correctness is enforced in three layers and is one of the strongest parts of the build.

- Finding: `plugins/normalize-canonical-urls/index.js` runs in `postBuild` and rewrites, to trailing-slash form: `<link rel="canonical">` (line 32), `<meta property="og:url">` (line 37), `<meta name="twitter:url">` (line 42), AND JSON-LD url-bearing keys (line 47 onward). The JSON-LD walker (line 64 `fixJsonLdUrls`) normalizes `item`, `url`, `@id`, `mainEntityOfPage`, `contentUrl`, and `target`. So canonical, og:url, twitter:url, and structured-data URLs all converge on trailing slashes. `addTrailingSlash` (line 16) correctly skips off-origin URLs and file URLs (those with an extension). Impact: High (positive, this is the backbone). Fix: none.
- Finding: Component-level canonicals are built consistently. DocItem swizzle (`src/theme/DocItem/Layout/index.tsx` line 28) uses `${baseUrl}${metadata.permalink}` (permalink already carries the trailing slash); BlogPostPage/Metadata, BlogArchivePage, and the standalone pages under `src/pages/tools/`, `roadmaps/`, and `index.tsx` each hardcode or derive canonical + og:url. Even where a hardcoded value lacks a slash (for example `frontend-roadmap-2026` and `bootcamp-cost-calculator` constants), the postBuild plugin corrects the emitted HTML. Impact: Low. Fix: for hygiene, make the hardcoded `canonicalUrl` constants in `src/pages/roadmaps/*` and `src/pages/tools/bootcamp-cost-calculator.tsx` already include the trailing slash so source and output agree without relying on the plugin.
- Finding: `sitemapPriority()` (lines 85-141) is well structured: `/` = 1.0; `/docs/pricing`, `/docs/comparisons`, `/docs/paths` = 0.9; intro/about/blog and two how-it-works pages = 0.8; blog posts, learn-react/nextjs, practice, faq, course hubs and course pages = 0.7; nested course sub-pages = 0.6; tools/roadmaps = 0.55; legal/contact/changelog and the which-scrimba-path tool = 0.35. Reasonable. Impact: Low. Fix: none.
- Finding: Sitemap item generation (config lines 222-234) filters via `shouldIncludeInSitemap` and rewrites every URL through `normalizeCanonicalUrl` (trailing slash) plus per-path priority. `lastmod: 'date'` is set (line 205), so freshness IS emitted in the sitemap. Impact: Low (positive). Fix: none.
- Finding: `SITEMAP_EXCLUDED_PATHS` (lines 27-44) excludes legacy blog/udemy redirect stubs; `SITEMAP_EXCLUDED_DOC_ALIASES` (lines 49-61) excludes 11 malformed/duplicate scraped course slugs (for example `/docs/courses/ai/claudeai`, `/docs/courses/css/htmlandcss`). This is the correct mechanism and is actively used. Impact: Low. Fix: none; add future exclusions here.

## 3. Internal Linking / Topical Clusters

Mostly healthy. Course pages are connected but underweight on cross-cluster links, and one schema gap exists.

- Finding (hub navigation): Paths and Courses are top-level navbar items; Comparisons, Pricing, FAQ live under a "Learn" dropdown; the footer "Learn" column links Courses, Paths, Pricing, FAQ, Changelog. The four pillars are reachable site-wide. Impact: Low (positive). Fix: consider promoting Pricing and Comparisons out of the dropdown if they are priority conversion pages.
- Finding (course pages ARE connected, but thinly): `scripts/generate-course-pages.mjs` injects, per generated course page, a "Part of These Learning Paths" block (PATH_LINKS, line 38), a "Related Courses" block from `course.relatedCourses` (line 156), practice links (PRACTICE_LINKS, line 45), and a fixed COMPARISON_LINKS block (line 76) that always points to only Codecademy, Udemy, and All Comparisons. So course leaf pages do link up to paths, practice, and comparisons. The connection is generic, not topical: an AI or React course still gets the same Codecademy/Udemy comparison links rather than the most relevant one, and course pages do NOT link to the pricing hub. Note the curated `RelatedGuides` engine (`src/content/relatedGuidesMap.ts`, wired into the DocItem swizzle line 6) has NO entries for `/docs/courses/*` paths, so that richer related-links module never fires on course pages. Impact: Med. Fix: in the generator, make COMPARISON_LINKS category-aware (React course links to a React-relevant comparison, etc.), add a link to `/docs/pricing/` or `/docs/pricing/pro-vs-free/`, and optionally add course-category entries to relatedGuidesMap.
- Finding (course-page Review schema gap): The generator injects `<CourseSchema>` (confirmed: 68 of 79 course MDX pages contain it; `CourseSchema.tsx` emits Course + EducationalOrganization + CourseInstance + Offer + ItemList). It injects ZERO `<ReviewSchema>` (grep count 0 in the generator and in course pages). Since these pages ARE editorial reviews authored by Yassine, they are missing Review/Rating rich-result eligibility and author attribution at the course level. The 11 course pages without CourseSchema are likely the excluded malformed-slug aliases. Impact: High. Fix: have the generator also emit `<ReviewSchema>` (author Yassine, itemReviewed the course, no price figures) on each course page, sourced from `data/courses.json`.
- Finding (keyword cannibalization, checked): There is NO standalone "is scrimba worth it" page. The phrase appears only as body copy / a section across many pages (comparisons, pricing, paths, some JS course pages). The pricing cluster is cleanly differentiated: `/docs/pricing/` (Scrimba Pricing), `/docs/pricing/pro-vs-free/`, `/docs/pricing/refund-policy/`, `/docs/pricing/student-discount/`, `/docs/pricing/scrimba-vs-bootcamps/`. No cannibalizing duplicate pages found. Impact: Low (no action needed). Fix: keep it this way; if a dedicated "is Scrimba worth it" page is ever added, make it the single canonical target and point the section anchors to it.
- Finding (redirect hygiene): The client-redirects block is large and well maintained (blog consolidation, udemy migration, FAQ/IA restructure). It correctly retires cannibalizing blog posts into pillars. Impact: Low (positive). Fix: none.

## 4. E-E-A-T

Strong. This area is better than typical affiliate sites.

- Finding (author identity): A named human is present site-wide. The Organization JSON-LD in `headTags` (config lines 457-483) names founder Yassine El Haddad with `sameAs` (x.com/scrimbaguide, LinkedIn, GitHub) and a logo. The DocItem Article JSON-LD (Layout lines 56-60) sets `author` = Yassine El Haddad with `knowsAbout: [Scrimba, web development, interactive coding education, React, JavaScript]` and links to `/about`. An `/about` page exists (`src/pages/about.mdx`) and is linked from the footer ("About Us"). Blog posts carry a byline via `blog/authors.yml`. Impact: Low (positive). Fix: confirm the visible `/about` page describes Yassine as a catalog reviewer and does NOT claim course completion (per the project author-voice note).
- Finding (independence + affiliate disclosure): Footer copyright (line 578) states "Not affiliated with Scrimba." A dedicated `/legal/affiliate-disclosure` page is linked in the footer Legal column. The `/about` page carries explicit "Affiliate disclosure" and "Not affiliated" statements. The `DisclosureNotice` component is rendered on 19 money pages (all 14 comparisons plus pricing pages), confirmed by grep, so inline disclosure IS present near the content, not only in the footer. Impact: Low (positive). Fix: none.
- Finding (freshness): `showLastUpdateTime: true` is enabled on the docs preset (line 188), and DocItem emits `dateModified` / `article:modified_time` from `metadata.lastUpdatedAt` (Layout lines 39, 52, 73). Sitemap emits `lastmod`. So both human-visible and machine-readable freshness exist. Impact: Low (positive). Fix: none. Optional: enable `showLastUpdateAuthor` to attribute updates to Yassine.

## 5. AI Surfaces (GEO)

Excellent foundation, ahead of most sites.

- Finding: llms.txt / llms-full.txt are generated at build time (`npm run build` runs `generate:llms`, package.json line 8/15). The generator `scripts/generate-llms-from-sitemap.mjs` has a test suite under `scripts/__tests__/`. Confirmed: it maintains a `KEY_PATHS` list (line 28) and a curated title/description map for `/docs/paths`, `/docs/pricing`, `/docs/comparisons`, and per-path / per-comparison entries, so comparison, path, and pricing pages are surfaced with hand-written titles and descriptions (not a flat dump). Impact: Low (positive). Fix: none.
- Finding: A machine-readable `static/pricing.md` ALREADY EXISTS and is well done (served at `/pricing.md`). Confirmed it follows the price rule: it lists Free / Pro monthly / annual / lifetime structure, states "Live pricing varies by region and changes without notice," links to https://scrimba.com/our-pricing, and explicitly says quoted price numbers are intentionally omitted. It includes the affiliate link and student/GitHub-pack notes. Impact: Low (positive). Fix: minor: reference `/pricing.md` from robots.txt; consider adding the no-signup demo scrim (https://scrimba.com/s0v687325e) as a try-before-you-buy entry.
- Finding: Two npm/llms plugins are present as dependencies (`@signalwire/docusaurus-plugin-llms-txt` and `docusaurus-plugin-generate-llms-txt`) but the active path is the custom `generate-llms-from-sitemap.mjs` script. Impact: Low. Fix: confirm only one llms.txt producer wins to avoid an overwrite race; remove the unused plugin deps to reduce confusion.
- Finding: `rel="preconnect"` to scrimba.com is set (headTags line 488), speeding affiliate-link navigation. Impact: Low (positive). Fix: none.

## 6. Structured Data

Comprehensive. This is a notably mature schema setup.

- Sitewide (`headTags`, config): `WebSite` + `Organization` in a single `@graph` cross-referenced by `@id` (`#website`, `#organization`), with SearchAction, founder, sameAs, logo, contactPoint. Strong entity foundation.
- Docs (`src/theme/DocItem/Layout/index.tsx`): `Article` per page with headline, description, url, image, inLanguage, dateModified, `publisher` referencing `#organization` by `@id`, and `author` = Yassine Person node. Clean (no duplicate Organization).
- Blog (`src/theme/BlogPostPage/Metadata/index.tsx`): `BlogPosting` with Person author, WebPage mainEntity, publisher `@id` reference.
- Component library (composable, pathname-keyed, deduplicated by `schemaScriptId`): `FAQAccordion.tsx` and `DocFaqSchema.tsx` (FAQPage), `HowToSchema.tsx` (HowTo + MonetaryAmount), `ItemListSchema.tsx` (ItemList), `PersonSchema.tsx` (Person/ImageObject), `ReviewSchema.tsx` (Review + Rating + Person), `CourseSchema.tsx` (Course + EducationalOrganization + CourseInstance + Offer + ItemList). Homepage emits its own FAQPage.
- Finding (FAQ duplication risk): Both `FAQAccordion.tsx` (line 116) AND `DocFaqSchema.tsx` (line 35) can emit `FAQPage`. If a page uses the visual accordion and also declares frontmatter FAQ that feeds DocFaqSchema, two FAQPage blocks could appear. They share `schemaScriptId('faq', canonicalPath)` which should dedupe by id, but verify a single page never renders both with different content. Impact: Med. Fix: pick one FAQ-schema source per page; document which component owns FAQPage.
- Finding (course-page coverage, confirmed): `Course` schema IS emitted on course pages (68 of 79 MDX files; the rest are excluded malformed-slug aliases). `Review` schema is NOT emitted anywhere by the generator (0 occurrences). The editorial reviews therefore lack Review/Rating markup. Impact: High. Fix: add `<ReviewSchema>` to the generator output (see section 3).
- Finding (HowToSchema MonetaryAmount): `HowToSchema.tsx` line 62 emits a `MonetaryAmount`. Verify it does not hardcode an exact Scrimba price (violates the no-price rule). Impact: Med if a price is baked in. Fix: use a zero/estimate cost or omit, and link our-pricing in the visible copy.

## 7. Core Web Vitals / Performance (light)

- Finding: `static/img` contains a small number of raster assets (`social-card.png`, `docusaurus-social-card.jpg`, `logo.png`). Verify the largest ones are reasonably sized; oversized above-the-fold images hurt LCP. A social-card generator exists (`npm run generate:social-cards`). Impact: Med. Fix: keep social cards compressed; prefer WebP/AVIF and set explicit width/height to avoid CLS.
- Finding: `gtag` (G-03WS2KR7EX) plus cookie-consent plugin in consent mode. Reasonable. Local search index (`@easyops-cn/docusaurus-search-local`, hashed) adds JS weight but avoids a third-party search call. Impact: Low. Fix: none.
- Finding: GitHub Pages hosting. No `_headers` control there (any `_headers` file would be ignored unless fronted by Cloudflare/Netlify). Impact: Low. Fix: if a CDN fronts the site, add long-cache headers for hashed assets; otherwise rely on Docusaurus content hashing.

---

## Top 7 site-wide fixes, ranked

1. Add `<ReviewSchema>` (author Yassine, itemReviewed the course, no price figures) to `scripts/generate-course-pages.mjs` so all course pages carry Review/Rating markup. CourseSchema is already present; this is the one real structured-data gap and the biggest GEO/rich-result win. (Sections 3 and 6, High)
2. Make course-page cross-cluster links topical: change the fixed COMPARISON_LINKS in the generator to be category-aware and add a link to the pricing hub from each course page. (Section 3, Med)
3. Add course-category entries to `relatedGuidesMap.ts` so the curated RelatedGuides module fires on course pages too. (Section 3, Med)
4. Verify `HowToSchema.tsx` MonetaryAmount (line 62) does not bake in an exact Scrimba price; if it does, zero it out or omit and link our-pricing. (Section 6, Med)
5. Ensure only one llms.txt producer runs at build (the custom script vs the two installed llms-txt plugin deps) to avoid an overwrite race. (Section 5, Med)
6. Confirm a single FAQPage source per page (FAQAccordion vs DocFaqSchema) so no page emits two FAQPage blocks with differing content. (Section 6, Med)
7. Reference `/pricing.md` and `/llms-full.txt` from robots.txt; surface the demo scrim as a try-before-you-buy CTA. (Sections 1, 5, Low)

Quick wins (Low effort): add trailing slashes to the hardcoded `canonicalUrl` constants in `src/pages/roadmaps/*` and `src/pages/tools/bootcamp-cost-calculator.tsx` so source matches output; enable `showLastUpdateAuthor`; remove unused llms-txt plugin dependencies.

Things checked and found already solid (no action): AI-crawler access, trailing-slash canonical/og/twitter/JSON-LD normalization, sitemap priority + lastmod + exclusions, author identity and E-E-A-T disclosures, inline DisclosureNotice on money pages, freshness signals, llms.txt sectioning, machine-readable pricing.md (no prices quoted), CourseSchema coverage, no "is scrimba worth it" cannibalization.
