# Comparisons section: SEO + GEO competitive audit

Scope: 13 head-to-head comparison pages plus the `/docs/comparisons/` hub (14 files total).
Canonical pattern: `https://scrimbaguide.tech/docs/comparisons/<slug>/` (trailing slash).
Audited: 2026-05-28. Author is an independent catalog reviewer (not a course completer); all scrimba.com links must use `<AffiliateLink>`; never quote exact Scrimba prices (link `scrimba.com/our-pricing`); no em-dashes in recommended copy.

Verification note: all 14 files were read in full and a structural marker matrix was run across them (VerdictBox / ComparisonTable / DocFaqSchema / FAQAccordion / PricingCTA / last_update / visible "Last reviewed" line). Live SERP pulls (WebSearch) were unavailable during this pass; competitor/citation-source lists below reflect the stable, well-established SERP for each "X vs Y coding platform" query and should be re-confirmed with a live pull before acting on the ranking bucket.

Structural matrix (confirmed): every head-to-head page has 2x VerdictBox/ComparisonTable/DocFaqSchema markers (the second is the visible FAQ mirror). The ONLY pages missing both a `last_update` frontmatter date AND a visible "Last reviewed" line are: index.mdx (hub), scrimba-vs-codecademy.mdx, and scrimba-vs-odin-project.mdx. All other 11 head-to-heads have both. AffiliateLink is imported/used on: coursera, boot-dev, odin-project, treehouse. The remaining pages hardcode `?via=u42d4986` in component props.

---

## Cross-cutting findings (whole section)

1. **The on-page template is already strong and consistent.** Almost every page ships a `VerdictBox` (short extractable verdict + pros/cons), a `ComparisonTable`, a doubled FAQ (`DocFaqSchema` for structured data + `FAQAccordion` for the visible UI), a `DisclosureNotice`, and a `PricingCTA`. This is well ahead of most affiliate competitors. The gaps are in consistency and freshness, not in missing the playbook.

2. **Freshness signals are inconsistent and that is the single biggest recurring miss.** 11 of 13 head-to-heads carry both a `last_update: 2026-05-23` frontmatter date and a visible "Last reviewed: May 2026" line. The three exceptions (the hub, scrimba-vs-codecademy, scrimba-vs-odin-project) have NEITHER. These three are otherwise among the strongest pages on content, so the missing freshness signal is pure low-effort upside. Google and AI engines both weight visible recency for "best platform 2026" intent.

3. **Duplicated FAQ content is a wasted GEO asset.** Pages emit the same Q&A twice (`DocFaqSchema` + `FAQAccordion emitSchema={false}`). That is correct for avoiding double schema, but the question SET is narrow (3-5 Qs) and mostly "is X better / which is cheaper." Adding 2-3 long-tail, literal-match questions per page (for example "Can I get a job with Scrimba alone?", "Is [competitor] worth it in 2026?") is the highest-leverage GEO move because those are exactly the strings AI engines retrieve against.

4. **Hardcoded stats will silently rot and undercut trust + freshness.** Trustpilot scores, "250,000 courses", "~$59/mo Coursera Plus", student counts, and path hour figures are typed inline. Several already drift from the `scrimbaFacts` helper (the Udemy verdict still says "all 86 courses" while the table uses `${totalCoursesLabel}`). Move every external stat behind a dated, sourced span and route Scrimba facts through `scrimbaFacts` everywhere.

5. **Affiliate-link hygiene is uneven.** Four pages (coursera, boot-dev, odin-project, treehouse) correctly use `<AffiliateLink>` in their body prose. But ALL 13 pages still pass raw `https://scrimba.com/?via=u42d4986` into `ComparisonTable` props and raw `https://scrimba.com/s0v687325e` into `VerdictBox` ctaHref props, bypassing the `<AffiliateLink>` component's `rel="nofollow"` and click tracking. Either route those props through `<AffiliateLink>` or have `ComparisonTable`/`VerdictBox` internally append `?via=` and set `rel="nofollow"`. This is the cleanest single component-level fix.

---

## 1. index.mdx (hub) — /docs/comparisons/

