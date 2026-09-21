# MCP authoring contract (what the agent must write)

When Claude Code creates an explainer, Claude is the author: it writes an OPML document of slides and narration and streams it to Scrimba, which renders it live. Scrimba runs no generation until the draft is claimed. The rules below are distilled from the contract string that `start_explainer_stream` returns (about 62 KB, ending `END OF EXPLAINER CONTRACT`) and from two runs on 2026-09-20. The returned contract is authoritative; this file is the map so the agent can plan before the tool result lands.

## Per-invocation Claude Code recipe (no persistent config)

Config file, endpoint URLs are API addresses and carry no `via`:

```json
{ "mcpServers": { "scrimba": { "type": "http", "url": "https://scrimba.com/explain/mcp" } } }
```

PR variant: same with `https://scrimba.com/explain/pr/mcp` (unlisted from the start, no playlist tool).

```bash
claude -p "<prompt from prompt-templates.md section 5 or 6>" \
  --mcp-config scrimba.mcp.json --strict-mcp-config \
  --allowedTools "mcp__scrimba__*,Read,Glob,Grep" \
  --output-format stream-json --verbose < /dev/null
```

- `--strict-mcp-config` keeps the user's other servers out; nothing is written to `~/.claude.json`. `claude mcp add` is the docs' persistent alternative and is not used here.
- Allow rule form: `mcp__scrimba__*` (a glob only after the literal `mcp__<server>__` prefix). `mcp__scrimba*` is rejected with a warning. The docs list the three explicit names instead.
- `< /dev/null` avoids "no stdin data received in 3s".
- Expect: no auth, no API key, no 429 in two runs; 135 to 160 s wall per explainer, 13 to 14 turns; API cost per run is logged in `lessons-learned.md`.
- Known cost: the `start_explainer_stream` result (66 to 69 K characters) exceeds Claude Code's tool-result window, is saved to a file, and the model spends 3 to 6 turns reading it. Half of each run went there. Tell the agent up front to read only the sections it needs from that file (slide types it plans to use) instead of the whole contract.

## Tools

- `start_explainer_stream(title <~45 chars, required; description ~120 to 160 chars; mode square|portrait|landscape, default square, fixed once open; visibility private|unlisted, default private)` returns `{guide, stream_token, url (…?claim=…&fullscreen=1), mode, explainer_contract}`. Give the user the URL immediately; it renders live.
- `append_explainer_chunk(stream_token, opml)` returns `bytes_used`, `bytes_remaining` (512,000 budget), `says`, `entries`, `narration_ms`, `narration_remaining_ms` (600,000 = 10 min).
- `finish_explainer_stream(stream_token)` returns `{guide, url, entries, says}`. Call it when done, or the explainer shows as generating; a stream idle 30 minutes finishes itself.
- `create_playlist(title 1 to 120, lessons 2 to 12 each {title, description <=500}, description, mode, visibility)`: one claim link for all lessons. Absent on the PR endpoint.
- Uploads: `curl -sS -F file=@img.png -H "X-Stream-Token: <token>" https://scrimba.com/explain/uploads` returns an `attachment` id for `<item type="image" attachment="<id>" ...>`. 8 MB per file, 12 per explainer, png/jpeg/webp/gif, not counted against the generated-image cap. An append naming an unknown id is refused whole.

## Stream limits

- 64,000 bytes per chunk; 512,000 bytes total; about 10 minutes of narration (~1,500 words across all `<say>`s). Narration past the cap is dropped and further pushes refused. "A deeper topic gets a tighter script, not a longer one."
- Chunks append to one growing document; never resend or rewrite earlier content; push each item's `<say>` right after the item; reference by anchor, never by position.
- Aim for 10 to 50 slides. Our 14-slide, 5:12 run used two chunks (6.6 KB and 7.3 KB).

## Required shape

- Top-level tags only `<item>`, `<say>`, `<followup>`. `type` or `layout` is always the first attribute. Quote attributes, close every tag. No wrapper item around the deck; every slide is a root-level `<item>`.
- Each top-level item is one non-scrolling screenful with exactly one visual (typed item or layout group), a `title`, and one short framing `text`. Only the intro has no visual. Slide count equals top-level item count.
- Banned tags: `<narrate> <fetch> <insert> <move> <update> <delete> <patch> <code> <diagram> <math> <image> <prop>`. Banned layouts: list, tiles, stats, table. Layouts allowed: `ul`, `ol`, `cards`.
- CDATA bodies need a `type` (diff `side` children excepted). No raw HTML or JSX in prose; escape `&lt;` `&gt;` or use a code item.
- Optional inputs the server may hand in: `<previous-guide>`, `<scrim-context>`, `<learner locale>`.

## The intro

`<item anchor="intro" title="How DNS Works" text="DNS turns a website name into the server address your browser connects to."></item>`. Title under ~45 chars, search-style; `text` one literal sentence under ~120 chars (it is the search description and card line). First `<say>` is one ~10-word sentence linking `#intro`, and must not open with "Welcome", "Today we", "In this explainer", "Let's". The intro cannot be redone later.

## Narration

