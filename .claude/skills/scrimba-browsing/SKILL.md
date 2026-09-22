---
name: scrimba-browsing
description: Browse scrimba.com with the user's logged-in Pro account through Claude in Chrome to collect first-hand facts for scrimbaguide.tech pages: full nested curricula, per-lesson transcripts, editor code and dependencies, slides, the live preview, and screenshots with alt text. Use whenever a course, path, hub, feature or how-it-works page needs verified detail or images from inside Scrimba, or when a subagent is told to "open the course", "pull the transcript", "take screenshots" or "check what the lesson actually shows".
---

# Browsing Scrimba (logged-in Pro account)

The scraper (`scraper/scrape.py` → `data/courses.json`) already has the public
catalog: durations, module names, lesson counts. This skill is for what it
cannot reach: nested modules, transcripts, code, the live preview, Pro-only
lessons. Selectors are custom elements (`toc-group`, `ide-transcript-modal`,
`slide-widget`), verified 2026-09-20; class names are hashed, never rely on
them. If a selector stops matching, re-derive it with `read_page` / `find`.

House rules from `CLAUDE.md` apply to what you write (Voice, Affiliate, Links):
no em-dashes, no prices, "reviewed" never "completed", `<AffiliateLink>` on
every scrimba.com link except `scrimba.com/explain` links.

## Session rules

1. Load tools in one call: `Skill claude-in-chrome`, then
   `ToolSearch "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__tabs_close_mcp"`.
2. `navigate` to `https://scrimba.com/home`. The sidebar shows the account
   name and Pro lessons open without a paywall. On a "Go Pro" wall or a login
   page: stop and tell the user; never attempt to log in.
3. Own one tab. Work in the tab `navigate` created and close it with
   `tabs_close_mcp` when done. Parallel agents each get their own tab and never
   touch another's; screenshots need a visible tab (`references/tool-quirks.md`,
   Parallel agents and tab visibility).
4. Never trigger `alert`/`confirm`. Never click Delete, Unenroll, Reset
   progress, Cancel subscription, or anything under account settings.
5. Playing a scrim marks progress on the user's account. Transcript, code and
   slides are all readable without pressing play; prefer that.
6. Generating an explainer spends the user's quota and publishes under their
   name. Only when asked, and through the `scrimba-explain` skill.
7. Never publish the dashboard, "Yours" explainers, email or billing screens,
   or licensed media inside slides. Hide `app-nav` before shooting catalog
   pages.

## Per-page workflow

1. Read the existing MDX and its entry in `data/courses.json`.
2. Open the course page and extract the full nested curriculum
   (`references/curriculum-extraction.md`); diff against the MDX. Fix numbers in
   the JSON, not in prose.
3. Open 2 to 4 representative lessons (first, one mid-course challenge, one from
   the final project). Pull transcript, files, dependencies
   (`references/lesson-extraction.md`). Quote a sentence or two with attribution;
   never paste transcripts.
4. Write from what you saw: concept order, project scope, challenge style,
   versions. Attribute quotes.
5. Take 2 to 3 purposeful screenshots (`references/screenshots.md`): read the
   transcript first, seek to the moment, hide the play button and cursor, look
   at every image in a contact sheet before it goes into a page. Never retouch
   what Scrimba shows; crop only.
6. Mount images with `<Screenshot>` (exact `width`/`height` from `identify`,
   descriptive alt), update `src/content/relatedGuidesMap.ts` if links were
   added, run `npm run check:content`, close the tab.
7. Hand a draft report (facts found, lessons opened, images taken, anything
   surprising) to whoever edits the page. Do not retouch the page a second time
   on hearsay; every claim traces to something you saw.

## References

- `references/url-map.md`: URL patterns, JSON-LD on course pages, search.
- `references/curriculum-extraction.md`: `toc-*` tree, expand-all snippet,
  catalog page virtualization.
- `references/lesson-extraction.md`: transcript modal, Monaco models,
  dependencies, slides and preview, what to write from a lesson.
- `references/screenshots.md`: rules, chapter title cards, lesson moments,
  cwebp commands, naming and alt text.
- `references/tool-quirks.md`: slow boot, reload rules, stale reads, batching,
  redaction, viewport, network names.
- `references/explain.md`: pointer to the `scrimba-explain` skill.
