# Lessons learned (dated log)

## 2026-09-20: first full run, 11 explainers, 89 slide captures

Made on the user's Pro account: five web singles (three RAG runs across styles, one attachment run, one context-window run), one three-lesson playlist, one in-lesson EXPLAIN result, one Claude Code MCP explainer, one PR-endpoint explainer. Every slide was stepped, captured, and graded. Captures live in the session scratchpad under `explain-verify/<id>/` (numbered PNGs plus `sheet.jpg`). Redo slide was not executed: the user's request did not cover mutations.

| Id | What | Length, slides | R T V N Q F | Defining defect |
|---|---|---|---|---|
| `guide0ab07v8g9` | In-lesson, Learn RAG chunking, highlighted code | 1:31, 7 | 5 4 5 5 5 5 | none; best of the set |
| `guide02qftck7g` | Web, attachment, MCP server | 1:17, 7 | 5 5 3 5 5 5 | unrequested animation: JSON-RPC pill over "Host Client" |
| `guide049ig84ai` | Claude Code MCP, agent loop | 5:12, 14 | 5 5 4 5 4 3 | Python code for a JS audience; quiz is static cards |
| `guide0sp3ljm85` | Web, RAG, Standard | 1:28, 8 | 5 5 3 4 5 5 | TD pipeline diagram 180 px column; animation points above axes |
| `guide04mover9n` | PR endpoint, HMAC webhook | 6:21, 12 | 5 5 3 5 - 4 | 12 px diff, 4-card wrap, state diagram column |
| `guide0jc32sm3l` | Web, context window | 1:22, 6 | 4 5 4 5 5 4 | "lost in the middle" dropped; sequence instead of the requested filling-bar |
| `guide0j3tt3irh` | Playlist L1 | 1:15, 8 | 4 5 4 4 5 3 | JSON not JS; "tool results" dropped; unrequested quiz |
| `guide0ih5ernr6` | Playlist L2 | 1:14, 7 | 4 4 3 4 3 4 | ambiguous quiz on a comparison; floating subgraph label |
| `guide0bnbt17e2` | Playlist L3 | 0:51, 6 | 4 5 4 5 5 3 | "state outside the window" dropped; stray arrow at 44 s |
| `guide0niu04ksn` | Web, RAG, Explain style | 1:20, 7 | 4 3 2 4 4 5 | dot product labelled cosine similarity (Redo candidate) |
| `guide050741s62` | Web, RAG, Professor | 1:26, 7 | 4 3 3 4 5 5 | `[0.1, 0.9, ...]` SyntaxError; undefined `userQuery` |

### What the strong ones shared

- A concrete artifact as ground truth (highlighted scrim code, attached markdown, repo files, PR diff). Code then reproduced the source verbatim and the quiz could be checked against it.
- Deliverables named one by one ("one sequence-diagram slide of the three-message handshake", "one short TypeScript slide", "finish with a quiz", "anchor on the highlighted code") came back exactly. "Include one diagram slide" with no shape produced the default TD layout.
- Left-to-right chains, sequence diagrams with three participants, and single fan-in flowcharts rendered legibly. Anything TD with stacked subgraphs, and `stateDiagram-v2`, rendered as a tiny column in the 16:9 frame. "Ingest path and query path" triggered the bad layout in three of three RAG runs.
- Seven slides in 1:15 to 1:30 was the sweet spot: one idea per slide, cards of 3 or fewer, code of 18 lines or fewer. The 5 to 6 minute MCP walkthroughs held up because every code slide had highlights; their diff and state slides were the weakest visuals.

### What made the weak ones weak

- No source: A3 wrote `vector: [0.1, 0.9, ...]` (SyntaxError) and used `userQuery` never defined; A1 called a raw dot product cosine similarity. The style knob did not change this; Professor added one card, not rigour.
- Several sub-topics per lesson: the generator budgets about six content slides and drops the last item (C1, C3, D).
- Library animations are fine but sometimes contradict the narration (A3 "baking bread" never drawn, C1 "no room left" never shown) or glitch (B pill overlap, C3 stray arrow, A2 point above axes).
- Quizzes are good when the lesson has one clear claim; C2's comparison lesson produced a question whose answer depended on an untaught assumption.
- Playlist per-lesson instructions ("end lesson 3 with a quiz", "JavaScript where code helps") were not honoured per lesson.

