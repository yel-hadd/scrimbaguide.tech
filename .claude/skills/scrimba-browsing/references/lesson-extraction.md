# Lesson (scrim) pages: transcript, code, slides


Layout: breadcrumb header (`<ide-header>`: Path / Module / Lesson, `0:16 / 2:16`,
EXPLAIN button, sidebar/terminal/browser toggles), file explorer
(`<explorer-widget>`, `<fs-file-entry>`), Monaco editor, live preview
(`<browser-widget>`), slide thumbnail (`<slides-thumb>`), and the player bar
(play, scrubber, volume, `CC`, language menu, settings/speed).

## Transcript (highest value, no click needed)

Every lesson embeds `<ide-transcript-modal>` with the full timestamped
transcript already rendered, even while the modal is closed. Extract it
without playing the video:

```js
const m = document.querySelector('ide-transcript-modal');
const leaves = [...m.querySelectorAll('*')]
  .filter(e => e.children.length === 0 && e.textContent.trim())
  .map(e => e.textContent.trim()).slice(3);          // drop "Transcript", "Timestamp Toggle", "Close"
const lines = []; for (let i = 0; i < leaves.length; i += 2) lines.push(leaves[i] + ' ' + leaves[i + 1]);
lines;                                                // ["0:00 Your very first exposure…", "0:05 …"]
```

Return an **array of lines**, not one long string: the extension truncates long
string results and redacts anything that looks like a secret or a query string
(you will see `[BLOCKED: …]`). Redacted lines are things you must not publish
anyway (API keys, tracking URLs), so just skip them.

The language menu ("ENGLISH") lists the subtitle languages; "10 languages" in
`<op-stats>` refers to these. If you need the visible UI for a screenshot, open
the modal via the settings (gear) menu in the player bar or `find "Transcript"`.

Transcripts are Scrimba's copyright. Use them to **understand** a lesson and to
quote a sentence or two with attribution ("as the instructor puts it in lesson
3…"). Never paste full transcripts, never rewrite a lesson into an article that
substitutes for taking it.

## Code in the editor

Monaco is global (`window.monaco`). Only the currently open file has a model;
click other `<fs-file-entry>` items to load them.

```js
[...document.querySelectorAll('fs-file-entry')].map(f => f.innerText.trim());     // file list
monaco.editor.getModels().map(m => ({ uri: m.uri.path, lines: m.getLineCount() }));
monaco.editor.getModels()[0].getValue().split('\n');                                 // array of lines
```

Dependencies (e.g. `react@16.13.1`) are listed under "DEPENDENCIES" in the
explorer; read them with `get_page_text` or `find "dependencies list"`. This is
how you state truthfully which React/Node version a course teaches.

Note the editor state is the scrim's **final** state until you scrub the
scrubber; content at `0:00` may already show the finished code.

## Slides and the live preview

- Slides render as images (`/slide-image/…` requests); `<slides-thumb>` in the
  bottom-left toggles the slide deck. Slides are the best source for the
  instructor's own summary of concepts.
- The preview (`<browser-widget>`) shows the running project. Toggle it with the
  browser icon top-right if hidden. For "what you will build" screenshots, this
  pane is the shot.

## What to write from a lesson

Per lesson you can now state, without guessing: title, position in module,
duration, whether it is a challenge (transcript says "your challenge is…" or the
code has `// Challenge:` comments), which files and dependencies it uses, and
the exact concept sequence. That is what makes course pages on this site more
useful than the Scrimba listing itself.