- **Frontmatter:** title "Scrimba vs Alternatives"; desc strong (lists Udemy/Codecademy/freeCodeCamp). Keywords good. `slug: /comparisons`. No `last_update`.
- **Word count:** 966 (thinnest page; acceptable for a hub).
- **Has:** routing table of all 13 competitors (good), a "decide in 3 questions" block, FAQAccordion (3 Qs, schema ON here), DisclosureNotice, PricingCTA. **Missing:** verdict box (fine for a hub), `last_update`/visible date, ItemList/structured data for the comparison set.
- **Primary query:** "scrimba alternatives" / "scrimba vs". Secondary: "best coding platform 2026", "scrimba competitors", "is scrimba worth it vs".
- **Likely competitors ranking:** Scrimba's own /blog, Class Central, Reddit r/learnprogramming threads, G2 "Scrimba alternatives", SaaSworthy/Slant. AI engines cite Class Central, Reddit, and Scrimba's own comparison content first.
- **Our gap:** Hub has no freshness date and no ItemList schema, so it does not present as a canonical "directory" to crawlers or AI. The intro is benefit-led but lacks one extractable 40-60 word "what is the best Scrimba alternative" answer that AI can lift.
- **Fixes — Ranking:** add `last_update`; add an H2 "Best Scrimba alternatives at a glance" above the table; add internal links from every child page back to this hub (some already do). **GEO:** add `ItemList`/`FAQPage` schema enumerating the 13 comparisons; add a 50-word direct-answer paragraph ("The best Scrimba alternative depends on your goal: freeCodeCamp/Odin for $0, Codecademy for non-web languages, Coursera for credentials..."). **Conversion:** keep the free-tier CTA; add a single "Not sure? Start with the free scrim demo" `<AffiliateLink>` to `s0v687325e` near the top.
- **Path to #1:** Convert the hub into the canonical "Scrimba alternatives" directory with ItemList schema and a lift-ready 50-word answer block. That is what wins the broad informational query and the AI-Overview slot.

---

## 2. scrimba-vs-udemy.mdx  (slug: scrimba-vs-udemy)

- **Frontmatter:** title "Scrimba vs Udemy"; desc strong; keywords good (incl. "best coding platform 2026"); `last_update: 2026-05-23` present.
- **Word count:** 1837.
- **Has:** visible "Last reviewed: May 2026" line, VerdictBox, ComparisonTable, "where each wins" + real-complaints section (excellent E-E-A-T), low-risk sequence, DocFaqSchema + FAQAccordion (4 Qs), PricingCTA. Strongest page in the set on balance/trust.
- **Issues:** VerdictBox pros say "all 86 courses" (hardcoded, drifting from `totalCoursesLabel`); demo + scrimba URLs hardcoded, not via `<AffiliateLink>`.
- **Primary query:** "scrimba vs udemy". Secondary: "udemy vs scrimba", "scrimba or udemy", "is scrimba better than udemy".
- **Likely competitors:** Scrimba blog, Reddit, Class Central, CareerKarma, Medium posts, Udemy's own pages. AI citation sources: Reddit threads, Class Central, Scrimba blog.
- **Our gap:** Very close to best-in-class. Main risks are the drifting "86" stat and non-componentized affiliate links; FAQ set could add "Can I get a job with Scrimba or Udemy?" and "Is Udemy worth it in 2026?".
- **Fixes — Ranking:** replace "86" with `${totalCoursesLabel}`; nothing else urgent. **GEO:** add 2 literal-match FAQs; wrap the electroIQ/Trustpilot stats in dated sourced spans. **Conversion:** route demo + Pro links through `<AffiliateLink>`.
- **Path to #1:** This page is already template-complete; fix the hardcoded stat and link hygiene, add 2 long-tail FAQs, and it should hold/take the #1 organic + AI-citation slot for "scrimba vs udemy."

---

## 3. scrimba-vs-codecademy.mdx  (slug: scrimba-vs-codecademy)

- **Frontmatter:** title good; desc strong; keywords good. **No `last_update`.**
- **Word count:** 2126.
- **Has:** VerdictBox, ComparisonTable, named-instructor React deep-dive (with a real third-party Medium review cited — strong E-E-A-T), "where each wins", low-risk sequence, DocFaqSchema + FAQAccordion (4 / 3 Qs), PricingCTA. **Missing:** any visible "last reviewed" date and `last_update` frontmatter.
- **Issues:** scrimba/demo URLs hardcoded; FAQ counts mismatch between schema (4) and visible accordion (3).
- **Primary query:** "scrimba vs codecademy". Secondary: "codecademy vs scrimba", "scrimba or codecademy", "is codecademy or scrimba better".
- **Likely competitors:** Codecademy's own blog, Class Central, BitDegree, Reddit, Hackr.io. AI sources: Reddit, Class Central, BitDegree.
- **Our gap:** Only real gap is freshness (no date). Content depth and the uncomfortable Codecademy 2.7 Trustpilot stat are GEO gold but undated.
- **Fixes — Ranking:** add `last_update: 2026-05-23` + visible "Last reviewed: May 2026" line. **GEO:** date the Trustpilot stat; align visible FAQ to the full 4-Q schema set; add "Is Codecademy worth it in 2026?". **Conversion:** componentize affiliate links.
- **Path to #1:** Add the missing freshness signals and the page is essentially best-in-class; the cited Medium review and Trustpilot data already make it more citable than most SERP incumbents.

