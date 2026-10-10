# Tool quirks and reliability (agent browser)

The stack is the `agent-browser` skill: Patchright Chrome on the owner's
profile, driven with `mcp__agent-browser__*` tools. Quirks below are about
scrimba.com's app, plus what changed when Claude in Chrome was retired
(2026-10-10).

- **Slow boot.** The scrim app can sit on `<app-splash>` for 20-30 s (data
  requests return 200; rendering just lags). Wait ~20 s (`browser_wait_for` on
  an app marker or time), then poll for `ide-transcript-modal` / `editor-widget`
  with `browser_evaluate` for up to 20 s more. Keep single `browser_evaluate`
  calls short (a few seconds): chunk long loops across calls instead of one
  big `await` inside a snippet.
- **When it stalls, reload.** If `document.body.innerText.length` is still 0
  after ~40 s, `browser_navigate` to the same URL again rather than waiting
  longer. If two reloads fail, close the tab (`browser_tabs` `action: close`)
  and open a new one. Unregistering the service worker does not help.
- **Stale reads.** Occasionally the first `browser_evaluate` after a navigation
  returns empty (`toc-group` count 0, no article) although the screenshot shows
  the page. Run the same snippet again before concluding anything.
- **No redaction.** `browser_evaluate` returns raw values; nothing filters
  cookies, tokens or query strings for you. Never request them (session rules,
  `agent-browser` skill). Return arrays/objects of short strings and read the
  DOM instead of the network.
- **Page text.** `browser_snapshot` gives the accessibility tree (tiles have
  `aria-label`s, rows have visible text). For raw text use `browser_evaluate`
  with `document.querySelector('article, main')?.innerText ?? document.body.innerText`;
  on course pages `<article>` is the About section, not the curriculum (use the
  JS in references/curriculum-extraction.md for the curriculum).
- **Viewport is the screenshot frame.** Call `browser_resize {width: 1920,
  height: 905}` before using any pixel recipe (scrubber, slide rects), and
  re-measure with `getBoundingClientRect()` after resizing. Screenshots are
  taken from CDP, so a background tab usually captures fine; if one comes back
  blank, select the tab first.
- **Coordinates.** `browser_click`/`browser_hover` need an element ref from
  `browser_snapshot`/`browser_find` or a unique selector. For literal pixel
  positions (scrubber seeks, mouse moves out of frame) use
  `browser_run_code_unsafe` with `page.mouse.click(x, y)` / `page.mouse.move(x, y)`.
- Page `<title>` can be stale (Intro to AI Engineering still says "with Thomas
  Chant"; the teacher card says Arsala Khan). Trust the teacher card and the
  transcript, not the title.
- **Network.** `browser_network_requests` lists requests seen since the tab was
  opened (call it after the page settles). Useful names: `/op/pub/<courseId>/data`
  (course JSON), `/op/stream/<scrimId>/stream` (scrim recording),
  `/slide-image/…`, `/v1/cdn/*.webm` (video). Full headers/body of one request
  with `browser_network_request`.

## Splash that never clears, and a profile that stops booting scrims

- **Splash left over.** Sometimes the scrim app finishes booting (the DOM has
  `ide-header`, the transcript modal and the editor) but `<app-splash>` stays on
  top, so screenshots are a blank dark frame. Hide it:
  `document.querySelector('app-splash').style.display='none'`.
- **Scrim pages stop booting in the profile** after a long session (body text
  length stays 0, `app-splash` only, every data request 200, no console
  errors), while course, path and Explain pages still load. New tabs and
  reloads do not fix it; it is profile state, not Scrimba. Fix: close the
  browser (`browser_close`), let the next call relaunch it, and if that fails
  report it; the owner rebuilt the profile once already (2026-10-10).
  Logged out, course scrims show "Only available to signed in users" after one
  locked scrim, but the public demo scrim `s0v687325e` works fully, which is
  enough for UI shots (transcript panel, settings menu, editor and preview).
  For course content you need the logged-in profile.
- Path pages with long TOCs can lag on a heavy `browser_evaluate` call; take a
  screenshot to check the page really rendered before concluding it is empty,
  and re-run the read.

## Parallel agents and tabs (updated 2026-10-10)

Reading (curriculum, transcripts, code) runs fine in parallel, one tab per
agent (`browser_tabs` `action: new`/`select`), about 400k tokens per course
including review and fix. Captures come from CDP rather than the old
extension's window grab, so a tab no longer has to be the active tab of an
on-screen window; if a background-tab capture still comes back blank, select
the tab and retry, and check `document.visibilityState` in the snippet. Keep
the browser window open (headful) while capturing. Hand the fixer the drafting
report, or it strips first-hand facts as untraceable. Non-Scrimba UI review
uses Playwright against `docusaurus serve --port 3050` so it does not compete
for the profile.
