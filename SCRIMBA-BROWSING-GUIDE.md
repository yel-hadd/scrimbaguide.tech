# Browsing Scrimba with a logged-in Pro account (guide for AI agents)

Purpose: turn real, first-hand access to scrimba.com (Pro account, logged in via
Claude in Chrome) into better pages on scrimbaguide.tech: accurate curricula,
lesson-level detail, quotes from transcripts, and screenshots with proper alt text.

Verified 2026-09-20 against the live app. Selectors are custom elements, which
are far more stable than class names (classes are hashed, e.g. `uh-bg uh-cb`).
If a selector below stops matching, re-derive it with `read_page` / `find`
rather than guessing.

Related, do not duplicate:

- `scraper/scrape.py` already collects the **public** catalog and top-level
  module list (no login) into `output/` → `data/courses.json`. Use it for bulk
  facts (durations, module names, lesson counts). This guide is for what the
  scraper cannot reach: nested modules, per-lesson transcripts, code, the live
  preview, Pro-only lessons, and the Explain feature.
- Content rules in `CLAUDE.md` still apply (no exact prices, no em-dashes,
  independent-reviewer voice, `<AffiliateLink>` for every scrimba.com link).

---

## 1. Session setup

1. Load the skill and tools in one call:
   `Skill claude-in-chrome`, then
   `ToolSearch "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__tabs_close_mcp"`.
2. `navigate` to `https://scrimba.com/home`. The sidebar shows the account name
   (top-left) and Pro lessons open without a paywall; if you see a "Go Pro" wall
   or a login page, stop and tell the user, do not attempt to log in.
3. Work in the tab `navigate` created; close it with `tabs_close_mcp` when done.
4. Never trigger `alert`/`confirm`. Never click "Delete", "Unenroll", "Reset
   progress", "Cancel subscription" or anything under account settings.
5. Playing a scrim marks progress on the user's account. That is harmless but
   avoid it where you can: the transcript, code and slides are all readable
   without pressing play (see §4).

## 2. URL map

| What | URL pattern | Notes |
|---|---|---|
| Dashboard | `/home` | "Recent / Discover / Started / Completed" tabs |
| Course catalog | `/courses` | 73 items; tabs All / Paths (4) / Pro (49) / Free (24). Virtualized list, see §3 |
| Career paths | `/paths` | 4 paths, cards are click handlers, not links |
| Topics | `/topics` | topic hubs |
| Explain hub | `/explain` | Featured / Community / Playlists / Yours / Saved |
| Course or path page | `/<slug>-<id>` e.g. `/learn-javascript-c0v`, `/fullstack-path-c0fullstack` | the short id alone also works: `/c0v`, `/c0p` |
| Lesson (scrim) | `/<slug>-<id>/~<index>` e.g. `/learn-javascript-c0v/~02` | index is base-36-ish (`~02`, `~0a`, `~02c7`); take it from `data-id`, never guess |
| Explainer | `/explain/guide<id>` e.g. `/explain/guide0p98re9ii` | auto-plays on open |
| Explain docs | `https://docs.scrimba.com/explain/introduction`, `.../explain/claude-code` | public, no login |
| Pricing | `/our-pricing` | link to it, never quote numbers |

Global search box (top of every catalog page) searches courses, lessons,
explainers and teachers; it is the fastest way to find a lesson by title.

Course pages ship `Course` and `BreadcrumbList` JSON-LD plus a meta description.
Read them for canonical title/description wording:

```js
[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent)
```

## 3. Course and path pages: curriculum extraction

Structure: `<toc-root>` → `<toc-group>` (module) → `<toc-items>` → `<toc-scrim-item>` (lesson)
or nested `<toc-group>` (paths nest two levels). Certificates are `<toc-cert-item>`.
Header stats live in `<op-stats>` ("9.4 hrs Beginner free 200,000+ students 10 languages").

Facts that matter:

- **Collapsed groups have no children in the DOM.** An expanded group has a
  direct `<toc-items>` child; a collapsed one does not. Expand iteratively
  (nested groups appear only after their parent opens).
