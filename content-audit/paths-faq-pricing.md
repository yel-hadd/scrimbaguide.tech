# Content Audit: Paths, FAQ, Pricing

Scope: 12 `.mdx` files across `docs/paths/` (6), `docs/faq/` (1), `docs/pricing/` (5).
Canonical pattern: `https://scrimbaguide.tech/docs/<folder>/<slug>/` (trailing slash).
Audited 2026-05-28. Author is an independent reviewer who did NOT complete the courses.

Note on scope: the brief expected 5 path files and 4-5 pricing files. Actual directory contents:
paths also contains `ai-engineer-path.mdx`; pricing also contains `scrimba-vs-bootcamps.mdx`. Both are
audited below. Word counts: ai-engineer 2,336 / backend 1,564 / frontend 2,352 / fullstack 1,688 /
paths-index 1,523 / study-plan 1,410 / faq 814 / pricing-index 1,523 / pro-vs-free 1,003 /
refund-policy 1,195 / scrimba-vs-bootcamps 1,222 / student-discount 1,127.

Constraints applied to all recommended copy: no em-dashes; never quote exact Scrimba prices
(link `scrimba.com/our-pricing`); author is an independent reviewer; scrimba.com links use `<AffiliateLink>`.

---

## CROSS-CUTTING SUMMARY (top 5)

1. **Backend hours: the site's own data says 39.4h; Scrimba's live ecosystem says 30.1h.** `data/courses.json`
   (there is NO `data/paths.json`) records the Backend path as `"duration": "39.4 hrs",
   "timeRequired": "PT39H22M7S", "lessonCount": 943`, so the site is internally consistent. BUT web
   search confirms the brief: Scrimba's own 2026 articles AND the third-party Class Central listing both
   describe the Backend path as **30.1 hours** (Class Central:
   `scrimba-the-backend-developer-path-c0tbi0l98f-533168`). So this is NOT just a marketing footnote;
   an independent aggregator agrees with 30.1h. The most likely cause: the scraped `timeRequired`
   (PT39H22M7S) sums the bundled standalone courses mapped into the path, while 30.1h is the path-only
   runtime Scrimba now publishes. Action: re-scrape the live course page, confirm whether 30.1h is now
   the canonical path runtime, and if so correct the data file AND all 6 page occurrences. If you keep
   39.4h, add a one-line footnote reconciling it with the 30.1h Scrimba/Class Central figure. Either way,
   a review site cannot show a number both the vendor and Class Central contradict without explanation.
   This is the highest-leverage credibility fix in the whole set.

2. **Thin pages will not rank or get cited.** Five pages sit at or below ~1,200 words and read like stubs:
   `faq/index` (814), `pro-vs-free` (1,003), `student-discount` (1,127), `refund-policy` (1,195),
   `scrimba-vs-bootcamps` (1,222). `study-plan` (1,410) and `paths/index` (1,523) are also light for
   their intent. They compete with Class Central, Learn to Code With Me, and Scrimba's own pages, which
   run longer and carry sourced detail.

3. **Sourcing is uneven, and that is the independent-reviewer credibility lever.** The Backend, FAQ,
   refund, and student-discount pages cite well (BLS, ZipRecruiter, Scrimba help-centre, DonTheDeveloper,
   forum). But `paths/index`, `study-plan`, `pro-vs-free`, and `scrimba-vs-bootcamps` assert opinions with
   little or no external evidence. Search results confirm AI engines cite Scrimba's own pages + Course
   Report + Class Central + Reddit + DonTheDeveloper. Adding sourced third-party signals (Course Report /
   Class Central ratings, Trustpilot refund experiences) is the cheapest path to citation eligibility.

4. **Freshness and the price rule are inconsistent.** `paths/index.mdx` and `faq/index.mdx` have **no
   visible LastUpdated date**. `pricing/index.mdx` has no `last_update` frontmatter. The FAQ answer "How
   much does Scrimba Pro cost?" and "is it ~$200/year" framing on `paths/index.mdx` brush against the
   project rule to never quote exact prices; `scrimba-vs-bootcamps`/`pricing-index` correctly compare only
   bootcamp ranges and link to `scrimba.com/our-pricing`. Keep that discipline everywhere.

