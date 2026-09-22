# Tool quirks and reliability (Claude in Chrome)


- **Slow boot.** The scrim app can sit on `<app-splash>` for 20–30 s (data
  requests return 200; rendering just lags). Wait ~20 s after `navigate`, then
  poll for `ide-transcript-modal` / `editor-widget` for up to 20 s more. Keep
  any single `javascript_tool` call under ~40 s or the CDP call times out at
  45 s and the batch dies.
- **When it stalls, reload.** If `document.body.innerText.length` is still 0
  after ~40 s, re-`navigate` to the same URL (a refresh) rather than waiting
  longer. If two reloads fail, close the tab and open a new one. Unregistering
  the service worker does not help.
- **Stale reads.** Occasionally the first `javascript_tool` call after a
  navigation returns empty (`toc-group` count 0, no article) although the
  screenshot shows the page. Run the same snippet again before concluding
  anything.
- **Batching.** `browser_batch` is faster but one failed step aborts the rest,
  and a batch that waits long stops responding. Two lessons per batch is the
  practical limit; use `wait` steps of 10 s (the tool maximum) rather than
  long JS polls. Never put `computer` → `scroll` in a batch loop: every scroll
  returns a screenshot and burns context for nothing.
- **Redaction.** `javascript_tool` redacts result lines that look like cookies,
  query strings, base64 or keys (`[BLOCKED: …]`) and blocks scripted `fetch`
  to `/op/pub/<id>/data`. Return arrays/objects of short strings, skip network
  calls, read the DOM instead.
- `get_page_text` prefers `<article>`/`<main>`; on course pages that means the
  About section, not the curriculum. Use the JS in references/curriculum-extraction.md for the curriculum.
- `find` works well on this app because tiles have `aria-label`s and rows have
  visible text; `read_page filter:interactive` mostly returns unlabeled
  `button`s on scrim pages, so prefer `find` with a description.
- Viewport: the screenshot frame is 1568 px wide at the default 1920×905
  window; after `resize_window` re-take a screenshot before using coordinates.
- Page `<title>` can be stale (Intro to AI Engineering still says "with Thomas
  Chant"; the teacher card says Arsala Khan). Trust the teacher card and the
  transcript, not the title.
- `read_network_requests` records only after its first call. Useful names:
  `/op/pub/<courseId>/data` (course JSON), `/op/stream/<scrimId>/stream`
  (scrim recording), `/slide-image/…`, `/v1/cdn/*.webm` (video).


## Splash that never clears, and a profile that stops booting scrims (2026-09-21)

- **Splash left over.** Sometimes the scrim app finishes booting (the DOM has
  `ide-header`, the transcript modal and the editor) but `<app-splash>` stays on
  top, so screenshots are a blank dark frame. Hide it:
  `document.querySelector('app-splash').style.display='none'`.
- **Scrim pages stop booting in the logged-in Chrome** after a long session
  (body text length stays 0, `app-splash` only, every data request 200, no
  console errors), while course, path and Explain pages still load. New tabs and
  reloads did not fix it. A headless Chromium on the same machine booted the
  same scrim in 5 s, so it is profile state, not Scrimba. Logged out, course
  scrims show "Only available to signed in users" after one locked scrim, but
  the public demo scrim `s0v687325e` works fully, which is enough for UI shots
  (transcript panel, settings menu, editor and preview). For course content you
  still need the logged-in profile; ask the user to restart Chrome.
- Path pages with long TOCs can freeze the renderer on a heavy
  `javascript_tool` call (45 s CDP timeout); take a screenshot to check the page
  really rendered before concluding it is empty, and re-run the read.