- Click only `toc-item-head`. Clicking a `toc-cert-item` navigates and appends
  `;cert…` to the URL.
- The "0/7" in a module header is Scrimba's own lesson count and can differ
  from the number of `toc-scrim-item`s rendered (e.g. 7 vs 9 in the Fullstack
  Path intro). Count items yourself and say which number you are using.
- Badges inside item text: `SAMPLE` = free preview lesson. The small icon
  before a duration is **not** a lock: its tooltip reads "Challenge with
  Instant Feedback" (an AI-checked challenge scrim). Items named
  "Solo Project (PRO) - …" are the Pro-gated pieces inside free courses.
- On plain course pages (e.g. `learn-javascript-c0v`) a JS `.click()` on
  `toc-item-head` does **not** toggle the group; use `find` to get refs for the
  module header rows and click them with `computer` (one click each, a second
  click collapses again). Path pages did respond to JS clicks.
- `<toc-items>` is sometimes wrapped in a `<div>`, so `:scope > toc-items` misses
  it; select the first `toc-items` whose `closest('toc-group')` is the group.
- Durations render lazily: items far below the viewport show no `m:ss` until
  scrolled into view. Before reading, `scrollIntoView` every 6th item without a
  duration with ~250 ms pauses (long loops time out the JS tool at 45 s; do it
  in batches).
- Each `toc-scrim-item` has `data-id="<courseId>/toc/~<index>"`; the lesson URL
  is `/<course-slug-or-id>/~<index>`.

Expand everything and dump the tree (tested on `fullstack-path-c0fullstack`;
on course pages replace the click loop with real clicks, see above, and use the
`own()` helper for items):

```js
const own = g => [...g.querySelectorAll('toc-items')].find(t => t.closest('toc-group') === g);
```

```js
for (let i = 0; i < 8; i++) {
  const c = [...document.querySelectorAll('toc-group')].filter(g => !g.querySelector(':scope > toc-items'));
  if (!c.length) break;
  c.forEach(g => g.querySelector('toc-item-head').click());
  await new Promise(r => setTimeout(r, 800));
}
const walk = (root, d) => [...root.children].flatMap(c => {
  if (c.tagName === 'TOC-GROUP') {
    const items = c.querySelector(':scope > toc-items');
    return [{ t: 'group', d, name: c.querySelector('toc-item-head').innerText.replace(/\s+/g, ' ').trim(),
              children: items ? walk(items, d + 1) : [] }];
  }
  if (c.tagName === 'TOC-SCRIM-ITEM')
    return [{ t: 'scrim', d, name: c.innerText.replace(/\s+/g, ' ').trim(), id: c.getAttribute('data-id') }];
  if (c.tagName === 'TOC-CERT-ITEM') return [{ t: 'cert', name: c.innerText.trim() }];
  return walk(c, d);
});
JSON.stringify(walk(document.querySelector('toc-root'), 0));
```

Item text looks like `"Write your first JavaScript variable 4:32"` or
`"Welcome to the Fullstack Path SAMPLE 2:01"`; split the trailing `m:ss` for
duration. Module text looks like `"Build a Blackjack Game 0/45 2.7 hrs"`.

The course description ("About" section) is the `<article>`; `get_page_text`
returns it cleanly, including the learning-objectives list.

### Catalog page (`/courses`)

The grid is a virtualized `<ol>`; only ~16 `<app-tile>`s exist at a time.
Each tile has `data-id="<courseId>"` and `aria-label="<title>"`. To enumerate,
scroll the `<ol>` in small steps and accumulate ids, or skip this and use
`data/courses.json` (the scraper already does it). Tabs "Pro"/"Free" are the
authoritative free-vs-Pro split; mirror them, do not infer from lock icons.

## 4. Lesson (scrim) pages

Layout: breadcrumb header (`<ide-header>`: Path / Module / Lesson, `0:16 / 2:16`,
EXPLAIN button, sidebar/terminal/browser toggles), file explorer
(`<explorer-widget>`, `<fs-file-entry>`), Monaco editor, live preview
(`<browser-widget>`), slide thumbnail (`<slides-thumb>`), and the player bar
(play, scrubber, volume, `CC`, language menu, settings/speed).