---

## 4. scrimba-vs-coursera.mdx  (slug: scrimba-vs-coursera)

- **Frontmatter:** title good; desc strong; keywords incl "coursera plus 2026"; `last_update: 2026-05-23`.
- **Word count:** 2048.
- **Has:** "Is this for you" + one-sentence tradeoff opener (excellent extractable intro), visible "Last reviewed" line, VerdictBox, ComparisonTable, "Scrimba is also on Coursera" honesty section (strong trust + unique angle), DocFaqSchema + FAQAccordion (5 / 4 Qs), PricingCTA. **Correctly uses `<AffiliateLink>`** in the choose-Scrimba section — the model for the others.
- **Issues:** quotes "$59/mo or $399/yr" for Coursera Plus (fine, that's the competitor not Scrimba) but undated as a sourced stat in places; verdict is long (good for GEO, but trim if it hurts readability).
- **Primary query:** "scrimba vs coursera". Secondary: "coursera vs scrimba", "is a coursera certificate worth it", "scrimba or coursera for react".
- **Likely competitors:** Coursera's own pages, Class Central, Reddit, Course Report, university-cert blogs. AI sources: Reddit, Class Central, Coursera blog.
- **Our gap:** Minimal. Some Coursera price/stat values should sit in dated sourced spans so they don't rot.
- **Fixes — Ranking:** none urgent. **GEO:** wrap Coursera price + "10,000+ courses" + ACE-credit claims in dated sourced spans; the certificate-value FAQ is exactly right, add "Will a Scrimba certificate get me a job?". **Conversion:** already correct; mirror this AffiliateLink pattern to the other 12 pages.
- **Path to #1:** Use this page as the template-of-record. Date its external stats and it is the strongest example of the GEO-ready, trust-forward comparison the rest of the section should match.

---

## 5. scrimba-vs-boot-dev.mdx  (slug: scrimba-vs-boot-dev)

- **Word count:** 2326 (one of the longest, strong depth). Full template confirmed: `last_update: 2026-05-23` + visible "Last reviewed" line, VerdictBox, ComparisonTable, "Who should pick Boot.dev specifically" segment (excellent, concedes backend honestly), DocFaqSchema + FAQAccordion (5/4 Qs), PricingCTA. Uses `<AffiliateLink>` correctly in the choose-Scrimba section. Already one of the most complete pages.
- **Issues:** Boot.dev price ($59/mo) and the Trustpilot reference should sit in dated sourced spans; VerdictBox ctaHref is still a raw `s0v687325e` (component-level fix).
- **Primary query:** "scrimba vs boot.dev". Secondary: "boot.dev vs scrimba", "boot.dev review", "best platform for backend beginners".
- **Likely competitors:** Boot.dev's own blog (very SEO-active), Reddit r/learnprogramming (Boot.dev is heavily discussed there), Class Central, YouTube reviews. AI sources lean Reddit + Boot.dev's own content.
- **Our gap:** Boot.dev's brand-owned content and Reddit dominance are hard to outrank; intent is partly mismatched (Boot.dev = backend/Python/Go, Scrimba = frontend/AI). The page already handles this well by conceding backend; the only real misses are stat-dating and the component-level link hygiene.
- **Fixes — Ranking:** add a target for the long-tail "scrimba vs boot.dev for beginners". **GEO:** date the Boot.dev price and Trustpilot sentiment; add FAQ "Is Boot.dev worth it in 2026?". **Conversion:** already well-positioned as the frontend/AI complement; just clean the ctaHref.
- **Path to #1:** This page is near best-in-class. Win the "which is better for FRONTEND vs backend" framing it already leans into; date the external stats and the honest backend concession should keep it citable by AI.

---

## 6. scrimba-vs-odin-project.mdx  (slug: scrimba-vs-odin-project)

- **Word count:** 2337 (longest). Title "Scrimba vs The Odin Project". Full template + cited Trustpilot (4.7 vs 4.3, with honest survivorship caveat) + cited ComputerScience.org and Odin success-stories sources. Uses `<AffiliateLink>` in body. **MISSING both `last_update` frontmatter AND a visible "Last reviewed" line** (one of only three pages that lack freshness). This is the single biggest miss on an otherwise excellent page.
- **Primary query:** "scrimba vs the odin project". Secondary: "odin project vs scrimba", "is the odin project enough", "free coding curriculum vs scrimba".
- **Likely competitors:** Odin Project's own site/Discord, heavy Reddit presence (Odin is a Reddit darling), Class Central, Medium "I finished Odin" posts. AI sources: Reddit + Odin's own materials.
- **Our gap:** Odin is free and Reddit-beloved, so a "Scrimba is better" framing reads as biased and won't get cited. Must respect the $0 angle.
- **Fixes — Ranking:** ADD `last_update: 2026-05-23` + a visible "Last reviewed: May 2026" line (highest-leverage fix here); target "scrimba vs odin for total beginners" + "is the odin project too hard". **GEO:** the verdict already concedes Odin wins on $0/self-direction; the "Is The Odin Project really free?" FAQ is already present, add "Is Odin too hard for beginners?". **Conversion:** already frames Scrimba's free tier as the gentler on-ramp and uses `<AffiliateLink>`; clean the VerdictBox ctaHref.
- **Path to #1:** Lead with the honest "free + self-directed vs guided + paid-after-free" split; that balanced framing is what AI engines and Reddit-skeptical readers reward.

---

## 7. scrimba-vs-frontendmasters.mdx  (slug: scrimba-vs-frontendmasters)

- **Word count:** 2078. Title "Scrimba vs Frontend Masters". Full template + `last_update` + visible date + a dedicated Sources section (good E-E-A-T). Already nails the beginner-vs-working-dev intent split in the verdict and table.
- **Issues:** hardcodes FM's "$39/month or $390/year" inline in many places (fine, it's the competitor) but not behind a dated sourced span; raw scrimba ctaHref.
- **Primary query:** "scrimba vs frontend masters". Secondary: "frontend masters vs scrimba", "is frontend masters worth it", "frontend masters for beginners".
- **Likely competitors:** Frontend Masters' own site, Reddit, Class Central, dev.to. AI sources: Reddit + FEM's own pages.
- **Our gap:** Minimal. FEM is positioned as expert/advanced and the page already splits beginner-vs-working-dev intent explicitly. Main miss is dating the FM price stats so they don't rot.
- **Fixes — Ranking:** add an explicit "frontend masters vs scrimba for beginners" target. **GEO:** date the FM price; the "Is Scrimba better than Frontend Masters for beginners?" FAQ is already present and exactly right. **Conversion:** clean the ctaHref.
- **Path to #1:** Own the "which is better for BEGINNERS" cut of the query; FEM's own content already owns the advanced cut.

