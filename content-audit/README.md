# scrimbaguide.tech — Per-Page Ranking Audit (Phase 1)

Goal: every doc page gets a competitive analysis and a path toward #1, plus a site-wide ranking layer. Delivery is audit-first (this folder), then fixes in reviewed waves.

## Files
- `comparisons.md` — 13 comparison/hub pages
- `paths-faq-pricing.md` — 5 paths + FAQ + 6 pricing pages
- `courses.md` — 79 generated course pages (template-level, fixes via generator + data)
- `other-pages.md` — 42 pages in help/, for/, how-it-works/, learn-react/, learn-nextjs/, practice/, intro, changelog
- `site-wide.md` — technical SEO, schema, internal linking, E-E-A-T, AI surfaces

Total: 145 doc pages covered.

## Competitive reality (applies to nearly every page)
SERPs and AI answers for Scrimba queries are dominated by: Scrimba's own articles (strong domain, not independent), review aggregators (G2, Trustpilot, Product Hunt, Course Report, Class Central), and DonTheDeveloper (trusted honest video review). Our moat is independence + honesty + structure + freshness. We win by being the third-party voice Scrimba's marketing can't be, formatted for snippet + AI extraction.

## The five recurring gaps (true across most pages)
1. **No 40-60 word extractable verdict block** under the H1. Answers are buried in prose. Kills featured snippets and AI citation.
2. **No machine-readable schema.** `FAQAccordion` renders FAQs visually but emits no `FAQPage` JSON-LD. No Article/Course/BreadcrumbList schema anywhere except a hand-rolled homepage FAQ block.
3. **No visible "last updated" date** in-content (freshness signal AI engines weight heavily).
4. **Under-linked clusters.** Pages link up to topic hubs but rarely across to the relevant path + comparison pages. Authority isn't concentrated.
5. **Keyword cannibalization.** Multiple pages chase the same intent without a clear canonical owner (see below).

## Cannibalization map (fix at site level)
- "learn react free" / "learn next.js": `learn-react/*` vs `courses/react/*` vs topic hub — three-way conflict (worst).
- "is scrimba worth it" / "best platform to learn to code": homepage vs `faq/index` vs `comparisons/best-coding-platform-for-beginners` vs `comparisons/index`.
- Several `help/*` pages duplicate `faq/index`.
Resolution: pick ONE canonical owner per intent; redirect the rest via `@docusaurus/plugin-client-redirects` (never delete); exclude losers from sitemap.

## Confirmed data bug
Backend path page hardcodes **39.4h**; `data/courses.json` (source of truth) sums to **30.1h**. Totals must come from data, never hardcoded. Fix in generator + path page.

## Thin pages (real low-competition wins being wasted)
`pricing/refund-policy.mdx` (~410w), `pricing/student-discount.mdx` (~520w), `paths/study-plan.mdx` (~600w), plus ~8-12 short course pages and many `help/*` answers.

## AI surfaces
- robots.txt: AI bots NOT blocked (GPTBot/PerplexityBot/ClaudeBot/Google-Extended all allowed). Good baseline.
- Missing `/pricing.md` (or `.txt`) for AI agents — add one that LINKS to scrimba.com/our-pricing (no quoted prices).
- `llms.txt`/`llms-full.txt` generated already; verify it surfaces comparison + path pages prominently.
- No affiliate / independent-review disclosure and thin author identity — E-E-A-T gap.

---

## Proposed Phase 2 wave order (highest ranking-upside x lowest effort first)

**Wave 0 — Shared infrastructure (lifts every page at once).** Highest leverage.
- Make `FAQAccordion` (or a wrapper) emit `FAQPage` JSON-LD.
- Add a reusable `VerdictBlock` component (40-60 words, extractable) + a `LastUpdated` display.
- Add Article + BreadcrumbList schema via theme/DocItem swizzle; Course schema for course pages.
- Add affiliate + independent-review disclosure + author identity (E-E-A-T).
- Add `/pricing.md` for AI agents; verify llms.txt coverage.

**Wave 1 — Comparisons (13).** Highest-intent, ~33% of AI citations. Add verdict block, comparison table, FAQ schema, freshness date, affiliate-tracked CTA; lean into the independent angle in titles/H1s.

**Wave 2 — Paths (5) + FAQ.** Add verdict blocks + FAQ schema; fix backend 30.1h data bug; reconcile totals from data.

**Wave 3 — Course generator (79 at once).** Add Course/FAQ/Breadcrumb schema, generated verdict block, cross-cluster links (course -> path + comparison), enrich/neutralize thin courses. All via `scripts/generate-course-pages.mjs` + `data/courses.json`.

**Wave 4 — Pricing + thin-page wins.** Deepen refund-policy, student-discount, study-plan (own low-competition queries); Zero-Risk conversion sweep.

**Wave 5 — Cannibalization cleanup.** Resolve learn-react/learn-nextjs vs courses vs hubs; consolidate duplicate help/ pages; canonical owners + redirects.

**Wave 6 — help/ + for/ enrichment.** Strengthen 18 long-tail Q&A/audience pages with schema + depth.

Each wave: representative diffs first, apply pattern, `make typecheck` + `make build`, browser spot-check, then review gate.

## Reality check
Literal #1 on 145 queries depends on off-site authority and indexing time we don't fully control. On-page + structure + schema is what we control and where the biggest, fastest gains are. Realistic outcome: materially higher positions and a large jump in AI citation share.
