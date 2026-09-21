# Screenshots


## Rules of thumb

- Read the transcript first and pick the timestamp where the point you are
  making is visible (a bug on screen, a preview updating, a challenge brief,
  the finished app). Then seek there (references/screenshots.md, "Lesson moments"). A random frame is not a screenshot.
- Two kinds of image per course page: **chapter title cards** (the intro slide
  of each module, "Chapter title cards" below) and **lesson moments** (editor + preview at a chosen
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

## Chapter title cards (course artwork)

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

## Lesson moments: seek, pause, capture

The scrubber runs along y≈725 from x≈30 to x≈1410 in the 1568-wide screenshot
frame, so `x = 30 + 1380 * (t / duration)`; duration is in `<ide-header>` as
`m:ss / m:ss`. Click it, `wait` 2–4 s, click play/pause at (17, 725), then
`computer` → `screenshot` with `save_to_disk: true` (full scale, never `scale`
< 1 for a saved image). Clicking inside the preview pane while paused shows a
"re-run" overlay, so seek again rather than interacting with the preview. The
caption line in the shot should match the caption you write.

## Files, sizes, naming, alt text

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