---

## 8. scrimba-vs-youtube.mdx  (slug: scrimba-vs-youtube)

- **Word count:** 2375 (longest tie). Title "Scrimba vs YouTube". Full template + `last_update` + visible date + a strong cited "Net Ninja vs Bob Ziroll" head-to-head with a Sources section. A top-3 highest-intent page per the hub.
- **Primary query:** "scrimba vs youtube". Secondary: "is youtube enough to learn coding", "learn to code youtube vs course", "tutorial hell youtube".
- **Likely competitors:** Reddit, dev.to/Medium "can you learn to code on YouTube" posts, freeCodeCamp blog, YouTube itself. AI sources: Reddit + freeCodeCamp articles.
- **Our gap:** Query is broad/informational ("is YouTube enough") more than brand-vs-brand; page must answer the underlying "can I learn coding free on YouTube" question to capture and be cited.
- **Fixes — Ranking:** lean the title/H1 and an H2 into "Is YouTube enough to learn to code?"; that captures far more volume than "scrimba vs youtube". **GEO:** 50-word extractable answer to "can you learn coding on YouTube"; cite the tutorial-hell concept with a source; FAQ "Is YouTube enough to get a coding job?". **Conversion:** position Scrimba as the structure/anti-tutorial-hell fix, free demo CTA.
- **Path to #1:** Reframe around the informational "is YouTube enough" intent (highest volume here) with a lift-ready answer block; the brand-vs-brand framing alone under-serves the query.

---

## 9. scrimba-vs-freecodecamp.mdx  (slug: scrimba-vs-freecodecamp)