5. **Module-count drift and one internal inconsistency.** Module counts are NOT stored in `courses.json`
   (`pathInfo.moduleCount` is null for every path), so the figures in prose are hand-maintained and
   already inconsistent: the AI Engineer page's `CourseCard` says **modules={9}** and its hero note says
   "9 modules", but `paths/index.mdx` lists the AI path as **8 modules**; the Backend `CourseCard` says
   12 while its module table lists 12 rows (ok); Frontend says 13 (ok); Fullstack says 20. Reconcile all
   module counts against the live Scrimba pages and store them in the data file so prose cannot drift.
   Also: lesson counts differ across pages for the same path (Frontend is "1,492" on its own page but the
   `paths/index` matrix and `courses.json` agree at 1492, ok; verify the others). `study-plan.mdx` is
   Frontend-only despite living in a four-path hub. (Note: the suspected `student-discount` self-link was
   NOT found; its Related list correctly points to pricing, refund-policy, and a blog.)

---

## docs/paths/index.mdx

- **Canonical:** /docs/paths/ (slug `/paths`)
- **Title:** "Scrimba Learning Paths" | **Desc:** compare frontend/fullstack/backend/AI paths, hours, level
- **Word count:** 1,523
- **Verdict block:** Yes (bold "What are the Scrimba Learning Paths?", ~55 words). Good.
- **Tables:** Yes (strong at-a-glance matrix). **FAQ + schema:** Yes (`DocFaqSchema` + `FAQAccordion`).
  **LastUpdated:** **No (missing).** **Affiliate CTA:** frontmatter only; no in-body `<AffiliateLink>`.
  Interactive `PathAdvisor` present (good engagement/dwell signal and a genuine moat).
- **Primary query:** "which scrimba path should i choose" / "scrimba learning paths"
- **Secondary:** "scrimba frontend vs fullstack path", "scrimba career path", "are scrimba paths worth it"
- **SERP/GEO landscape:** Scrimba's own path pages, dev.to (some Scrimba-authored), Class Central, Learn to
  Code With Me. AI engines cite Scrimba + Class Central + Reddit.
- **OUR GAP:** No freshness date. Quotes "roughly $200 a year" twice, which conflicts with the no-exact-
  price rule; replace with a range-free "well below typical bootcamp cost, see scrimba.com/our-pricing."
  Module counts (esp. Fullstack 20) are unverifiable from `courses.json` and should be data-backed. The
  "honest framing" section is the differentiator but short and unsourced.
