# Entry points and mechanics

Six ways to make an explainer. Pick by what the lesson must be grounded in and who will watch.

| Entry | Context it gets | Controls | Default visibility | Quiz | Styles |
|---|---|---|---|---|---|
| Web composer | prompt, pasted code, attachments, URLs it opens | style picker, attach, playlist toggle, visibility picker | Public (signed in); Unlisted signed out | yes | 7 |
| In-lesson EXPLAIN | the scrim: title and course, all editor files, highlighted code, teacher narration up to the pause, the paused moment | one text input only | Unlisted (Publish to community button) | yes | scrim teacher's voice or your selected style |
| Chrome extension | first ~12,000 characters of the page | click | Public | never | n/a |
| ChatGPT / Codex plugin | the conversation; the model writes the lesson | prompt | Unlisted | model-written | none |
| Claude Code MCP | the repository; Claude writes OPML | prompt, `mode`, `visibility` | private draft, `?claim=` link | cards only | none |
| PR endpoint / CI action | the PR diff; Claude writes OPML | prompt, `visibility` at claim | Unlisted, one claimer | cards only | none |

## Web composer (https://scrimba.com/explain?via=u42d4986)

- The composer is a contenteditable (`.op-md-editor`); the paperclip opens a native file picker. Drop a file onto the editor (or a synthetic `drop` with a DataTransfer from `javascript_tool`) to get a chip with an X. Long pastes become attachments.
- Style chevron on the Explain button: Explain, Standard, Per, Tom, LOL, Professor, TLDR. The choice persists across page loads, so read it before every submit.
- Playlist toggle `op-button.playlist-toggle` does not persist. Visibility select starts on Public each time.
- A 1:20 explainer was playable about 10 s after submit; a 3-lesson playlist finished in under 40 s.
- Accepts: code files (.js .ts .py .html .css .json), text and markdown, PDFs, images (screenshots, whiteboard photos), .ipynb. Attached code becomes code slides; papers and notes become diagrams and images; an attached picture can be shown as an image slide. Whole repositories go through an agent.
- Web search: no switch. Explain searches for recency-sensitive topics (versions, releases, products, "latest"); lasting concepts get none. A pasted URL is opened and read; unreadable pages are acknowledged on a slide. Sources row (domain pills, first six, click opens) appears only when a search grounded the explainer, is visible to every viewer, and is absent in embeds.

## In-lesson EXPLAIN button

- Header button EXPLAIN (tooltip "Explain this to me") or the editor pane's Options menu on newer scrims. Modal: "What would you like explained more?", CREATE EXPLAINER. Empty box asks "Explain what's happening here".
- Highlight lines first; they become the focus and reappear verbatim as the first code slide. Pause where the concept is on screen; narration up to that point is context. Hidden on scrims locked for the plan; needs sign-in.
- Result: overlay player at `/<course>/~<scrim>;explain/<id>` and a standalone page at `/explain/<id>` with a "Back to lesson" chip; listed in the scrim sidebar under Explainers "at m:ss" (only your own). Inherits a non-public scrim's visibility. Counts against the allowance like any explainer.

## Chrome extension ("Turn articles into videos")

Signed-in Scrimba account in Chrome; click on any article; overlay explainer; Open on Scrimba button. Reads about 12,000 characters, so a long article covers only its opening. Public by default; no quiz; no web search. Change visibility on Scrimba afterwards.

## ChatGPT / Codex

Plugin "@Explain Video Generator": type `@` and ask, or just describe it. Works in ChatGPT web/desktop/mobile, Codex in the ChatGPT desktop app, Codex CLI (`/plugins`); not the IDE extension (use MCP). The chat model writes the lesson; a stronger model or "take your time" improves it. Unlisted link; claim to keep.

## Claude Code and the MCP server