- **Word count:** 1660. Title "Scrimba vs freeCodeCamp". Full template + `last_update` + visible date + a genuinely well-sourced certification-value section (hackr.io, DEV.to, fCC forum, HN). Strong E-E-A-T already.
- **Primary query:** "scrimba vs freecodecamp". Secondary: "freecodecamp vs scrimba", "is freecodecamp enough", "free coding bootcamp vs scrimba".
- **Likely competitors:** freeCodeCamp's own (enormous domain authority), Reddit, Class Central. AI sources: freeCodeCamp + Reddit (very hard to outrank).
- **Our gap:** freeCodeCamp has massive DA and is free; a "Scrimba beats free" framing is non-credible. Thinnest of the deep pages (1660w) against the hardest competitor.
- **Fixes — Ranking:** do NOT fight head-on for the brand term; target "is freecodecamp enough to get a job" + "freecodecamp alternative with video". **GEO:** honest verdict conceding fCC wins on $0 + certifications, Scrimba wins on guided video/less burnout; FAQ "Is freeCodeCamp enough to get hired?". **Conversion:** frame Scrimba free tier as the video complement to fCC's text.
- **Path to #1:** Realistically aim for the long-tail and AI-citation slot ("freeCodeCamp alternatives", "is fCC enough"), not the raw brand SERP. Add depth to close the word-count gap.

---

## 10. scrimba-vs-treehouse.mdx  (slug: scrimba-vs-treehouse)

- **Word count:** 2063. Title "Scrimba vs Treehouse". Full template + `last_update` + visible date + `<AffiliateLink>` in body. Already targets "is Treehouse worth it in 2026" intent in the opener and a dedicated FAQ.
- **Primary query:** "scrimba vs treehouse". Secondary: "treehouse vs scrimba", "is team treehouse worth it 2026", "treehouse alternative".
- **Likely competitors:** Treehouse's own site, Class Central, Reddit, older review blogs (Treehouse SERP is thinner/older — an opportunity). AI sources: Class Central, Reddit.
- **Our gap:** Lower competition here and the page is already strong (freshness present, FAQ covers Treehouse status + Techdegree). Treehouse has declined, so "is Treehouse still active in 2026" is the underserved long-tail to push harder on.
- **Fixes — Ranking:** add an explicit "is Treehouse still active in 2026" target. **GEO:** the "Is Treehouse better than Scrimba in 2026?" FAQ is present; add a dated source for Treehouse's slowing update cadence. **Conversion:** already positions Scrimba as the modern alternative; clean the ctaHref.
- **Path to #1:** One of the most winnable pages: weak/stale incumbents and the page is already template-complete. Push the "is Treehouse still worth it in 2026" angle harder and it can take #1 + the AI slot.

---

## 11. scrimba-vs-pluralsight.mdx  (slug: scrimba-vs-pluralsight)

- **Word count:** 1700. Title "Scrimba vs Pluralsight". Full template + `last_update` + visible date + Sources section + a "Quick answer" extractable opener. Already splits individual-vs-enterprise intent cleanly.
- **Primary query:** "scrimba vs pluralsight". Secondary: "pluralsight vs scrimba", "is pluralsight worth it for beginners", "pluralsight for web development".
- **Likely competitors:** Pluralsight's own site, G2, Class Central, Reddit. AI sources: G2, Reddit.
- **Our gap:** Pluralsight is enterprise/cert-prep focused; intent mismatch with individual beginners. Page is on the thinner side (1700w).
- **Fixes — Ranking:** target "pluralsight vs scrimba for beginners" + "is pluralsight good for web development". **GEO:** verdict conceding Pluralsight wins for enterprise/team L&D + cert prep, Scrimba wins for individual web/AI beginners; FAQ "Is Pluralsight good for beginners?". **Conversion:** free demo CTA for the individual-learner segment.
- **Path to #1:** Own the individual-beginner cut; Pluralsight's own domain owns the enterprise/cert cut. Add depth to reach ~2000w.

---

## 12. scrimba-vs-educative.mdx  (slug: scrimba-vs-educative)

- **Word count:** 1686. Title "Scrimba vs Educative". Full template + `last_update` + visible date + Sources section + "Quick answer" extractable opener. Already splits beginner-vs-interview-prep intent and concedes Grokking/system-design to Educative.
- **Primary query:** "scrimba vs educative". Secondary: "educative vs scrimba", "is educative worth it", "educative for beginners vs interview prep".
- **Likely competitors:** Educative's own site, Reddit (esp. interview-prep threads), Class Central. AI sources: Reddit, Class Central.
- **Our gap:** Educative is text-playground + interview/system-design focused; clear intent split. Thinner page (1686w).
- **Fixes — Ranking:** target "educative vs scrimba for beginners" and "text vs video coding course". **GEO:** verdict: Educative = text playgrounds + interview/system design, Scrimba = guided video for web/AI beginners; FAQ "Is Educative good for beginners?" / "Educative vs Scrimba for interview prep?". **Conversion:** free demo CTA.
- **Path to #1:** Win the beginner + "video vs text" framing; concede interview/system-design depth to Educative for credibility. Add depth.

