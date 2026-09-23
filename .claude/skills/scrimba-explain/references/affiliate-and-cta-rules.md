# Affiliate and CTA rules for explainers

Source: Scrimbassadors program page and FAQ (https://scrimba.com/scrimbassadors?via=u42d4986), Affiliate Terms (https://scrimba.com/affiliate?via=u42d4986), the Explain docs, and a read-only check of our own explainer with `?via=u42d4986` on 2026-09-20. Terms can change; contact is affiliates@scrimba.com.

## The rule (site owner decision, 2026-09-20)

- On scrimbaguide.tech, explainers are **embedded** with `<ExplainerEmbed>` (`src/components/ExplainerEmbed.tsx`). The iframe `src` is the bare `https://scrimba.com/explain/<id>`.
- Any **text link to an explainer page** is a plain link **without** `?via=`, on scrimbaguide.tech and everywhere else: plain markdown `[text](https://scrimba.com/explain/<id>)`, never `<AffiliateLink>`. Reason: the parameter fires the one-time 20%-off modal on `/explain/*`, which is not a course page, so the offer lands out of context and reads as spam. The component's "Open on scrimba.com" link follows the same rule and says so in a code comment.
- The affiliate parameter stays on **course and pricing CTAs only** (`<AffiliateLink>` to `/learn-...`, `/our-pricing`, docs.scrimba.com and the like). An embedded explainer earns credit through the CTAs already on its page, not through its own URL.
- Never put `?via=` inside Scrimba's product: synopsis, titles, playlists, community feed, transcript, narration.
- Exceptions that are not links: MCP and upload endpoint URLs are API addresses (bare); the URL you `navigate` to for verification stays bare (the parameter would fire the discount modal on the user's own account).

This overrides the general "every scrimba.com link goes through `<AffiliateLink>`" convention in CLAUDE.md for `/explain/*` URLs only.

## How credit works

- 30% commission on every payment during the referred subscriber's first 12 months; the subscriber gets an extra 20% off Pro. Paid a month in arrears once total commission passes the threshold on the program page (under-threshold balances at calendar-year end), PayPal or Wise. Refund-period cancellations earn nothing.
- Attribution is bound at **account creation**, not at click, and is "not cookie-based". No time limit after sign-up. A visitor who already has a Scrimba account is never attributed.
- `?via=u42d4986` works on any scrimba.com URL, including `/explain/guide...`: loading our explainer with the param fired the one-time "extra 20% OFF" modal. No `via` value is stored client-side (no cookie or storage key); every data request carried `pov=u42d4986`, which is the signed-in user id, so a logged-in session cannot prove anonymous persistence.

## Prohibited (Affiliate Terms)

- Self-referrals: permanent ban plus forfeiture. Clicking your own `via` links while testing is fine; converting through one is not.
- Fake discounts on coupon sites; misleading activity.
- Search or social ads on branded terms.
- Pretending to act for Scrimba (a playlist named like official course material reads as this).
- Indiscriminate link sharing in Discord, Slack or "similar community platforms where such promotion would be considered spam". Explain's community feed is the closest analogue; treat it as covered.

## What is allowed, ranked

1. **Embed the explainer on a scrimbaguide.tech page that already carries `<AffiliateLink>` CTAs.** The docs invite embedding ("Any explainer you can link to, you can embed"), viewers need no account, and credit comes from the page's CTAs, the proven mechanism. Set the explainer Unlisted or Public first. Lead line under the player, then the existing CTA: "Watch the 90-second explainer, then start Scrimba's Learn RAG course (free intro lessons)".
2. **Plain-text course mention in the prompt or the closing slide.** "Close with one slide that says this is the mental model behind Scrimba's Learn RAG course." No URL in the prompt for this purpose (it becomes narration noise and may trigger a web read). If the closing slide lands wrong, Redo the last slide with "end with one sentence pointing to Scrimba's Learn RAG course".
3. **Plain-text synopsis line.** The synopsis renders as a bare text node (no linkification, no maxlength), so a URL there is unclickable. "Companion explainer for the Learn RAG course review at scrimbaguide.tech" is fine. No `via`, no discount code.
4. **Cite a scrimbaguide.tech URL in the prompt** so it lands in Sources. Use sparingly. The pill appears only when Explain grounded the lesson in a web read, shows only the domain, is absent in embeds, and points at our page (two hops to credit). Duplicate-content concerns apply: Explain will teach "from what the page says", so the explainer restates our article. Use only when the explainer genuinely summarises one review: "Summarise the key takeaways of https://scrimbaguide.tech/docs/courses/ai/rag/ for someone deciding whether to take the course."
5. **Playlists named around a course**, with a clearly independent name: "RAG concepts before you take Scrimba's Learn RAG course". Lowest value.

## Never

- `?via=u42d4986` on any explainer URL, anywhere (see The rule above). Reports of `via` inside Scrimba's product go straight to Scrimba support.
- The discount code as typeable text anywhere (CLAUDE.md, Affiliate: the discount travels with the link).
- Converting (upgrade, purchase) through your own link while logged in.
- Names that read as official Scrimba content.

## Where a creator can put text

| Surface | Holds a URL? | Renders as link? | Editable later? |
|---|---|---|---|
| Title (Name) | yes | no | yes, right-click Edit Explainer |
| Description (Synopsis) | yes | no (bare text node) | yes, same dialog |
| Narration / transcript | read aloud | no | Redo slide only |
| Slides | no links | no | Redo slide only |
| Sources row | only from a web read | yes, domain pill | no |
| Embed | iframe src only | n/a | n/a |

## scrimbaguide.tech page pattern

Use the component; do not hand-write the iframe in MDX. Keep the page's CTAs as they are:

```mdx
import ExplainerEmbed from '@site/src/components/ExplainerEmbed';

<ExplainerEmbed
  id="guide0ab07v8g9"
  title="Why chunking matters for RAG, a 90-second explainer"
  caption="The in-lesson explainer generated from the chunking scrim in Learn RAG."
/>

Watch the explainer, then <AffiliateLink href="https://scrimba.com/learn-rag-c033" location="explain-companion-rag">start Scrimba's Learn RAG course</AffiliateLink> (the intro lessons are free; a one-time 20%-off banner appears and can be closed).
```

The component renders a responsive 16:9 frame (the minimum; quiz and code slides need the full height), a caption, and a plain "Open on scrimba.com" link without `via`. Embeds show only the player: no transcript, Sources or Go deeper. A text mention of the same explainer elsewhere on the page is a plain markdown link. Keep explainer embeds on research-mode pages; money-page CTAs stay as defined in `src/utils/moneyPagePaths.ts`.