Endpoint `https://scrimba.com/explain/mcp`, remote streamable HTTP, no auth. Four tools: start, append, finish, create_playlist (2 to 12 lessons, one claim link). Drafts are private and free; opening the claim link signed in claims it (and spends one allowance unit); images render on first open, narration after claim. Ask for `unlisted` at creation to share the link right after claiming. Per-invocation recipe and the authoring rules: `mcp-authoring-contract.md`. The docs' persistent alternative is `claude mcp add --transport http scrimba-explain https://scrimba.com/explain/mcp`; this skill uses `--mcp-config` per run instead so nothing is written to the user's config.

## PR endpoint and CI

Endpoint `https://scrimba.com/explain/pr/mcp`: same three stream tools, no playlist, unlisted from the first chunk so a PR-comment link works without an account; the plain URL shows nothing until someone opened the `?claim=` link; only one person can claim, so think before posting the claim link on a public PR. Optional `visibility: "private"` applies at claim. Limits: 10 minutes of narration per explainer, 30-minute idle auto-finish, rate limits shared across all Scrimba MCP endpoints with `429` plus `Retry-After`. Headless config `scrimba.mcp.json` `{ "mcpServers": { "scrimba": { "type": "http", "url": "https://scrimba.com/explain/pr/mcp" } } }` and `claude -p "Make a Scrimba explainer of this pull request" --mcp-config scrimba.mcp.json --allowedTools "mcp__scrimba__start_explainer_stream,mcp__scrimba__append_explainer_chunk,mcp__scrimba__finish_explainer_stream"`. GitHub Action `scrimba/pr-explainer` (`npx pr-explainer` writes `.github/workflows/scrimba-pr-explainer.yml`, skips draft and fork PRs, keeps one PR comment updated).

## Playlists

Composer playlist mode: describe the curriculum; Explain plans lessons, then builds each as a normal explainer with its own URL, embed code and Save button. Player gets Next/Previous explainer; the end card auto-advances after a few seconds. Visibility applies to every lesson. Cannot export as one video; deleting deletes every lesson; can be Featured. Quota: each lesson is a normal explainer with its own URL (docs), so budget a 3-lesson playlist as 3 units until metering is confirmed (`limits-and-plans` does not mention playlists).

## Languages

33 narration languages with native voices (Afrikaans, Arabic, Bulgarian, Chinese, Croatian, Czech, Danish, Dutch, English, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Malay, Norwegian, Polish, Portuguese, Romanian, Russian, Slovak, Spanish, Swedish, Tamil, Turkish, Ukrainian, Vietnamese). Ask in the language or for it ("explain closures in Japanese"); slides, titles and narration follow; code, identifiers and filenames stay. Unsupported language: slides in it, English voice. Infographic labels follow the request language.

## Go deeper and follow-ups

- Go deeper: top-corner button, right-click menu, cog menu. Pauses, names the current slide, and makes a new explainer with the lesson and slide as context, keeping the teacher. Needs an account, spends one allowance unit, not offered in embeds.
- Follow-ups: end card with model-written questions plus a free box; each pick is a new explainer (one unit). Waits for the quiz. In playlists, offers the next lesson and auto-advances. On unclaimed claim-link explainers it offers "save to your profile" instead. MCP explainers end with exactly two follow-up prompts the agent writes.

## After creation

- Redo slide: right-click a slide, write the change ("use a diagram instead of text here", "cut this code to the core lines", "the pointer isn't landing on the right things"). Any slide but the intro; owners only; free; works on claimed agent explainers.
- Regenerate narration: cog or right-click; re-records all audio, content untouched, voice may change; free.
- Edit Explainer (right-click; undocumented): Name and Synopsis fields.
- Visibility: cog menu Privacy, or right-click. Copy link, Copy fullscreen link (`?fullscreen=1`), Copy embed code; all hidden while Private.
- Export video: right-click; render on Scrimba's servers; email when done; Download video (MP4 2560x1440 60 fps) and Download captions (.vtt); Public or Unlisted only; any edit retires it.
- Delete: owner only, confirms "Are you sure?"; deletes exports; agents cannot delete. Never do this on the user's behalf without an explicit ask.
- Rating: "Happy with this video?" thumbs, shown once to the creator. Report issue: support ticket to Scrimba from anyone.
