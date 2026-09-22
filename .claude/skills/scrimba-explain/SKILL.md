---
name: scrimba-explain
description: Produce a high-quality Scrimba Explain explainer (narrated slide video) and verify it before sharing. Use whenever the user wants an explainer, an "Explain" video, a Scrimba playlist of lessons, an explainer of a PR or repo via the Scrimba MCP, an in-lesson EXPLAIN result, or wants to embed or link an explainer from scrimbaguide.tech. Also use when grading, redoing, or fixing an existing explainer, or when asked about Explain quotas, visibility, export or affiliate rules for explainers.
---

# Scrimba Explain

An explainer is a streamed deck of typed slides (code, diff, diagram, animation, cards, quiz) with synthesized narration. Explain decides layout; the prompt decides content. The rules below come from 11 explainers made and stepped slide by slide on 2026-09-20 (`references/lessons-learned.md`) and from the docs (`references/docs-index.md`); the evidence for each rule lives in those files, not here.

House rules for anything this skill writes: no em-dashes; never quote a Scrimba price (link to the pricing page); explainer URLs and the `scrimba.com/explain` hub never carry `?via=`, on scrimbaguide.tech or anywhere else. The affiliate parameter belongs on course and pricing CTAs only. The full rule, with the reasons and the exceptions for API endpoints and verification URLs, is in `references/affiliate-and-cta-rules.md`; read it before writing any link.

Generating an explainer spends the user's allowance and, by default, publishes under their name. Create only when the user asked for an explainer, and on their account only through the surfaces they named.

## The formula

Work through the steps in order. Each step ends when its output is written down; the prompt is assembled from those outputs, not improvised.

1. **Pick the use case and entry point.** Concept lesson, course companion, code walkthrough, PR review, curriculum. Concept and companion: web composer (styles, attachments, quiz). Inside a lesson: EXPLAIN button (scrim as context, no style or attachment). Real code: Claude Code with the MCP endpoint. PR for reviewers: PR endpoint. Mechanics in `references/entry-points.md`.
2. **Write the topic as one claim.** One idea per explainer, at most three sub-points, numbered in the prompt. The generator budgets about six content slides and drops a fourth sub-topic. More ideas means a playlist, one claim per lesson.
3. **Write the audience sentence.** Who, what they already know, what they are trying to do: "for a JavaScript developer who has called an LLM API once and wants a chatbot over their own docs". Never leave out the "already knows" clause.
4. **Choose format and dimensions.** Web output is 16:9 landscape; viewers can flip to Vertical view, where code shrinks and wraps, so keep lines under 50 chars if phones matter. MCP `mode` is square by default, or portrait or landscape, fixed at open. Target for a web single: 1:15 to 1:30, 7 slides. Sizes in `references/dimensions-and-visuals.md`.
5. **Plan the visuals slide by slide** and name each one in the prompt. Per-type fit rules and request phrases are in `references/dimensions-and-visuals.md`; the short list:
   - title card (automatic). Keep the title under 45 chars: on MCP set it in `start_explainer_stream(title)`; on the web fix it after creation via right-click, Edit Explainer;
   - one diagram for structure: a sequence diagram with three participants, or a flowchart written as an arrow chain ("a -> b -> c -> d -> e"). Never ask for two paths in one diagram;
   - one animation only where something moves, with the motion named. For comparisons or advice write "no animation";
   - code slides in JavaScript or TypeScript, at most 18 lines and 60 chars wide, runnable as written. Say "JavaScript, not Python" and "every code slide is JavaScript";
   - an image or art style only for non-code topics;
   - a closing quiz on one crisp fact you state in the prompt. Do not ask for a quiz on a comparison lesson.