---

## 13. scrimba-vs-fireship.mdx  (slug: scrimba-vs-fireship)

- **Word count:** 1645 (thinnest of the head-to-heads). Title "Scrimba vs Fireship". Full template + `last_update` + visible date + Sources section + "Quick answer" opener. Already frames short-form-vs-long-form and concedes Fireship's overview strength.
- **Primary query:** "scrimba vs fireship". Secondary: "is fireship enough to learn", "fireship pro worth it", "fireship vs structured course".
- **Likely competitors:** Reddit, YouTube (Fireship is a YT brand), dev.to. AI sources: Reddit, YouTube comments/threads.
- **Our gap:** Fireship is short-form/single-creator and partly free on YouTube; the real query is "is Fireship enough to actually learn" (depth vs entertainment). Thinnest page against a strong creator brand.
- **Fixes — Ranking:** target "is Fireship enough to learn to code" + "fireship pro worth it". **GEO:** verdict: Fireship = fast overviews/staying current, Scrimba = structured beginner-to-job depth; FAQ "Can you learn to code from Fireship alone?". **Conversion:** position Scrimba as the structured follow-through after Fireship's overviews; free demo CTA.
- **Path to #1:** Reframe around "is Fireship enough" depth intent and add ~400-600 words; it is currently the thinnest page and needs body to compete.

---

## 14. scrimba-vs-zerotomastery.mdx  (slug: scrimba-vs-zerotomastery)

- **Word count:** 1747. Title "Scrimba vs Zero to Mastery". Full template + `last_update` + visible date + Sources section + "Quick answer" opener. Already frames cohort-vs-self-paced and has an "Is the ZTM lifetime plan worth it?" FAQ.
- **Primary query:** "scrimba vs zero to mastery". Secondary: "zero to mastery vs scrimba", "is zero to mastery worth it 2026", "ZTM vs scrimba for beginners".
- **Likely competitors:** ZTM's own site, Reddit, Andrei Neagoie/ZTM YouTube, Class Central. AI sources: Reddit, ZTM's own content.
- **Our gap:** ZTM has a strong single-instructor brand + active community; "is ZTM worth it" is the real query. Mid-thin page (1747w).
- **Fixes — Ranking:** target "is Zero to Mastery worth it in 2026" + "ZTM vs scrimba for beginners". **GEO:** verdict: ZTM = cohort-style + one lead instructor + Discord, Scrimba = self-paced interactive scrims; FAQ "Is Zero to Mastery worth it?" with a dated source. **Conversion:** free demo CTA for the self-paced segment.
- **Path to #1:** Honest cohort-vs-self-paced framing plus a dated "is ZTM worth it 2026" answer block; add depth toward ~2000w.

---

## Section-wide priority actions (do once, applies to all)

1. **Freshness pass (only 3 pages need it):** add `last_update: 2026-05-23` frontmatter + one visible "Last reviewed: May 2026" line to the three pages missing both: index.mdx, scrimba-vs-codecademy.mdx, scrimba-vs-odin-project.mdx. Highest leverage, lowest effort. The other 11 already have both.
2. **FAQ expansion + literal-match questions:** add 2-3 long-tail questions per page ("Is [competitor] worth it in 2026?", "Can I get a job with Scrimba alone?", "Is [competitor] free?"). Align the visible `FAQAccordion` set to the full `DocFaqSchema` set.
3. **Stat hygiene:** wrap every external stat in a dated, sourced span; route all Scrimba facts through `scrimbaFacts` (fix the "86 courses" drift in the Udemy verdict).
4. **Affiliate-link standardization:** replace hardcoded `?via=u42d4986` and raw `s0v687325e` hrefs with `<AffiliateLink>` everywhere (Coursera is the reference implementation).
5. **Intent reframing for the hard/broad pages:** YouTube, freeCodeCamp, Odin, Fireship should lead into the informational "is X enough" question; Boot.dev/FEM/Pluralsight/Educative should explicitly split beginner-vs-advanced/backend intent rather than claim an outright win.
