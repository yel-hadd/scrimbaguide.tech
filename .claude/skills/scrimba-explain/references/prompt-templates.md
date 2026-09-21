# Prompt templates per use case

Each template is followed by the filled prompt from the best run of that kind on 2026-09-20 and what it produced. Scores are R relevance, T accuracy, V visual, N narration, Q quiz, F format, 1 to 5 (`rubric.md`). Prompts are pasted into the web composer at https://scrimba.com/explain?via=u42d4986 unless the template says otherwise.

## 1. Concept lesson (web composer, Standard style)

```
Explain <one claim>, for <who> who <already knows> and wants to <goal>.
Cover: 1) <point> 2) <point> 3) <point>.
Include one short diagram slide: <a> -> <b> -> <c> -> <d>.
Animate <one named motion>. | No animation.
One JavaScript code slide showing <exact function>, under 18 lines, runnable as written, JavaScript not Python.
Finish with a quiz on <the one fact>.
```

Filled (A2, `guide0sp3ljm85`, 1:28, 8 slides, R5 T5 V3 N4 Q5 F5):

> Explain how retrieval-augmented generation (RAG) works, for a JavaScript developer who has called an LLM API once and wants to build a chatbot that answers questions from their own docs. Cover why you cannot paste every doc into the prompt, chunking, embeddings, similarity search, and how the retrieved chunks end up in the prompt. Include one pipeline diagram slide with the ingest path and the query path, one JavaScript code slide that embeds a query and runs a cosine-similarity search over an in-memory array (JavaScript, not Python), and finish with a quiz.

What it produced: title, cards (2), diagram, list, animation, code, code, quiz. Correct `cosineSimilarity` with magnitudes. The V3 came from "ingest path and the query path", which rendered as two stacked `flowchart TD` subgraphs in a 180 px column in all three RAG runs. The template above replaces that phrase with a single arrow chain, the phrase that scored V5 in the in-lesson run (adding the words "left-to-right" is untested; see `lessons-learned.md` Open items). The same prompt in Explain style (A1) mislabelled a dot product as cosine similarity; in Professor style (A3) it produced a `[0.1, 0.9, ...]` literal (SyntaxError) and an undefined `userQuery`. Standard is the default for developer audiences.

## 2. Course companion from inside a lesson (EXPLAIN button)

Open the scrim, pause where the concept is on screen, highlight the lines the explainer should anchor on, click EXPLAIN. One text input; no style, attachment or visibility control, so everything goes in the question. Result opens as an overlay, is listed in the scrim sidebar under Explainers "at m:ss", and comes out Unlisted.

```
Explain why this lesson <does the thing on screen>. Anchor on the highlighted code: <paste the exact lines>.
Audience: <who> who <already knows> and just watched this scrim.
Cover three things. 1) <point>. 2) <point>. 3) <point>.
Use JavaScript code, not Python.
Include one short diagram slide: <a> -> <b> -> <c> -> <d> -> <e>.
Finish with a quiz.
```

Filled (`guide0ab07v8g9`, Learn RAG "Chunking text from documents" at 9:29, 1:31, 7 slides, R5 T4 V5 N5 Q5 F5, the best explainer of the set):

> Explain why this lesson splits podcasts.txt into chunks before it creates embeddings. Anchor on the highlighted code: new RecursiveCharacterTextSplitter({ chunkSize: 150, chunkOverlap: 15 }). Audience: a JavaScript developer who has called an LLM API once and just watched this scrim. Cover three things. 1) What goes wrong when chunks are too large: one vector averages several topics, you can hit the embedding model's token limit, and the retrieved chunk bloats the chat completion prompt. 2) What goes wrong when chunks are too small: sentences lose their surrounding context, fragments make no sense on their own, and you store and search more vectors for weaker matches. 3) How chunk size relates to the similarity search that comes next: the user's short question is embedded and compared with every chunk vector, so chunks should be about as specific as the questions people will ask; explain why chunkOverlap: 15 helps at the boundaries. Use JavaScript code, not Python. Include one short diagram slide: document -> chunks -> embeddings -> vector store -> query match. Finish with a quiz.

What it produced: title, code (`index.js`, the exact splitter config), `flowchart LR` pipeline fully legible, cards (3), cards (3), overlap animation (Chunk A drawn, then A/B with shaded overlap), quiz B unambiguous. The highlighted code became the code slide verbatim. Note the quiz question was lifted straight from point 3, so the fact you want tested should be the last numbered point.

## 3. Document walkthrough with an attachment (web composer)

Drop the file onto the composer (a chip appears with an X). Long pastes become attachments automatically.

```
Explain this document for <who> who wants to <goal>.
Focus on <two or three named sections>.
Include one sequence-diagram slide of <the exchange> between <A> and <B>.
One short <TypeScript|JavaScript> slide showing <the minimal real API call>.
Finish with a quiz.
```

Filled (B, `guide02qftck7g`, attachment `mcp-reference.md`, 1:17, 7 slides, R5 T5 V3 N5 Q5 F5):

> Explain this document for a Node.js developer who wants to build their first MCP server. Focus on what a server offers (tools, resources, prompts), the stdio transport, and the initialize handshake. Include one sequence-diagram slide of the three-message handshake between client and server, one short TypeScript slide showing a minimal tool registered with the MCP SDK, and finish with a quiz.

