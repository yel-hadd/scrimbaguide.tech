# Course and path pages: curriculum extraction


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

## Catalog page (`/courses`)

The grid is a virtualized `<ol>`; only ~16 `<app-tile>`s exist at a time.
Each tile has `data-id="<courseId>"` and `aria-label="<title>"`. To enumerate,
scroll the `<ol>` in small steps and accumulate ids, or skip this and use
`data/courses.json` (the scraper already does it). Tabs "Pro"/"Free" are the
authoritative free-vs-Pro split; mirror them, do not infer from lock icons.