### 4.1 Transcript (highest value, no click needed)

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

### 4.2 Code in the editor

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

### 4.3 Slides and the live preview

- Slides render as images (`/slide-image/…` requests); `<slides-thumb>` in the
  bottom-left toggles the slide deck. Slides are the best source for the
  instructor's own summary of concepts.
- The preview (`<browser-widget>`) shows the running project. Toggle it with the
  browser icon top-right if hidden. For "what you will build" screenshots, this
  pane is the shot.

### 4.4 What to write from a lesson

Per lesson you can now state, without guessing: title, position in module,
duration, whether it is a challenge (transcript says "your challenge is…" or the
code has `// Challenge:` comments), which files and dependencies it uses, and
the exact concept sequence. That is what makes course pages on this site more
useful than the Scrimba listing itself.

## 5. Explain (beta)

Two surfaces:

1. **Inside a lesson**: the EXPLAIN button (top-right of `<ide-header>`) opens
   "Explain this to me": type a question, Scrimba generates a short explainer
   video using the current scrim (and any highlighted code) as context. Button:
   "CREATE EXPLAINER".
2. **Hub at `/explain`**: "Unpack anything": free-text prompt → explainer video,
   Public/Private toggle, attach files. Example prompts shown on the page:
   "Big O notation for normal people", "What is a race condition?". Entry points
   advertised: ChatGPT (`@Explain` plugin), Chrome extension "Explain by
   Scrimba", Claude/Codex via MCP (docs at `docs.scrimba.com/explain/claude-code`),
   and document upload (PDF/DOCX/PNG → lesson).

Explainer pages (`/explain/guide<id>`) auto-play; pause immediately with
`document.querySelectorAll('video').forEach(v => v.pause())`. The narration is
rendered as prose in `<article>` (`get_page_text` returns headed sections such
as "The big idea", "The two rules", "Test your knowledge"), and there is a
"GO DEEPER" button for follow-up explainers. Community cards show author,
duration, like count and age.

Do **not** generate explainers on the user's account unless they ask; it creates
public content under their name by default (the toggle says "Public").

## 6. Screenshots

### 6.1 Rules of thumb

- Read the transcript first and pick the timestamp where the point you are
  making is visible (a bug on screen, a preview updating, a challenge brief,
  the finished app). Then seek there (§6.3). A random frame is not a screenshot.
- Two kinds of image per course page: **chapter title cards** (the intro slide
  of each module, §6.2) and **lesson moments** (editor + preview at a chosen
  time). Two to four lesson moments per page is plenty.
- Before any capture: captions off (gear menu → "Show Captions"), the play
  button hidden (`ide-branch-fab`), and the mouse moved out of the frame
  (`computer` → `hover` at (5, 700)). The cursor is otherwise baked into the
  image.
- Never publish licensed media that appears in slides (the HTML & CSS welcome
  card carries a Peacock-watermarked *The Office* GIF). Skip the slide.
- **Look at every image before it goes into a page.** Build a contact sheet
  and read it (Read tool on the JPEG); check for cursors, overlays, caption
  slivers, cut-off content, the account name, and anything you did not intend:
  `montage -label '%f' static/img/scrimba/<course>/*.webp -tile 3x -geometry 440x300+8+8 sheet.jpg`
- Hide the account before shooting any catalog/dashboard page:
  `document.querySelector('app-nav').style.visibility='hidden'`. Never publish
  the dashboard, "Yours" explainers, email, or billing screens.

### 6.2 Chapter title cards (course artwork)

