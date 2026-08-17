# Multilingual Program: Execution Plan

**Goal:** take scrimbaguide.tech from 1 locale to a multi-market property that ranks in
European, Indian, Japanese, and Arabic-speaking search markets, without losing any of the
English rankings or SEO invariants the site already depends on.

**Status:** infrastructure COMPLETE and committed; `es` translation IN PROGRESS and PARKED.
See §19 for the execution log. This document remains the contract.

**Author's note on scope:** this is deliberately front-loaded. Phases 0 to 3 are
infrastructure and cost roughly two weeks of engineering. They are what make the
translation phase cheap, safe, and repeatable. Skipping them and translating first is the
single most likely way this program fails.

---

## 0. The bet, stated plainly

Scrimba teaches in English. Every buyer must read English well enough to take the course.
So translation does **not** open a new product market; it opens a new **research** market.
People evaluate a purchase in their own language and then consume the product in English.

That has three consequences that shape everything below:

1. **The money pages matter more than the catalog.** "Scrimba avis", "Scrimba Erfahrungen",
   "Scrimba 評判", "vale a pena Scrimba" are evaluation queries. Those convert. A translated
   course-catalog leaf page for `learn-svelte` in Latvian does not.
2. **Markets with lower English proficiency and large dev populations pay best.** Brazil,
   Spanish-speaking LatAm, France, Turkey, Indonesia, Japan, Arabic-speaking MENA. Markets
   where developers already research in English (Netherlands, Nordics, India) get much less
   lift from translation and more lift from *market-specific English content*.
3. **Pure translation is the weakest version of this play.** The strongest per-market asset
   is a `scrimba-vs-<local competitor>` page that does not exist in English at all
   (Alura and Rocketseat in Brazil, Platzi across Ibero-America, OpenClassrooms in France,
   Progate / TechAcademy / CodeCamp / DMM WEBCAMP in Japan, Scaler / Coding Ninjas /
   GeeksforGeeks in India). Those are net-new content, not translations, and they are the
   highest-margin work in this entire program.

So the plan is **translation as the floor, transcreation on money pages, net-new local
competitor content as the actual differentiator.**

---

## 1. Decisions locked

| Decision | Choice | Why |
|---|---|---|
| URL structure | Subdirectory: `scrimbaguide.tech/de/...` | Google lists ccTLD / subdomain / subdirectory as equal-with-tradeoffs; subdirectory keeps all authority on one domain, is what Docusaurus does natively, and is the only option that does not require new DNS/hosting per market. |
| Slug localization | **No. Path parity is mandatory.** `/de/docs/comparisons/scrimba-vs-codecademy/` | Docusaurus computes hreflang by swapping the locale segment on the *current* pathname (`useAlternatePageUtils.createUrl`, verified in `node_modules/@docusaurus/theme-common/lib/utils/useAlternatePageUtils.js`). A different translated slug makes every hreflang on that page point at a 404. Docusaurus also lists slug translation as an explicit non-goal ("technically complicated, little SEO value"). Local keywords go in `title`, H1, `description`, and the first paragraph instead. |
| Canonical | **Self-referencing per locale.** `/de/docs/x/` canonicals to itself. | Cross-locale canonical to English would deindex every translation. This is the #1 fatal mistake in multilingual SEO. |
| Geo/language redirect | **Never.** Dismissible suggestion banner only. | Google: "Avoid automatically redirecting users from one language version of a site to a different language version." US-based Googlebot would only ever see English. |
| Locale launch unit | A locale ships only when its **declared page set is 100% translated**. | Docusaurus falls back to default-locale markdown for missing translations, so a half-translated locale publishes English pages under a German hreflang. That is duplicate content plus a bad quality signal. |
| Coverage tiers | **Three route sets, enumerated in `i18n/tiers.json`.** Tier A gets `full`; Tier B gets `full` minus `docs/courses/**` leaves; Tier C and E get **Core-40**; Tier D gets **Micro-16**. Uncovered routes are **absent from that locale and absent from its hreflang cluster**. | Requires the coverage-manifest work in Phase 2. Without it, tiered coverage produces broken hreflang. See §2.1. |
| Register per language | Fixed once per locale in the skill (see §4 Phase 5). de: `du`. fr: `vous`. ja: です・ます. ar: MSA. | Register drift across 200 pages reads as machine output. |
| Course titles | **Not translated.** "Learn React", "Frontend Developer Path" stay English. | They are product names and the actual search term. Descriptions and surrounding prose are translated. |
| Legal pages | English only, excluded from all locales, with a one-line localized notice. | Translated privacy/ToS text creates real legal exposure and has zero SEO value. |

---

## 2. Locale roster

`en` is `defaultLocale` and keeps the bare root (`/docs/...`, no prefix).

### 2.1 Coverage tiers: what each locale actually translates

**Decided 2026-08-09.** Enumerated in `i18n/tiers.json`; tier assignment per locale lives in
`i18n/locales.config.ts` (`coverage` field). All 40 Core routes were validated against the live
220-URL sitemap, so none of this is aspirational.

| Route set | Routes | Applies to | Translated words (approx) |
|---|---|---|---|
| `full` | ~190 | Tier A (6) | ~272k each |
| `full` minus `docs/courses/**` leaves | ~119 | Tier B (8) | ~200k each |
| **Core-40** | 40 | Tier C (10) + Tier E (12) | ~58k each |
| **Micro-16** | 16 | Tier D (11) | ~26k each |

**The chrome floor is the constraint that shapes this.** Navbar, footer, and MegaMenu reach
`/docs/intro/`, the four hubs, `/docs/faq/`, `/docs/changelog/`, `/blog`, `/about/` and
`/contact/`. Under `onBrokenLinks: 'throw'` every one of those must exist in every locale, so
**9 pages of pure navigation scaffolding are mandatory before a single commercial page.** That is
why Micro-16 is 16 and not 12: below that, the ratio of scaffolding to value stops making sense.

**Core-40 composition:**

| Group | n | Contents |
|---|---|---|
| Chrome floor (mandatory) | 9 | `intro`, `paths/`, `courses/`, `comparisons/`, `pricing/`, `faq/`, `changelog`, `about`, `contact` |
| Paths | 5 | frontend, fullstack, backend, ai-engineer, study-plan |
| Comparisons | 6 | codecademy, udemy, freecodecamp, coursera, odin-project, youtube |
| Pricing | 4 | pro-vs-free, student-discount, refund-policy, vs-bootcamps |
| How it works | 3 | how-scrims-work, is-scrimba-free, certificates |
| Audience | 2 | `for/`, `for/beginners` |
| Category hubs | 7 | react, javascript, css, ai, backend, python, typescript |
| Blog | 4 | scrimba-review, is-scrimba-worth-it, best-free-scrimba-courses, how-long-to-learn-web-development-2026 |

**Micro-16** = the 9 chrome routes + the 5 paths + `scrimba-review` + `is-scrimba-worth-it`. It is
a strict subset of Core-40 (asserted in CI).

**What is deliberately excluded, and why:**

- **All 79 course leaves.** The single largest saving. A Latvian `learn-svelte` page has no
  measurable demand; the 7 category hubs preserve catalog credibility at 9% of the cost.
- **7 niche comparisons** (boot-dev, treehouse, zerotomastery, pluralsight, educative, fireship,
  frontendmasters). Near-zero non-English search volume.
- **All 12 practice pages.** Long-tail English keyword plays that do not survive translation.
- **68 of 72 blog posts.** Top-of-funnel, and they compete with local-language content that
  outranks a translation. The operative principle, straight from §0: **for a core-only locale,
  one net-new local competitor page (§4 Phase 7) beats five translated blog posts.**
- **All `/legal/*`.** English-only in every locale (§1), replaced by a localized notice line.

**Why Tier D gets Micro-16 rather than Core-40:** 11 locales x 24 fewer routes cuts ~264 pages
and ~25% of that tier's translation cost, and it cuts R2 index-bloat exposure by ~20% overall
(1,056 translated pages instead of 1,320). It also shrinks R7 exposure exactly where it is worst,
since Tier D is the set nobody on the team can spot-check.

**Treat the comparison and blog picks as a default, not a fixed list.** They were chosen from
English search behaviour, and §13.2 item 5 requires per-market SERP research before translating.
That research may well show Brazilian learners care far more about `scrimba-vs-udemy` than
`scrimba-vs-coursera`. Adjust after Tier A returns data, before Tier C opens.

### Tier A: proof + infrastructure validation (6 locales)

Ships the **full site**. Chosen so that the two hardest technical problems (RTL, CJK) are
solved while the blast radius is still small.

| Locale | `htmlLang` | Language | Primary markets | Dir | Why in Tier A |
|---|---|---|---|---|---|
| `es` | `es` | Spanish (neutral) | ES, MX, AR, CO, CL, PE | ltr | Largest non-English dev search market. Platzi is the incumbent to compare against. |
| `pt-BR` | `pt-BR` | Portuguese (Brazil) | BR | ltr | Huge dev population, low English proficiency, Alura + Rocketseat comparisons are wide open. |
| `fr` | `fr` | French | FR, BE, CH, CA, MA, DZ, TN | ltr | OpenClassrooms is the incumbent; "avis" queries are strong and commercial. |
| `de` | `de` | German | DE, AT, CH | ltr | Highest affiliate value per click in Europe. |
| `ja` | `ja` | Japanese | JP | ltr | Japanese devs genuinely search in Japanese; low competition. **Validates CJK typography + `lunr.ja` tokenizer + system font stack.** |
| `ar` | `ar` | Arabic (MSA) | EG, SA, AE, MA, JO, DZ | **rtl** | Large underserved learner base. **Validates the entire RTL stack** so `he`/`fa`/`ur` are near-free later. |

**Gate: do not start Tier B until the 90-day Tier A verdict comes back at >= 90% indexed.**
This is a hard, numeric, evidence-based gate, not a schedule. See §7.1.

### Tier B: next-largest markets (8 locales)

Full site, or full site minus course leaves if volume does not justify it.

`it` (IT, CH) · `nl` (NL, BE) · `pl` (PL) · `tr` (TR) · `ru` (RU, KZ, BY, diaspora) ·
`uk` (UA) · `ko` (KR) · `id` (ID)

**Default scope: full site minus the `docs/courses/**` leaves, category hubs retained.** That
is ~71 pages x 8 locales of translation cost held back. Promotion trigger: a Tier B locale
gets its course leaves once its category hubs clear 500 impressions/month in GSC. This is
Decision 4 in §18 and the locked-decisions row in §1 defers to it.

### Tier C: remaining major European (10 locales)

Core set only.

`sv` · `da` · `nb` (Norwegian Bokmål, EEA) · `fi` · `cs` · `el` · `hu` · `ro` · `bg` · `sk`

### Tier D: European long tail (11 locales)

Core set only. Completes all 24 EU official languages plus Western Balkans and Iceland.

`hr` · `sl` · `lt` · `lv` · `et` · `ga` (Irish) · `mt` (Maltese) · `is` · `sq` (Albanian) ·
`sr` (Serbian) · `mk` (Macedonian)

### Tier E: strategic non-European + derived (12 locales)

| Sub-tier | Locales | Notes |
|---|---|---|
| E1 India | `hi`, `bn`, `ta`, `te`, `mr` | See the India caveat below. Core set only. |
| E2 Asia | `vi`, `th`, `zh-Hans` | `vi` and `th` are fast-growing dev markets. `zh-Hans` needs the `zhUserDict` search option. |
| E3 RTL expansion | `he`, `fa`, `ur` | Reuses the `ar` RTL work. `fa` also needs `calendar: 'persian'`. |
| E4 Derived variant | `pt-PT` | **Derive from `pt-BR`** as an orthography + vocabulary pass, not a fresh translation. Same for any future `es-419`/`es-ES` split. |

### The India caveat (read this before funding E1)

India's developer search is overwhelmingly **English**. The right India play is not `hi`,
it is **India-specific content in English**:

- INR pricing context and payment-method notes (without quoting Scrimba prices; link to
  `/our-pricing` per the existing rule)
- Indian junior job market, campus placement reality, service-company vs product-company
  tracks
- `scrimba-vs-scaler`, `scrimba-vs-coding-ninjas`, `scrimba-vs-geeksforgeeks`,
  `scrimba-vs-newton-school`

These are **new English pages** targeting `en-IN` intent, and they belong in the normal
English content roadmap, not in the i18n program. `hi`/`bn`/`ta`/`te`/`mr` are worth doing
for the absolute-beginner and career-changer segment where regional-language search is
growing, but they are Tier E for a reason and should be gated on E1 pilot data from `hi`
alone.

### Volume and cost reality

| Metric | Value |
|---|---|
| Source documents | 138 docs + 72 blog + ~7 pages/MDX = **~217** |
| Source words | docs 145k + blog 120k + pages 6k = **~272k words** |
| UI strings (`code.json` surface) | ~393 string literals + JSX text nodes, **~500 to 700 units, ~4 to 5k words** |
| Core set (Tiers C/D/E) | ~48 pages, **~67k words** |
| Full roster if everything ships | 47 locales + `en` = **48 locales** |
| Total translated output at full roster | 14 full x 272k + 33 core x 67k = **~6.0M words** |
| Pages at full roster | 15 full x ~190 + 33 core x ~48 = **~4,400 indexable URLs** |

Those two rows apply the tiered coverage model from §1. An untiered reading (190 x 48 =
~9,100 URLs) is the wrong number and must not be quoted elsewhere.

That last number is the reason for the tier gates. See §7.

---

## 3. What breaks today (grounded audit)

Every item below was verified against this repo, not assumed.

### 3.1 Blockers

| # | Issue | Evidence | Fix phase |
|---|---|---|---|
| B1 | **GitHub Pages 1 GB published-site limit.** Current build is **44 MB**. 48 locales x 44 MB ≈ **2.1 GB**. Hard fail. | `du -sh build` = 44M. Breakdown: `assets` 13M, `search-index.json` 7.8M, `img` 7.5M, `blog` 7.3M, `docs` 6.6M, `llms-full.txt` 1.6M | Phase 0 |
| B2 | **`search-index.json` is 7.8 MB and duplicated per locale** (374 MB at full roster), and the whole monolith downloads before the user types a character. | `@easyops-cn/docusaurus-search-local` builds one in-repo lunr index per build. Resolved by the Pagefind migration in §4 Phase 0. | Phase 0 |
| B3 | **`static/` (7.5 MB) is copied into every locale outDir.** 360 MB of identical images at full roster. | Docusaurus copies `static/` per locale build. | Phase 3 |
| B4 | **Sequential all-locale build.** `docusaurus build` iterates locales with `mapAsyncSequential` (verified in `node_modules/@docusaurus/core/lib/commands/build/build.js:34`). 48 locales x ~4 min = ~3 hours in one job. | Same file | Phase 3 |
| B5 | **`--locale de` alone silently drops the `/de/` prefix.** `isAutomaticBaseUrlLocalizationDisabled()` returns true when exactly one `--locale` is passed, giving `baseUrl=/` and `outDir=build/`. A naive CI matrix would publish every locale on top of English. | `node_modules/@docusaurus/core/lib/commands/build/buildUtils.js` | Phase 3 |

**B5 fix (non-obvious, load-bearing):** set an explicit `baseUrl` per locale in
`localeConfigs`. `node_modules/@docusaurus/core/lib/server/i18n.js:122` checks
`typeof localeConfigInput.baseUrl !== 'undefined'` *before* consulting the automatic
localization flag, so an explicit `baseUrl: '/de/'` wins and single-locale matrix builds
emit the right prefix and land in `build/de/`.

### 3.2 Correctness bugs that i18n exposes

| # | Issue | Location | Effect |
|---|---|---|---|
| C1 | `og:locale` hardcoded `en_US` in **two** places, while `theme-classic`'s `SiteMetadata` already emits `og:locale` + `og:locale:alternate` automatically from `localeConfigs`. | `docusaurus.config.ts` (`themeConfig.metadata`), `src/theme/BlogPostPage/Metadata/index.tsx` | Duplicate + contradictory `og:locale` on every blog post in every locale. |
| C2 | `inLanguage: 'en-US'` hardcoded in BlogPosting schema. | `src/theme/BlogPostPage/Metadata/index.tsx` | Every locale claims English. |
| C3 | `isMoneyPagePath()` uses `path.startsWith('/docs/paths/')` and exact `/blog/scrimba-review/` matches. | `src/utils/moneyPagePaths.ts:19-27` | Sticky affiliate CTA disappears on every non-English money page. Direct revenue loss. |
| C4 | Locale-fragile path predicates across the component layer. | `src/theme/DocItem/Layout/index.tsx:95-98`, `src/components/RelatedGuides.tsx:19-28`, `src/content/relatedGuidesMap.ts:464-489`, `src/components/DisclosureNotice.tsx:18-21`, `src/components/FAQAccordion.tsx:31-34`, `src/components/DocFaqSchema.tsx:24-27`, `src/components/MegaMenu.tsx:55`, `src/clientModules/a11yFixes.ts:86,103` | Related guides, disclosures, FAQ schema, and active-nav state all silently break under `/de/`. |
| C5 | `toSeoTitle()` truncates at 44 chars, calibrated for English. | `src/utils/seoTitle.ts:1` | German and Finnish titles run ~30% longer and get cut mid-phrase. Needs a per-locale budget. |
| C6 | `normalize-canonical-urls` rewrites `canonical`, `og:url`, `twitter:url`, and JSON-LD, but not `<link rel="alternate" hreflang>`. | `plugins/normalize-canonical-urls/index.js` | Low risk in practice (`useAlternatePageUtils` already applies `applyTrailingSlash`), but must be asserted, not assumed. |
| C7 | `themeConfig.metadata` description + keywords are English and sitewide, and `themeConfig.metadata` is **not** translatable via `i18n/`. | `docusaurus.config.ts` | Locale homepages inherit English meta description. Fix via `process.env.DOCUSAURUS_CURRENT_LOCALE` branching in the config (verified set at `node_modules/@docusaurus/core/lib/commands/build/buildLocale.js:31`). |
| C8 | Heading anchors are auto-generated from heading text, and **nothing catches it when they drift**. | All 217 MDX files; `docusaurus.config.ts` sets only `onBrokenLinks` | A translated heading changes its anchor ID, so in-page `#faq` links break. `onBrokenAnchors` **defaults to `'warn'`** (`core/lib/server/configValidation.js:110`, `TODO Docusaurus v4: change to throw`) and is not configured here, so drift prints one warning inside a 48-locale matrix log and ships. The repo has exactly **one** explicit `{#id}` today (`docs/paths/index.mdx:55`). **Must set `onBrokenAnchors: 'throw'` in the same commit as the anchor freeze, and run `npm run write-heading-ids` on English before any translation starts.** Note `write-heading-ids` skips h1 by design (`@docusaurus/utils/lib/markdownUtils.js`), so h1 anchor targets are hand-added. |
| C9 | `check:content` scans only `docs`, `blog`, `src/pages`, `src/components`, `src/content`. | `scripts/check-content.mjs:22` | Zero guardrail coverage over `i18n/**`. Translated Scrimba prices, in localized currency, would ship. |
| C10 | Search `language: ['en']` is a single global array, not per-locale. | `docusaurus.config.ts` themes block | Every locale indexes with the English stemmer unless computed per locale. |
| C11 | `generate-llms-from-sitemap.mjs` reads `build/sitemap.xml` with hardcoded English `KEY_PATHS` / `PAGE_ANNOTATIONS`. | `scripts/generate-llms-from-sitemap.mjs` | One English `llms.txt` for a 48-locale site. This is the AI-search surface and it is worth getting right. |
| C12 | `submit-indexnow.mjs` and `assert-sitemap-url.mjs` take one sitemap. | `scripts/*.mjs`, `.github/workflows/deploy.yml` | New locales never get pinged; post-deploy verification stays English-only. |
| C13 | `plugin-client-redirects` has ~80 inline redirects plus `data/course-redirects.json`. | `docusaurus.config.ts` | Needs verification that stubs are generated per locale, and `SITEMAP_EXCLUDED_PATHS` must be matched after stripping the locale prefix. |
| C14 | Font stack is Plus Jakarta Sans + Sora + JetBrains Mono via Google Fonts. | `docusaurus.config.ts` `headTags` | No Cyrillic, Greek, Arabic, Devanagari, or CJK coverage. Renders as tofu or falls back inconsistently. |