- **Fixes:**
  - *Ranking:* Add LastUpdated. Replace price figures with the pricing-page link. Verify and data-source
    module counts. Expand "paths vs other ways to learn" with a sourced bootcamp cost comparison.
  - *GEO:* Add `ItemList`/`Course` schema for the four paths so engines can extract the matrix. Keep the
    40-60 word definition as the opening paragraph (already strong); add one comparison sentence per path.
  - *Conversion:* Add an in-body `<AffiliateLink>` after the matrix ("Try the format free, then unlock a
    path"), pointing free-tier users to a real free course and Pro buyers to `scrimba.com/our-pricing`.
- **Path to #1:** Own the "which path" decision query. The interactive advisor is the moat. Add freshness,
  fix the price language, data-source the numbers, and add ItemList schema so AI engines cite the matrix.

---

## docs/paths/backend-developer-path.mdx

- **Canonical:** /docs/paths/backend-developer-path/
- **Title:** "Scrimba Backend Developer Path" | **Desc:** Node/Express/SQL/TS in ~39h
- **Word count:** 1,564 (thin for a review; strongest sourcing in the path set)
- **Verdict block:** Yes (~50 words). **Tables:** Yes (module breakdown + vs-Fullstack). **FAQ+schema:** Yes.
  **LastUpdated:** Yes (2026-05-28). **Affiliate CTA:** Yes, multiple in-body `<AffiliateLink>` + demo scrim
  + `PricingCTA`. Sourced (ZipRecruiter, BLS, Scrimba forum, DonTheDeveloper). Good page.
- **Primary query:** "scrimba backend developer path review" / "is scrimba backend path worth it"
- **Secondary:** "scrimba node course review", "scrimba backend curriculum", "scrimba backend path hours"
- **SERP/GEO landscape (verified):** Independent written reviews of the Backend path are **sparse**. Top
  results are Scrimba's own course page, the [Class Central listing](https://www.classcentral.com/course/scrimba-the-backend-developer-path-c0tbi0l98f-533168),
  [i-programmer.info](https://www.i-programmer.info/news/150-training-a-education/18483-scrimbas-backend-developer-path.html),
  and Scrimba's [backend roadmap article](https://scrimba.com/articles/how-to-become-a-backend-developer-in-2026-complete-roadmap/).
  **This is a winnable, low-competition query.** Note: scrimbaguide's own paths page already ranks here.
- **DATA DISCREPANCY (flagged, verdict RESOLVED):** Page states **39.4 hours** in SIX places (verdict,
  CourseCard `duration`, hero note, module-table total, Backend-vs-Fullstack table, and an FAQ answer).
  The brief said Scrimba's public articles say 30.1h. Verified: there is no `data/paths.json`; the source
  of truth is `data/courses.json`, which records **39.4 hrs / PT39H22M7S / 943 lessons**, so the page
  matches the site's own data. HOWEVER, web search confirms BOTH Scrimba's current articles AND the
  third-party [Class Central listing](https://www.classcentral.com/course/scrimba-the-backend-developer-path-c0tbi0l98f-533168)
  state **30.1 hours**. So an independent aggregator backs 30.1, not 39.4. Most likely the scraped
  `timeRequired` summed the bundled standalone courses (Node 3.5 + Express 4.0 + SQL 3.8 + Supabase 4.8 +
  Cybersecurity 5.0 + TypeScript 4.2 + etc. ~= 39h) rather than the path-only runtime (30.1h). Action:
  re-scrape the live page; if 30.1h is canonical, fix `courses.json` and all six occurrences. Do not leave
  a number that Scrimba and Class Central both contradict without at least a reconciling footnote.
- **Fixes:**
  - *Ranking:* Re-scrape the live Scrimba course page. If 30.1h is canonical, correct `courses.json` and
    all six page occurrences; otherwise add a footnote ("Scrimba and Class Central list ~30.1 path-only
    hours; the 39.4h here counts the bundled standalone courses mapped into the path"). Either resolves the
    objection. Then expand to 1,800+ words: per-module hours and named capstone projects.
  - *GEO:* Add `Course` schema (provider Scrimba, `timeRequired` matching whichever figure you commit to,
    educationalLevel Intermediate). Keep FAQ; make the hours answer state the count definition.
  - *Conversion:* Already strong (in-body AffiliateLinks, demo scrim, honest prerequisites that
    self-select the right buyer and reduce refunds). Leave as is.
- **Path to #1:** Low competition plus the best sourcing in the set. Fix or footnote the hours, add named
  projects and Course schema, and this is a realistic #1. The hours fix is the unblock.

---

## docs/paths/frontend-developer-path.mdx

- **Canonical:** /docs/paths/frontend-developer-path/
- **Title:** "Scrimba Frontend Developer Path Review (2026): Honest Pros & Cons" | **Word count:** 2,352
- **Verdict block:** Yes (~50 words). **Tables:** Yes. **FAQ+schema:** Yes. **LastUpdated:** Yes (2026-05-20).
  **CTA:** Yes (`CourseCard` + `PricingCTA`). Healthiest page in the set.
- **Source check:** 81.6 hrs / 13 modules / 1000 lessons matches `courses.json` (81.6 hrs, 1000 lessons).
- **Primary query:** "scrimba frontend developer career path review" (highest-value query in this set)
- **Secondary:** "is scrimba frontend path worth it", "scrimba react path", "scrimba frontend path 2026"
- **SERP/GEO landscape (verified):** Crowded but the page already does this well. Competitors:
  [DonTheDeveloper "My HONEST Review"](https://www.donthedeveloper.tv/podcast/scrimba-frontend-developer-career-path-review)
  (YouTube + Spotify), [curricular.dev review](https://curricular.dev/reviews/frontend-scrimba-career-path-review/)
  (ranked it #1 for frontend), [Quora](https://www.quora.com/What-are-the-reviews-about-The-Frontend-developer-Career-Path-by-Scrimba),
  [Product Hunt reviews](https://www.producthunt.com/products/scrimba/reviews),
  [Course Report](https://www.coursereport.com/schools/scrimba), Class Central. This page ALREADY cites
  DonTheDeveloper, curricular.dev, a Medium first-person post, and Class Central, which is exactly right.
- **OUR GAP:** This is the best-executed page in the set (sourced learner sentiment, honest MDN framing,
  real module durations, explicit "I have not completed the path" disclosure that matches the author-voice
  rule). The remaining gap is the absence of an aggregate rating signal and `Course` schema. Course Report
  and Product Hunt surface star ratings; this page could cite one with attribution.
- **Fixes:** *Ranking:* add a cited aggregate rating line (Course Report / Product Hunt with link). The
  "what real learners say" block is already strong; keep it current. *GEO:* add `Course` schema;
  `aggregateRating` ONLY if it cites a real external rating with attribution. *Conversion:* already has the
  demo scrim CTA; consider one mid-article AffiliateLink after the modules table.
- **Path to #1:** Mostly there. Add Course schema and a cited rating, and this page out-resources every
  competitor on curriculum specifics. Highest query value in the set, so finishing it matters most.

---

## docs/paths/fullstack-developer-path.mdx

- **Canonical:** /docs/paths/fullstack-developer-path/
- **Title:** "Scrimba Fullstack Developer Path Review (2026): Is It Worth It?" | **Word count:** 1,688
- **Verdict block:** Yes (~50 words). **Tables:** Yes. **FAQ+schema:** Yes. **LastUpdated:** Yes (2026-05-20).
  **CTA:** Yes (`CourseCard`, 108.4 hrs / 20 modules / 1500 lessons).
- **Source check:** 108.4 hrs and 1500 lessons match `courses.json`. **Module count 20 is NOT verifiable
  from `courses.json`** (`pathInfo.moduleCount` is null). Reconcile against the live Scrimba page; the
  Backend page's comparison table implies different module accounting.
- **Primary query:** "scrimba fullstack developer path review" / "is scrimba fullstack worth it"
- **Secondary:** "scrimba fullstack curriculum", "scrimba frontend vs fullstack", "scrimba longest path"
- **SERP/GEO landscape:** Scrimba's own page, Class Central, Reddit. Moderate competition.
- **OUR GAP:** Mid-length and unsourced. The 108-hour commitment is the key buyer objection and needs a
  realistic-calendar treatment. Module count needs data backing.
- **Fixes:** *Ranking:* expand to 2,000+ words, verify and data-source module count, add a realistic
  timeline table. *GEO:* `Course` schema (`timeRequired` PT108H). *Conversion:* an honest "who should NOT
  pick this" block plus a free-tier CTA.
- **Path to #1:** Win the "frontend vs fullstack" decision intent with a sourced, accurate comparison and a
  realistic time-commitment framing the merchant will not publish.

---

## docs/paths/ai-engineer-path.mdx

- **Canonical:** /docs/paths/ai-engineer-path/
- **Title:** "Scrimba AI Engineer Path Review (2026): Build Real AI Apps" | **Word count:** 2,336
- **Verdict/tables/FAQ+schema/LastUpdated (2026-05-20)/CTA:** all present. Most detailed path page.
- **Source check:** `courses.json` records the AI Engineer Path at **11.4 hrs / 257 lessons** (matches
  page). Module count is inconsistent ON THIS PAGE: the `CourseCard` says **modules={9}** and the hero note
  says "9 modules", but `paths/index.mdx` lists it as **8 modules**. Module counts are not in `courses.json`
  (`pathInfo.moduleCount` null), so verify against the live page and pick one number sitewide.
- **Primary query:** "scrimba ai engineer path review" / "is the scrimba ai engineering course worth it"
- **Secondary:** "learn ai engineering scrimba", "scrimba RAG agents course", "scrimba ai path prerequisites"
- **SERP/GEO landscape:** Emerging, low-competition (AI engineering is new). Scrimba's marketing plus a few
  YouTube reviews. **Highest GEO upside in the set** because few authoritative independent pages exist yet.
- **OUR GAP:** Actually a very strong page already (per-module table with lengths, sourced salary data from
  levels.fyi/PwC/Stack Overflow, explicit DeepLearning.AI/fast.ai/cookbook comparisons, honest JS-vs-Python
  framing, named instructors). The only real defects are the 8-vs-9 module inconsistency and no `Course`
  schema. Hours (11.4h) match the data file.
- **Fixes:** *Ranking:* fix the module count (8 vs 9) sitewide. Content depth is already competitive.
  *GEO:* add `Course` schema; the first-60-words definition is already present and citable. *Conversion:*
  already has dual in-body AffiliateLinks and a demo scrim; leave as is.
- **Path to #1:** Newest topic, lowest competition, and this page is already the most thorough independent
  treatment available. Fix the module count, add Course schema, and lock in citations before rivals arrive.

---

## docs/paths/study-plan.mdx

- **Canonical:** /docs/paths/study-plan/
- **Title:** "Scrimba 6-Month Study Plan" | **Word count:** 1,410 (thin for the intent)
- **Verdict block:** Yes ("Quick answer", ~55 words). **Tables:** Yes (pace + month-by-month + daily routine).
  **FAQ+schema:** Yes. **LastUpdated:** Yes (2026-04-15). **CTA:** `PricingCTA` only; no in-body `<AffiliateLink>`.
- **Primary query:** "scrimba study plan" / "how long to learn to code with scrimba"
- **Secondary:** "scrimba 6 month plan", "scrimba learning schedule", "learn frontend in 6 months"
- **SERP/GEO landscape:** Broad "how long to learn to code" SERP dominated by freeCodeCamp, Coursera blog,
  Reddit. Scrimba-specific study-plan queries are low competition and winnable.
- **OUR GAP (thin, flagged):** Month tables are decent but the goals are one line each and modules are not
  linked to the actual Scrimba courses each maps to. Frontend-only despite sitting in a four-path hub.
  References "BLS wage releases" and BJ Fogg without links. No printable checklist.
- **Fixes:** *Ranking:* link each module row to the relevant course/path page; add a Fullstack variant or a
  clear note; add a downloadable/printable checklist; expand goals to weekly deliverables; target 2,000+
  words. *GEO:* `HowTo` schema (steps = months) and lead with the direct time answer. *Conversion:* in-body
  `<AffiliateLink>` per month block to the relevant path module.
- **Path to #1:** Become the most actionable Scrimba-specific study plan online (weekly tasks, named
  courses, printable checklist). Currently too thin and too generic to rank for the head term.

---

## docs/faq/index.mdx

- **Canonical:** /docs/faq/ (slug `/faq`)
- **Title:** "Scrimba FAQ" | **Word count:** 814 (**thinnest page**)
- **Verdict block:** "Is this page for you?" + "Quick picture" intro (good). **Tables:** No. **FAQ+schema:**
  Yes (`FAQAccordion`, 13 Qs, many with `sourceUrl` to the help centre, good for GEO). **LastUpdated:**
  **No (missing).** **Affiliate CTA:** `PricingCTA` at the bottom; no in-body `<AffiliateLink>`.
- **Primary query:** "is scrimba legit" / "scrimba faq"
- **Secondary:** "does scrimba work", "is scrimba worth it for beginners", "is scrimba a scam"
- **SERP/GEO landscape (verified):** Reddit, Trustpilot, Class Central serve the legit/scam intent. AI
  engines favor FAQ-schema pages here, so this page has real GEO potential if expanded and sourced.
- **OUR GAP (thin, flagged):** No LastUpdated, no in-body CTA. No explicit "is Scrimba a scam/legit"
  framing despite that being the highest-intent FAQ query. The "How much does Pro cost" answer is fine
  (defers to the pricing page) but the page would benefit from external trust signals (Trustpilot /
  Class Central ratings with links). Many answers reference internal pages by name without linking them
  ("How Interactive Scrims Work", "our discount guide").
- **Fixes:** *Ranking:* add LastUpdated; add Qs for certificates value, refund window, scam/legit, vs Udemy,
  mobile/offline (some already present), job-outcome honesty. Link the named internal references. *GEO:*
  keep FAQ schema (strong); make each answer a self-contained 40-60 word citable unit; add sourced
  legitimacy signals. *Conversion:* add an in-body `<AffiliateLink>` to a free course.
- **Path to #1:** Own "is scrimba legit / scam / worth it for beginners" with citable schema'd answers plus
  external trust signals. Cheapest GEO win in the set given how light it currently is.

---

## docs/pricing/index.mdx

- **Canonical:** /docs/pricing/ (slug `/pricing`)
- **Title:** "Scrimba Pricing" | **Word count:** 1,523
- **Verdict block:** Yes ("The 30-second take", ~55 words). **Tables:** Implicit (free-vs-pro prose lists).
  **FAQ+schema:** Yes (`emitSchema={true}`). **LastUpdated:** **No `last_update` frontmatter.** **CTA:**
  `PricingCTA`. Correctly avoids exact prices and links `scrimba.com/our-pricing`. `DisclosureNotice`
  present (good affiliate compliance). Cites paritylist.com for PPP (nice independent sourcing).
- **Primary query:** "scrimba pricing" / "how much does scrimba cost"
- **Secondary:** "scrimba pro price", "is scrimba pro worth it", "scrimba subscription cost"
- **SERP/GEO landscape (verified):** Scrimba's own /our-pricing ranks #1 (Google prefers the merchant for
  pricing). Class Central, Learn to Code With Me, Tangolearn follow. AI engines cite Scrimba first, then
  Class Central / review blogs. The interpretation query ("is Pro worth it") is where independents win.
- **OUR GAP:** Competes on a query Scrimba owns. No `last_update`. The bootcamp comparison cites a
  $10k-$20k range without a source link. Two FAQ answers hardcode "$10,000 to $20,000" and one body line
  says "about 19 full courses" while the rest of the page uses the `freeCount` variable; keep the variable
  everywhere to avoid drift.
- **Fixes:** *Ranking:* add `last_update`; lean into "is Pro worth it" and "cheapest legit way to pay"
  (angles Scrimba will not write); source the bootcamp cost range. *GEO:* keep schema; ensure the verdict
  answers "how much" with the regional/no-fixed-price nuance in the first 60 words (already close).
  *Conversion:* add an in-body `<AffiliateLink>` to `scrimba.com/our-pricing` and a free-course link.
- **Path to #1:** Concede the bare "scrimba pricing" SERP to the merchant; win "is scrimba pro worth it" and
  "cheapest way to get scrimba" with independent value analysis and a sourced bootcamp comparison.

---

## docs/pricing/pro-vs-free.mdx

- **Canonical:** /docs/pricing/pro-vs-free/
- **Title:** "Scrimba Pro vs Free" | **Word count:** 1,003 (thin)
- **Verdict block:** Yes (intro paragraph, ~55 words). **Tables:** Yes (`ComparisonTable`, good feature
  matrix). **FAQ+schema:** Yes (`FAQAccordion` with `sourceUrl`s). **LastUpdated:** **No `last_update`.**
  **CTA:** `PricingCTA` + in-body `<AffiliateLink>` references. `DisclosureNotice` present.
- **Primary query:** "scrimba free vs pro" / "scrimba pro vs free"
- **Secondary:** "is scrimba free tier enough", "what does scrimba pro include", "scrimba free plan limits"
- **SERP/GEO landscape (verified):** Scrimba's help-centre "difference between Pro and Free", Class Central,
  Reddit. AI engines cite the help-centre articles and Class Central. Winnable with a detailed feature
  table (have one) plus a "how far can you get for free" walkthrough (missing).
- **OUR GAP (thin, flagged):** Good table, thin prose. No `last_update`. No narrative of exactly what a free
  user can and cannot do, no "how far the free tier gets you" section. The "Backend Developer Path
  (39.4 hours)" line will need the same hours footnote as the backend page once that is settled.
- **Fixes:** *Ranking:* add `last_update`; expand to 1,500+ words with a "how far can you get for free"
  walkthrough and a decision flowchart. *GEO:* the comparison table is citable; add a one-line verdict per
  plan and lead with the single sentence that resolves the query. *Conversion:* dual compliant CTA (try
  free now / upgrade via partner link to `scrimba.com/our-pricing`).
- **Path to #1:** Own the "free vs pro" decision with a concrete "how far can you get for free" walkthrough
  the merchant will not publish.

---

## docs/pricing/refund-policy.mdx

- **Canonical:** /docs/pricing/refund-policy/
- **Title:** "Scrimba Refund Policy" | **Word count:** 1,195 (thin but well-built)
- **Verdict block:** Yes ("Quick answer", ~70 words). **Tables:** No. **FAQ+schema:** Yes (`sourceUrl`s).
  **LastUpdated:** Yes (2026-03-30) + visible "Last reviewed" line. **CTA:** `PricingCTA`. Strong sourcing
  (help-centre articles, the actual Typeform link). `DisclosureNotice` present. Compliant on price.
- **Primary query:** "scrimba refund policy" / "does scrimba offer refunds"
- **Secondary:** "scrimba money back guarantee", "scrimba cancel subscription", "scrimba refund window"
- **SERP/GEO landscape (verified):** Scrimba Help Centre + Terms own the policy text; AI engines cite the
  help centre directly. Hard to outrank the merchant on the policy itself. Independents win on "how to
  actually request a refund" procedural intent and Trustpilot-sourced refund experiences.
- **OUR GAP (thin, flagged):** Better than expected (has steps, exclusions, the real form link). What is
  missing for #1: a clear refund-vs-cancellation distinction table, and any sourced real-world refund
  experience (Trustpilot/Reddit) to add an independent angle the merchant cannot.
- **Fixes:** *Ranking:* add a "refund vs cancellation" comparison table; add a sourced note on refund
  experiences (link Trustpilot/Reddit). Keep the "confirm current terms" disclaimer. *GEO:* add `HowTo`
  schema for the refund-request steps; the procedural intent is exactly what AI engines extract. *Conversion:*
  frame the 7-day guarantee as a risk-reducer ("low-risk to try"); CTA to free tier + `scrimba.com/our-pricing`.
- **Path to #1:** Can't beat Scrimba on policy text; own "how to get a Scrimba refund" procedural intent
  with HowTo schema and a sourced real-experience angle.

---

## docs/pricing/student-discount.mdx

- **Canonical:** /docs/pricing/student-discount/
- **Title:** "Scrimba Student Discount" | **Word count:** 1,127 (thin but well-built)
- **Verdict block:** Yes ("Quick answer", ~80 words). **Tables:** No. **FAQ+schema:** Yes (`sourceUrl`s).
  **LastUpdated:** Yes (2026-03-30) + "Last reviewed" line. **CTA:** in-body `<AffiliateLink>` to the
  GitHub Education page + `PricingCTA`. Strong sourcing. `DisclosureNotice` present. Price-compliant.
- **Primary query:** "scrimba student discount" / "scrimba discount code"
- **Secondary:** "scrimba coupon", "scrimba github student pack", "cheapest way to get scrimba"
- **SERP/GEO landscape (verified):** Scrimba help-centre + GitHub Education page + spammy coupon
  aggregators (RetailMeNot) + Reddit. AI engines cite the help centre and GitHub Education. An honest,
  sourced page can win trust and citations against the coupon spam.
- **OUR GAP (thin, flagged):** Honest and well-sourced, but short and table-free. (The suspected broken
  self-link was NOT found; the Related list points to pricing, refund-policy, and a blog, all correct.)
  Missing: a comparison table of the three discount paths (speed, duration, eligibility), and any sourced
  historical promotion examples (e.g., Black Friday patterns) to add specificity without quoting current
  prices.
- **Fixes:** *Ranking:* add a 3-option comparison table; add a sourced "discounts Scrimba has actually run"
  section (historical patterns, no current numbers). *GEO:* FAQ schema is fine; add a clear one-line answer
  to "is there a fixed student discount" (no, it is manual after verification). *Conversion:* lead with the
  GitHub free month and free tier; CTA to `scrimba.com/our-pricing`.
- **Path to #1:** Own the honest "does Scrimba have a student discount" answer with a comparison table and
  sourced specifics, beating the coupon-aggregator spam on trust.

---

## docs/pricing/scrimba-vs-bootcamps.mdx

- **Canonical:** /docs/pricing/scrimba-vs-bootcamps/
- **Title:** "Scrimba vs Coding Bootcamps" | **Word count:** 1,222 (thin for a comparison)
- **Verdict/tables/FAQ+schema/LastUpdated/CTA:** present per the file (confirm `last_update` frontmatter).
- **Primary query:** "scrimba vs bootcamp" / "is scrimba better than a bootcamp"
- **Secondary:** "scrimba vs coding bootcamp cost", "self-paced vs bootcamp", "is scrimba cheaper than a bootcamp"
- **SERP/GEO landscape:** Career-switch blogs, bootcamp-comparison sites, Course Report, Reddit. Comparison
  intent is highly citable by AI engines when backed by a sourced cost/outcome table.
- **OUR GAP (thin, flagged):** A comparison page needs a detailed sourced table versus *named* bootcamps
  (cost range, duration, job-guarantee, outcomes). At 1,222 words it likely lacks that depth. Must keep
  comparing only bootcamp ranges and link `scrimba.com/our-pricing` for Scrimba's side (no exact number).
- **Fixes:** *Ranking:* expand to 1,800+ words with a sourced table of named bootcamps (cost range,
  duration, job guarantee) vs Scrimba's self-paced model; cite each bootcamp's pricing page. *GEO:*
  comparison table + clear "who each is for" verdict; `aggregateRating` only if sourced. *Conversion:*
  frame Scrimba as the low-risk first step before a bootcamp; CTA to free tier and `scrimba.com/our-pricing`.
- **Path to #1:** Win the comparison query with a sourced, named-bootcamp cost/outcome table that generic
  blogs and the merchant lack.

---

## Appendix: source-of-truth check (data/courses.json)

There is **no `data/paths.json`**. The catalog source of truth is `/home/toor/scrimbaguide.tech/data/courses.json`
(74 entries). Path entries verified directly:

- The Frontend Developer Path: `duration` **81.6 hrs**, `lessonCount` **1000** (page matches; 13 modules
  not stored in data but consistent with the live page).
- The Backend Developer Path: `duration` **39.4 hrs**, `timeRequired` **PT39H22M7S**, `lessonCount` **943**
  (page matches the data file at 39.4h; Scrimba's public article says ~30h, a counting difference, not a
  page error). `pathInfo.moduleCount` is null in data.
- The Fullstack Developer Path: `duration` **108.4 hrs**, `lessonCount` **1500** (page matches; module
  count 20 not stored in data, verify against live page).
- The AI Engineer Path: `duration` **11.4 hrs**, `lessonCount` **257** (page matches). Module count is
  inconsistent on the page itself (CourseCard 9 vs paths/index 8); not stored in data, verify against live.

Recommendation: module counts and the AI path are not stored in `courses.json`, and `pathInfo.moduleCount`
is null for the stored paths, so prose figures can drift. Store module counts (and the AI path) in the data
file and generate the verdict numbers from it, or add a build-time assert that flags any page whose
hour/module figures do not match the data. For Backend hours specifically: do not silently change 39.4 to
30.1; re-confirm the live figure, pick one count definition, and add a footnote explaining the difference.