Course pages have no artwork (`og:image` is the generic Scrimba card, the
`Course` JSON-LD has no `image`). The artwork lives in the **first scrim of each
chapter**: an intro scrim whose first frame is a title slide ("Let's build a
Chrome Extension", "05 · Capstone Project 1 · Tenzies"). It is an inline SVG
inside `<slide-widget>` (Google-Slides export, 960×540 viewBox, text as paths),
so it captures crisply. Not every chapter has one: "Practice Time" blocks and
guest-taught sections open straight into code, and some intros open on the
finished project in the preview pane, which also works as a "what you build"
image.

Recipe: open the chapter's first scrim, wait for `slide-widget svg`, then

```js
document.querySelectorAll('ide-branch-fab').forEach(e => e.style.display = 'none'); // big play button
```

move the mouse away, and `computer` → `zoom` with `region: [261, 71, 1306, 659]`
(the player at the default 1920×905 viewport; re-measure with the SVG's
bounding rect if the window differs), `save_to_disk: true`. If a caption sliver
remains at the bottom, trim ~36 px when converting.

If a slide embeds a GIF or photo over the title, you can hide only the large
`<image>` nodes and keep the text:

```js
const s = [...document.querySelectorAll('slide-widget svg')]
  .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
const sr = s.getBoundingClientRect();
[...s.querySelectorAll('image')].forEach(i => { const r = i.getBoundingClientRect();
  if (r.width > sr.width * 0.3 && r.height > sr.height * 0.3) i.style.display = 'none'; });
```

Do not try to hide the surrounding frame by bounding box: the slide background
is also a path and you hide the whole slide. If the result looks wrong (an
empty frame), do not use it.

Video-style intro scrims autoplay and advance their slide deck. Seek back to
the start (click the scrubber at x≈40, then pause) before capturing.

### 6.3 Lesson moments: seek, pause, capture

The scrubber runs along y≈725 from x≈30 to x≈1410 in the 1568-wide screenshot
frame, so `x = 30 + 1380 * (t / duration)`; duration is in `<ide-header>` as
`m:ss / m:ss`. Click it, `wait` 2–4 s, click play/pause at (17, 725), then
`computer` → `screenshot` with `save_to_disk: true` (full scale, never `scale`
< 1 for a saved image). Clicking inside the preview pane while paused shows a
"re-run" overlay, so seek again rather than interacting with the preview. The
caption line in the shot should match the caption you write.

### 6.4 Files, sizes, naming, alt text

- `static/img/scrimba/<course-slug>/<what>.webp`, e.g.
  `learn-javascript/calculator-challenge-string-concatenation-bug.webp`,
  `learn-react/chapter-05-tenzies-title-card.webp`.
- Convert with cwebp: lesson shots `cwebp -q 82 -resize 1400 0 in.jpg -o out.webp`;
  title cards keep their 1279×720 (`-crop 0 0 1279 684` to drop a caption
  sliver). Keep under ~150 KB; grainy gradient cards land near that.
- Crops (a finished project inside the preview pane) use `-crop x y w h` with
  coordinates read off the saved PNG; re-check the crop in the contact sheet.
- Mount with `<Screenshot>` (`src/components/Screenshot.tsx`): `src`, `alt`,
  `width`, `height`, `caption`, optional `source`. Title cards go in a
  `<div className="screenshot-grid">`.
- Alt text describes what is visible for someone who cannot see it and names
  the product and lesson: `Scrimba Learn JavaScript calculator challenge paused
  mid-solution: the editor shows … and the preview displays Sum: 82`. Not
  `screenshot`, not keyword lists.
- Caption says what to notice and the timestamp. `source` defaults to a
  scrimba.com attribution; pass `source=""` on all but the last card in a grid.
- These are Scrimba's UI and course material: editorial illustration of a
  review, few and purposeful, never a slide deck or a sequence that replaces
  the lesson.

## 7. Tool quirks and reliability (Claude in Chrome)

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
  About section, not the curriculum. Use the JS in §3 for the curriculum.
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

## 8. Suggested workflow per page you are improving

1. Read the existing MDX and its entry in `data/courses.json`.
2. Open the course page, extract the full nested curriculum (§3), diff against
   the MDX; fix the JSON, not prose numbers.
3. Open 2 to 4 representative lessons (first, one mid-course challenge, one
   from the final project). Pull transcript, files, dependencies (§4).
4. Write from what you saw: concept order, project scope, challenge style,
   versions. Attribute quotes. Keep the independent-reviewer voice.
5. Take at most 2 to 3 screenshots for the page (§6), with alt text and captions.
6. Update `src/content/relatedGuidesMap.ts` if you added links; run
   `npm run check:content`; close the browser tab.