### 3.3 What already works in our favour

- `theme-classic`'s `SiteMetadata` **auto-emits reciprocal `hreflang` for every configured
  locale plus `x-default`**, using trailing-slash-normalized URLs. Google's reciprocity
  requirement is satisfied by default (verified in
  `node_modules/@docusaurus/theme-classic/lib/theme/SiteMetadata/index.js`).
- `localeConfigs` supports exactly what we need: `label`, `direction`, `htmlLang`,
  `calendar`, `path`, `translate`, `url`, `baseUrl`.
- `trailingSlash: true` and the canonical-normalizing plugin already exist, so the hardest
  canonical invariant is solved and just needs extending.
- `lunr-languages` (already installed) ships stemmers for `ar de el es fi fr he hi hu hy it
  ja ko nl no pt ro ru sv ta te th tr vi zh` plus `zh` support in the search plugin. That
  covers Tier A entirely.
- `onBrokenLinks: 'throw'` means a translation that breaks a link fails CI instead of
  shipping. Keep it.

---

## 4. Phases

### Phase 0: hosting + index decision (blocking, ~1 day)

Nothing else can be sized until B1/B2 are resolved.

- [ ] Measure a 2-locale spike (`en` + `de`): **total bytes AND total file count** per locale,
      plus the per-language Pagefind index size. File count matters as much as bytes; see below.
- [ ] **Decide hosting.** Options, with the limits that actually bind:
  - **Stay on GitHub Pages.** Hard cap: **1 GB total published size, no file-count limit.**
    Realistically Tier A + B full (15 locales) plus Tiers C/D/E on the Core set, and only
    with B2/B3 fixed.
  - **Migrate to Cloudflare Pages** (recommended for evaluation). **No total-size cap, but a
    hard file-count cap: 20,000 files Free, 100,000 paid, 25 MiB per asset.** Current
    single-locale build is **894 files**, so at roster scale the file cap binds before any
    byte cap. Also materially better TTFB in Japan, India, Brazil, and MENA, which is exactly
    where this program is aimed, and Core Web Vitals are a ranking input.
- [ ] Record the decision in `CLAUDE.md`. **The Phase 3 deploy gate cannot be written until
      this is answered**, because the two hosts fail on different axes.

### Phase 0b: Pagefind migration (~2 days)

Its own phase, not a Phase 0 checkbox: it replaces three swizzles and a test suite, and it is
explicitly **not** a no-op on English output, so it cannot ride in the Phase 1 commit.

- [ ] Full checklist is §12.4. Deliverable: `plugins/pagefind/index.js` plus the rewritten
      search UI.
- [ ] **The postBuild plugin must have a skip gate.** A registered `postBuild` plugin also runs
      in every matrix `build-locale` job, which would leave up to 48 per-locale `pagefind/`
      directories in the merged tree *on top of* the merged index, recreating the exact B2 size
      problem this migration exists to fix. So: the plugin no-ops when `SKIP_PAGEFIND === '1'`;
      every matrix job sets it; `assemble` runs `rm -rf merged/*/pagefind` and then
      `npx pagefind --site merged` **exactly once**, before the size/file-count gate.

### Phase 0c: hosting migration to Cloudflare Workers Static Assets (~1 day)

**Do this while the site is still 190 English URLs.** Migrating hosts and adding 47 locales in
the same window produces a regression nobody can attribute. Everything below was verified
against the live site, the live APIs, and the authenticated Cloudflare account on 2026-08-09.

**The migration is far smaller than it first appears, because the domain is already on
Cloudflare.** Verified state:

| Fact | Evidence |
|---|---|
| `scrimbaguide.tech` nameservers are Cloudflare | `mariah.ns.cloudflare.com`, `sevki.ns.cloudflare.com` |
| The zone is in this account | authenticated as `yassineelhaddad41@gmail.com`, single account, token has `zone:read` + `workers:write` |
| The orange cloud is already ON | `server: cloudflare`, `cf-ray`, apex resolves to `172.67.220.97` / `104.21.78.108` (Cloudflare anycast) |
| GitHub Pages sits behind it | `via: 1.1 varnish`, `x-served-by: cache-mad2200106-MAD` (Fastly, GitHub Pages' CDN) |
| Cloudflare is **not** caching HTML | `cf-cache-status: DYNAMIC`, `cache-control: max-age=600` |
| No Pages projects exist | `wrangler pages project list` returns empty. Clean slate |

Two consequences:

1. **No nameserver change, and no DNS propagation window.** The cutover is: deploy the Worker,
   then attach `scrimbaguide.tech` as a Workers **Custom Domain** (Cloudflare rewrites the DNS
   record itself). Revert is detaching it and restoring the GitHub Pages record. Minutes, not
   hours, and entirely inside one dashboard.
2. **The TTFB argument for migrating is now evidenced rather than speculative.** Today an
   international request goes user -> Cloudflare edge -> Fastly -> GitHub Pages origin, and
   `cf-cache-status: DYNAMIC` means the HTML is **never** served from the Cloudflare edge: every
   request pays the extra hop. Workers Static Assets deletes the Fastly hop and serves from
   Cloudflare's own edge. That is a real latency win in exactly the markets this program
   targets, not a hoped-for one.

**Target product: Workers Static Assets, not Pages.** `~/use-apify/wrangler.json` already runs
that model, so this keeps one mental model across both properties. Limits are identical either
way: **20,000 files Free, 100,000 Paid, 25 MiB per asset, no total-size cap.** Requires Wrangler
>= 4.34.0 (4.120.0 is what is installed). The §14 roster projection is ~22,200 files, so
**Paid is required**; Free would breach on file count.

- [x] `npx wrangler login` done 2026-08-09; account confirmed
      (`yassineelhaddad41@gmail.com`, one account, `workers:write` + `pages:write` + `zone:read`).
      Note the login also installed Cloudflare agent skills globally; it did **not** modify this
      repo (`git status` clean apart from this plan).
- [ ] Add `wrangler.json`. No `main` entry: there is no Worker logic here, unlike use-apify's
      chatbot routes. Assets-only.

      ```json
      {
        "$schema": "node_modules/wrangler/config-schema.json",
        "name": "scrimbaguide",
        "compatibility_date": "2026-08-09",
        "assets": {
          "directory": "./build",
          "html_handling": "force-trailing-slash",
          "not_found_handling": "404-page"
        }
      }
      ```

- [ ] **`not_found_handling: "404-page"` is non-negotiable.** It serves the existing
      `build/404.html` (12 KB, confirmed present) with a correct 404 status. If it is ever set
      to `single-page-application`, Cloudflare returns **HTTP 200 for every unknown URL** and
      Google mass-indexes soft 404s. This is the single setting on this platform that can
      destroy the site's SEO, so it is also §5 invariant 11.
- [ ] `html_handling: "force-trailing-slash"` is belt-and-braces. The default
      `auto-trailing-slash` already serves folder index files (`foo/index.html`) **with** a
      trailing slash, which is exactly what `trailingSlash: true` emits, so there is **no
      conflict even on defaults**. Set it explicitly anyway so a future default change cannot
      silently invert the site's canonical form.
- [ ] Deploy to the `*.workers.dev` preview URL first and run the cutover checklist below
      against it, before touching the custom domain.
- [ ] Keep `static/CNAME` in place. It becomes inert on Cloudflare and is harmless; removing it
      only matters if GitHub Pages is ever re-enabled, which is the revert path.
- [ ] Attach `scrimbaguide.tech` (and `www` if present) as a Workers **Custom Domain**. This
      replaces the DNS record pointing at GitHub Pages. **Record the existing record's value
      first**, since restoring it is the revert.
- [ ] Leave `.github/workflows/deploy.yml`'s post-deploy verification steps intact
      (`assert-sitemap-url`, IndexNow). Swap only the publish step from
      `actions/deploy-pages` to `wrangler deploy`.

**Cutover checklist. Every line was passing on GitHub Pages on 2026-08-09, so any difference is
a regression, not a discovery:**

**Note on the baseline:** every "verified pre-cutover" value below was measured **through the
existing Cloudflare proxy**, so it already reflects Cloudflare edge behaviour. The only thing
changing at cutover is the origin behind that edge, which is what makes this a like-for-like
comparison.

| Assertion | Expected (verified pre-cutover) |
|---|---|
| `/docs/paths` | `301` (or `308`) to `/docs/paths/`. The current `301` is passed through from GitHub Pages; after cutover it is issued by `html_handling`, and **308 is an equally valid permanent redirect** that Google treats identically |
| `/docs/paths/` | `200` |
| `/docs/paths/index.html` | redirect to `/docs/paths/`. **On GitHub Pages this currently returns `200`**, a duplicate URL for every page, so Cloudflare is an improvement here |
| `/nonexistent-page-xyz/` | `404`, never `200` |
| `/04a47dc50a7a4b528f9fa0aa65c489ff.txt` | `200`, `text/plain`, body equals the key |
| `/sitemap.xml` | `200`, 220 `<loc>` entries, all with trailing slashes |
| `/robots.txt`, `/llms.txt`, `/llms-full.txt` | `200` |
| `/docs/faq/billing/` | serves the meta-refresh stub to `/docs/help/billing/` |
| `<link rel="canonical">` on 6 sampled pages | exactly one tag, absolute, trailing slash |
| Cache-control on HTML | currently `max-age=600` (GitHub Pages' default). Keep HTML short-lived and **never `immutable`**; hashed `/assets/*` may be long-lived. Add a `_headers` file only if the Workers defaults differ from this |
| `cf-cache-status` on HTML | should become `HIT` on a warm second request, versus today's permanent `DYNAMIC`. This is the migration's main performance payoff, so it is worth asserting |

- [ ] **Post-cutover GSC watch, against the §6.1 baseline.** Re-run the same URL Inspection set
      at +48h and +14d. Regression signals: any page moving off
      `coverageState = "Submitted and indexed"`, any `googleCanonical` losing its trailing slash,
      any rise in `Page with redirect` for a canonical URL, or sitemap `errors > 0`.
      Do **not** judge by clicks at 48h; 346 clicks/28d is too small a sample to read that fast.

**Skills:** `seo-audit` (the cutover checklist and the +48h/+14d comparison).

**Skills:** `seo-audit` (baseline snapshot before anything changes: per-page impressions,
clicks, positions, indexed count, CWV per template, so every later change is attributable).

### Phase 1: make the codebase locale-aware (~3 days)

No locales added yet. Ship this to `main` on its own. It is **not** a byte-identical refactor;
see the allowed-delta list in §16, which is the authoritative gate.

- [ ] Add **`i18n/locales.config.ts`, the only locale roster in the codebase.** The roster
      currently exists only as §2 prose. Six independent work units need overlapping per-locale
      fields and would each hardcode a copy, which is failure mode R4. One record per locale:
      `{locale, htmlLang, direction, calendar?, tier, coverage: 'full'|'core',
      status: 'draft'|'live'|'pruned', region, fontScript, register?}`. It is the **sole** input
      to `i18n.locales` (filter `status === 'live'`), `localeConfigs`, the CI build matrix, the
      Phase 4 font map, the Phase 8 switcher grouping, and the §11.3 C locale round-robin.
      Acceptance check: `grep -rn "'pt-BR'" src plugins scripts docusaurus.config.ts` hits only
      this file. `status: 'pruned'` emits `noindex`, drops out of hreflang and the sitemap, and
      keeps files on disk (§7 kill criteria).
- [ ] Add `src/utils/localePath.ts`: `stripLocale(pathname)`, `getLocale(pathname)`,
      `localize(path, locale)`. Single source of truth, driven by `i18n/locales.config.ts`.
- [ ] Fix C3 and C4: route every path predicate through `stripLocale()`.
      Files: `src/utils/moneyPagePaths.ts`, `src/theme/DocItem/Layout/index.tsx`,
      `src/components/RelatedGuides.tsx`, `src/content/relatedGuidesMap.ts`,
      `src/components/DisclosureNotice.tsx`, `src/components/FAQAccordion.tsx`,
      `src/components/DocFaqSchema.tsx`, `src/components/MegaMenu.tsx`,
      `src/clientModules/a11yFixes.ts`, and **`src/components/AffiliateLink.tsx:42`**, which
      derives the GA4 `post_slug` from `window.location.pathname.replace(/^\/blog\//,'')`
      and would report `/de/blog/x` as the slug. Wrap in `stripLocale()` and add a `locale`
      field to the event so per-locale affiliate attribution works (§6).
      **Self-verifying check:** `grep -rn "window.location.pathname" src` must show only
      `stripLocale()`-wrapped call sites. `src/theme/BlogPostItem/*` is intentionally
      untouched because it compares `metadata.permalink`, which is already locale-correct.
- [ ] Fix C1: delete the hardcoded `og:locale` from `themeConfig.metadata` and from
      `BlogPostPage/Metadata`. Let `SiteMetadata` own it.
- [ ] Fix C2: `inLanguage` from `useDocusaurusContext().i18n.currentLocale`.
- [ ] Fix C5 with real numbers, not a gesture. `toSeoTitle(rawTitle, locale)` reads
      `LOCALE_TITLE_BUDGET` with `DEFAULT = 44`. These are **content-length** budgets that
      must satisfy `budget + 16 <= 60`, because `" | Scrimba Guide"` (16 chars) is appended
      untranslated. So **no locale may exceed 44 while the suffix is kept** (the earlier
      draft's "~52" would render 68 characters and get truncated in SERPs). Seed:
      `de/fi/hu/tr: 44`, `ja/zh-Hans/ko: 30` (CJK glyphs are double-width in SERPs).
      Raising a budget above 44 requires dropping the suffix for that locale, which is
      Decision 5 in §18. §13.2 item 4 may only **lower** a value, never raise it.
- [ ] Fix C7 **using the safe locale helper, not the raw env var.** `start.js:21` assigns
      `process.env.DOCUSAURUS_CURRENT_LOCALE = cliOptions.locale`, so a bare
      `docusaurus start` (i.e. `make dev`) sets it to the literal string `"undefined"`, which
      defeats both `?? 'en'` and `|| 'en'`. Export one helper and require every branch on the
      current locale to use it (C7 metadata, the Phase 2 `exclude` computation, the Phase 4
      font stack):
      ```js
      const raw = process.env.DOCUSAURUS_CURRENT_LOCALE;
      export const CURRENT_LOCALE = !raw || raw === 'undefined' ? 'en' : raw;
      ```
      A locale absent from `coverage.json` (including `en`) is treated as **full coverage**,
      emitting no `exclude` entries, so `make dev` and the English build stay unaffected.
- [ ] **Harden `plugins/normalize-canonical-urls` before i18n depends on it.** Its regex is
      `(<link[^>]*rel=["']canonical["'][^>]*href=["'])([^"']+)(["'])`, which **requires `rel` to
      appear before `href`**. Docusaurus currently emits
      `<link data-rh="true" rel="canonical" href="...">` (verified live 2026-08-09), so it
      matches today. If that attribute order ever changes, the plugin **silently stops
      normalizing and nothing fails**, which under i18n is the R4 hreflang-collapse vector.
      Fix: match attribute-order-independently (parse the tag, then rewrite `href`), and add a
      `postBuild` assertion that **every** emitted canonical is absolute and ends in `/`,
      failing the build otherwise. Same treatment for `og:url` and `twitter:url`.
- [ ] Export `LOW_VALUE_PATTERNS` and `isLowValuePath` from
      `scripts/generate-llms-from-sitemap.mjs` (both are `const`/unexported today at lines 15
      and 201, among nine other named exports). §11.3 A says to reuse them and currently
      cannot. Landing this in Phase 1 keeps it clear of the Phase 3 rewrite of that file.
- [ ] Fix C8: run `npm run write-heading-ids`, review the diff, commit frozen `{#id}`
      anchors across all 217 files. **This is a prerequisite for translation, not a
      nice-to-have.**
- [ ] Wrap UI strings for extraction: `<Translate>` / `translate()` across
      `src/components/**` (25 files), `src/pages/**`, `src/content/whichScrimbaPath.ts`,
      `src/content/relatedGuidesMap.ts`. ~500 to 700 units.
- [ ] `npm run write-translations -- --locale en` to generate the baseline `code.json` and
      confirm the extraction surface matches expectation.
- [ ] Add `make i18n-scaffold LOCALE=xx` to the Makefile.
- [ ] Extend `scripts/check-content.mjs` (C9): scan `i18n/**`; add localized-currency price
      patterns (`€ £ ¥ ₹ ₺ zł R$ ₽ ﷼ CHF kr Kč Ft lei лв`); add an **affiliate-integrity
      check** asserting every `scrimba.com` reference in `i18n/**` either routes through
      `<AffiliateLink>` or carries `via=u42d4986`; make the em-dash rule
      Latin-script-scoped via a small `check-content.config.json` (Japanese `、。―` and
      Arabic `،؛` punctuation must not be flagged).

**Skills:** `seo-audit` for the invariants; `analytics-tracking` to add a locale dimension
to GA4 and per-locale affiliate attribution before traffic arrives, not after.

### Phase 2: the coverage manifest + hreflang engine (~5 days)

This is the piece that makes tiered coverage safe, and it is the highest-value engineering in
the plan. It is also where the plan's biggest latent build-breaker lives, so read all of it
before starting any of it.

The problem: `SiteMetadata` emits hreflang for **every configured locale on every page**. With
tiered coverage, a page translated into 6 locales but configured alongside 47 would advertise
41 hreflang URLs that either 404 or serve English fallback. Both outcomes are bad, and Google
discards the whole cluster's annotations.

**Two files, not one. Declared scope and actual coverage must be separate**, because a
disk-derived manifest is always 100% of itself, which makes the §1 launch gate ("declared page
set 100% translated") uncomputable if the two are conflated:

- [ ] **`i18n/tiers.json`, hand-authored and version-controlled.** The *declared* scope.
      `{"core": [ ...the enumerated Core route list... ], "full": "*"}` plus each locale's
      tier. **The Core set is Decision 2 in §18 and must be enumerated before this phase
      starts:** it is the scope for 33 of 47 locales, and two agents scaffolding Tier C
      without it will invent two different lists.
- [ ] **`i18n/coverage.json`, generated from disk** by `scripts/build-coverage-manifest.mjs`
      (runs in `prebuild`; gitignored; needs no build). Shape, with the route-to-source
      mapping that the `exclude` computation requires:

      ```json
      {"sk": {"tier":"C","coverage":"core","status":"live","codeTranslationCoverage":0.94,
       "entries":[
         {"route":"/docs/pricing/","surface":"docs","sourceFile":"pricing/index.mdx"},
         {"route":"/blog/scrimba-review/","surface":"blog","sourceFile":"2026-01-02-scrimba-review.mdx"},
         {"route":"/about/","surface":"pages","sourceFile":"about.mdx"}]}}
      ```

      **Routes alone are insufficient.** The plugin `exclude` option takes **file-path globs**,
      and the route-to-file inverse is not derivable by convention: 16 docs override `slug:`
      (`docs/pricing/index.mdx` serves `/docs/pricing`) and all 72 blog files are
      `YYYY-MM-DD-*.mdx` with date-stripped slugs. Resolve the mapping by **reading frontmatter
      `slug`/`id`**, never by path arithmetic. Skip `i18n/en/` (Phase 1 creates it for
      `code.json`).
- [ ] **A route is only "covered" if a `.status` sidecar exists with `state:'current'` and a
      matching `sourceHash`** (§4 Phase 5 item 10). File presence alone is not enough, because
      of the scaffolding rule below.
- [ ] `make i18n-status` reports `declared - covered` per locale. **CI blocks adding a locale
      to `i18n.locales` while that difference is non-empty.** That is the §1 launch gate, made
      computable.

**Per-locale content exclusion, and the four hard failures it causes if done naively.** A
Core-set locale must genuinely not build the ~170 pages it has not translated. But nothing in
the earlier draft accounted for the fact that `onBrokenLinks: 'throw'` plus a hand-written
sidebar means **every Core-set build dies**. Four independent failures, none recoverable at
runtime:

1. `sidebars.ts` hand-lists ~60 doc IDs plus 13 `link: {type:'doc', id:...}` category links.
   `plugin-content-docs` throws *"These sidebar document ids do not exist"* at content load,
   before any link checking.
2. `onBrokenLinks: 'throw'` plus `Link`'s route validation: navbar and MegaMenu targets, footer
   targets including `/docs/changelog` and the three `/legal/*` links (which §1 says are
   excluded from all locales), and all 264 `href`s in `relatedGuidesMap.ts` rendered through
   `<Link to>`. Any one pointing at an uncovered route fails the locale build.
3. `relatedGuidesMap.ts` section fallbacks return hardcoded `/docs/comparisons/`,
   `/blog/scrimba-review`, `/docs/paths/study-plan` for **any** doc page, so a 48-route Core
   locale emits links to routes it just excluded.
4. ~1,573 in-body `](/docs/...` and `](/blog/...` markdown targets across `docs/`.

Four named tasks, in this order:

- [ ] **(a) `sidebars.ts` becomes coverage-aware.** It must still **default-export a plain
      object** (`loadSidebarsFileUnsafe` returns the module as-is; a function export is not
      supported), so compute it at module-evaluation time from `i18n/coverage.json` plus
      `CURRENT_LOCALE`: filter `type:'doc'` items and category `link.id`s to the covered set,
      drop categories whose `link.id` is uncovered, drop `autogenerated` dirs with zero covered
      docs.
- [ ] **(b) Global-chrome closure invariant.** The Core set **must** contain every route
      reachable from navbar, footer, and MegaMenu: `/docs/paths/`, `/docs/courses/`,
      `/docs/intro`, `/docs/comparisons/`, `/docs/pricing/`, `/docs/faq/`, `/docs/changelog`,
      `/blog`, plus the `#path-advisor` anchor. Enforce with
      `scripts/__tests__/coverage-closure.test.mjs`, per tier. **When it fails, the resolution
      is to expand the Core route list, never to rewrite links per locale.**
- [ ] **(c) Body links and related guides are pruned, not closed.** `getRelatedGuides()` filters
      against the manifest and `RelatedGuides` renders nothing below 2 survivors.
      `scripts/prune-locale-links.mjs` (in `prebuild`, non-full locales only) emits anchor text
      **unlinked** for any markdown link whose locale-stripped target is uncovered, and
      **never** substitutes a cross-locale English link (§5 invariant 6). It exits non-zero if
      any surviving `<Link to>` resolves outside the manifest.
- [ ] **(d) `src/pages` is a third surface and was missing entirely.** §1's `/legal/*`
      exclusion needs a `plugin-content-pages` `exclude` **and** the three footer Legal links
      replaced with the localized notice line in non-`en` locales, or the footer alone throws in
      every locale. Separately, five `.tsx` routes (`index.tsx`,
      `tools/{index,which-scrimba-path,bootcamp-cost-calculator}.tsx`,
      `roadmaps/frontend-roadmap-2026.tsx`) build in every locale via `<Translate>` and cannot
      be "covered" by a translated file. Maintain an **`ALWAYS_BUILT`** list injected into every
      locale's manifest so they stay in the hreflang cluster. **This is the one accepted
      exception to invariant #4**, and without it the locale homepage loses its alternates
      entirely. Maintain an **`ALWAYS_EXCLUDED`** list (`legal/**`) wired into
      `plugin-content-pages`.

- [ ] **Manifest-miss fails closed, with exactly one escape hatch.** A locale absent from the
      manifest, or present with zero entries, excludes **all** docs/blog content, and CI asserts
      such a locale is also absent from `i18n.locales`. The alternative (fail open) silently
      publishes English fallback under a non-English hreflang for any live locale accidentally
      dropped from the manifest, which is precisely the invariant-#4 violation this phase
      exists to prevent. Single escape hatch: `I18N_COVERAGE=full` bypasses manifest exclusion
      and builds every route with English fallback, **for local RTL and typography QA only**
      (§4 Phase 4). `deploy.yml` fails if that variable is set.

**The hreflang engine must be an eject, not a wrap.**

- [ ] `SiteMetadata` is **absent from `theme-classic/lib/getSwizzleConfig.js`**, so it is
      `wrap: 'unsafe', eject: 'unsafe'` and `ensureActionSafety` prompts for confirmation. An
      agent in a non-interactive shell stalls. Use `--danger`.
- [ ] A wrap is also wrong on the merits: `AlternateLangHeaders` maps unconditionally over
      `Object.entries(localeConfigs)`, so wrapping leaves all 48 `rel=alternate` tags in place
      and merely adds duplicates. **Eject.**
- [ ] In the ejected copy, emit **both `rel=alternate` and `og:locale:alternate`** only for
      locales whose manifest contains the current route, plus self, plus exactly one
      `x-default` pointing at English. Keep the `DEFAULT_SEARCH_TAG` / `useAlternatePageUtils` /
      `keyboardFocusedClassName` imports and the `CanonicalUrlHeaders` / `SearchMetadata` /
      `themeConfig.metadata` blocks verbatim.
- [ ] Scope the `plugins/normalize-canonical-urls` extension to **assert only** (trailing slash
      plus manifest membership) and never to emit or remove tags (C6). Exactly one owner for
      hreflang emission.
- [ ] `scripts/__tests__/hreflang.test.mjs` is a **unit test over a fixture `coverage.json`**
      and runs in every matrix job: exactly one `x-default`, self-reference present, no
      duplicate `hrefLang` values, valid BCP 47 codes (Google ignores non-standard region codes
      like `EU`/`UK`). **Cross-locale reciprocity cannot be checked in a single-locale build**,
      because only `assemble` sees the full tree, so reciprocity is a separate `assemble`-only
      assertion script over the merged HTML.
- [ ] Optional but cheap: emit `xhtml:link` alternates into each sitemap. `SitemapItem` in
      `@docusaurus/plugin-sitemap` has **no** `alternateRefs` field (verified in
      `node_modules/@docusaurus/plugin-sitemap/lib/types.d.ts`), so this is a post-process step
      over the generated XML, not a `createSitemapItems` option.

**Skills:** `schema-markup` (per-locale JSON-LD: `inLanguage`, translated
`name`/`description`/`question`/`answer`, locale-prefixed `url`/`@id`, but **one shared
`#organization` `@id` across all locales** so the entity consolidates rather than fragmenting
into 48 organizations); `site-architecture` (locale URL architecture, in-locale internal
linking, and the rule that the *only* cross-locale link is the switcher).

### Phase 3: build + deploy pipeline (~2 days)

- [ ] **B5 fix, stated exactly, because the obvious phrasing is catastrophic.** Set an
      explicit `baseUrl` on every `localeConfigs` entry: **`'/'` for `en`** (the default
      locale keeps the bare root) and `'/<locale>/'` for every other locale.
      `localeConfigs.en.baseUrl = '/en/'` would relocate every currently-indexed English URL
      to `/en/...` and write `build/en/`, because
      `core/lib/server/i18n.js:122` prefers an explicit `baseUrl` over the inferred one and
      `server/site.js:68` derives `outDir` from it. Add a config-time assertion that throws
      if `i18n.localeConfigs.en.baseUrl !== '/'`.
- [ ] Rewrite `.github/workflows/deploy.yml`:
  - `build-locale` job with `strategy.matrix.locale`, `fail-fast: false`,
    `max-parallel: 15`. Each job: `npx docusaurus build --locale $L`, upload
    `build/` as artifact `site-$L`. Add `NODE_OPTIONS=--max-old-space-size=6144`.
  - `assemble` job: download all artifacts, merge into one tree, **dedupe `static/`
    into root only (B3)** and rewrite locale references to root-absolute `/img/...`,
    run the per-locale llms generator, generate `sitemap-index.xml`, upload the Pages
    artifact.
  - `deploy` job unchanged.
  - `indexnow` job: loop locales.
- [ ] **Two-axis deploy gate in `assemble`**, so B1 can never silently regress. Fail if the
      merged tree exceeds **900 MB** OR if `find merged -type f | wc -l` exceeds **18,000**
      (Cloudflare Free) / **90,000** (Cloudflare paid), per the Phase 0 host choice.
      Cloudflare Pages has **no total-size cap**; its binding limit is **file count: 20,000
      Free, 100,000 paid, 25 MiB per asset**. Current single-locale build is **894 files**, so
      at roster scale the file cap binds well before any byte cap. GitHub Pages is the
      opposite: 1 GB total, no file cap.
- [ ] Run **Pagefind once over the merged tree** in the `assemble` job (§12). This replaces
      the per-locale `language` array problem (C10) entirely: Pagefind reads `<html lang>`
      and splits the index per language by itself, so it needs no locale wiring at all.
- [ ] `scripts/generate-sitemap-index.mjs`: root `sitemap-index.xml` referencing
      `/sitemap.xml` + every `/<locale>/sitemap.xml`. Update `static/robots.txt` to list the
      index (keep `/sitemap.xml` listed too, for continuity).
- [ ] Per-locale llms.txt (C11): `/llms.txt` stays English, each locale gets
      `/<locale>/llms.txt` and `/<locale>/llms-full.txt`, root `llms.txt` links the locale
      indexes. Key `PAGE_ANNOTATIONS` by locale-stripped path with per-locale annotation
      text. **Extend `scripts/__tests__/generate-llms-from-sitemap.test.mjs`** (the only
      test suite in the repo, per `CLAUDE.md`). Consider generating `llms-full.txt` only
      for Tier A/B, since it is 1.6 MB per locale.
- [ ] `submit-indexnow.mjs` + `assert-sitemap-url.mjs` per locale (C12). Respect the
      IndexNow 10k-URL-per-request limit. Add a per-locale required-URL assertion
      (`https://scrimbaguide.tech/de/docs/paths/`).
- [ ] Verify `plugin-client-redirects` emits stubs per locale (C13) and that
      `shouldIncludeInSitemap()` strips the locale prefix before matching
      `SITEMAP_EXCLUDED_PATHS`.

### Phase 4: RTL implementation (~3 days, gated on `ar` being in the ROSTER, not translated)

`direction: 'rtl'` in `localeConfigs.ar` gives `dir="rtl"` on `<html>`, and Infima handles
the core theme. Everything below is our custom layer.

**Disambiguating the gate, because it changes when this phase can run.** Phase 4 needs `ar`
present in `i18n/locales.config.ts` with `status: 'draft'`. It does **not** need `ar` translated,
and it must not wait for Phase 6. But under the Phase 2 fail-closed rule a zero-coverage `ar`
builds **no pages at all**, so a bare `--locale ar` pass would validate mirroring, logical
properties, and icon flipping while validating **none** of the four things this phase exists to
fix: bidi isolation of `npm install react` inside Arabic prose, Arabic font fallback and tofu,
`:lang(ja)` line breaking, and title overflow.

- [ ] Therefore: create a small **Arabic fixture set** first (homepage,
      `/docs/paths/frontend-developer-path/`, one comparison page with a table, one course leaf
      with code blocks) plus one `ja` fixture. Hand-written, throwaway, not production copy.
- [ ] Run as `I18N_COVERAGE=full npx docusaurus start --locale ar` (the Phase 2 escape hatch).
- [ ] Done-assertions, all four required: no tofu glyphs; code spans render LTR inside Arabic
      paragraphs; no title clipping at the §4 Phase 1 C5 budget; `axe` clean.

- [ ] Convert physical to logical properties. **58 lines in `src/css/custom.css`** (4,238
      lines total) carry physical-direction declarations, plus 3 CSS modules
      (`src/theme/Navbar/Content/styles.module.css`,
      `src/theme/NavbarItem/DropdownNavbarItem/Mobile/styles.module.css`,
      `src/theme/SearchPage/SearchPage.module.css`).
      `margin-left` to `margin-inline-start`, `padding-right` to `padding-inline-end`,
      `left`/`right` to `inset-inline-start`/`inset-inline-end`,
      `border-left` to `border-inline-start`, `text-align: left` to `text-align: start`.
- [ ] **Bidi isolation for code (critical).** Arabic prose containing `npm install react`
      scrambles without it:
      ```css
      code, pre, kbd, samp, .token {
        direction: ltr;
        text-align: start;
        unicode-bidi: isolate;
      }
      ```
      Same treatment for version numbers, URLs, and durations rendered inline
      (`<span dir="ltr">` or a small `<Ltr>` component).
- [ ] Flip directional iconography. `lucide-react` chevrons/arrows:
      `[dir="rtl"] .icon-directional { transform: scaleX(-1); }`.
      `transform: translate(-50%, -50%)` centering (`custom.css:1574,1592`) is
      direction-safe; `translateX` slide-in animations are not and must be flipped.
- [ ] Per-script font stacks (C14), loaded conditionally from
      `DOCUSAURUS_CURRENT_LOCALE` so a German visitor never downloads Arabic glyphs:

      | Script | Locales | Stack |
      |---|---|---|
      | Latin / Latin-ext | most of Europe, `tr`, `pl`, `cs`, `hu`, `vi` | current stack (verify Plus Jakarta Sans latin-ext diacritic coverage) |
      | Cyrillic | `ru uk bg sr mk` | Noto Sans (cyrillic subset) |
      | Greek | `el` | Noto Sans (greek subset) |
      | Arabic / Hebrew / Persian / Urdu | `ar he fa ur` | IBM Plex Sans Arabic or Noto Sans Arabic; Noto Sans Hebrew; Noto Nastaliq Urdu |
      | Devanagari / Bengali / Tamil / Telugu | `hi mr bn ta te` | **system stack**, not webfonts |
      | CJK | `ja ko zh-Hans` | **system stack**: `-apple-system, "Hiragino Sans", "Yu Gothic", Meiryo` (ja) |

      CJK and Indic webfonts are multi-megabyte. Serving them would tank LCP in exactly the
      markets we are trying to win. System stacks are the right call.
- [ ] Japanese line breaking: `:lang(ja) { line-break: strict; overflow-wrap: anywhere; }`.
      Japanese has no word spaces, so default `word-break` produces bad wraps in cards and
      tables.
- [ ] `docusaurus start --locale ar` visual pass over: homepage, a path page, a comparison
      table, `FAQAccordion`, `PathAdvisor`, `LearningTimeCalculator`, `CourseCurriculum`,
      navbar + mobile drawer, `DesktopStickyCTA`.
- [ ] Extend `npm run test:a11y` (existing `@axe-core/playwright` setup) with an `ar` run.

### Phase 5: the translation skill (~1 day): **the deliverable that makes Phase 6 cheap**

Create `.claude/skills/translate-content/SKILL.md` in-repo so it is version-controlled and
loadable by the later ultracode workflows.

```
.claude/skills/translate-content/
├── SKILL.md                    # the contract
├── references/
│   ├── locales.md              # roster, tiers, register per locale, live status
│   ├── glossary.csv            # term, do-not-translate flag, per-locale rendering
│   ├── jsx-contract.md         # which props/components are translatable
│   └── qa-checklist.md         # the gate every translated file must pass
└── scripts/
    ├── new-locale.mjs          # scaffold DIRECTORIES + JSON only, never copies markdown
    ├── translation-status.mjs  # sole reducer of .status sidecars -> translation-status.json
    ├── build-glossary.mjs      # seeds global do-not-translate rows from data/courses.json
    ├── jsx-integrity.mjs       # deterministic JSX/prop/code-block/anchor diff
    └── glossary-check.mjs      # deterministic do-not-translate compliance
```

**`new-locale.mjs` must NOT copy English markdown.** The official Docusaurus tutorial answers
this with `cp -r docs/ i18n/fr/...`, and that is actively harmful here: combined with a
disk-derived coverage manifest, untranslated copies are indistinguishable from translations, so
an interrupted multi-day run reads as covered, earns hreflang and a self-canonical, and **ships
English pages under a non-English hreflang with a green build**: the exact invariant-#4
violation §1 spends a decision row forbidding. Docusaurus already falls back per file, so the
copy buys nothing and destroys the only disk signal we have. It therefore creates the directory
tree and the four `write-translations` JSON files **only**. Presence of a markdown file under
`i18n/<L>/` means a translator wrote it.

Target paths, named once so nobody guesses:
`i18n/<L>/docusaurus-plugin-content-docs/current/<same relative path as docs/>`,
`i18n/<L>/docusaurus-plugin-content-blog/<same filename as blog/>`,
`i18n/<L>/docusaurus-plugin-content-pages/<markdown pages only>`.

**`glossary.csv` is long-form, RFC 4180**, not wide. Columns:
`term,category,locale,rendering,inflectable,source`. One row per term-locale pair, so parallel
per-language agents each append only their own rows instead of fighting over 47 columns in one
line. `locale: '*'` with an empty `rendering` means global do-not-translate. `inflectable`
records whether a frozen term may take case endings in `pl`/`cs`/`lt` and the other
case-governed languages flagged in §13.2. `build-glossary.mjs` seeds the ~71 global rows from
`data/courses.json` (`cleanName`, `title`) and the path names; never hand-typed.

**SKILL.md must specify:**

1. **Frontmatter policy.**
   - Translate: `title`, `description`, `image_alt`.
   - **Re-research, never translate:** `keywords`. Literal keyword translation is the
     single most common way multilingual SEO produces zero traffic. German developers
     search "Scrimba Erfahrungen", not "Scrimba Bewertung", and never "Scrimba review".
   - **Never touch:** `slug`, `id`, `sidebar_position`, `sidebar_label` (translate the
     value, keep the key), `authors`, `tags`, `date`, `last_update`, `image`,
     `hideFooterPricingCta`.
   - `slug` parity is a hard invariant. Restate the reason (hreflang) inline so nobody
     "improves" it later.
   - **Resolving the `title` vs course-name collision.** Item 3 freezes all course titles,
     but `title` is listed as translatable, and on 79 course leaves plus 6 path pages the
     title *is* the product name (`title: "Learn React"`, `# Learn React`). The construction
     rule: **the proper name is never translated as a name, and a `title`/H1 is never left
     bare English.** Emit the English name character-for-character (so `glossary-check.mjs`
     passes) plus a localized descriptor carrying the §13.2 item 5 local keyword. For example
     `ja: 「Learn React」コースレビュー`, `de: "Learn React": Kurs im Test`,
     `pt-BR: "Learn React": vale a pena?`. Where the English title is *only* the product name,
     the descriptor is **mandatory**. First body mention uses the English name; later mentions
     may paraphrase.
2. **JSX policy.** 308 `<AffiliateLink>`, 173 `<FAQAccordion>`, 137 `<PricingCTA>`,
   94 `<DisclosureNotice>`, 83 `<CourseCard>`, 72 `<CourseSchema>` usages across the MDX.
   - Translatable props (allowlist): `question`, `answer`, `title`, `label`, `verdict`,
     `alt`, and element children.
   - Never touch: `href`, `to`, `slug`, `courseSlug`, `id`, component names, import
     statements, or anything inside `{...}` expressions.
   - Never translate: fenced code blocks, inline code, CLI commands, file paths.
3. **Do-not-translate glossary.** Scrimba, scrim, Scrimba Pro, all course titles, all path
   names ("Frontend Developer Path"), React, Next.js, TypeScript, Tailwind, RAG, MCP,
   "vibe coding", Trustpilot, Mozilla MDN.
4. **Register: not defined here.** `translate-<lang>/SKILL.md` section 1 is the **only**
   normative source (§13.2 item 1). Both skills load into the same job, so defining register in
   two places puts two conflicting instructions in one prompt for the line this plan itself
   calls highest-leverage. `references/locales.md` holds roster, tier, live status, and skill
   path only. For reference, the values that belong in those per-language files:
   `de`: `du`. `fr`: `vous`. `nl`: `je`. `ja`: です・ます
   (never である). `ar`: MSA, never dialect. `es`: `tú`, LatAm-neutral vocabulary.
   `pt-BR`: `você`. `ko`: 해요체. `tr`: `sen`.
5. **Voice, inherited from `CLAUDE.md`:** independent reviewer, **never a course graduate**.
   Translators must not introduce "when I finished the course" phrasing, which is a very
   common drift in languages where the reviewer register differs.
6. **Editorial guardrails carried over:** no em-dashes in Latin-script locales, never quote
   exact Scrimba prices in **any** currency, link to `/our-pricing` instead.
7. **Anchor discipline:** translated headings must keep the frozen `{#id}` from English.
8. **Transcreation tier.** Money pages (homepage hero, `/docs/paths/*`,
   `/docs/comparisons/*`, `/docs/pricing/*`, and the 3 money blog posts) are
   **transcreated, not translated**: local competitor set, local job-market framing, local
   social proof, CTA rewritten for the market. Everything else is faithful translation.
9. **QA gate, split into two tiers.** The earlier draft listed a full
   `docusaurus build --locale <L>` as a per-file gate, which contradicts Phase 6's barrier and
   is unsatisfiable anyway: under the Phase 2 exclusion rule a Core-set locale cannot build
   until its whole route set exists.

   **Per-file (cheap, deterministic, no model judgment), runs on every translated file:**
   - `npm run check:content` (with the new `i18n/**` rules)
   - MDX compiles
   - `scripts/jsx-integrity.mjs`: identical multiset of component names; identical values for
     the never-touch prop allowlist (`href|to|slug|courseSlug|id`); identical count and byte
     content of fenced code blocks; identical `{#id}` anchor set
   - `scripts/glossary-check.mjs`: non-zero on any global do-not-translate term missing or
     rendered differently, honouring `inflectable`
   - affiliate-param integrity (already assigned to `check-content.mjs` in Phase 1: cross
     reference it, do not build a second checker)

   **Per-locale barrier, once, over the pruned link set:**
   - `npx docusaurus build --locale <L>` green, with `onBrokenLinks: 'throw'` and
     `onBrokenAnchors: 'throw'`
   - back-translation spot check on a 10% sample
   - a native-register critic pass (the step that separates "translated" from "publishable",
     and the direct mitigation for §7 R1)

   The disk-derived coverage manifest is authoritative **only at the barrier**, never mid-run.
10. **The new-content loop** (the "so we can easily translate later" requirement), **sharded
    so parallel agents never share a file.** A single `i18n/translation-status.json` written by
    47 concurrent locale agents is a guaranteed write conflict, which is why §11.4 shards the
    ledger and this must do the same.

    Each completed page writes its own sidecar at
    `i18n/<locale>/.status/<sha256(sourcePath)>.json`:

    ```json
    { "sourcePath": "docs/comparisons/scrimba-vs-codecademy.mdx",
      "route": "/docs/comparisons/scrimba-vs-codecademy/",
      "locale": "de", "sourceHash": "<sha256>",
      "translatedAt": "<ISO8601 UTC>",
      "tier": "faithful",            /* 'faithful' | 'transcreation' */
      "mqm": { "score": 3.2, "sourceWords": 1840, "majorAccuracy": 0,
               "terminology": 0, "judgeModel": "...", "verdict": "pass" },
      "jsd": 0.041,                  /* §13.5 translationese score */
      "state": "current",            /* 'current' | 'blocked' */
      "attempts": 1 }
    ```

    - **`sourceHash` is computed after stripping the frontmatter keys `last_update`, `date`, and
      `image`, and after normalizing line endings.** Hashing raw bytes means one `last_update`
      bump mass-staleizes all 47 locales, which is exactly the R5 cost this mechanism exists to
      control.
    - `scripts/translation-status.mjs` is the **sole reducer**, folding the sidecars into
      `i18n/translation-status.json` during `prebuild`. **Sidecars are committed; the reduced
      file is generated and gitignored.**
    - `make i18n-status` reports, per locale: missing, stale (source hash changed), current,
      blocked.
    - CI **warns** (does not fail) on drift, and posts the report to the PR.
    - Authoring a new English page automatically enqueues it for every live locale.

11. **`data/*.json` is a translation target and nothing in the earlier draft reached it.**
    `data/courses.json` carries English `modules[].name`, `modules[].duration`, `level`, and
    `access`, rendered by `CourseCurriculum.tsx` and read by `scrimbaFacts.ts`. These are
    **data, not `<Translate>` call sites**, so the Phase 1 extraction sweep and the Phase 6
    `code.json` job never see them, and the JSX policy above correctly forbids the translator
    from touching `{...}` expressions. Net result if unaddressed: every translated course page
    renders an English curriculum table, **and the cold MQM judge scores that as an
    Accuracy/Untranslated error, failing the page for a defect the translator was told not to
    fix.** Fix:
    - `data/courses.json` stays English (it is scraper output; §CLAUDE.md owns it).
    - Add `data/i18n/<locale>/courses-strings.json` (`{"<docSlug>": {"modules": [...]}}`) plus a
      shared `units.json` for `min`/`hrs`/`level`/`access`, resolved through
      `src/utils/localizedCatalog.ts` with English fallback **only** for non-live locales.
    - `build-data.mjs` emits a stub per live locale so missing keys are visible rather than
      silently falling back.
    - These files are translation targets with their own status sidecar, translated **before**
      any course page in that locale is judged. **Module names ARE translated** (they are
      Scrimba UI copy, not course proper names) and are out of scope for the glossary.

**Language-specific knowledge does NOT go in this skill.** It goes in the per-language
`translate-<lang>` skills specified in **§13**. This file holds only repo mechanics, so it
stays the single thing to update when the repo changes.

**Skills this skill composes with:** `copywriting` (transcreation of money pages),
`copy-editing` (per-locale editorial pass), `humanizer` (strip MT/AI tells per language),
`customer-research` (per-market VOC before transcreating), `ai-seo` + `content-strategy`
(per-locale keyword research instead of translated keywords).

### Phase 6: translate Tier A (later, ultracode + dynamic workflows)

Out of scope for this document beyond the shape:

1. `es` first, alone, full site. It is the largest market and the lowest-risk script.
2. Then `pt-BR`, `fr`, `de` in parallel.
3. Then `ja` (validates CJK end to end) and `ar` (validates RTL end to end).
4. Launch each locale only when its coverage manifest is complete relative to `tiers.json`, no
   more than 10% of its declared routes were auto-dropped (§13.4), and the per-locale barrier is
   green.
5. Stagger launches by ~3 weeks so indexing signals stay attributable per locale.
6. **Stop after Tier A.** Tiers B through E do not begin until the 90-day Tier A verdict in §7.1
   returns >= 90% indexed. This is the whole point of shipping Tier A first.

Workflow shape for the ultracode phase: pipeline over pages, with stages `translate` to
`self-review` to `integrity-verify` (glossary, JSX, links, affiliate params) to
`native-register critic`. Barrier only before the per-locale build.

**The UI-string job covers all FOUR `write-translations` outputs, not just `code.json`.** The
earlier draft named `code.json` here and `navbar.json`/`footer.json` in Phase 8, and omitted the
two that carry the most-seen UI on a docs site:

| File | Carries |
|---|---|
| `i18n/<L>/code.json` | React component strings |
| `i18n/<L>/docusaurus-theme-classic/navbar.json` + `footer.json` | nav and footer labels |
| `i18n/<L>/docusaurus-plugin-content-docs/current.json` | **sidebar category labels** hand-written in `sidebars.ts` (`How Scrimba Works`, `Who It's For`, `Learning Paths`, `Courses by Topic`, `React`, `CSS & Design`, `AI & Machine Learning`, ...) |
| `i18n/<L>/docusaurus-plugin-content-blog.json` | blog sidebar title and tag labels |

All four are generated by `npx docusaurus write-translations --locale <L>`. Translate `message`
values only, **never keys**. Nothing in the coverage manifest or the per-file gate can catch a
miss here, because these are not translated content files, so add an explicit barrier
assertion: **fail if any `message` in the four files is byte-identical to its English baseline**,
unless the string is a glossary do-not-translate term.

### Phase 7: per-market content, not translation (the actual differentiator)

Runs after each locale launches. This is where the ranking upside is.

**Before any of this is written, resolve where locale-only content lives, because right now it
would silently produce nothing.** Both content plugins enumerate their file list from the
**base** content dir only (`plugin-content-docs` globs `versionMetadata.contentPath`;
`plugin-content-blog` globs `contentPaths.contentPath`) and consult `getContentPathList()` only
for per-file *override* lookup. So a file that exists **only** under `i18n/<L>/...` yields
**no route, no sitemap entry, and no warning**, with a green build. The highest-margin work in
the whole program would ship nothing, and no QA gate would notice. Pick one:

- **(a) A second `plugin-content-docs` instance**, registered only when `CURRENT_LOCALE`
  matches, with `id: 'local-<L>'`, `path: 'i18n/<L>/local-docs'`, `routeBasePath: 'docs'`, and
  its own `sidebarPath` (the main `sidebars.ts` cannot reference another instance's docs).
- **(b) Put the source in `docs/`** and add it to the Phase 2 `exclude` list for every other
  locale, in which case it must sit inside an `autogenerated` sidebar dir.

Either way: locale-only routes enter `coverage.json` as **singletons** (self canonical, no
alternates, no `x-default`, skipped by the reciprocity assertion), and the barrier build asserts
a corresponding `build/<L>/.../index.html` actually exists.

- [ ] Per-market local competitor comparisons (net-new, no English source):
  - `pt-BR`: `scrimba-vs-alura`, `scrimba-vs-rocketseat`
  - `es`: `scrimba-vs-platzi`
  - `fr`: `scrimba-vs-openclassrooms`
  - `ja`: `scrimba-vs-progate`, `scrimba-vs-techacademy`, `scrimba-vs-codecamp`
  - `de`: `scrimba-vs-codecademy` reframed for the DACH market, plus local bootcamps
  - `en-IN` (English, not `hi`): `scrimba-vs-scaler`, `scrimba-vs-coding-ninjas`,
    `scrimba-vs-geeksforgeeks`
- [ ] Per-market job-market and salary pages, replacing the US-centric framing in
      `developer-salary-guide-2026` and `junior-developer-job-market-2026`.
- [ ] Localized OG/social cards. `scripts/generate-social-cards.mjs` shells out to
      `rsvg-convert`; it needs per-script font handling and RTL text layout for `ar`.
- [ ] Localize the tools: `bootcamp-cost-calculator` needs local currency and local
      bootcamp price ranges (currency display only, never Scrimba prices).
- [ ] `relatedGuidesMap.ts` entries for the new per-market pages.

**Skills:** `competitor-alternatives` (this is exactly its use case: comparison and
alternative pages per market), `customer-research` (review mining in-market: local
subreddits, Qiita/Zenn for `ja`, Brazilian dev Twitter/YouTube for `pt-BR`, local
Trustpilot and G2 locales), `content-strategy` (per-market topic map and cannibalization
check against the existing 72-post English blog), `pricing-strategy` (regional pricing
context without quoting prices), `marketing-psychology` (local social proof norms differ:
credential-heavy in `de` and `ja`, community-heavy in `pt-BR`), `image` (localized cards),
`directory-submissions` (local directories for early per-market links),
`programmatic-seo` (the locale x page matrix is inherently programmatic; use its quality
gates to avoid the thin-page failure mode).

### Phase 8: language switcher + discovery UX (~1 day)

- [ ] `type: 'localeDropdown'` is unusable at 15+ locales. Build a custom `LocaleSwitcher`:
      searchable, grouped by region, rendering **real crawlable `<a href>` anchors** (not
      JS-only), positioned left of the "Get Scrimba Pro" CTA so it never competes with it.
- [ ] `i18n/<locale>/docusaurus-theme-classic/navbar.json` + `footer.json` per locale for
      nav and footer labels.
- [ ] Dismissible locale-suggestion banner from `Accept-Language`, storing a cookie.
      **Suggest, never redirect.**
- [ ] `dropdownItemsAfter`: a "help improve this translation" link.

---

## 5. New SEO invariants (to append to `CLAUDE.md`)

These join `trailingSlash: true` as things that must never regress:

1. **Path parity across locales.** Never localize a `slug`. Local keywords live in `title`,
   H1, `description`, and body copy.
2. **Self-referencing canonical per locale.** Never canonical a translation to English.
3. **hreflang comes from `i18n/coverage.json`**, never from the raw locale list. Reciprocal,
   self-referencing, exactly one `x-default` pointing at English.
4. **A locale ships complete relative to its coverage manifest, or not at all.** Never an
   English fallback page under a non-English hreflang. "Complete" means every route in that
   locale's manifest is translated and unblocked (§13.4 failure ladder), not every route on the
   site.
5. **No geo or `Accept-Language` redirects.** Ever.
6. **Frozen heading anchors.** Never remove an explicit `{#id}`.
7. **One `#organization` entity** shared across all locales. `inLanguage` always reflects
   the actual locale.
8. **`robots` meta is `name=`, not `property=`** (already-learned lesson; it applies to the
   noindex path below). The coverage plugin emits `<meta name="robots" content="noindex">`
   for exactly one case: a locale whose roster `status` is `pruned` (§7 kill criteria). A
   pruned locale also drops out of every hreflang cluster and out of `sitemap-index.xml`,
   while its files stay on disk. No other noindex path exists in this program.
9. **Affiliate params survive translation.** `via=u42d4986` on every outbound scrimba.com
   link in every locale, enforced by `check:content`.
10. **Never quote exact Scrimba prices in any currency or locale.**
11. **Unknown URLs return 404, never 200.** On Cloudflare Workers Static Assets that means
    `not_found_handling: "404-page"`. Setting it to `single-page-application` returns 200 for
    every unknown URL and mass-indexes soft 404s. This is the one platform setting that can
    destroy the site's SEO on its own (§4 Phase 0c).
12. **Exactly one canonical tag per page, absolute, trailing-slash.** Asserted at build time,
    not assumed from a regex that happens to match (§4 Phase 1).

---

## 6. Measurement

### 6.1 Recorded baseline (2026-08-09, via the Search Console API)

The pre-i18n baseline is captured, not pending. Everything later is measured against this.

**28 days, 2026-07-10 to 2026-08-06, `dataState: final`:**
**346 clicks, 32,867 impressions, 1.05% CTR, average position 11.6.**

Property health at capture: sitemap 220 URLs / 0 errors / 0 warnings; all 7 sampled canonical
pages `PASS` + `Submitted and indexed` + `robotsTxtState: ALLOWED`; `googleCanonical` correct
with trailing slash on all 9 URLs tested; `/nonexistent/` returns 404; IndexNow key file 200
`text/plain`.

**Impressions by country, which is the direct test of §0's thesis:**

| Country | Impressions | Clicks |
|---|---|---|
| USA | 7,196 | 54 |
| **India** | **4,323** | **48** |
| GBR | 1,439 | 16 |
| CAN | 1,141 | 14 |
| DEU | 550 | 12 |
| AUS | 786 | 10 |
| ESP | 335 | 10 |
| BRA | 412 | 9 |
| PHL | 979 | 9 |
| PAK | 643 | 8 |
| IDN | 613 | 7 |
| NGA | 689 | 7 |

**What this does and does not license.**

- It **confirms** the §2 India caveat empirically: India is already the #2 market by impressions
  and near-#1 by clicks, entirely in English. Adding PHL, PAK and NGA, the English-consuming
  long tail is already delivering real volume at zero translation cost. **The cheapest next win
  is India-focused English content, ahead of any locale.**
- It **does not** rank the translation opportunity. DEU 550 / ESP 335 / BRA 412 are impressions
  on *English* pages, so they measure "German users finding English content", which is exactly
  what translation exists to fix. The absence of FRA and JPN from the top 12 is likewise not
  evidence those markets are dead. Do not reorder Tier A on this table alone; use the
  per-market SERP research in §13.2 item 5.

### 6.2 Ongoing

Baseline each new locale before it goes live.

**Per locale, tracked monthly:**

| Metric | Source | Target by month 6 |
|---|---|---|
| Indexed pages vs submitted | GSC Pages report, filtered by `/<locale>/` | >90% |
| Impressions, clicks, avg position | GSC, filtered by `/<locale>/` | trending up from month 3 |
| Non-brand queries in target language | GSC query report | >50% of clicks |
| Affiliate clicks per session | GA4, locale dimension | within 30% of English |
| Conversion rate | Scrimba affiliate dashboard, per-locale sub-ID if supported | within 50% of English |
| CWV (LCP/INP/CLS) | GSC + CrUX per locale path | pass |

**Notes on measurement traps:**
- **GSC no longer validates hreflang.** The International Targeting report was removed on
  22 September 2022. Use Screaming Frog's hreflang report, or the CI assertions from
  Phase 2, plus a spot check:
  `curl -s https://scrimbaguide.tech/de/docs/paths/ | grep -i 'rel="alternate"'`.
- Subdirectories inherit a domain property, so no new GSC verification is needed. Do add
  per-locale **filtered views** so per-market data is one click away.
- **You cannot A/B test SEO here.** Do not try. Measure by locale cohort and launch stagger
  instead. `ab-test-setup` applies only to on-page CTA and conversion elements within a
  locale, not to the translation decision itself.
- Expect **3 to 6 months** before a new locale shows meaningful position data. Do not judge
  a locale at 30 days.

**Skills:** `analytics-tracking` (GA4 locale dimension, per-locale conversion tracking,
UTM/sub-ID scheme), `seo-audit` (monthly per-locale regression pass).

---

## 7. Risks, honestly ranked

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Scaled content abuse.** (Primary external check is now Google's own index response, per §7.1.) Google's spam policy names "automated transformations like synonymizing, **translating**, or other obfuscation techniques, where little value is provided to users". ~4,400 machine-translated pages is a textbook trigger. | **Critical** | Tier gates. Native-register critic pass in the QA gate. `humanizer` pass per language. Transcreated (not translated) money pages. Net-new local-competitor content per market so each locale carries genuinely unique value. Never launch a locale that is only a translation. |
| R2 | **Index bloat and crawl budget.** A mid-authority site suddenly submitting ~4,400 URLs gets partial indexing and diluted crawl. | High | Tier gates tied to observed indexing rate. Core set only for Tiers C/D/E. Stagger launches ~3 weeks apart. Per-locale sitemap priority scaled by tier. Do not open Tier C until Tier A/B indexing exceeds 90%. |
| R3 | **GitHub Pages 1 GB cap (B1).** Silent deploy failure at scale. | High | Phase 0 decision + the CI size gate. Cloudflare Pages is the clean escape. |
| R4 | **hreflang breakage** from slug drift or coverage/manifest skew. Google discards the whole cluster's annotations. | High | Invariant #1 + #3, plus the Phase 2 CI assertions. This is why the manifest is generated from disk rather than hand-maintained. |
| R5 | **Maintenance drift.** 217 English pages x N locales. Every English edit silently staleizes N translations. | High | `i18n/translation-status.json` with source hashes, `make i18n-status`, CI drift warning on every PR. Budget the re-translation cost from day one; it is not a one-time project. |
| R6 | **Affiliate revenue loss** from broken CTAs (C3) or stripped `via=` params. | High | Phase 1 C3 fix + the `check:content` affiliate-integrity rule. Verify per locale after launch with a real click test, not just a grep. |
| R7 | **Quality failure in a language nobody on the team reads.** With no manual review anywhere (§18 decision 6), this applies to **every** locale, not just `ga`/`mt`/`is`/`mk`/`bn`/`te`. | **High** (raised from Medium) | The full regime is §7.1: mandatory translationese JSD as the pre-publish signal, auto-drop of blocked routes, a 10%-dropped locale-launch veto, and the 90-day Tier A verdict gating every subsequent tier. An unlaunched locale costs nothing; a bad one costs sitewide quality signal, so the default is not to launch. |
| R8 | **CWV regression** from font loading in non-Latin scripts. | Medium | System font stacks for CJK/Indic (Phase 4). Per-locale conditional font loading. Measure LCP per locale before launch. |
| R9 | **Build time and CI cost.** | Medium | Matrix with `max-parallel: 15`. Public repo means unlimited Actions minutes; the constraint is wall-clock, roughly 15 to 20 minutes for the full roster. |
| R10 | **Search stemming** is unavailable for 20 roster languages even under Pagefind (9 UI-only + 11 absent from its table; 22 if `ja`/`zh` are counted, though those get segmentation instead). See §12.3. | Low | Substring and segmentation matching still work; only morphological root-matching is weaker. Documented, accepted, never a launch blocker. |
| R11 | **Legal exposure** from translated privacy/ToS. | Low but non-zero | Legal pages excluded from all locales. English only, with a localized pointer line. |

### 7.1 The no-manual-review regime, and the 90-day Tier A verdict

**Decided 2026-08-09: nothing is proofread by a human before publishing, at any tier.** An LLM
translates and a second cold LLM instance grades it. That is a real gap, so it is closed with
structure rather than ignored.

**Three substitutes for the human reviewer, in order of when they fire:**

| When | Check | What it catches |
|---|---|---|
| Pre-publish, deterministic | `jsx-integrity.mjs`, `glossary-check.mjs`, `check:content`, anchor parity, affiliate-param integrity | Mechanical corruption. Cannot judge language quality at all |
| Pre-publish, statistical | **§13.5 translationese JSD** vs a native reference corpus | Systematically unnatural output, including the case where the MQM judge is wrong. This is now **load-bearing and mandatory**, not optional, because it is the only pre-publish signal that is independent of the model doing the grading |
| Post-publish, external | **§11.5 index response**: `Submitted and indexed` versus `Crawled - currently not indexed` | Whether Google considers the pages worth indexing. Lagging by ~6 weeks, but objective, free, and the only check that measures the thing we actually care about |

**The failure ladder loses its human branch.** §13.4's terminal state was "a human fixes it or
drops the route." With no reviewer, it becomes fully automated:

- After 3 failed attempts a page is marked `state: 'blocked'` and its route is **automatically
  dropped from that locale's coverage manifest** (so it leaves hreflang, leaves the sitemap, and
  never renders an English fallback). The run continues.
- **If more than 10% of a locale's declared routes end up dropped, that locale does not launch.**
  An objective, unattended gate that needs nobody to adjudicate it.

**The 90-day Tier A verdict.** Tier A ships. Then, 90 days after the last Tier A locale goes
live, read one number per locale using the §11.5 definition (`Submitted and indexed` over
`active` rows inspected within 35 days):

| Result | Meaning | Action |
|---|---|---|
| **>= 90% indexed** | The unattended pipeline produces content Google accepts | Proceed to Tier B |
| **60 to 90%** | Marginal. Something is being judged thin | Fix, re-verify, do **not** expand |
| **< 60%** | The pipeline is producing content Google will not index | **Stop.** Launch no further locale. Prune the worst locale per the kill criteria below and reconsider whether translation without review is viable at all |

**Why Tier A is the right place to bet.** Its 6 languages are high-resource, which is exactly
where a self-grading model is most reliable and where the translationese corpus check has enough
data to work. They are also the 6 largest markets, so the upside is concentrated there regardless.
And the cost of being wrong is 6 locales of wasted work, not 47.

**What this decision explicitly buys.** The alternative was shipping all 48 locales at once.
Google's scaled-content rules apply at the **domain** level, so a bad unattended rollout would put
the English pages, which earn 100% of today's 346 monthly clicks (§6.1), at risk. Tier-first is
the only sequencing where the downside is bounded to new work rather than existing revenue.

### Kill criteria

A locale that after **6 months live** has fewer than 500 impressions per month and zero
affiliate conversions gets pruned: `noindex` + removed from the hreflang cluster + removed
from the sitemap, content retained on disk. Do not leave dead locales indexed. Bloat is a
sitewide signal, not a per-locale one.

---

## 8. Skill index

| Phase | Skills |
|---|---|
| 0 Hosting + index | `seo-audit` |
| 1 Locale-aware refactor | `seo-audit`, `analytics-tracking` |
| 2 Coverage + hreflang | `schema-markup`, `site-architecture` |
| 3 Build + deploy | `ai-seo` (per-locale llms.txt), `seo-audit` |
| 4 RTL | (engineering; `page-cro` for the RTL CTA/layout review) |
| 5 Translation skill | `copywriting`, `copy-editing`, `humanizer`, `customer-research`, `content-strategy`, `ai-seo` |
| 6 Tier A translation | `humanizer`, `copy-editing`, `copywriting` (money-page transcreation) |
| 7 Per-market content | `competitor-alternatives`, `customer-research`, `content-strategy`, `pricing-strategy`, `marketing-psychology`, `image`, `directory-submissions`, `programmatic-seo` |
| 8 Switcher UX | `page-cro`, `copywriting` |
| §11 Indexing automation | `seo-audit`, `analytics-tracking` |
| §12 Pagefind migration | (engineering; `page-cro` for the search UI, `seo-audit` for the `/search/` route and `SearchAction` schema) |
| §13 Per-language skills | `example-skills:skill-creator`, `customer-research`, `humanizer`, `copy-editing`, `ai-seo`, `content-strategy` |
| Ongoing | `seo-audit` (monthly per-locale), `analytics-tracking`, `ab-test-setup` (in-locale CTA tests only) |

**Run first, before anything else:** `product-marketing-context` to write
`.agents/product-marketing-context.md` with the multi-market positioning, per-market ICP,
and the "English product, localized research" framing from §0. Every other skill reads it,
and without it each one will re-derive the positioning differently.

---

## 9. Open questions for the user

> **Superseded: the authoritative decision list is now §18**, which carries the corrected
> inputs and states what each decision blocks. Kept here for continuity.

1. **Hosting (Phase 0, blocking).** GitHub Pages (**1 GB total, no file cap**) or Cloudflare
   Pages (**no size cap, but 20,000 files Free / 100,000 paid**)? Today's single-locale build is
   **894 files**, so the Cloudflare file cap binds before any byte cap at roster scale. See §18
   decision 1. Recommendation: migrate, on a paid plan.
2. ~~**Search.**~~ **Resolved: Pagefind.** Fully static, no hosted service, automatic
   per-language index splitting. See §12 for the evidence and the migration cost.
3. **Native review budget.** Is there budget for one native review pass per locale
   (roughly 15 to 40 locales)? The answer decides whether Tiers D and E launch at all
   (see R7), and it is the main lever on R1.
4. **Roster gate.** Confirm Tier A (6) is the launch scope and that Tier B is
   data-gated rather than scheduled. The full 48-locale roster is planned here as
   requested, but shipping it without gates is the highest-risk version of this program.
5. **Affiliate sub-IDs.** Does Scrimba's affiliate program support a sub-ID or `sub_id`
   parameter alongside `via=`? If yes, per-locale attribution is nearly free and R6/§6
   measurement gets much sharper. If no, attribution has to come from GA4 alone.
6. **India.** Confirm the `en-IN`-content-first reading of §2, which moves
   `scrimba-vs-scaler` etc. into the English roadmap and demotes `hi`/`bn`/`ta`/`te`/`mr`
   to a gated pilot on `hi` alone.

---

## 10. Recommended first commit

Phases 1 and 2 are independent of any translation and safe to land on `main` now. **Three
separate commits, not one**, because they have different risk profiles and only the first is
close to a no-op:

```
1) feat(i18n): locale-aware routing and frozen anchors      [Phase 1]
   - src/utils/localePath.ts + strip locale prefix in 10 path predicates
   - i18n/locales.config.ts as the single locale roster
   - freeze heading anchors across 217 MDX files + onBrokenAnchors: 'throw'
   - remove hardcoded og:locale / inLanguage
   - export LOW_VALUE_PATTERNS / isLowValuePath
   - check:content: i18n/** scope, localized currencies, affiliate integrity

2) feat(i18n): coverage manifest and manifest-driven hreflang [Phase 2]
   - i18n/tiers.json (declared) + i18n/coverage.json (disk-derived)
   - ejected SiteMetadata emitting hreflang from the manifest
   - coverage-aware sidebars.ts + link pruning
   - hreflang fixture tests

3) refactor(search): replace lunr with Pagefind               [Phase 0b]
```

The `baseUrl` work belongs to **Phase 3**, not here. Commit 1 changes English output in the
enumerated ways listed in §16 and nothing else; commit 3 rewrites the search UI, so it is
explicitly not a no-op. No commit adds a locale, so none of them can affect current rankings.

---

## 11. Indexing automation (Google Search Console API)

Self-contained under `scripts/indexer/`, owned by this repo. No shared state with any other
project.

**Why this belongs in the i18n plan:** the current site is ~190 URLs and indexing is
effectively a non-problem. At Tier A it is ~1,300, and at full roster ~4,400. At that size
"submit the sitemap and hope" stops working, and the binding constraint becomes the
**URL Inspection quota of 2,000 per day per property**. The system below turns indexing from
a hope into a measured, prioritized, quota-aware loop, and it is the measurement instrument
for the tier gates in §7.

### 11.0 API contract (single source of truth)

Every module reads these constants from `scripts/indexer/auth.mjs`. No consumer re-derives
them, because five separate review findings traced back to modules inventing their own.

**Dependency decision: no new npm dependency.** Do **not** add `googleapis`; it would land in
a Docusaurus production install, and every existing script (`submit-indexnow.mjs`,
`assert-sitemap-url.mjs`) uses node builtins only. `auth.mjs` hand-rolls the service-account
JWT flow: RS256 assertion via `node:crypto` `createSign('RSA-SHA256')`, then
`POST https://oauth2.googleapis.com/token` with
`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`. Cache the token in-process until
`exp - 60s`.

**Scopes. This is the highest-consequence line in the section.**

```
SCOPE_WEBMASTERS = 'https://www.googleapis.com/auth/webmasters'   // ALL Search Console calls
SCOPE_INDEXING   = 'https://www.googleapis.com/auth/indexing'     // notify.mjs only
```

Use the **read-write** `webmasters` scope for *every* Search Console call, including
`urlInspection`. Verified against the live v1 discovery document: `sitemaps.submit` and
`sitemaps.delete` accept **only** `webmasters`, while `urlInspection.index.inspect`,
`sitemaps.list` and `sitemaps.get` also accept `webmasters.readonly`. An agent reasonably
picking least-privilege `readonly` gets a **silent 403 on every sitemap submit**, which the
error table below would then misreport as bad credentials. `SCOPE_INDEXING` is a separate JWT
client on a different host, constructed only under `--enable-indexing-api`.

**Endpoints.**

```
INSPECT_URL    = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'   // POST
SITEMAPS_BASE  = 'https://searchconsole.googleapis.com/webmasters/v3/sites'
ANALYTICS_URL  = `${SITEMAPS_BASE}/${enc(SITE_URL)}/searchAnalytics/query`                // POST
INDEXING_URL   = 'https://indexing.googleapis.com/v3/urlNotifications:publish'            // POST
INDEXING_BATCH = 'https://indexing.googleapis.com/batch'                                  // POST
```

Use `searchconsole.googleapis.com` (the discovery `rootUrl`) throughout.
`www.googleapis.com/webmasters/v3` is a legacy alias; pin one host so two agents cannot fork.

**Percent-encoding rule.** Both path params are encoded, always:

```
PUT `${SITEMAPS_BASE}/${encodeURIComponent('sc-domain:scrimbaguide.tech')}/sitemaps/${encodeURIComponent(feedpath)}`
```

`feedpath` is an **absolute URL** (`https://scrimbaguide.tech/de/sitemap.xml`), not a filename
and not a site-relative path. Success is **HTTP 200 with an empty body: do not parse it.**

**Response nesting.** Inspection fields live at `inspectionResult.indexStatusResult.*`;
`inspectionResultLink` is a sibling on `inspectionResult`. The array field is named
**`sitemap`** (singular). `inspect.mjs` throws if `indexStatusResult` is absent rather than
writing a null-filled row. Test fixtures must be captured from a real API response, never
hand-written from a flat field list.

**Exports.** `getAccessToken(scopes: string[]): Promise<string>` and
`gscFetch(url, {method, body, scopes}) -> {status, headers, json}` which **does not throw on
non-2xx**. The caller classifies using the table below.

**Error classification.** The naive rule "403 is fatal" is **wrong and would abort the sweep
on a routine rate limit**: `quotaExceeded`, `dailyLimitExceeded`, `rateLimitExceeded` and
`userRateLimitExceeded` are all returned as **HTTP 403**. Classify on status **and** the JSON
`reason`, never status alone.

| Condition | Action |
|---|---|
| 403 with reason in {`quotaExceeded`, `dailyLimitExceeded`, `rateLimitExceeded`, `userRateLimitExceeded`}, or any 429 | Not fatal. Sleep 15s / 60s / 900s + jitter. If the 3rd attempt still fails, or 5 consecutive URLs hit it: persist state, write the summary, **exit 0** (treat the day's quota as exhausted) |
| 403, any other reason, on the first call before any URL has succeeded | Fatal, exit 1 (credentials, scope, or `sc-domain:` prefix) |
| 400 / 404 | Record `lastError`, set `nextDue = null`, log, **continue**. Never fatal |
| 5xx | Retry 3x with backoff, then record `lastError`, leave `nextDue` unchanged, continue |

**Only a `FAIL` verdict or a not-indexed `coverageState` advances `failCount` and the P2
backoff ladder. Transport and HTTP errors never touch `failCount` or `nextDue`**, otherwise
healthy URLs silently sink into the 30-day tier.

**Quota units.** URL Inspection: 1 unit per URL. Indexing API: **1 unit per URL, including
URLs inside a batch.** See §11.2.

### 11.1 Credentials (done)

| Item | Value |
|---|---|
| Local key | `secrets/gsc-service-account.json`, `chmod 600` |
| Service account | `google-search-console-scriopt@boreal-forest-450320-k5.iam.gserviceaccount.com` |
| GCP project | `boreal-forest-450320-k5` |
| GitHub secret | `GSC_SERVICE_ACCOUNT_JSON` (set on `yel-hadd/scrimbaguide.tech`) |
| Gitignore | `/secrets/`, `*service_account*.json`, `*service-account*.json`, `*.pem`, `gcp-*.json`, `/.indexer-state/` |
| Verified access | `siteOwner` on **`sc-domain:scrimbaguide.tech`** |

**Two facts that shape every script:**

1. It is a **Domain property**, so `siteUrl` is the literal string `sc-domain:scrimbaguide.tech`,
   **never** `https://scrimbaguide.tech/`. Passing the URL-prefix form against a domain
   property returns 403. A domain property covers every locale subdirectory automatically, so
   no new property is needed per locale. This applies to the `urlInspection` request body
   **and** to the percent-encoded `{siteUrl}` path segment of every Sitemaps and Search
   Analytics call (§11.0).
2. Permission is `siteOwner`, sufficient for URL Inspection, Sitemaps submit/delete/list, and
   Search Analytics. Nothing further to grant.

**Credential resolution.** `GSC_SERVICE_ACCOUNT_JSON` holds the **verbatim, un-encoded**
contents of the key file (not base64). Resolution order: `process.env.GSC_SERVICE_ACCOUNT_JSON`,
then `--key-file <path>`, then `secrets/gsc-service-account.json`. If none resolves, exit 1
with a one-line remediation message. **Never log `client_email`, `private_key_id`, or any part
of `private_key`**, and never `cat` the key file. (This rule exists because a review agent
already echoed parts of this file into a transcript once.)

- [ ] Confirm the **Indexing API** is enabled on project `boreal-forest-450320-k5`. Enabling
      the Search Console API does not enable it. Only needed if §11.3 D is used.
- [ ] **Rotate this key** once the automation is live. It has been on disk in two repos and
      shares its Indexing API quota with `use-apify.com`.

### 11.2 Verified API budget

Numbers from Google's official limits pages and the live discovery document.

| API | Limit | Notes |
|---|---|---|
| **URL Inspection** (`urlInspection.index.inspect`) | **2,000/day and 600/min per site**; 15,000 QPM / 10M QPD per project | One URL per call. **No bulk endpoint exists.** The scarce resource; the whole design orbits it. |
| **Search Analytics** (`searchanalytics.query`) | 1,200 QPM per site; 40,000 QPM and 30M QPD per project | Effectively unlimited for us. See the freshness and pagination notes below. |
| **Sitemaps** (`submit` / `delete` / `list`) | "All other resources": 20 QPS, 200 QPM per user | Cheap. Submitting the index is enough for discovery, but submitting each locale sitemap explicitly gives per-sitemap coverage reporting in the GSC UI, which is what §11.5 reads. |
| **Indexing API** (`urlNotifications.publish`) | **200 URLs/day per GCP project**, 180/min `getMetadata`, 380/min all endpoints, resets **midnight Pacific**. Batch endpoint accepts up to **100** calls per HTTP request, each part <= 1 MB. | See the compliance and quota warnings below. |
| **IndexNow** (`scripts/submit-indexnow.mjs`) | No documented hard cap; 10,000 URLs per request | Bing, Yandex, Seznam, Naver. Not Google. |

**Batching does not save quota.** Google is explicit: *"Quota is counted at the URL level. For
example, if you combine 10 requests into a single HTTP request, it still counts as 10 requests
for your quota."* So the hard cap is **200 URLs/day**, not 200 requests/day. Combined with the
increment-before-the-call rule in §11.4, `notify.mjs` must **increment by the batch's URL
count before sending**. Reading this as "200 requests x 100 URLs" would be a 20x overspend in
the very section whose purpose is quota safety.

**Indexing API compliance warning.** Google's docs are explicit: it "can only be used to crawl
pages with either `JobPosting` or `BroadcastEvent` embedded in a `VideoObject` markup." This
site has neither. Off-label submissions are accepted and queued, but Google may deprioritize
or ignore them and reserves the right to ignore accounts that bulk-misuse it. There is no
documented penalty beyond wasted quota, and no documented benefit.

**Therefore the Indexing API is opt-in and off by default (§11.3 D).** The backbone is
Sitemaps + URL Inspection + IndexNow: all supported, all uncapped enough, all honest. Anyone
flipping `--enable-indexing-api` is spending 200 URLs/day on a hint that may do nothing.

**Search Analytics specifics the system depends on.** Data lags **2 to 3 days**; the most
recent days are absent or incomplete. Pass `dataState: 'final'` for stable reporting and
`'all'` only when deliberately reading fresh-but-mutable data. Paginate with
`rowLimit` (max **25,000**) and `startRow`; a query that returns exactly `rowLimit` rows is
**not** complete, so keep paging until a short page. Query with
`dimensions: ['page']` (plus `['page','query']` for the non-brand share metric in §6).

### 11.3 System design

```
scripts/indexer/
├── auth.mjs            # §11.0 contract: JWT, scopes, endpoints, gscFetch
├── quota.mjs           # persisted token buckets, Pacific-day rollover
├── ledger.mjs          # SOLE reader/writer of ledger.json
├── discover.mjs        # A: URL universe from the LIVE sitemaps + reconciliation
├── sitemaps.mjs        # B: submit/verify sitemap index + per-locale sitemaps
├── inspect.mjs         # C: priority-queue URL Inspection sweep
├── notify.mjs          # D: IndexNow (default) + Indexing API (opt-in)
├── report.mjs          # E: coverage report, tracking issue, per-locale rollup
├── commit-state.sh     # the only write path to the indexer-state branch
└── __tests__/          # node --test, matching the repo convention
```

**A. Discovery. Never reads `build/`.** `build/` is gitignored, `indexer-submit.yml` fires on
`workflow_run` on a fresh runner, and `deploy.yml` produces only a `github-pages` tarball.
Input is the **live** site: `--sitemap-url`, defaulting to
`https://scrimbaguide.tech/sitemap-index.xml`, exactly as `scripts/assert-sitemap-url.mjs`
already does against production in `deploy.yml`.

- **Detect `<sitemapindex>` vs `<urlset>` and recurse one level, then dedupe.** Both existing
  extractors (`generate-llms-from-sitemap.mjs:183`, `submit-indexnow.mjs:75`) are flat.
  Reusing either verbatim seeds the ledger with ~49 child-sitemap URLs instead of ~4,400
  pages, silently, with a green build.
- Retry each fetch up to 8x at 30s spacing (Pages CDN propagation), matching the existing
  key-file wait loop in `deploy.yml`.
- **Failure semantics: never an empty set.** A child sitemap that 404s or fails to parse means
  exit 1. Guard: if the discovered page count is below 90% of the previous ledger's `active`
  count, exit 1 **without writing the ledger**.
- Filter with `isLowValuePath(stripLocale(pathname))`, **never the raw pathname**. Every
  pattern in `LOW_VALUE_PATTERNS` is `^/`-anchored, so none of them match `/de/tags/`,
  `/ja/blog/page/2/` or `/ar/search/`. Tests must assert those three are filtered and
  `/de/docs/paths/` is not.
- Cross-check against `i18n/coverage.json`, regenerated in-workflow by
  `node scripts/build-coverage-manifest.mjs` (disk-derived, needs no build). A URL that should
  not exist in a locale is flagged as a **leak**, not silently inspected.
- **Reconciliation, every run.** A ledger URL absent from the current discovery set gets
  `status='gone'`, `nextDue=null`, and is excluded from every rollup and ratio. Records are
  retained 90 days so a bad deploy cannot lose history, then pruned. All counts filter to
  `status === 'active'`.
- Pre-Phase-3 note: `docusaurus.config.ts` sets `filename: 'sitemap.xml'`, and
  `sitemap-index.xml` does not exist until Phase 3. For the §11.7 baseline, fall back to
  `https://scrimbaguide.tech/sitemap.xml` when the index 404s.

**B. Sitemap submission.** Idempotent. `sitemaps.list` first; submit only what is missing or
whose `lastSubmitted` predates the current deploy. Submit the root `sitemap-index.xml` plus
each `/<locale>/sitemap.xml`, per the §11.0 encoding rule. Pruning a locale under §7 also
calls `sitemaps.delete` on that locale's sitemap.

**C. The URL Inspection sweep (the core).** 2,000/day forces prioritization.

| Priority | Class | Cadence |
|---|---|---|
| P0 | New URL, never inspected | Next run |
| P1 | Content changed. **v1 (decided): sitemap `<lastmod>` is newer than `ledger.lastInspected`.** Upgrade path once Phase 5 sidecars exist: the per-locale hash for this route differs from `ledger.sourceHash`. Both fields stay in the schema from day one so the swap is additive | Next run |
| P2 | Last verdict `FAIL`, or `coverageState` is a not-indexed state | Backoff 1d, 3d, 7d, 14d, 30d, then park (`nextDue = null`) |
| P3 | Money pages (`isMoneyPagePath(stripLocale(path))`) | Weekly |
| P4 | Everything else, indexed and healthy | Every 30 days, round-robin |

Budget: cap at **1,800/day**, leaving 200 headroom for ad-hoc runs. Throttle to ~8 req/s to
stay under 600/min. Round-robin across locales, driven by `i18n/locales.config.ts`, so one
large locale cannot starve the others.

`coverageState` is **free-text, not an enum** (confirmed in the discovery document), so match
tolerantly and always store the raw value. The states that matter:
`Submitted and indexed` (good), `Crawled - currently not indexed` (quality signal, do not
resubmit, fix the page), `Discovered - currently not indexed` (crawl-budget signal, worth a
ping), `Duplicate without user-selected canonical` and `Alternate page with proper canonical
tag` (**the i18n canary**, see §11.5), `Excluded by 'noindex' tag`, `Page with redirect`.

Enums that **are** fixed, so they can be matched exactly:
- `verdict`: `VERDICT_UNSPECIFIED | PASS | PARTIAL | FAIL | NEUTRAL`
- `indexingState`: `INDEXING_STATE_UNSPECIFIED | INDEXING_ALLOWED | BLOCKED_BY_META_TAG | BLOCKED_BY_HTTP_HEADER | BLOCKED_BY_ROBOTS_TXT`
- `robotsTxtState`: `ROBOTS_TXT_STATE_UNSPECIFIED | ALLOWED | DISALLOWED`
- `pageFetchState`: `PAGE_FETCH_STATE_UNSPECIFIED | SUCCESSFUL | SOFT_404 | BLOCKED_ROBOTS_TXT | NOT_FOUND | ACCESS_DENIED | SERVER_ERROR | REDIRECT_ERROR | ACCESS_FORBIDDEN | BLOCKED_4XX | INTERNAL_CRAWL_ERROR | INVALID_URL`
- `crawledAs`: `CRAWLING_USER_AGENT_UNSPECIFIED | DESKTOP | MOBILE`

**D. Notification.** IndexNow for every new or changed URL, on by default. Note
`submit-indexnow.mjs` currently accepts only `--sitemap`/`--sitemap-url` and always submits
everything it finds, so it must first gain a `--urls <file>` flag (newline-delimited, mutually
exclusive with the sitemap flags) reusing its existing batching, endpoint list, retry and
`INDEXNOW_REQUIRE_BING` handling. `notify.mjs` writes the changed set to a temp file and
invokes it; it must not re-implement IndexNow.

Indexing API strictly opt-in behind `--enable-indexing-api`, spending its 200 URLs/day only on
P0 and P1. Transport: `POST https://indexing.googleapis.com/batch`,
`Content-Type: multipart/mixed; boundary=...`, each part a `POST /v3/urlNotifications:publish`
with `{"url": "...", "type": "URL_UPDATED"}`. Hand-rolled multipart (there is no batch helper
for this API); single-call publishes are an acceptable simpler default. **Parse each part's
status independently: an outer 200 does not mean every part succeeded.**

**E. Reporting.** Per-locale rollup written to the state branch and posted as a **single
updating GitHub issue**. Identity resolution: read `${STATE_DIR}/issue.json` (`{"number": n}`);
if absent, 404, or closed, search open issues for title `[indexer] Coverage tracker` with body
marker `<!-- indexer-tracker -->`; if still none, create it and commit `issue.json` in the same
state commit. Only `indexer-report.yml` creates or edits it. Requires `GITHUB_TOKEN` and
`GITHUB_REPOSITORY`; exit 1 if unset.

### 11.4 State persistence and quota safety

`actions/cache` entries expire after 7 days and are evicted under pressure, so they cannot hold
a quota ledger. State lives on a dedicated **orphan branch `indexer-state`**.

**Branch layout: state files sit at the branch ROOT.** There is no `indexer-state/`
subdirectory inside the branch. The branch is checked out into the working tree at
`.indexer-state/`, which `.gitignore` already ignores so a local run can never be committed to
`main`.

```
(indexer-state branch root)
├── ledger.json
├── quota.json          # { "2026-08-09": { "urlInspection": 1743, "indexingApi": 0 } }  Pacific keys
├── issue.json          # { "number": 42 }
└── reports/YYYY-MM-DD.json
```

**Bootstrap (§11.7 step 0).** `actions/checkout` on a nonexistent ref hard-fails, so every
indexer workflow red-fails until the branch exists. Create it once:
`git ls-remote --exit-code --heads origin indexer-state` as a guard, else
`git checkout --orphan indexer-state && git rm -rf . &&` seed `ledger.json` (`{"version":1,"urls":{}}`),
`quota.json` (`{}`), `reports/.gitkeep`, commit, push.

**Access.** Every indexer workflow does two checkouts: the repo at `./`, plus
`actions/checkout` with `ref: indexer-state, path: .indexer-state, fetch-depth: 1`. All scripts
read a single `STATE_DIR` constant defaulting to `.indexer-state`, overridable with
`--state-dir`.

**Write path.** All writes go through `scripts/indexer/commit-state.sh`:
`git fetch origin indexer-state && git reset --hard origin/indexer-state`, then
**re-serialize in-memory state onto the refreshed files** (never re-apply a stale working
copy), commit, push. Retry up to 5x with jitter. Merge rule: per-URL last-write-wins keyed on
`lastInspected`. **`git push --force` and `--force-with-lease` are forbidden on this branch**:
a lost commit discards a day of quota accounting and lets the next run re-spend up to 1,800
inspections.

**Ledger schema (normative).** One schema, replacing the two inconsistent field lists in the
earlier draft:

```json
{ "version": 1, "updatedAt": "<ISO8601 UTC>",
  "urls": { "<absolute URL, trailing slash>": {
    "locale": "en",                  /* 'en' for root, never null */
    "routePath": "/docs/paths/",     /* locale-stripped, trailing slash */
    "status": "active",              /* 'active' | 'gone' */
    "firstSeen": "...", "lastInspected": "...|null",
    "nextDue": "...|null",           /* null = parked or gone; never scheduled */
    "priority": "P0|P1|P2|P3|P4",
    "failCount": 0,                  /* 0-5 */
    "sourceHash": "...|null", "deployedSha": "...|null",
    "verdict": null, "indexingState": null, "robotsTxtState": null,
    "pageFetchState": null, "crawledAs": null,
    "coverageState": null,           /* raw verbatim free text */
    "googleCanonical": null, "userCanonical": null, "lastCrawlTime": null,
    "sitemap": [],                   /* API field name is singular */
    "referringUrls": [],             /* cap 10 */
    "inspectionResultLink": null,
    "lastError": null                /* { at, status, reason } */
  } } }
```

**All ledger timestamps are ISO 8601 UTC. Only `quota.json` uses Pacific date keys.** An agent
that keys the ledger in Pacific "to match quota" computes wrong `nextDue` windows. Serialize
with keys sorted ascending and 2-space indent so the daily commit to a public branch produces
a readable diff. `ledger.mjs` is the **only** module that reads or writes the file; every other
module mutates through its exported helpers.

Rules that make this safe rather than merely automated:

- **Quota accounting is Pacific-time keyed**, because that is when Google resets. Deriving the
  day key from UTC double-spends quota once per day, every day.
- **Increment the counter before the call, not after.** A crash after a successful request must
  not free the quota back up. For batched Indexing API calls, increment by the batch's **URL**
  count (§11.2).
- **Persist on failure.** Wrap the sweep so a mid-run crash still commits partial progress;
  otherwise a failure at URL 1,900 replays 1,900 requests tomorrow.
- **Retry with exponential backoff plus jitter** per the §11.0 table.
- **Hard stop, not soft warn,** when the day's budget is exhausted. Exit 0 with a summary so a
  quota-exhausted run is not a red build.
- The branch is public (the repo is public). It holds only URLs and index states, no secrets.
  Keep it that way: never log the service-account email or a token into a report.

### 11.5 What this system is actually for (i18n tie-in)

Three failure modes from §7 are only detectable here, which is the argument for building it
before Tier A launches:

1. **R4, hreflang breakage.** `googleCanonical != userCanonical` on a locale URL, or a
   `coverageState` of `Alternate page with proper canonical tag` on a page that should be
   independently indexed, means Google is folding a translation into another page. That is
   invisible in the GSC UI at ~4,400 URLs and fatal to the whole program.
2. **R1, scaled content abuse.** A locale where `Crawled - currently not indexed` climbs while
   `Submitted and indexed` stalls is Google saying the translations are not worth indexing.
   **This is the tier gate's measurement instrument.**
3. **R2, index bloat.** Per-locale indexed-versus-submitted ratios feed the §7 kill criteria.

**The gate metric, with a valid data source.** This is the one number the whole program is
gated on, so its definition is normative:

- `submitted` per locale comes from `sitemaps.list` -> `sitemap[].contents[].submitted`.
  **Never read `contents[].indexed`.** Google's own reference marks that field
  *"Deprecated; do not use."* An agent reaching for it gets a permanently red or permanently
  green gate.
- `indexed` comes from the **ledger only**: rows with `coverageState === 'Submitted and
  indexed'`, counted over rows whose `lastInspected` is within 35 days. Staler rows are
  `unknown`, excluded from both numerator and denominator, and reported as a separate coverage
  figure beside the ratio.
- The weekly regression check is a **per-URL state-transition count** (rows that moved from
  indexed to not-indexed since the previous report), **never** a week-over-week delta of
  aggregate counts. P4 is "every 30 days, round-robin", so any given week's rows are roughly a
  quarter of the corpus and an aggregate delta would just measure which slice ran.
- The Tier B >90% gate additionally requires every URL in that tier's locales to have been
  inspected within 35 days. Otherwise report `insufficient data` and refuse to evaluate.

**GSC removed the International Targeting report in September 2022**, so there is no
first-party hreflang validation left. Between this system and the Phase 2 CI assertions, that
gap is covered.

### 11.6 GitHub Actions workflows

Four workflows, deliberately separate because they have different failure semantics. Mixing
them makes a quota exhaustion look like a deploy failure.

| Workflow | Trigger | Does |
|---|---|---|
| `indexer-submit.yml` | `workflow_run` on Deploy completion | Discover from the live sitemaps, reconcile the ledger, submit sitemaps (B), IndexNow the changed set (D), enqueue new/changed as P0/P1. A few minutes. |
| `indexer-sweep.yml` | `schedule: '17 4 * * *'` + `workflow_dispatch` | The daily URL Inspection sweep (C) within the 1,800 budget. Commits ledger + quota. |
| `indexer-report.yml` | `schedule: '0 9 * * 1'` + `workflow_dispatch` | Weekly per-locale coverage report (E), updates the tracking issue. Fails only on a real regression per the transition-count rule in §11.5. |
| `indexer-manual.yml` | `workflow_dispatch` with inputs `urls`, `locale`, `priority`, `enable_indexing_api` | Targeted reindex after a content fix. The "reindex now" button. |

**The `workflow_run` trigger, verbatim, because a name mismatch fails silently:**

```yaml
on:
  workflow_run:
    workflows: ["Deploy to GitHub Pages"]   # MUST equal deploy.yml `name:` byte-for-byte
    types: [completed]
```

plus a job-level guard:

```yaml
if: github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_branch == 'main'
```

There is no `successful` activity type (only `requested | in_progress | completed`), so the
`conclusion` guard is mandatory. A `workflows:` name mismatch never fires **and never errors**.
`workflow_run` only fires from the default-branch copy of the workflow, so it cannot be tested
from a feature branch. Renaming `deploy.yml`'s `name:` requires updating this filter in the
same commit.

**Commit identity.** `indexer-submit.yml` checks out `${{ github.event.workflow_run.head_sha }}`
explicitly, never implicit HEAD. Under `workflow_run`, `GITHUB_SHA` is "last commit on the
default branch", and the deploy path is multi-minute (`deploy.yml` sleeps 60s then retries
8x30s). Without the explicit SHA, a push inside that window makes the job hash content that is
not live, write the new `sourceHash`, and the page is never re-enqueued as P1 for up to 30
days. Store `deployedSha` beside `sourceHash`; if it is not an ancestor of `head_sha`, emit
`::warning::` and re-hash.

**Concurrency: all four workflows declare this block byte-identically.**

```yaml
concurrency:
  group: indexer-state
  cancel-in-progress: false
```

Cross-workflow serialization on one literal group is the point, so **do not interpolate
`${{ github.workflow }}`**. `indexer-report.yml` writes the state branch and
`indexer-manual.yml` spends quota, so both need it too. Note GitHub's queue depth is 1: a
pending run can be superseded, so `indexer-sweep.yml` additionally asserts freshness. If
`quota.json` has no committed record for either of the last two Pacific days, emit
`::warning::` and have `report.mjs` flag `sweep_missed_days`.

Other notes:

- `permissions: { contents: write }` for the state branch, plus `issues: write` only on
  `indexer-report.yml`. `indexer-submit.yml` needs neither the build tree nor the Pages
  artifact, so it never needs `actions: read`.
- Validate all four files with `actionlint` in CI. An unrecognized `concurrency` key is a
  parse-time failure, not a runtime one.
- Cron on a public repo is free, but **GitHub disables scheduled workflows after 60 days of
  repository inactivity** and can delay cron by 10+ minutes under load. Mitigation: the ledger
  makes runs idempotent and a skipped day just shifts the round-robin, so the only real
  requirement is the `sweep_missed_days` flag above. If the repo genuinely goes quiet for 60
  days, re-enable from the Actions tab.
- Keep all of this decoupled from `deploy.yml`. The existing `indexnow` job there stays as the
  fast-path ping; `indexer-submit.yml` is the bookkeeping layer on top. Do not merge them, or a
  quota problem turns every deploy red.
- Tests in `scripts/indexer/__tests__/*.test.mjs` via `node --test`. Cover: Pacific-day
  rollover, priority ordering, budget cap, the error-classification table, `coverageState`
  classification, sitemap-index recursion (a root index with two child urlsets must yield page
  URLs, not child-sitemap URLs), and locale-prefixed low-value filtering.

### 11.7 Build order

- [ ] **Step 0: bootstrap the `indexer-state` orphan branch** (§11.4). Everything else
      red-fails until it exists.
- [ ] `auth.mjs` (§11.0 contract) + `quota.mjs` + `ledger.mjs`, with tests. No API calls yet.
- [ ] `discover.mjs` (live sitemaps + recursion + reconciliation) + `sitemaps.mjs`. Verify
      against the live property in dry-run mode.
- [ ] `inspect.mjs` with `--dry-run` and `--limit`, then a real 50-URL run to confirm shape
      against a captured fixture.
- [ ] Seed the ledger with a full baseline sweep of the current ~190 English URLs. Fits in one
      day's quota with room to spare, and becomes the pre-i18n baseline §6 needs.
- [ ] `report.mjs` + the tracking issue.
- [ ] The four workflows: `workflow_dispatch` first, cron enabled last.
- [ ] `notify.mjs`, including the `--urls` flag on `submit-indexnow.mjs`. Indexing API path off
      by default.
- [ ] Rotate the service account key.

**Skills:** `seo-audit` (interpreting coverage states and turning the report into a fix list),
`analytics-tracking` (joining Search Analytics onto the ledger so "indexed" can be checked
against "actually gets impressions", which is the only definition of indexed that matters).

---

## 12. Search: migrate to Pagefind

**Decision: replace `@easyops-cn/docusaurus-search-local` with [Pagefind](https://pagefind.app).**
Fully static, no hosted service, no API key, no vendor. This supersedes the earlier
suggestion of Algolia DocSearch.

### 12.1 Why Pagefind and not the alternatives

| Option | Static? | Per-language index | Verdict |
|---|---|---|---|
| **Pagefind** | Yes, prebuilt binary index + WASM runtime | **Automatic**, from `<html lang>` | **Chosen.** The only option that does per-language splitting without being told to. |
| `@easyops-cn` (lunr) | Yes | Manual `language: []`, one monolith per build | Current. 7.8 MB monolith the browser must fully download before the first keystroke. |
| Orama | Yes, but in-RAM | Manual, monolithic | Nice API and vector search, but the client downloads the whole index. Same failure mode as lunr at our size. |
| FlexSearch / MiniSearch / Fuse | Yes | None built in | Would need us to build the multilingual layer ourselves. |
| Algolia DocSearch | **No** (hosted) | `contextualSearch` | Ruled out: user requires static. |

The decisive mechanic: **Pagefind shards its index into many small binary chunks and the
browser fetches only the chunks a query touches.** Initial load is roughly 30 KB (WASM
runtime plus a manifest) against lunr's 7.8 MB monolith. That is what turns B2 from a
1 GB-cap blocker into a non-issue.

### 12.2 The multilingual mechanic (exactly what was asked)

Verified against Pagefind's multilingual docs:

1. **At index time** Pagefind reads the `lang` attribute on each page's `<html>` element and
   **builds an independent index per detected language.**
2. **At query time** the browser reads the same `lang` attribute and loads **only that
   language's index.** A visitor on `/de/` searches German pages only, with no
   cross-language pollution and no German user paying for the Japanese index.
3. `force_language` collapses everything into one index. **Do not use it here.**

This is a near-perfect fit for our architecture, because Docusaurus already sets
`<html lang>` from `localeConfigs[locale].htmlLang`. **The language splitting therefore
requires zero configuration on our side.** It also means Pagefind should run **once over the
merged tree** in the Phase 3 `assemble` job, not once per locale build: one invocation,
48 language indexes, no locale wiring.

One consequence to respect: `htmlLang` must be the plain language subtag wherever we do not
genuinely want a separate index. `pt-BR` and `pt-PT` as distinct `htmlLang` values give two
separate Portuguese indexes, which is correct for us since the copy differs. But
`en` versus `en-US` inconsistency would silently fragment the English index, so `htmlLang`
values need one audit pass.

### 12.3 Language support across our roster

Pagefind ships UI translations for 50+ languages and Snowball stemming for ~30.

| Support level | Roster locales |
|---|---|
| **Stemming + UI** (best) | `ar de el es fi fr hi hu id it nl pl pt ro ru sr sv ta tr da nb` |
| **Stemming, no UI translation** | `et ga lt` (UI falls back to English; supply our own strings) |
| **Segmentation, no stemming** (correct for these scripts) | `ja zh` (requires the **extended** release) |
| **UI only, no stemming** | `bn cs fa he hr ko th uk vi` |
| **Not in Pagefind's table** | `bg sk sl lv mt is sq mk ur mr te` |

Unlisted languages still index and search; they just get no stemming and an English UI.

Versus the current lunr setup this is a **net gain**: Pagefind adds stemming for `pl`, `et`,
`lt`, `ga`, `id`, and `sr` (`pl` matters, it is a large dev market) and gives materially
better CJK segmentation than lunr's `tinyseg`. It loses stemming for `he`, `ko`, `th`, `vi`,
and `te`, all of which are Tier E. Given that Pagefind also fixes the size blocker, the
trade is clearly worth it.

- [ ] **Use the extended release** (`pagefind_extended`, the npx default) for `ja`/`zh`
      segmentation. Note it is a larger binary; it is a build-time cost only and never
      reaches the browser.
- [ ] Supply UI strings for `et`, `ga`, `lt` via Pagefind's translation option, sourced from
      the same per-language skill that translates the rest of that locale (§13).

### 12.4 Migration cost, stated honestly

There is **no official Docusaurus Pagefind plugin** (the upstream request,
facebook/docusaurus#10290, was closed as not planned), so this is a custom integration.
It is small, and this repo already has the exact pattern in
`plugins/normalize-canonical-urls/index.js`.

- [ ] `plugins/pagefind/index.js`: a `postBuild` plugin shelling out to
      `npx pagefind --site <outDir>`, mirroring the existing postBuild plugin.
      **It must no-op when `SKIP_PAGEFIND === '1'`.** A registered postBuild plugin also runs in
      every matrix `build-locale` job, so without the gate the merged tree gets up to 48
      per-locale `pagefind/` directories on top of the merged index, recreating the B2 size
      problem this migration exists to fix. See Phase 0b for the full sequence.
- [ ] Replace the three existing swizzles: `src/theme/SearchBar/`,
      `src/theme/Navbar/Search/`, `src/theme/SearchPage/` (`index.js`, `SearchPage.jsx`,
      `SearchPage.module.css`). Pagefind ships `@pagefind/default-ui`, but we have a custom
      search modal and a styled `/search/` page, so wrap Pagefind's JS API and keep our UI.
- [ ] Rewrite `scripts/__tests__/search-modal.test.mjs` (`npm run test:search`).
- [ ] Keep `/search/` as a real crawlable route. It is referenced by the `WebSite`
      `SearchAction` JSON-LD in `docusaurus.config.ts`, whose `target` must become
      locale-aware (`/{locale}/search/?q=`).
- [ ] Remove `@easyops-cn/docusaurus-search-local` and its `themes` entry.
- [ ] Measure the resulting index size per language in the Phase 0 two-locale spike, and
      feed the real number into the B1 budget rather than trusting an estimate.

### 12.5 Bonus: it fixes an accessibility and a11y-test dependency

`src/clientModules/a11yFixes.ts:86,103` exists to patch the current search page's
accessibility. Verify whether those patches are still needed after the swap, and delete them
if not. `npm run test:a11y` should cover the new search UI in both `en` and `ar`.

---

## 13. Per-language translation skills

The requirement: **one skill per target language**, grounded in research rather than
intuition, so translation output is reliably good instead of plausibly good.

### 13.1 Architecture: one core skill plus thin per-language profiles

47 fully independent skills would drift and duplicate. Instead:

```
.claude/skills/
├── translate-content/          # THE CONTRACT (§4 Phase 5): repo mechanics, frontmatter,
│   │                           # JSX, anchors, affiliate integrity, QA gate.
│   │                           # Language-agnostic. One file to change when the repo changes.
│   └── references/
│       ├── mqm-rubric.md       # shared scoring rubric (§13.3)
│       ├── workflow.md         # shared translate/reflect/refine loop (§13.4)
│       └── glossary.csv        # shared do-not-translate list
└── translate-<lang>/           # ONE PER LANGUAGE: linguistics + market only.
    └── SKILL.md                # never repeats repo mechanics
```

A translation job loads **`translate-content` plus exactly one `translate-<lang>`**. Repo
rules live in one place; language knowledge lives in 47 small, independently improvable
files.

**Skill-name casing, because the obvious names are invalid.** Skill names must match
`^[a-z0-9-]+$`, so `translate-pt-BR` and `translate-zh-Hans` would be rejected. The mapping: the
skill directory and its frontmatter `name` use the locale tag **lowercased, region retained**
(`translate-pt-br`, `translate-zh-hans`, `translate-pt-pt`, `translate-nb`), while the Docusaurus
locale tag keeps its canonical casing (`pt-BR`, `zh-Hans`) everywhere else. Each
`translate-*/SKILL.md` states its canonical locale tag on the first body line so the mapping is
never ambiguous. Validate with skill-creator's `quick_validate.py` before commit. When `check:content` changes, one file changes. When we learn that German compound
nouns are wrecking our H2s, one file changes.

### 13.2 What every `translate-<lang>/SKILL.md` must contain

Eight sections, same shape every time, so the files are diffable and reviewable:

1. **Register decision, with justification.** Not just "use `du`" but why, given a
   developer-learning audience and the competitor set. This is the highest-leverage single
   line in the file, because register drift across 200 pages is the clearest machine-output
   tell.
2. **Typographic and orthographic rules, written as testable assertions** so they can be
   promoted into `check:content`. Examples of the level of specificity required:
   - `fr`: narrow no-break space (U+202F) before `? ! ; :` and inside `« »`; French quotes
     not `" "`.
   - `de`: `„ "` quotes; capitalised nouns; ß versus ss per Swiss variant.
   - `es`: opening `¿` and `¡` are mandatory.
   - `ja`: full-width `、。` never `, .`; no space around parentheses; `です・ます` throughout.
   - `ar`: Arabic comma `،` and semicolon `؛`; ASCII digits (not Eastern Arabic-Indic) for
     version numbers and durations to match the code they sit beside.
   - `el`: final sigma `ς` word-final only; no accent on monosyllables.
   - `tr`: the dotted/dotless i casing trap. `title` casing "IT" to "ıt" is a real,
     silent corruption.
   - `pl`, `cs`, `hr`, `sl`, `sk`, `lt`, `lv`, `et`, `hu`, `ro`, `fi`: case-governed noun
     forms mean **UI strings cannot be assembled from fragments**. Any interpolated string
     must be translated whole, per grammatical case.
   - `th`, `ja`, `zh`: no inter-word spaces, so line-breaking and truncation rules differ
     (ties into the Phase 4 CSS work).
   Source these from CLDR (plural rules, number/date/currency patterns, capitalisation
   `contextTransforms`) rather than inventing them.
3. **Morphosyntactic hazards for the EN to X direction.** German verb-final subordinate
   clauses and compound nouns that break H2 length budgets. Turkish and Finnish
   agglutination inflating string length. Arabic dual number and non-concatenative
   morphology. Slavic aspect pairs. Japanese topic versus subject marking. Each with the
   concrete failure it causes in our layout or our meaning.
4. **Length expansion factor**, measured not guessed, feeding the per-locale
   `toSeoTitle()` budget (C5) and the meta-description budget. German and Finnish run long;
   Japanese and Chinese run short in character count but wide in SERP pixels.
5. **Search behaviour in this market.** The actual query patterns, which is what makes this
   an SEO skill and not a translation skill: `de` "Erfahrungen"/"Test", `fr` "avis",
   `ja` "評判"/"口コミ", `pt-BR` "vale a pena", `es` "opiniones", `tr` "yorumlar",
   `ru` "отзывы". Plus the local competitor set for §4 Phase 7.
6. **Language-specific translationese markers.** See §13.5. These are the automatable ones.
7. **Known LLM failure modes for this pair**, accumulated from real review findings. This
   section starts empty and grows. It is the compounding asset in the whole system.
8. **Sign-off criteria**: the MQM threshold for this language and who or what can clear it.

### 13.3 Quality rubric: MQM, not vibes

Score with **MQM (Multidimensional Quality Metrics)**, the framework stewarded by the MQM
Council, aligned with **ISO 5060**, and used as the human-evaluation standard at WMT. It
replaces "does this read okay" with a countable error rate.

Top-level error categories, applied per page:

| Category | Sub-types we care about |
|---|---|
| **Accuracy** | Mistranslation, Omission, Addition, Untranslated text |
| **Fluency** | Grammar, Spelling, Punctuation, Register, Inconsistency, Character encoding |
| **Terminology** | Glossary violation, inconsistent term use |
| **Style** | Awkward, unidiomatic, translationese |
| **Locale** | Number/date/currency format, typographic convention |
| **Non-translation** | Segment is unusable |

Severity weights, per the MQM scoring models: **Minor = 1, Major = 5,
Non-translation = 25**, with negligible-weight minor punctuation at 0.1.

**Proposed gate:** a page ships when its MQM error score is under **5 points per 1,000
words**, with **zero Major Accuracy errors** and **zero Terminology violations** (glossary
compliance is binary, not weighted, because a mistranslated affiliate CTA or a wrong course
name is a commercial error, not a stylistic one).

**The denominator is English source words, identical for every locale.** Without pinning this,
two judges score the same page differently, and a target-word denominator would need a
segmenter for `ja`/`zh`/`th` that nothing here defines. Counted by `scripts/mqm-wordcount.mjs`:
strip frontmatter, fenced and inline code, JSX tags **and all attribute values**, then count
whitespace tokens. Record `sourceWords` in the status sidecar so any score is reproducible.

Calibrate on the first 20 `es` pages, then freeze per tier: strict for Tier A money pages,
looser for Tier D catalog leaves. The calibration must **also** set a **minimum absolute error
budget per page**, or a 300-word practice page fails on a single Minor error while a 2,400-word
comparison page absorbs twelve.

### 13.4 Workflow: translate, reflect, refine

Adopt the **reflection pattern** from Andrew Ng's `translation-agent`: translate, have the
model critique its own output against explicit criteria, then revise using the critique.
Layered onto our repo contract:

1. **Translate** with the glossary and the per-language profile injected in the prompt.
2. **Reflect** against the MQM categories, the register decision, and the typographic
   assertions. Critique only; produce no new translation.
3. **Refine** using the critique.
4. **Verify mechanically**: JSX/prop integrity, anchors, affiliate params, `check:content`,
   locale build green. Deterministic, no model judgment.
5. **Judge** with a separate model instance that never saw the drafting context, scoring
   MQM cold. Independence matters; a reviewer holding the drafting context rationalises.

**The failure ladder, because the loop above has no exit.** §13.3 defines a pass threshold and
the loop defines refinement, but with invariant #4 ("ships complete or not at all") and Phase 6
item 4 ("100% coverage"), a page the judge fails twice has **no legal state**: it cannot ship,
cannot be dropped without breaking 100%, and cannot fall back to English. R7's "do not launch
that locale" is a locale-level decision, not a per-page one, so an unattended run deadlocks.

1. Attempt 1: translate, reflect, refine.
2. Attempt 2: refine again with the judge's error list injected verbatim.
3. Attempt 3: re-translate from source, with the accumulated errors appended to that language
   skill's §13.2 section 7 ("Known LLM failure modes").
4. After three failures: record `state: 'blocked'` in the status sidecar with the MQM report and
   **automatically drop that route from the locale's coverage manifest** (so it leaves hreflang,
   leaves the sitemap, and never renders an English fallback). Continue with the remaining pages.

**There is no human branch**, because §18 decision 6 rules out manual review. The launch gate is
therefore numeric: **a locale does not launch if more than 10% of its declared routes ended up
dropped.** Below that threshold it launches with a smaller manifest, which is legitimate; above
it, the pipeline is failing on that language and the locale is held. §5 invariant #4 already
reads "complete **relative to its coverage manifest**", which is what makes auto-drop safe.

Two honest caveats worth writing into the skill:

- Ng reports the reflection workflow is "sometimes competitive with, and sometimes worse
  than, commercial providers" on BLEU. **Reflection is not a guarantee.** It is why step 5
  is a separate cold judge and why §13.5 adds a non-model check.
- Research on terminology-aware translation shows glossary injection plus constrained
  decoding measurably reduces meaning-altering deviation. **Glossary injection is doing more
  work here than any amount of prompt polish.** Invest in `glossary.csv`.

### 13.5 The automated translationese check (the part most programs skip)

**This check is mandatory and load-bearing, not optional.** Under §18 decision 6 nothing is
proofread before publishing, so the JSD score is the **only** pre-publish quality signal that is
independent of the model doing the grading. If it is not built, the program has no pre-publish
quality gate at all. See §7.1.

Research finding worth building on: translated text is **reliably machine-distinguishable**
from natively written text using shallow features (function-word frequencies, part-of-speech
perplexity, mean word length, syllable ratio, character n-grams), and such classifiers
**outperform professional human translators** at the task. Separately, "Lost in Literalism"
(arXiv:2503.04369) shows supervised training actively pushes LLMs toward literalism, so this
is the expected failure mode, not an edge case.

That means our best defence against R1 is **not** another LLM opinion. It is a cheap
statistical check:

A metric tracked for drift is meaningless without a frozen definition, and `ja`/`zh-Hans`/`th`
have no whitespace tokens at all, so the contract is specified here rather than left to the
implementer:

- [ ] **Tokenizer:** `new Intl.Segmenter(locale, {granularity: 'word'})`, keeping `isWordLike`
      segments, lowercased. Segments `ja` and `th` correctly on Node 22 and adds no dependency.
- [ ] **Feature set:** the 150 most frequent types in that locale's native profile, **derived,
      not curated**. Hand-curating a function-word list per language for 47 languages is not
      going to happen and would not be reproducible.
- [ ] **Statistic:** **Jensen-Shannon divergence** between the page's 150-dimension
      relative-frequency vector and the profile.
- [ ] **Threshold: empirical, not a magic number.** Bootstrap 2,000 length-matched contiguous
      samples from the reference corpus, and flag pages above the **95th percentile** of that
      null distribution. Store both `p50` and `p95` in the profile so a score is reproducible
      later.
- [ ] `scripts/translationese-check.mjs` writes `i18n/translationese-report.json`. Flagged pages
      get escalated review; the rest pass.
- [ ] **The tracked metric is the per-locale median JSD**, and the alarm is a **>20% rise versus
      the previous run**. A locale whose median JSD is drifting up is a locale about to get hit
      by the scaled-content-abuse policy, and this gives weeks of warning ahead of the §11.5
      indexing signal.

**Reference corpus handling, and the licensing trap.** The corpus was described as "scraped from
local dev blogs and the local competitor's own marketing copy", with no size floor and no
statement about storage. **This repo is public**, so committing that scrape would republish
third-party copy at scale, in the section whose entire purpose is avoiding a scaled-content
penalty.

- [ ] Sources are read from a local **gitignored** cache. **Never commit corpus text.**
- [ ] Commit only `i18n/native-profiles/<locale>.json`:
      `{locale, tokenCount, topTypes: [{token, relFreq}] x150, bootstrapNull: {p50, p95},
      sources, builtAt}`. Roughly 10 KB per locale.
- [ ] **Minimum 300k tokens per locale**, or refuse to build the profile rather than shipping a
      noisy baseline. Prefer openly licensed sources (Wikipedia dumps, CC-licensed dev blogs,
      government/EU parallel corpora).
- [ ] Competitor marketing copy is read for §4 Phase 7 research and **not stored**.

This pairs with §11.5: the translationese score is the **leading** indicator, and
`Crawled - currently not indexed` is the **lagging** one. Having both is the difference
between diagnosing a quality problem and discovering it.

### 13.6 Build order

- [ ] `translate-content` core skill (§4 Phase 5), including `mqm-rubric.md`,
      `workflow.md`, `glossary.csv`.
- [ ] `translate-es` as the reference implementation. Write all eight sections properly,
      translate 20 pages, calibrate the MQM threshold, then treat this file as the template.
- [ ] `translate-ja` and `translate-ar` next, because they stress the format hardest
      (script, register, directionality) and will expose anything the template is missing.
- [ ] Then `translate-pt-BR`, `translate-fr`, `translate-de` to complete Tier A.
- [ ] Tier B and beyond: one skill per language, authored just before that locale's
      translation run, never in bulk up front. A skill written 18 months before use is a
      skill nobody validated.
- [ ] `scripts/translationese-check.mjs` plus one native reference corpus per Tier A
      language.

**Skills used to build these skills:** `example-skills:skill-creator` for the scaffolding,
`customer-research` for the per-market search-behaviour and competitor sections,
`humanizer` as the model for §13.5 (it is the English-language version of exactly this
check), `copy-editing` for the register and style sections, `ai-seo` and `content-strategy`
for the keyword-behaviour research.
---

## 14. Task manifest (machine-readable)

Everything above is prose checkboxes, which a human reads fine and a fan-out cannot. Before any
ultracode run, `plan/tasks.json` must exist, with one record per work unit, mirrored as a table
in this section so the two cannot silently diverge.

```json
{ "id": "P1-locale-path-util",
  "phase": 1,
  "title": "localePath.ts + strip locale prefix in 10 path predicates",
  "files_owned": ["src/utils/localePath.ts", "src/utils/moneyPagePaths.ts",
                  "src/components/RelatedGuides.tsx", "src/content/relatedGuidesMap.ts"],
  "files_touched_readonly": ["config/metadata.ts"],
  "depends_on": ["P0-hosting-decision", "P1-locales-config"],
  "blocks": ["P2-coverage-manifest"],
  "acceptance": ["npm run typecheck",
                 "node --test scripts/__tests__/localePath.test.mjs",
                 "grep -rn \"window.location.pathname\" src | grep -v stripLocale | wc -l == 0"],
  "parallel_safe": true,
  "human_decision": false }
```

**The rule that makes parallelism safe: `files_owned` sets are disjoint across any units that
can run concurrently, and a unit may never edit a file it does not own.** A unit needing a
change in someone else's file either declares a dependency or the two units merge. There is no
third option, because two agents editing one file in one checkout is how this program produces
a corrupted plan rather than a shipped one.

`human_decision: true` marks a unit that cannot start until a §18 decision is answered. The
runner must refuse to schedule those.

---

## 15. Ownership, dependency graph, and the `docusaurus.config.ts` hotspot

### 15.1 The hotspot

**Six work units edit the 618-line `docusaurus.config.ts`:**

| Unit | What it changes |
|---|---|
| Phase 1 (C7) | locale-aware `themeConfig.metadata` |
| Phase 2 | per-locale `exclude` arrays + the coverage plugin registration |
| Phase 3 | `i18n.localeConfigs` (the `baseUrl` work) |
| Phase 4 | per-script font `headTags` |
| Phase 8 | the switcher navbar item |
| §12.4 | remove the `themes` entry, make `SearchAction` locale-aware |

- [ ] **Split it in Phase 1**, before anything else touches it: extract `config/i18n.ts`,
      `config/metadata.ts`, `config/fonts.ts`, `config/sitemap.ts`, `config/search.ts`, so
      Phases 2/3/4/8 and §12 each own exactly one file. **If that split is rejected, then all
      config edits become a single sequential unit** and lose their parallelism. Those are the
      only two valid options.

### 15.2 Three more file collisions

| File | Colliding units | Resolution |
|---|---|---|
| `src/theme/SearchPage/SearchPage.module.css` | Phase 4 converts to logical properties; §12.4 replaces the file wholesale | **§12 (Phase 0b) runs first**, Phase 4 then converts whatever Pagefind's UI leaves behind |
| `src/clientModules/a11yFixes.ts` | Phase 1 C4 edits lines 86 and 103; §12.5 may delete those patches entirely | **§12.5 runs first**, Phase 1 C4 then edits only what survives |
| `scripts/check-content.mjs` | Phase 1 adds `i18n/**` scope + currency + affiliate rules; §13.2 wants per-language typographic assertions | **All rule additions land as one Phase 1 unit.** §13.2 supplies config data (`check-content.config.json`), never code |

### 15.3 Hard orderings

```
P0 hosting decision ──► P3 deploy gate
P0b Pagefind ─────────► P4 RTL CSS  (and ──► P1 C4 a11y edits)
P1 locales.config ────► P1 localePath ──► P2 coverage manifest ──► P3 matrix build
P2 coverage manifest ─► P4 RTL (needs I18N_COVERAGE=full escape hatch)
P1 anchor freeze ─────► P5 skill authoring ──► P6 translation
P2 + P3 ──────────────► §11 indexer (needs sitemap-index.xml to exist)
Decision 2 (Core set) ► P2 tiers.json  [BLOCKING, human]
```

Phases 0b, 1, and the §11 script modules that touch no site files (`auth.mjs`, `quota.mjs`,
`ledger.mjs`) are the only things startable on day one.

### 15.4 Build isolation for parallel locale builds

- [ ] **Any parallel `docusaurus build --locale` runs in its own `git worktree` with an explicit
      `--out-dir`.** `generatedFilesDir` is `<siteDir>/.docusaurus` and is **not** locale-scoped,
      and `buildLocale` clears `outDir` before writing. Two concurrent locale builds in one
      checkout clobber each other nondeterministically, which in CI reads as a flaky build and in
      an ultracode run reads as a mysteriously empty locale.
- [ ] The CI matrix already satisfies this (one runner per locale). The rule exists for local
      and agent-driven runs, where one checkout is the default.

---

## 16. Acceptance criteria

### 16.1 The "byte-identical English site" gate was false. Use this instead.

Phase 1 and §10 previously claimed zero change to English output. That is provably wrong on the
plan's own terms: `theme-classic/SiteMetadata` **already** emits `og:locale` from
`currentHtmlLang`, so deleting the hardcoded `en_US` changes every page's head from two tags
(three on blog posts) to one; C2 changes `inLanguage` from `en-US` to `en`; and every TS/TSX edit
rehashes `assets/js/*`. An agent handed an impossible gate either stalls or quietly discards it,
and discarding it loses the real signal.

**Allowed-delta list for the Phase 1 commit.** Exactly these, nothing else:

1. Exactly one `og:locale` per page, where there were two (three on blog posts).
2. `inLanguage` changes from `en-US` to `en`.
3. `assets/js/*` content hashes change.
4. **No other head tag, JSON-LD field, or rendered-text change.** A structured head-diff over the
   built tree against a committed baseline is the proving artifact.

### 16.2 Per-phase criteria

| Phase | Verify commands | Allowed deltas | Proving artifact |
|---|---|---|---|
| 0 | none (decision only) | none | decision recorded in `CLAUDE.md` + spike measurements (bytes **and** file count) |
| 0b Pagefind | `npm run build && npm run test:search && npm run test:a11y` | search UI replaced; `search-index.json` gone; `pagefind/` present once | per-language index sizes; `/search/` still crawlable |
| 1 | `npm run typecheck && npm run check:content && npm run build && npm run test:llms` | §16.1 list only | head-diff vs baseline; `grep` assertions in §14 `acceptance` |
| 2 | `npm run build` (en) + `npx docusaurus build --locale ar` with a fixture manifest; `node --test scripts/__tests__/hreflang.test.mjs scripts/__tests__/coverage-closure.test.mjs` | hreflang set changes from all-locales to manifest-driven | `coverage.json` + a passing closure test per tier |
| 3 | full matrix build + `assemble` | per-locale `baseUrl`; `sitemap-index.xml` appears | two-axis gate passes (bytes + file count); `en` still served at `/` |
| 4 | `I18N_COVERAGE=full npx docusaurus start --locale ar`; `npm run test:a11y` (en + ar) | RTL CSS only | the four done-assertions in Phase 4 |
| 5 | `node --test` over the new checker scripts | new skill files only | `jsx-integrity.mjs` and `glossary-check.mjs` both fail a deliberately corrupted fixture |
| 6 | per-file gate, then the per-locale barrier (§4 Phase 5 item 9) | one locale's content | zero `blocked` pages; barrier build green |
| §11 | `node --test scripts/indexer/__tests__/*.test.mjs`; dry-run against the live property | state branch only | a baseline sweep of ~190 URLs inside one day's quota |

**Every phase also has an abort criterion:** if its verify set is still red after two full
attempts, stop, leave the working tree on a branch, and report. Do not partially land a phase,
because §14's ownership model assumes a unit either completed or never ran.

---

## 17. State-file registry

Every generated or committed data file in the program, with its single owner. This table is the
structural defence behind five separate review findings, all of which were two agents inventing
two schemas for one file.

| File | Owner script | Writers | Committed? |
|---|---|---|---|
| `i18n/locales.config.ts` | hand-authored | 1 (human) | yes |
| `i18n/tiers.json` | hand-authored | 1 (human) | yes |
| `i18n/coverage.json` | `scripts/build-coverage-manifest.mjs` | 1 | **no** (generated in `prebuild`) |
| `i18n/<locale>/.status/*.json` | the translating agent | 1 per file, sharded | yes |
| `i18n/translation-status.json` | `scripts/translation-status.mjs` (sole reducer) | 1 | **no** (generated) |
| `i18n/native-profiles/<locale>.json` | `scripts/build-native-profile.mjs` | 1 | yes (profile only, **never corpus text**) |
| `i18n/translationese-report.json` | `scripts/translationese-check.mjs` | 1 | no |
| `data/i18n/<locale>/courses-strings.json` | translating agent; stubs from `build-data.mjs` | 1 | yes |
| `data/i18n/<locale>/units.json` | translating agent | 1 | yes |
| `.indexer-state/ledger.json` | `scripts/indexer/ledger.mjs` (sole reader/writer) | 1 | yes, on `indexer-state` branch |
| `.indexer-state/quota.json` | `scripts/indexer/quota.mjs` | 1 | yes, on `indexer-state` branch |
| `.indexer-state/issue.json` | `scripts/indexer/report.mjs` | 1 | yes, on `indexer-state` branch |
| `.indexer-state/reports/*.json` | `scripts/indexer/report.mjs` | 1 | yes, on `indexer-state` branch |
| `plan/tasks.json` | hand-authored | 1 (human) | yes |

**Rule: exactly one writer per file, named here.** Any new state file must be added to this
table in the same commit that creates it.

---

## 18. Decisions required before launch

These are judgment calls, not things an implementing agent can derive. Each one blocks specific
work, noted inline.

1. **Hosting. DECIDED: Cloudflare Workers Static Assets, Paid.** See §4 Phase 0c for the
   migration and cutover checklist. **The domain is already on Cloudflare DNS with the proxy
   enabled, in this same account**, so there is no nameserver change and no propagation window;
   the cutover is a Workers Custom Domain attach. The reasoning, with verified numbers:
   - GitHub Pages: **1 GB total, no file cap.** The roster projects to ~800 MB, which fits today
     but leaves ~20% headroom against Phase 7 content growth. It breaches on bytes within a year.
   - Cloudflare **Free** (Pages or Workers Static Assets): **20,000 files.** The roster projects
     to ~22,200 files, so Free breaches on file count. Dead.
   - Cloudflare **Paid**: **100,000 files, 25 MiB per asset, no total-size cap.** ~22% utilised.
     The only option with real headroom on both axes.
   - Workers Static Assets rather than Pages, because `~/use-apify/wrangler.json` already uses
     that model. Limits are identical between the two products.
   - Trailing-slash behaviour is **aligned, not risky**: `html_handling` defaults to
     `auto-trailing-slash`, which serves `foo/index.html` at `/foo/`, matching
     `trailingSlash: true`. Verified 2026-08-09.
   - **Note the coupling:** Pagefind trades bytes for file count (adds ~4,300 files, removes
     ~370 MB). On a byte-capped host that is a pure win; on Cloudflare Free it is actively
     harmful. The search and hosting decisions are not independent.
2. **Core route set. DECIDED 2026-08-09: Core-40 plus Micro-16**, enumerated in
   `i18n/tiers.json` and explained in §2.1. All 40 routes were validated against the live
   sitemap. *Unblocks:* Phase 2 and §13.6. Revisit the comparison and blog picks once Tier A
   returns real per-market SERP data (§13.2 item 5).
3. **P1 change-detection. DECIDED 2026-08-09: sitemap `<lastmod>` now, content hash later.**
   Ship the indexer against `<lastmod>` vs `ledger.lastInspected` so §11 has no dependency on
   the translation system and the pre-i18n baseline is captured immediately. Keep `sourceHash`
   and `deployedSha` in the ledger schema as nullable from day one, so the upgrade to precise
   per-locale hashing is additive once the Phase 5 `.status` sidecars exist. Known cost in the
   meantime: a `last_update` bump re-enqueues a page whose body did not change. *Unblocks:* §11.3 C.
4. **Tier B scope. DECIDED 2026-08-09: full site minus `docs/courses/**` leaves**, all 7
   category hubs retained (~119 routes per locale). Promotion trigger: a Tier B locale earns its
   course leaves once its category hubs clear 500 impressions/month in GSC. Holds back ~568
   pages of the lowest-demand content. Recorded in `i18n/tiers.json`.
5. **Title suffix. DECIDED 2026-08-09: keep `" | Scrimba Guide"` in every locale, cap every
   locale at 44 content characters.** One uniform rule, brand consistency in every SERP, nothing
   truncated. `LOCALE_TITLE_BUDGET` therefore has a hard ceiling of 44 and CJK locales sit at 30.
   §13.2 item 4 may only lower a value, never raise it. No locale-dependent title logic exists,
   which removes one thing per-language skills could get wrong.
6. **Translation review. DECIDED 2026-08-09: no manual review at any tier. Ship Tier A only,
   then gate every further locale on Google's own indexing response.** This is the most
   consequential decision in the document, so its full consequences are written out in §7.1
   rather than buried here. In short:
   - Tier A (6 locales) launches on the automated stack alone.
   - **Google's index response becomes the primary external quality check**, replacing the human
     reviewer. It is lagging (about 6 weeks) but objective, free, and it is the only signal that
     actually measures what we care about.
   - **Tiers B, C, D and E are evidence-gated, not scheduled.** No further locale launches until
     the 90-day Tier A verdict in §7.1 comes back green.
   - The §13.5 translationese check moves from "nice to have" to **mandatory and load-bearing**,
     because it is now the only quality signal available *before* publishing.
   - The §13.4 failure ladder loses its human branch, so blocked pages auto-drop (see §7.1).
7. **Rotate the service account key.** It has been on disk in two repos, and its 200/day Indexing
   API quota is shared with `use-apify.com`. *Blocks:* nothing, but do it before the automation
   handles anything that matters.

---

## 19. Execution log (updated 2026-08-17)

Written at the point work was parked. Numbers are from `i18n/coverage.json`, not estimates.

### What shipped

Branch `feat/i18n-phase-1`, 10 commits, **not merged, no locale live**. `i18n.locales`
still resolves to `['en']`; no `build/es/` is emitted; nothing has reached production.

Every infrastructure phase is done: the `config/` split, the 48-locale roster, `localePath`,
the disk-derived coverage manifest, manifest-driven hreflang via an ejected `SiteMetadata`,
per-locale `baseUrl` (B5), Pagefind (7.8 MB lunr monolith to a 2.05 MB sharded index),
the matrix deploy + `wrangler.json`, RTL and per-script fonts, the `translate-content` and
`translate-es` skills with their QA scripts, and the per-locale exclusion machinery.

### `es` state at park

| Metric | Value |
|---|---|
| Covered (cold-judge pass + integrity clean) | **84 / 212 (40%)** |
| Blocked (failed judging) | 74 |
| Dropped ratio | **34.9%** |
| §7.1 launch veto | **10%** |
| Verdict | **`es` CANNOT LAUNCH as-is** |

`status: 'draft'`. The blocked pages must be retranslated and re-judged to bring the
dropped ratio under 10%, or the declared route set must shrink (see Next steps).

### Model quality, measured on this corpus

Same contract, same checkers, same judge design — only the translating model changed:

| Translator | Pass rate | Median MQM (gate <5) |
|---|---|---|
| Haiku 4.5 | 25/92 — 27% | — |
| Sonnet, `effort: low` | 33/57 — 58% | 6.10 |
| Sonnet, `effort: high` | 16/18 — 89% | 1.10 |

Low effort is a false economy here: a failing page costs the translate call *plus* the
judge call *plus* a retranslation, so it is more expensive **per passing page**. Haiku
produced errors no checker can catch — `cavedad` (not a Spanish word), `bien paseado`
for "well-paced", `práctica práctica`, and `$1,299` rewritten as `$1.299`, which changes
a cost-comparison figure by a factor of a thousand.

### Four contract defects found, all fixed and all gated

Each was the CONTRACT being wrong, not the translator. Each is now enforced by a
deterministic, model-independent check, so it cannot recur silently:

1. **Template literals frozen.** The JSX policy said never touch anything inside `{...}`,
   so translators skipped every interpolated string: Spanish tables with English columns,
   Spanish FAQ questions with English answers *inside FAQPage schema*. 24 Major errors in
   22 pages. Gate: `template-literal-untranslated`.
2. **Prose props missing from the allowlist.** `description` (173 uses), `subtitle` (119),
   `buttonText` (36), `ctaText` (13) all render as visible text, and `description` also
   feeds `CourseSchema`'s JSON-LD — so an untranslated one shipped an English course
   description to Google. Gate: `prose-prop-untranslated`.
3. **Markdown links unprotected.** The contract froze `href`/`to` props; the corpus has
   **2,221 markdown links and zero such props**. Gate: link-target multiset equality.
4. **Self-assessed verdicts counted as coverage.** Every translator wrote its own
   `verdict: pass` — one self-scoring MQM 2.1 on a page the cold judge scored 21.7. The
   manifest claimed 22/212 complete when the truth was 4/212. Coverage now requires an
   explicit pass from a judge whose `judgeModel` is not self-review.

### Two sidecar corruptions, repaired

Caused by an escape hatch in the translation prompt ("edit the sidecar JSON directly"),
which let agents invent a schema:

- **24 sidecars stored `sha256(sourcePath)` in `sourceHash`** — the FILENAME hash, not the
  CONTENT hash. Those pages read as permanently stale and were silently excluded.
- **21 sidecars used `source` instead of `sourcePath`** and omitted `sourceHash` entirely.

Both were deterministically repaired (coverage 63 to 84 with no model spend), and
`translation-status.mjs` now rejects both shapes.

### Next steps, cheapest first

1. **Repair, don't retranslate, wherever possible.** Two of the four defect classes are
   mechanical. A script that fixes untranslated prose props and template literals in place
   would recover a large share of the 74 blocked pages for near-zero model spend. Do this
   before buying any more translation.
2. **Retranslate the true failures at `effort: high`.** Low effort and Haiku are both
   measurably below the gate; using them costs more per passing page.
3. **Consider narrowing `es` to Core-40.** ~40 routes instead of 212. §1's gate measures
   completeness against the *declared* set, so a complete Core-40 `es` is a legitimate
   launch, and it is roughly a fifth of the remaining cost. The full set currently cannot
   clear the 10% veto.
4. **Only then** flip `status: 'live'`, run the per-locale barrier build, and deploy.

