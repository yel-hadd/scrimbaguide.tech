# Cursor Marketing Skills

Project-scoped [Cursor Agent Skills](https://docs.cursor.com/context/rules#agent-skills) adapted for **use-apify.com** from the upstream [Marketing Skills](https://github.com/coreyhaines31/marketingskills) pack by Corey Haines (MIT — see Notice below).

These skills are available automatically in every Cursor session on this repository.

---

## Skills Index

| Skill directory | What it does |
|---|---|
| `ab-test-setup` | Plan, design, and implement A/B tests and experiments |
| `ad-creative` | Generate and scale ad creative (headlines, descriptions, primary text) |
| `ai-seo` | Optimize content for AI search engines and LLM citations |
| `analytics-tracking` | Set up, improve, or audit analytics and measurement |
| `churn-prevention` | Reduce churn, build cancel flows, recover failed payments |
| `cold-email` | Write B2B cold outreach emails and follow-up sequences |
| `competitor-alternatives` | Create competitor comparison and alternatives pages |
| `content-strategy` | Plan content strategy and decide what topics to cover |
| `copy-editing` | Edit and improve existing marketing copy |
| `copywriting` | Write or rewrite marketing copy for any page |
| `email-sequence` | Create drip campaigns, automated flows, lifecycle emails |
| `form-cro` | Optimize non-signup forms (lead capture, contact, checkout) |
| `free-tool-strategy` | Plan and evaluate free tools for lead gen or SEO value |
| `launch-strategy` | Plan product launches, feature announcements, release strategy |
| `lead-magnets` | Create and optimize lead magnets for email capture |
| `marketing-ideas` | Generate marketing ideas and strategies for SaaS products |
| `marketing-psychology` | Apply behavioral science and psychological principles to copy |
| `onboarding-cro` | Optimize post-signup onboarding and time-to-value |
| `page-cro` | Optimize any marketing page for conversions |
| `paid-ads` | Google Ads, Meta, LinkedIn, Twitter/X paid campaigns |
| `paywall-upgrade-cro` | Create and optimize in-app paywalls and upgrade screens |
| `popup-cro` | Create and optimize popups, modals, overlays, and banners |
| `pricing-strategy` | Pricing decisions, packaging, and monetization strategy |
| `product-marketing-context` | Create/update product context doc at `.cursor/product-marketing-context.md` |
| `programmatic-seo` | Create SEO-driven pages at scale using templates and data |
| `referral-program` | Build and optimize referral and affiliate programs |
| `revops` | Revenue operations: lead routing, lifecycle, scoring, attribution |
| `sales-enablement` | Build sales collateral, one-pagers, objection handling |
| `schema-markup` | Add and optimize structured data / JSON-LD |
| `seo-audit` | Audit site SEO: on-page, technical, content, and AI search |
| `signup-flow-cro` | Optimize signup/registration flows and free-trial conversion |
| `site-architecture` | Plan information architecture and navigation |
| `social-content` | Write platform-native social media content |

---

## use-apify.com editorial overrides

These skills provide general marketing best practices. For work on this repository, the root [`README.md`](../../README.md) takes precedence on the following topics:

- **Mission & non-negotiables** (§1) — factual accuracy, zero hallucinations, affiliate disclosures.
- **Affiliate governance** (§11) — correct tracking parameters, link hygiene, commercial integrity.
- **Content quality standards** (§8) — freshness markers, completeness, gate criteria.
- **Copywriting & UX standards** (§9) — tone, CTA rules, heading limits.
- **SEO & interlinking strategy** (§10) — pillar/cluster architecture, backward linking, no orphan pages.

When any marketing skill advice conflicts with a rule in that README, **the README wins**.

The `use-apify-editorial-context` skill (also in this directory) surfaces this explicitly in Cursor's skill picker.

---

## Product Marketing Context

The shared product context document lives at `.cursor/product-marketing-context.md` (gitignored — see root [`.gitignore`](../../.gitignore)). Run the `product-marketing-context` skill to create or update it. All other skills read it automatically at the start of any task.

---

## Notice (upstream license)

Adapted from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills):

```
MIT License

Copyright (c) 2025 Corey Haines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