What it produced: title, cards (3), stdio animation, sequence diagram `initialize -> result -> notifications/initialized`, `server.ts` with a valid `@modelcontextprotocol/sdk` + `zod` call, list (3), quiz. The named deliverables ("one sequence-diagram slide of the three-message handshake", "one short TypeScript slide") came back exactly. V3: the unrequested stdio animation parked a "JSON-RPC" pill over the "Host Client" label. Add "No animation" when nothing in the topic moves.

## 4. Playlist (web composer, playlist toggle on)

The toggle (`op-button.playlist-toggle`) does not persist. Visibility applies to all lessons. Explain plans the curriculum, then builds each lesson as a normal explainer with its own URL.

```
<Topic>, for <who> who <already knows>.
<N> lessons, each under 2 minutes, one idea per lesson.
Lesson 1: <one claim>; include one <diagram type> slide.
Lesson 2: <one claim>; one JavaScript code slide showing <thing>.
Lesson 3: <one claim>; one JavaScript code slide showing <thing>.
Every code slide is JavaScript. End every lesson with a quiz on that lesson's claim.
```

Filled (C, `guide0j3tt3irh` / `guide0ih5ernr6` / `guide0bnbt17e2`, 1:15 / 1:14 / 0:51, F3 F4 F3):

> Context engineering for AI agents, for a developer who has built one chatbot and is now adding tools and memory. Three lessons, each under 2 minutes. Lesson 1: what actually goes into the context window on every call (system prompt, message history, tool schemas, tool results) and why it fills up faster than you expect; include one diagram slide. Lesson 2: retrieval versus long context, when to fetch a few relevant chunks and when to send everything. Lesson 3: managing memory and tool results, summarising old history, truncating large tool output, and keeping state outside the window. Use short JavaScript examples where code helps, and end lesson 3 with a quiz.

What went wrong and what the template changes: four sub-topics in lesson 1 dropped "tool results"; lesson 3 dropped "keeping state outside the window"; "where code helps" produced a JSON slide in lesson 1; "end lesson 3 with a quiz" produced a quiz on every lesson anyway (so ask for one per lesson and choose the fact); lesson 2, a comparison, got an ambiguous quiz. The template limits each lesson to one claim, names the code, and states "every code slide is JavaScript".

## 5. Code walkthrough from a repository (Claude Code + MCP)

No composer. Claude writes the OPML itself against the contract (`mcp-authoring-contract.md`). Run per invocation with `--mcp-config`, never persistent config.

```
Read <file(s) and function(s)>. Then, using the Scrimba MCP tools, create ONE explainer that explains <one claim>, for <who> who <already knows>, with <one diagram slide type> and a quiz. Every code slide is <language of the repo>; if the audience uses another language, say so in narration. Make it unlisted. Mode <square|landscape|portrait>. Keep code slides under 15 lines and 60 chars. When done, reply with the explainer URL and a slide list.
```

Filled (`guide049ig84ai`, 5:12, 14 slides, R5 T5 V4 N5 Q4 F3):

> Read agent.py (the Agent._agent_loop method) and utils/tool_util.py. Then, using the Scrimba MCP tools, create ONE explainer that explains how this agent decides to call a tool and feeds the result back into the model, for a JavaScript developer who has called an LLM API once, with a diagram slide and a quiz. Make it unlisted. When done, reply with the explainer URL and a short summary of the slides you wrote.

What it produced: every code slide verified line by line against the source; both quiz answers correct; the quiz is cards plus an answers list (the contract has no quiz item, so MCP quizzes are not interactive). F3 because the code was Python for a JS audience; the template now says which language the code is and where to reconcile.

## 6. Pull request for reviewers (PR endpoint)

Same as 5 with the PR endpoint (`https://scrimba.com/explain/pr/mcp`), which starts unlisted and has no playlist tool. Give the agent the PR description and diff as files.

Filled (`guide04mover9n`, 6:21, 12 slides, R5 T5 V3 N5, no quiz):

> Make a Scrimba explainer of this pull request. The PR description is in pr-485.md and the full diff is in pr-485.diff (read both with the Read tool). Audience: a JavaScript developer who has shipped one webhook. Use a diff slide for the key change. When done, reply with the explainer URL.

What it produced: sequence diagram, cards (4), forged-route animation, one diff slide, three TS code slides, list, state diagram, cards (4). Code matched the diff verbatim. V3 from the diff slide at 12 px with a wrapped line, 4-card grids wrapping 3+1, and a `stateDiagram-v2` rendered as a tall column. Ask for at most 3 cards per slide, diff sides under 10 lines and 50 chars, and no state diagram in landscape.

## Phrases with evidence

Produced what was asked, every time it was used:
- "for a <role> who has <done one concrete thing> and wants to <goal>"
- "Cover three things. 1) ... 2) ... 3) ..."
- "one sequence-diagram slide of the three-message handshake between client and server"
- "one short TypeScript slide showing a minimal tool registered with the MCP SDK"
- "Anchor on the highlighted code: <exact snippet>"
- "one short diagram slide: a -> b -> c -> d -> e"
- "(JavaScript, not Python)"
- "finish with a quiz"
- "Make it unlisted" (MCP; honoured at creation)

Produced weak slides:
- "one pipeline diagram slide with the ingest path and the query path" (stacked TD subgraphs, unreadable, three of three)
- "include one diagram slide" with no shape named (default TD layout)
- "use short JavaScript examples where code helps" (JSON slide)
- four sub-topics in one lesson (last one dropped, three of three)
- "end lesson 3 with a quiz" in a playlist (quiz on every lesson)
- a comparison lesson plus "quiz" (ambiguous answer)
- no attachment plus "code slide" (pseudo-helpers, syntax errors)
