# STYLE-BAR.md

House voice reference for the Scrimba Guide blog, distilled from the edits applied to `do-you-need-to-learn-to-code-if-ai-writes-it`. Batch agents: match these patterns. Independent-reviewer voice, never a Scrimba graduate. No em-dashes, en-dashes, curly quotes, or exact Scrimba prices anywhere.

## Good / bad sentence pairs (from the actual edits)

1. Negative parallelism is an AI tell. Use a plain causal verb.
   - BAD: "A beginner who accepts the same suggestions blind does not get slower, they get a codebase full of problems they cannot see."
   - GOOD: "A beginner who accepts the same suggestions blind ends up with a codebase full of problems they cannot see."

2. Do not paraphrase a precise stat into a looser claim it does not support. Keep the survey's own framing.
   - BAD: "Most working developers now have AI in their workflow in some form, up from 76% the prior year." (84% is "using OR planning to use," not "in their workflow")
   - GOOD: "Most working developers are now using or planning to use these tools, up from 76% the prior year."

3. A thesis refrain can echo, but never repeat verbatim as a templated triplet. Reword each restatement.
   - BAD: "...which in 2026 mostly means reading code, running it, and deciding whether to trust it before it reaches a customer." (identical triplet already used earlier in the post)
   - GOOD: "...which in 2026 mostly means reviewing far more code than you write and catching what is wrong before it reaches a customer."

4. The visible FAQ must match the DocFaqSchema answer byte-for-byte. Do not let rendered copy drift from the schema.
   - BAD (visible drifted): "Starting now means learning to read and verify from day one."
   - GOOD (matches schema): "Starting now means learning to read and verify from day one instead of unlearning bad habits later."

5. Same parity rule, exact wording counts.
   - BAD (visible drifted): "...understanding what it does, and deciding whether it is correct."
   - GOOD (matches schema): "...understanding what it actually does, and deciding whether it is correct."

## Good / bad pairs (approved exemplars kept from this piece; match this register)

6. Open each H2 with the answer, not a throat-clear.
   - BAD: "In this section, we will explore why relying on AI-generated code can be risky."
   - GOOD: "Here is the part nobody warns beginners about: almost-right code is more dangerous than broken code."

7. Attribute every statistic to a named, dated source with the exact figure. No vague "studies show."
   - BAD: "Surveys show most developers do not really trust AI-generated code."
   - GOOD: "In the Stack Overflow 2025 Developer Survey, 46% of developers distrust the accuracy of AI output while only 33% trust it, and about 3% highly trust it."

8. Bound the scope of a study inline instead of overstating it.
   - BAD: "A study proved that AI makes developers slower."
   - GOOD: "It was 16 experienced developers, in mature repositories with years of their own context, using the frontier tools of early 2025."

9. End on a concrete action or a flat declarative, never generic uplift.
   - BAD: "By embracing these tools while honing your fundamentals, you will be well-positioned to thrive in the evolving landscape of software development."
   - GOOD: "When you can do that reliably, you are learning the right skill. Everything else is typing."

## Approved intro pattern

Bold lead paragraph that answers the title question in its first two or three words, then states the one-sentence reframe, then names the reader and the payoff. Shape:

> **[Yes/No, direct answer to the H1]. [One-sentence reframe of what actually changed].** If you are [specific reader, e.g. a career changer scared they started too late], [why that reframe is good news and what skill now matters].

Then, on their own lines and in this order: the plain FTC line `We earn a commission if you upgrade through our links, at no extra cost to you.`, then `{/* truncate */}`. Keep `<DisclosureNotice />` directly under the H1 above the bold lead; the manual FTC line and the component are both intentional (the component renders null on list pages, the manual line covers excerpt visibility) and are not redundant.

## Approved one-line CTA shape

Exactly one soft affiliate CTA per post, placed late, in the section where the argument has earned it, immediately after a sentence that ties Scrimba's format to the post's thesis ("the format is the argument"). Lead with free-courses-first framing; link to `/docs/pricing/` for price and use "low monthly subscription" plus "20% off" rather than any number. Wrap the single outbound link in `<AffiliateLink>`:

```
<AffiliateLink href="https://scrimba.com/home?via=u42d4986&utm_source=scrimbaguide&utm_medium=blog&utm_campaign=<slug>&utm_content=inline" location="inline-cta">
  Start Scrimba Pro with 20% off
</AffiliateLink>
```

CTA link text is a single imperative line: verb + offer ("Start Scrimba Pro with 20% off"). The component dedupes `via=`, so a hardcoded `?via=u42d4986` is safe and will not double-append. Never hand-write a raw `https://scrimba.com/...` markdown link. Keep aggressive/sticky CTAs off research-mode posts like this one.

## Banned phrases / patterns (add to house list)

New tells caught in this batch:
- Negative parallelism: "does not X, they Y" / "it is not about X, it is about Y" as a rhetorical flip. Rewrite as a plain causal statement.
- Verbatim-repeated thesis triplets. A motif may echo, but reword each restatement.
- Loose stat paraphrase that widens a precise survey figure (e.g. turning "using or planning to use" into "have it in their workflow"). Keep the source's own scope words.
- Generic upbeat closers: "well-positioned to thrive," "in the evolving/ever-changing landscape," "embrace these tools," "in today's fast-paced world." End concrete instead.

Standing banned vocabulary (confirmed absent here, keep banned): testament, pivotal, crucial, delve, landscape, tapestry, underscore, robust, seamless, foster, showcase, vibrant, "let's dive in," copula-avoidance ("serves as," "boasts"). No emojis. No bold-header bullet lists (the bottom FAQ uses inline-bold questions inside paragraphs, which is the standard pattern). Headings in sentence case. Internal links carry trailing slashes.