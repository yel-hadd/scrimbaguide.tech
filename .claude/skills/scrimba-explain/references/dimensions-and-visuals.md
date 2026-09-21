# Dimensions, slide types, visuals

## Frame sizes

| Surface | Size | Notes |
|---|---|---|
| Web player, Windowed view | stage 1362x765 CSS px (16:9) at a 1920x905 window | Title, description, Sources, transcript below |
| Web player, Vertical view | stage 429x765 (9:16) | Per-viewer toggle in the cog menu, remembered per explainer per browser, also in embeds. Text reflows, code drops to 14 px and wraps (`// From LLM API` wrapped in A1) |
| Embed | `width="800" height="450"` default (16:9) | Set px or %; quiz and long code crop in a short frame; the docs use a 56.25% padding-bottom responsive box |
| Fullscreen view | player covers the page, inside the browser window | `?fullscreen=1`; embeds get true Full screen |
| MP4 export | 2560x1440, 60 fps, subtitle track plus `.vtt` | Public or Unlisted only; edits retire it |
| MCP `mode` | `square` (default), `portrait`, `landscape`; fixed at open | The web player still rendered a `square` explainer as 16:9 |

The web composer has no size control: output is landscape and viewers choose Vertical view. For a phone-first deliverable, author through MCP with `mode: portrait`, or keep code under 50 chars a line and tell viewers to use Vertical view. Nothing inside a slide scrolls in the contract; on the web a tall code block scrolls to keep the pointer visible.

## Slide types and how to request each

| Type | Request phrase | Fit rules | Evidence |
|---|---|---|---|
| Title card | automatic; the title (under 45 chars) and one-sentence description are the tile text. MCP: set it in `start_explainer_stream(title)`; web: Explain writes it, fix it afterwards via right-click, Edit Explainer | intro cannot be redone | every run |
| Cards | "X vs Y, when do I use which?"; parallel concepts | 2 or 3 cards; 4 wrap to 3+1 with one dangling | PR slides 3 and 12 |
| Ordered / bullet list | steps; discrete points | 3 to 6 entries | C1, C3 |
| Code | paste or attach code, or "one JavaScript code slide showing <function>" | web: about 20 lines max; contract: 15 lines, 50 to 60 chars; real code, no `...` placeholders | A2 correct; A3 `[...]` SyntaxError |
| Diff | "use a diff slide for the key change" (agent), or paste both versions | 10 lines per side, under 50 chars; side by side wide, stacked narrow | PR slide 5 at 12 px, wrapped `return` mis-indented |
| Diagram | "one sequence-diagram slide of A, B, C" or "one diagram: a -> b -> c -> d" | sequence: 3 participants; flowchart: one row or single fan-in; five nodes in a row observed legible (up to six is an extrapolation, untested); TD with stacked subgraphs and `stateDiagram-v2` render as a tall unreadable column in 16:9 | in-lesson LR V5; A1 to A3 TD column V2 to V3; PR state diagram |
| Animation | "animate <named motion>" only when something moves; "no animation" for comparisons and advice | 8 to 25 s; square 8x8 canvas; four boxes in a row do not fit | in-lesson overlap clean; B pill overlap; C3 stray arrow; A2 point above axes |
| Image | non-code topics; "make it visual, like a documentary"; name one style (sketchbook, watercolor, pixel art, blueprint, photorealistic) | one style per explainer; max 12 generated pictures including infographics; programming explainers on the web get none | none in our code runs |
| Infographic | "show the four stages as one infographic" (web only) | exactly four parts; one per explainer is enough | not used |
| Math | "derive the update rule, step by step"; numbers alone do not trigger it | one formula per slide; ~30 LaTeX chars a line | not used |
| Quiz | "finish with a quiz on <fact>" | one right answer of three or four; never on TLDR, summaries, own-code tasks, Chrome extension pages | in-lesson B unambiguous; C2 ambiguous |

## Pacing that graded best

- Web single: 7 slides, 1:15 to 1:30, one idea per slide, cards of 3 or fewer, code of 18 lines or fewer. The generator produces about six content slides whatever the prompt asks, so extra sub-topics are dropped, not squeezed.
- MCP walkthrough: 12 to 14 slides, 5 to 6 minutes, held up because each code slide had pointer highlights; the diff and state-diagram slides were its weakest visuals.
- Contract cap: 10 minutes of narration (about 1,500 words), 10 to 50 slides; narration past the cap is dropped silently.

## Tiles and thumbnails

No slide becomes a thumbnail. Hub and profile tiles are a procedural gradient pattern in the explainer's theme colour with title, description, avatar, duration, views, age, and a PUBLIC or UNLISTED badge (`preview_image: null` on all eleven). The only visual identity a card has is its title (search-style keywords, under 45 chars, at most one emoji at the end) and the one-sentence description (under 120 chars). Both are editable after creation through right-click, Edit Explainer (Name and Synopsis), which the docs do not mention.

## Player facts useful when planning

- Narration pointer (blue arrow) and anchor highlights are part of the player and appear in captures.
- Speeds 0.8x to 2.5x remembered per browser; captions on by default.
- Owner cog menu: Show Captions, Vertical view, Show watermark, Go deeper, Save to Watch later, Report issue, Copy link, Copy fullscreen link, Copy embed code, Privacy (Public/Unlisted), Redo slide, Regenerate narration. Embedded menu: Show Captions and Vertical view only. PR-endpoint explainers not claimed by the viewer show no owner items.
- Transcript headings under the player equal the slide order; use them to plan seeks.
