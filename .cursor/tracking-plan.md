# Analytics Tracking Plan — scrimbaguide.tech

*Created: 2026-03-29 | Tools: GA4*

---

## Overview

Three conversion events to implement before the first TOFU blog post goes live. All affiliate links must use UTM parameters so GA4 can attribute revenue by content source.

---

## Events

| Event Name | Category | Trigger | Properties |
|------------|----------|---------|------------|
| `affiliate_link_clicked` | Conversion | Click on any `<AffiliateLink>` component | `post_slug`, `destination_url`, `link_text`, `page_location` |
| `email_captured` | Conversion | Email form submission (EmailCapture component) | `source_post`, `capture_type` (inline / popup / footer), `page_location` |
| `blog_cta_clicked` | Engagement | Click on `<PricingCTA>` or in-article CTA buttons | `post_slug`, `cta_text`, `cta_type` (pricing / path / course), `page_location` |

---

## UTM Parameter Template

All affiliate links in blog posts must append UTM parameters. This allows GA4 to track which post drove each Scrimba click.

**Template:**
```
https://scrimba.com/home?pricing&via=u42d4986&utm_source=scrimbaguide&utm_medium=blog&utm_campaign={post_slug}&utm_content={link_position}
```

**`link_position` values:** `intro`, `inline`, `footer_cta`, `faq`, `sidebar`

### Per-Post UTM Examples

| Post | `utm_campaign` value |
|------|---------------------|
| Developer Salary Guide 2026 | `developer-salary-guide-2026` |
| Web Dev Roadmap 2026 | `web-development-roadmap-2026` |
| Is Web Dev Worth It | `is-web-development-worth-it-2026` |
| How Long to Learn | `how-long-to-learn-web-development-2026` |
| Can AI Replace Junior Devs | `ai-replace-junior-developers-2026` |
| AI Tools for Learning | `ai-tools-learning-to-code-2026` |
| No Degree Dev Jobs | `developer-job-no-degree-2026` |
| First Dev Job | `how-to-get-first-developer-job-2026` |
| TypeScript Awareness | `should-javascript-developers-learn-typescript-2026` |
| Bootcamp Alternatives | `best-coding-bootcamp-alternatives-2026` |
| Tutorial Hell | `escape-tutorial-hell-2026` |
| JS Projects | `javascript-projects-for-beginners-2026` |
| What Is Vibe Coding | `what-is-vibe-coding-2026` |
| Vibe Coder to Developer | `vibe-coder-to-real-developer-2026` |
| Vibe Coding Survival Guide | `vibe-coding-javascript-survival-guide-2026` |

---

## GA4 Implementation

### Step 1: Mark conversions in GA4 Admin

In GA4 → Admin → Conversions, mark these events as conversions:
- `affiliate_link_clicked`
- `email_captured`

### Step 2: Custom Dimensions

Create the following custom dimensions in GA4 → Admin → Custom Definitions:

| Parameter Name | Scope | Description |
|---------------|-------|-------------|
| `post_slug` | Event | Which blog post triggered the event |
| `cta_type` | Event | Type of CTA clicked (pricing / path / course) |
| `capture_type` | Event | How email was captured (inline / popup / footer) |

### Step 3: AffiliateLink component event firing

The `<AffiliateLink>` component should fire `affiliate_link_clicked` on click. Add to `src/components/AffiliateLink.tsx`:

```typescript
// On click handler addition
const handleClick = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'affiliate_link_clicked', {
      post_slug: window.location.pathname.replace(/^\/blog\//, '').replace(/\/$/, ''),
      destination_url: href,
      link_text: typeof children === 'string' ? children : 'affiliate_link',
      page_location: window.location.href,
    });
  }
};
```

### Step 4: EmailCapture component event firing

The `EmailCapture` component on successful submission should fire:

```typescript
window.gtag('event', 'email_captured', {
  source_post: window.location.pathname.replace(/^\/blog\//, '').replace(/\/$/, ''),
  capture_type: captureType, // prop: 'inline' | 'popup' | 'footer'
  page_location: window.location.href,
});
```

---

## Reporting Queries

### Monthly content performance report

In GA4 → Explore → Free Form:
- Rows: `page_path`
- Columns: `affiliate_link_clicked` (event count), `email_captured` (event count)
- Filter: `page_path` contains `/blog/`
- Date: Last 30 days

This shows which posts drive the most affiliate clicks and email captures per month.

### UTM campaign performance

In GA4 → Acquisition → Traffic Acquisition:
- Filter by `utm_medium = blog`
- See `utm_campaign` breakdown
- Track: Sessions, Engaged Sessions, Conversions per post

---

## Affiliate Link Audit

Before publishing each post, verify:
- [ ] All `<AffiliateLink>` hrefs include `utm_source=scrimbaguide&utm_medium=blog&utm_campaign={post_slug}`
- [ ] No plain `scrimba.com` links without `via=u42d4986`
- [ ] Discount parameter (`?pricing`) included on pricing-adjacent CTAs