- At least one `<say>` per teaching item, immediately after it. Says carry the teaching; visible text stays short and exists to be pointed at.
- `lang="xx-RR"` is the first attribute of every say; the first say fixes the language. Language of the query unless asked otherwise.
- Every say opens with a link to its section, labelled by the thing itself (never "Watch the animation"), then drills into targets. Ref syntax: section `#anchor`; entry `#entry-anchor`; code `[label](#code-anchor:L4 'exact text')`, `:L4-8 'start...end'`, `:L4` whole line, lines from 1, selector literal, no apostrophes, link placed a few words before the spoken word; diff side `#side-anchor:L3 'text'`; diagram node or arrow `#d:L2 'Visible Label'`; math `#m 'exact LaTeX'`. Every code block must be taught with precise refs; do not mix diagram and code refs in one sentence; finish the diagram before the code.
- Purpose before mechanism: Need, Friction, Evidence, Mechanism. Mark inferred reasons ("This appears to be needed because...").
- Banned phrasing: negation scaffolds ("isn't just X, it's Y"), stock metaphors (heavy lifting, secret sauce, superpower, magic, Swiss Army knife, unlock, seamless, game-changer, buckle up, dive in, "under the hood" as a closer), decorative similes (one analogy per concept, carried through, never re-announced), hype transitions ("Here's the kicker", "Ever wondered"), praise without consequence (powerful, crucial, essential, robust). Test: a sentence that fits any topic carries no information.
- End with exactly two self-closing `<followup prompt="..."/>`: distinct, self-contained, under ~80 chars, learner phrasing. No giant final say.
- Emoji: at most one, at the end of text-carrying titles; none in says, none on slides with a visual.

## Slide types and fields

- **code** `<item type="code" anchor title text language filename><![CDATA[...]]></item>`. Real source, no fences, no `...` or `// ...` placeholders in source-grounded code, attached code copied exactly. Max ~15 lines, 50 to 60 chars wide; split illustrative code, never reflow attached source (choose a narrower excerpt).
- **diff** `<item type="diff" anchor title text language filename>` with exactly two children `<item side="before" anchor>` then `<item side="after" anchor>`, CDATA each, no `+`/`-` markers, optional per-side `title` and `filename`. ~10 lines per side, under 50 chars. Narrate before ref, after ref, consequence. Our PR run omitted a long `console.warn` line from the after pane to fit, and said so.
- **diagram** Mermaid in CDATA: `sequenceDiagram` (max three participants, short names; Note/alt/else/loop ok), `flowchart TD` (the contract says never LR because the deck is square by default, and a linear chain of more than four nodes becomes a list; the wider limits observed on the web player belong to Explain's own generator, not to an agent under this contract), `stateDiagram-v2`, `classDiagram`, `erDiagram`. Simple node ids, punctuation inside quoted labels, labelled arrows, meaningful shapes (`{Decision?}`, `[(Database)]`), subgraphs for ownership. In `landscape` mode a short chain or a single fan-in still reads better than stacked subgraphs.
- **math** raw KaTeX in CDATA, no `$`, one formula per item, derivations in one `aligned` block on `=`, ~30 chars of LaTeX per line (scaled down to 40). Refs quote a unique substring.
- **animation** JS module `export function build(manim) {...}` returning a Scene in a strict Manim CE subset. 8x8 unit canvas, content within -3.5..3.5 on both axes, the player zooms to fit; use both axes; four boxes in a row do not fit. Options as a trailing object; `.animate` is a property; never multiply direction constants (`UP * 0.5` is NaN; write `[0, 0.5, 0]`); `group.get(i)`, `.copy()`, `submobjects`; no MathTex; no config sizes. Duration 8 to 25 s, end with `scene.wait(0.5)`; the player stretches the scene over its say, so match steps to narration clauses. Labels one or two words at scale 0.5 to 0.7, `FadeIn` for text (`Write` at most once). "Almost every explainer should include an animation": one or two.
- **image** `<item type="image" anchor title prompt [reference] [attachment] [aspect-ratio]>`. Prompts two to four rich sentences (subject, setting, era, mood, lighting, composition); commit to ONE style phrase for the whole explainer and end every prompt with that exact phrase then "No text, no words, no labels." character for character. `reference` always points at the original scene, never chained. Leave `aspect-ratio` out unless the subject has a shape (`9:16` phone, `16:9` panorama). Code topics get two to four images around the core; story topics are image-driven. Max 12 generated pictures including infographics. Never for exact content. Each image slide has its own short say.
- **infographic** `<item type="infographic" anchor title prompt="Style: ...">` with exactly four quadrant children in order top-left, top-right, bottom-right, bottom-left, each `anchor`, `title` (one to four plain words), `prompt` (two to three sentences), "Labels: a, b, c" (max three labels of three words). Narration: opening say linking only the item (25 to 35 words), one say per quadrant, closing say linking the item; never mention the picture or camera; no `:L` refs. Counts toward the 12-picture cap. The public docs say agents do not use infographics; the endpoint accepts the type.
- **cards / ul / ol** `<item layout="cards" anchor title>` with child `<item anchor title text/>` entries; entry count from the material (do not default to three); every pointed entry has an anchor; no markdown bullets in `text`.
- **table** a small GFM table as the body of a plain item, framing sentence in `text`.
- **quiz**: no item type exists. Our agent-loop run built a quiz as two cards slides plus an answers list; the web player shows it as static cards (`has_quiz: false`). Say so in the reply.

## Ordering and pacing

Intro, then straight into the needed structure; item then its say; each visual its own slide; follow-ups last. Purpose before mechanism. Finish a diagram walkthrough before code. Image slide plus short say pairs give a filmic rhythm. Infographic says follow quadrant order.

## Final quality pass (the contract's own list)

Unsupported tags; CDATA without type; unverified post-cutoff facts; exactly two follow-ups; a code-centred request without code; unnarrated code; missing refs; mechanism before purpose; fake omitted lines; over-tall or over-wide code; unified-diff markers; missing diff sides; slides without visuals; multiple visuals on one slide; generic intro title; banned phrasing; duplicate analogies; infographic checks.

## Claim flow observed

Opening the `?claim=` link while signed in showed "Claim this explainer to watch it" for about 10 s, then the page moved to the claimed player without a click. Images render on first open, narration after claim. Visibility set at creation (`unlisted`) was honoured. The PR-endpoint explainer did not appear under "Yours" and its cog menu had no owner items.