6. **State the language** if not English ("in Spanish"); 33 narration voices, code stays as is.
7. **Pick the style.** Standard for developers. Explain for true beginners. Professor does not add rigour at this prompt length; buy depth with "use the pointer on every line, skip none" instead. TLDR never gets a quiz. The chosen style persists across page loads: check the chevron before every submit. Styles do not apply to MCP or ChatGPT.
8. **Ground it.** Attach the file, paste the code, or name the exact snippet ("Anchor on the highlighted code: `new RecursiveCharacterTextSplitter({ chunkSize: 150, chunkOverlap: 15 })`"). Every run without a concrete artifact hallucinated at least one detail. Paste a URL only when the page should be read and cited in Sources.
9. **Set visibility** before submitting: Unlisted for drafts and anything to be verified first; Public only after verification. Composer defaults to Public and remembers nothing; in-lesson results come out Unlisted; MCP drafts are private until claimed; PR-endpoint results are unlisted.
10. **Assemble and submit** using the template in `references/prompt-templates.md`. Copy-edit once: numbered sub-points, one sentence per deliverable, no filler.
11. **Verify before sharing.** Step every slide, check each code slide against its source, check every diagram is legible at stage size, watch each animation at two moments, answer the quiz. Grade with `references/rubric.md`. Fix with Redo slide (any slide but the intro, free) for wrong words or visuals, Regenerate narration (free) for audio only. Both mutate the user's explainer: do them only when the user asked for fixes.

### Prompt template

```
Explain <one claim>, for <who> who <already knows> and wants to <goal>.
Cover: 1) <point> 2) <point> 3) <point>.
Include one <sequence diagram of A, B, C | short diagram slide: a -> b -> c -> d> slide.
<Animate <named motion> | No animation.>
<One | Two> JavaScript code slide(s) showing <exact thing>, under 18 lines, runnable as written, JavaScript not Python.
Finish with a quiz on <the one fact>.
<In <language>.> <Anchor on the attached file | highlighted code | this snippet: ...>
```

## Quota, visibility, sharing

Short version; the per-surface detail is in `references/entry-points.md` and the sizes in `references/dimensions-and-visuals.md`.

- Allowance (docs): Free 10 explainers for life; Pro 100 per month; signed out 1 (create or claim). Creating, each follow-up, each Go deeper, and claiming an agent draft all count. Each playlist lesson is a normal explainer with its own URL (docs), so budget a 3-lesson playlist as 3 units until metering is confirmed.
- Free: Redo slide, Regenerate narration, export, Watch later, watching. Agent drafts cost nothing until claimed.
- Default visibility: web Public; in-lesson Unlisted; Chrome extension Public; ChatGPT Unlisted; MCP private draft with `?claim=`; PR endpoint Unlisted, one claimer. Private explainers cannot be exported, linked, or embedded: set Unlisted first.
- Embed and export sizes, and the tile behaviour (no thumbnail; title and one-sentence description are the whole card): `references/dimensions-and-visuals.md`.

## Affiliate and CTA rules

One rule, stated in full in `references/affiliate-and-cta-rules.md`: embed explainers with `<ExplainerEmbed>`, link explainer pages plainly without `via`, keep the affiliate parameter on course and pricing CTAs only, and never put `via` or the discount code inside Scrimba's product. Also: never convert through your own link; never name an explainer so it reads as official Scrimba content.

## References

- `references/prompt-templates.md`: per-use-case templates with the filled prompts from the best runs and what each produced.
- `references/rubric.md`: the six-axis rubric, pass thresholds, and the Chrome step-and-capture verification procedure.
- `references/dimensions-and-visuals.md`: slide types, how to request each, stage sizes, vertical view, art styles, export and embed sizes, tile behaviour.
- `references/mcp-authoring-contract.md`: what the MCP contract demands (OPML shape, narration limits, code and diff widths, animation canvas, image prompts, pacing) plus the per-invocation Claude Code recipe.
- `references/entry-points.md`: web composer, in-lesson EXPLAIN, Chrome extension, ChatGPT/Codex, Claude Code MCP, PR endpoint and CI action, playlists, attachments, languages, Go deeper and follow-ups.
- `references/affiliate-and-cta-rules.md`: program terms, what is allowed, exact wording, how scrimbaguide.tech pages embed and link explainers.
- `references/docs-index.md`: every docs.scrimba.com/explain page in one line.
- `references/lessons-learned.md`: dated log of the 2026-09-20 runs, scores, defects, the evidence behind each formula step, and the prompt phrases that worked.
