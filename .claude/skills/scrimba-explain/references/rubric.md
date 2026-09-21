# Quality rubric and visual verification

## Rubric

Six axes, 1 to 5 each. An explainer ships when every axis is 4 or higher and T is 5. A T below 5 is fixed with Redo slide before anyone sees it; a V below 4 is fixed with Redo slide ("redraw as one arrow chain: a -> b -> c -> d", "cut this code to the core lines") or accepted with a note.

| Axis | 5 | 3 | 1 |
|---|---|---|---|
| R relevance | Every numbered point covered, pitched at the audience sentence, nothing off-topic | One requested point missing, or one slide aimed at the wrong level | Generic lesson on the topic word |
| T accuracy | Every code slide runs as written and matches its source; every diagram label and narration claim is true | One soft claim or mislabel (A1 dot product called cosine) | Syntax error, undefined identifier, wrong quiz answer |
| V visual | Every diagram legible at stage size without zoom; code fits the frame at 16 px; animations match the narration | One tiny or overlapping element (TD subgraph column, pill over a label, 4-card wrap) | Slides unreadable or contradicting the voice |
| N narration | Concrete, one analogy carried through, no filler, no hype openers | Terse or slightly generic | Filler, wrong terms, silent slides |
| Q quiz | One question on the lesson's core fact, one defensible answer, distractors plausible | Answer depends on an assumption not taught (C2) | No quiz when asked, or wrong key |
| F format | Every requested slide type present in the requested language, target length hit | One deliverable swapped (JSON for JS, Python for a JS audience) or extra quizzes | Format request ignored |

Reference scores from 2026-09-20 (best first): in-lesson chunking 5/4/5/5/5/5; MCP server B 5/5/3/5/5/5; agent loop 5/5/4/5/4/3; RAG Standard 5/5/3/4/5/5; PR endpoint 5/5/3/5/-/4; RAG Explain 4/3/2/4/4/5; RAG Professor 4/3/3/4/5/5.

## Verification procedure (Claude in Chrome)

Do this on every explainer before it is shared, embedded, or made Public. The account is the user's Pro account and everything you do is visible on it, so: own tab only, never Delete, never touch settings or billing, and Redo or Regenerate only when the user asked for fixes.

1. **Load tools** in one call: `Skill claude-in-chrome`, then `ToolSearch "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__find,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__tabs_close_mcp"`.
2. **Open your own tab** (`tabs_create_mcp`, then `navigate` to `https://scrimba.com/explain/<id>`). Playlist lessons and MCP explainers autoplay on open; hub singles did not. Pause at once with the Play narration button or Space (`computer` key). There is no `<video>` element: the player is a `<guide-page>` custom element, slides are `section.guide-slide` crossfaded by CSS, animations are sandboxed iframes at `/manimjs2/player.html`, diagrams inline Mermaid SVG, code Shiki-style HTML.
3. **Hide the account** before any capture: `document.querySelector('app-nav').style.visibility='hidden'`. Move the mouse out of the frame (`computer` hover at (5, 700)). Turn captions off if a caption sliver would land in the crop (cog, Show Captions).
4. **Measure the stage**: `JSON.stringify(document.querySelector('guide-page').getBoundingClientRect())` (1362x765 at the default 1920x905 window; embeds 800x450) and count slides: `document.querySelectorAll('section.guide-slide').length`. Read the transcript with `get_page_text`: its headings are the slide order and give you the seek targets.
5. **Step every slide.** There is no next-slide control on a single explainer. The precise method is the player model: from `javascript_tool`, reach the `guide-page` element's model and call its `voiceover.seek(<ms>)` with the transcript heading's start time (discover the exact accessor path in the console first; it is not documented), then pause. Fallback: the timeline (click on the thin bar above the controls) or arrow keys (5 s each), which are docs-supported but imprecise for landing on a specific slide. Capture each slide with `computer` zoom on the stage rect, `save_to_disk: true`, numbered `01-title.png`, `02-cards.png`, ... Capture each animation at two moments (early and late) because a scene that never reaches the state the narration describes is a defect (C1 desk never "full", A3 "baking bread" never drawn). Capture the quiz before and after answering. If a diagram looks small, zoom on it separately (`diagram-zoom.png`) to read the labels; the grade is still on the unzoomed frame.
6. **Contact sheet, then look**: `montage -label '%f' <dir>/*.png -tile 3x -geometry 440x300+8+8 <dir>/sheet.jpg`, then Read the JPEG. Check for cursors, the account name, caption slivers, crossfade ghosts, cut-off content. Recapture anything dirty.
7. **Check the code** slide by slide: type it out from the capture, run it or read it against the attachment, scrim file, or repo. Placeholders (`...`, `// ...`) in a literal, identifiers never defined, and comments that misname the algorithm are T failures.
8. **Check the diagram**: every node label readable on the unzoomed capture; arrows go the way the narration says; subgraph labels attached to a visible box.
9. **Answer the quiz** and confirm the key follows from a slide the lesson showed.
10. **Grade** each axis and write the scores plus one line per defect (slide number, what, evidence file). Report before fixing.
11. **Fix** (only when asked): right-click the slide, Redo slide, one instruction ("replace the dot product comment with 'cosine similarity, vectors normalised'"; "redraw as one arrow chain: a -> b -> c -> d -> e, no subgraphs"). Wrong words: Redo. Words fine, audio wrong or silent: cog, Regenerate narration (the voice may change). Both are free. Redo never touches the intro; Regenerate re-records every slide's audio, intro included. Any edit retires an exported MP4; re-export.
12. **Vertical view check** when phones matter: cog, Vertical view, capture one code slide (stage becomes 429x765, code 14 px and wrapping), toggle it back off. The setting is remembered per explainer in this browser.
13. **Close the tab** (`tabs_close_mcp`).

Chrome quirks: the first `javascript_tool` after navigation can return empty, so run it twice; keep any single call under 40 s; `javascript_tool` redacts lines that look like tokens or query strings, so return short strings; the screenshot frame is 1568 px wide at the default window, so re-measure after any `resize_window`.
