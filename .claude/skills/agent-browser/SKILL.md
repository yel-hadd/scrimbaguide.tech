---
name: agent-browser
description: The agent browser stack for scrimbaguide.tech, replacing Claude in Chrome (2026-10-10). A Patchright-patched real Chrome on the owner's persistent logged-in profile (/home/toor/sg-work/agent-browser/profile), driven through the agent-browser MCP server. Load this skill before any skill or agent opens scrimba.com, Google Trends, Scrimbassadors or impact.com with the owner's sessions. Covers the tool map, session rules, the Chrome lock, and what to do when the session is logged out or a site challenges us.
---

# Agent browser (Patchright Chrome, owner's profile)

Every skill that used to say "Claude in Chrome" now uses this stack:

- **Patchright** (`/home/toor/node_modules/patchright`), an undetected fork of
  Playwright, driving the real installed Chrome (`--browser chrome`), headful.
  `navigator.webdriver` is false; the fingerprint is the owner's own Chrome 151.
- **A persistent profile** at `/home/toor/sg-work/agent-browser/profile` holding
  the owner's Scrimba Pro login (and any other login the owner has done there).
  Treat the directory like a password file: never read cookie, localStorage or
  token values out of it, never copy it into the repo, never commit it.
- **The `agent-browser` MCP server** (repo `.mcp.json`), which exposes the
  Playwright MCP tools as `mcp__agent-browser__*`. One server process owns the
  profile: only one browser at a time can use it.

If a generic `mcp__playwright__*` server is also connected, never use it: it is
stock Playwright with a fresh profile (detectable, logged out). The agent
browser is always `mcp__agent-browser__*`.

## Stack wiring (what makes it undetected, and how to check)

The MCP server runs stock `@playwright/mcp` from `/home/toor/node_modules`;
it is only undetected because `playwright` and `playwright-core` in that
directory are **symlinks to `patchright` / `patchright-core`** (the stock
copies sit beside them as `*.stock`). Any `npm install` under `/home/toor`
that reinstalls playwright can silently replace the symlinks and drop the
whole stack back to detectable stock Playwright. Before the first browse
after such an install, verify:

```
ls -l /home/toor/node_modules/playwright-core   # must show -> patchright-core
```

and on any page, `browser_evaluate` `() => navigator.webdriver` must return
`false`. If it returns `true`, stop: the stack is stock, sites will start
challenging it, and the symlink must be restored before browsing.

## Tool map (Claude in Chrome → agent browser)

| Then | Now |
|---|---|
| `tabs_context_mcp` | `browser_tabs` `action: list` |
| `tabs_create_mcp` / select a tab | `browser_tabs` `action: new` (with `url`) / `action: select` |
| `tabs_close_mcp` | `browser_tabs` `action: close` |
| `navigate` | `browser_navigate` |
| `get_page_text` / `read_page` | `browser_snapshot` (structure) or `browser_evaluate` `() => document.body.innerText` (raw text; for `<article>`/`<main>`, select it in the snippet) |
| `find` | `browser_find` |
| `javascript_tool` | `browser_evaluate` |
| `computer` click at element | `browser_click` |
| `computer` hover / click at coordinates, mouse move | `browser_run_code_unsafe` (`page.mouse.move(x, y)`, `page.mouse.click(x, y)`) |
| `computer` key | `browser_press_key` |
| `computer` scroll | `browser_run_code_unsafe` (`page.mouse.wheel`) or `browser_evaluate` `scrollIntoView` |
| `computer` zoom `region: [x,y,w,h]` + `save_to_disk` | `browser_take_screenshot` with `element` + `filename`, or `browser_run_code_unsafe` `page.screenshot({ clip: {x,y,width,height}, path })` |
| `computer` screenshot `save_to_disk: true` | `browser_take_screenshot` with `filename` |
| `resize_window` | `browser_resize` |
| `browser_batch` | gone; separate calls |
| `read_network_requests` | `browser_network_requests` / `browser_network_request` |
| `wait` | `browser_wait_for` |

## Session rules

1. **One browser, one owner.** Take `.seo-cache/chrome.lock` before your first
   browser call when anything else might be browsing (`/daily-post`, site-ops);
   remove it when your browser work ends, also on error. The lock recipe is in
   `site-health/references/routines.md` and the daily-post workflow.
2. **Own your tabs.** Create a tab with `browser_tabs action: new`, work in it,
   close it with `action: close`. Never close a tab you did not open. Parallel
   agents each get their own tab.
3. **Never destroy or change anything.** Never click Delete, Unenroll, Reset
   progress, Cancel subscription, "Edit Payout Details", or anything under
   account settings or billing. Never trigger `alert`/`confirm`. Never sign in,
   type a credential, or solve a captcha: a captcha or login wall means stop and
   report, never proceed.
4. **Playing a scrim marks progress** on the owner's account. Transcript, code
   and slides are all readable without pressing play; prefer that.
5. **Nothing redacts for you.** `browser_evaluate` returns raw values (the old
   `javascript_tool` redaction is gone), so never ask it for cookies,
   localStorage, tokens or auth headers. Return arrays of short strings you
   intend to read, not dumps.
6. **Screenshots** via `browser_take_screenshot` with an explicit `filename`
   (resolved against the workspace root; use `shots/` under the repo or an
   absolute path in `/home/toor/sg-work/`). Captures come from CDP, so a
   background tab usually captures fine; if one comes back blank, select the tab
   first (`browser_tabs action: select`).
7. **Viewport before pixel recipes.** The screenshot frame equals the viewport
   exactly (no device-pixel-ratio scaling like the old extension's 1568-px
   frame). Set it with `browser_resize {width: 1920, height: 905}` and measure
   every rect and coordinate fresh with `browser_evaluate`
   (`getBoundingClientRect()`); coordinates remembered from the old extension
   frame do not carry over.
8. **Logged out of Scrimba** (SIGN IN shows, a paywall appears on a Pro lesson):
   stop and tell the owner. Re-login is the owner's step (about 30 seconds,
   `node /home/toor/sg-work/agent-browser/login.mjs` opens the browser and waits);
   never attempt it yourself, and never browse on while logged out: an anonymous
   visit rotates the session cookie and kills the saved session for everyone.

## Session validity

The profile was rebuilt 2026-10-10 from the owner's main Chrome (cookies,
localStorage, IndexedDB, session stores) plus a fresh manual login. Sessions
expire server-side; when one dies, rule 8 applies. The verification suite lives
at `/home/toor/sg-work/agent-browser/` (`test-session.mjs`, `test-mcp.mjs`);
rerun it if the stack behaves oddly before debugging anything else.
