# URL map


| What | URL pattern | Notes |
|---|---|---|
| Dashboard | `/home` | "Recent / Discover / Started / Completed" tabs |
| Course catalog | `/courses` | 73 items; tabs All / Paths (4) / Pro (49) / Free (24). Virtualized list, see references/curriculum-extraction.md |
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