### Evidence behind the formula steps (SKILL.md)

- Step 2, one claim with at most three sub-points: every prompt that packed four sub-topics lost the last one (C1 "tool results", C3 "state outside the window", D "lost in the middle"); the generator budgets about six content slides regardless.
- Step 3, the audience sentence: the "already knows" clause is what the docs say people leave out, and it held in every run.
- Step 4, dimensions: stage 1362x765 in-page, embed 800x450, Vertical view 429x765 where code drops to 14 px and wraps (`// From LLM API` wrapped in A1).
- Step 5, diagrams: "one pipeline diagram with the ingest path and the query path" produced two stacked TD subgraphs rendered as an unreadable 180 px column in all three RAG runs (A1, A2, A3). "document -> chunks -> embeddings -> vector store -> query match" rendered as a wide, legible `flowchart LR` with five nodes (in-lesson, V5). Six nodes is an extrapolation from that five-node observation, not a tested limit.
- Step 5, animations: unrequested library animations contradicted the narration (A3 "baking bread" never drawn, C1 "no room left" never shown) or glitched (B pill overlap, C3 stray arrow, A2 point above axes).
- Step 5, code: "use short JavaScript examples where code helps" returned a JSON slide (C1). A2 (Standard) was the only RAG run with correct code.
- Step 5, quiz: the comparison lesson C2 produced a quiz whose answer depended on an untaught assumption.
- Step 7, style: Professor at this prompt length added one card, not rigour (A3 had a `[0.1, 0.9, ...]` SyntaxError and an undefined `userQuery`). Explain style (A1) mislabelled a dot product as cosine similarity.
- Step 8, grounding: every run with a concrete artifact (attachment B, highlighted scrim code, repo files, PR diff) scored 5 on accuracy; every run without one hallucinated at least one detail.

### Platform facts learned first-hand

- Composer style choice persists across page loads (Professor was still selected on the next visit); playlist toggle and visibility do not.
- In-lesson results come out Unlisted with a Publish to community button, although the hub default is Public.
- Playlist lessons and MCP explainers autoplay on open; hub singles did not.
- The player has no `<video>`; it is a `<guide-page>` element with `section.guide-slide` children, Mermaid SVG diagrams, and animation iframes at `/manimjs2/player.html`. Vertical view is 429x765 and wraps 14 px code.
- No thumbnail is generated; tiles are patterned. Title and one-sentence synopsis are the whole card, and both are editable through right-click, Edit Explainer.
- The synopsis renders as a bare text node: URLs there are not clickable.
- Sources row appeared on none of ours, including the attachment run; only web-grounded explainers get one.
- Every `mode` was `landscape` on the web; the MCP `square` explainer still rendered 16:9 in the web player.
- Claude Code: the contract result (66 to 69 K chars) overflows the tool-result window and costs 3 to 6 turns of file reading; `--allowedTools "mcp__scrimba*"` is rejected, `mcp__scrimba__*` works; `< /dev/null` avoids the stdin warning; about a dollar of API usage per explainer at the tier used (2026-09-20); the claim link self-claims within about 10 s for a signed-in user.
- Loading an explainer with `?via=u42d4986` fires the 20%-off modal; nothing is stored client-side.

### Open items

- A1 slide 5 comment `// A simple dot product for cosine similarity`: Redo with "rename to dot product, or normalise the vectors and keep the name", pending the user's go-ahead.
- Untested: `?via=` on an iframe src; the `portrait` MCP mode in the web player; whether a pasted scrimbaguide.tech URL reliably produces a Sources pill; whether a 3-lesson playlist meters as 3 units.
- Untested wording: "left-to-right diagram ... (one row, no subgraphs)" was proposed by the verification report but never sent. The tested phrase is the bare arrow chain ("one short diagram slide: document -> chunks -> embeddings -> vector store -> query match", in-lesson V5). Keep the arrow chain as the template phrase until "left-to-right" is tried.
