---
name: frontend-verify
description: Verify a scrimbaguide.tech frontend change before its PR merges and after it deploys (build diff, visual harness, Lighthouse, metadata). Use for any PR touching src/css, src/components, src/theme, src/pages, docusaurus.config.ts head or metadata, fonts or dependencies, and before stating any performance gain.
---

# Frontend verify

A frontend PR merges with evidence, not with "looks fine". Every claim in the PR body (no HTML change, no visual change, faster LCP, same metadata) traces to a command below and its output. The traps at the end each cost a false finding or a wiped `node_modules` once; read them before step 1.

Working files live in `W=/home/toor/sg-work/<program>/` (builds, captures, Lighthouse JSON, logs). The session scratchpad is in `/tmp` and a reboot wipes it. Edits happen in a worktree under `W/wt/` with `node_modules` symlinked to the main checkout's; nothing is installed anywhere.

## Steps

1. **Gates** in the worktree: `npm run check:content`, `npm run typecheck`, the unit tests that need no build (`node --test scripts/__tests__/<file>.test.mjs` for `check-content`, `check-built-metadata`, `home-cta-inventory`, `visual-ratchet`, `analytics`, `diff-builds`, and any test the PR touched), and `node scripts/audit-course-links.mjs --file <path>` per touched page. Check `ls node_modules | wc -l` is not 0 first. Done when every gate is green.

2. **Build base and head in the main checkout**, never in a worktree. Preconditions: `git -C /home/toor/scrimbaguide.tech status --porcelain` is empty, `pgrep -f "docusaurus (build|start)"` is empty, and no page workflow is running. Then, for `base` = `origin/main` and `head` = the PR's last commit:
   ```
   cd /home/toor/scrimbaguide.tech && orig=$(git branch --show-current)
   ls static/img/blog/*.png | wc -l          # 0: npm run generate:social-cards first
   git checkout --detach <sha> && npm run build > $W/build-<label>.log 2>&1
   rm -rf $W/builds/<label> && cp -a build $W/builds/<label>
   git checkout "$orig"                      # always, also after a failed build
   ```
   Done when both `$W/builds/base` and `$W/builds/head` exist and the checkout is back on `$orig`. A base built for an earlier PR in the same program is reusable only if `origin/main` has not moved since.

3. **Diff the builds.** `node scripts/visual/diff-builds.mjs $W/builds/base $W/builds/head --json $W/diff-<label>.json`. Done when every V2 (full HTML), V3 (head: title, meta, canonical, JSON-LD) and V4 (`llms.txt`, `llms-full.txt`, `sitemap.xml`) difference is one the PR intends, and the JS/CSS byte delta is noted for the PR body. CSS, font and refactor PRs expect V2 = 0; `sitemap.xml` `<lastmod>` moves with any content commit. An unexplained difference stops the PR until explained.

4. **Serve** each build on a free port you own (never 3100 unless you started it; CI and other sessions use it):
   ```
   P=3101; while ss -ltn | grep -q ":$P "; do P=$((P+1)); done
   npx docusaurus serve --dir $W/builds/head --port $P --host 127.0.0.1 --no-open > $W/serve-$P.log 2>&1 & echo $! > $W/serve-$P.pid
   ```
   Stop it with `kill $(cat $W/serve-$P.pid)`. Serve `base` the same way on the next free port.

5. **Visual harness and pixel diff.** `VISUAL_BASE_URL=http://127.0.0.1:$P npm run test:visual` against head. It fails on a new finding and on a stale `known-issues.json` entry: a fix that clears a known issue removes its entry in the same PR. For captures to compare, run `node scripts/visual/matrix.mjs --base http://127.0.0.1:<port> --out $W/visual/<label>-{base,head}` against each server, then the side-by-side loop in `references/pixel-diff.md`. Done when `test:visual` exits 0 and you have **opened every side-by-side image** with Read and can say what changed in each; for a PR meant to change nothing visible, the loop prints no DIFF.

6. **Interactions.** `interactions.mjs` (inside `test:visual`) covers the lightbox, PathAdvisor, FAQ, sandbox, calculator, CodePreview, consent banner, mega menu, drawer, search, sidebar, footer and sticky CTA. A component it does not cover: drive it with Playwright at 1280x900 and 390x844 in both themes (keyboard, Escape, focus return, scroll lock), and screenshot and look. Done when each changed component was exercised, not only rendered.

7. **Lighthouse.** `npm run lhci` and `LHCI_FORM_FACTOR=desktop npm run lhci` read `./build` in the cwd: run them in the main checkout right after building head, or `ln -sfn $W/builds/head build` in the worktree. Accessibility, best practices and SEO assert 1.0 on the ten pages. Any performance claim additionally needs `bash scripts/visual/lh-ab.sh <path> http://127.0.0.1:<base-port> http://127.0.0.1:<head-port>` (interleaved, 6 runs each, mobile) per claimed page; quote its medians and LCP element. Done when lhci passes and every perf number in the PR body comes from lh-ab.

8. **Metadata.** `node scripts/check-built-metadata.mjs --build $W/builds/head`. Done when it exits 0; a stale allowlist entry comes out in this PR.

9. **PR body.** One evidence line per step: gates, diff-builds counts, `test:visual` result and the number of side-by-sides reviewed, lhci, lh-ab medians, check:metadata. Stop the servers you started.

10. **After deploy.** Run `/site-health post-merge <PR#>`. Then check the live site: `curl -s https://scrimbaguide.tech<path>` shows the intended head (title, canonical, JSON-LD); open each changed page at 390x844 and 1280x800 and look; for a perf PR, 3 mobile Lighthouse runs on the live URL compared with the last line of `secrets/ops/lighthouse-live.jsonl`. Done when the live pages match head.

## Traps

- **Theme forcing.** Setting `data-theme` on `<html>` leaves React inline styles in the old theme and fabricated two "confirmed defects" on 2026-09-23. Seed `localStorage.theme` before `goto`, then reload.
- **axe over overlays.** axe scores text in a fixed drawer or modal against what is behind it: the mobile sidebar read 1.42:1 on the hero gradient, but its real background is white (5.72:1). Walk the computed background and look at a clipped viewport screenshot before changing a colour.
- **pkill -f matches its own shell.** `pkill -f "docusaurus serve"` run through a shell kills that shell, whose command line contains the pattern. Kill by the saved PID.
- **Missing social cards.** `static/img/blog/*.png` is gitignored; a fresh checkout without them serves 404 og:images and Lighthouse best practices drops to 0.96. Generate them (`npm run generate:social-cards`, needs `rsvg-convert`) before building.
- **make build in a worktree.** `make build` runs `npm ci`, which through the symlink empties the main checkout's `node_modules` (2026-09-26). Use `npm run build`, and only in the main checkout: webpack resolves the symlink's real path and fails in a worktree anyway.
- **Volatile scratchpad.** A reboot on 2026-09-27 wiped `/tmp` with a baseline build, 190 captures and every worktree. Keep a program's files in `/home/toor/sg-work/<program>/`.
- **Sequential Lighthouse.** Before/after batches run minutes apart showed `/` mobile perf 94 to 76; the interleaved rerun of the same builds gave 65.5 to 74.5. Only `lh-ab.sh` numbers support a perf claim.
- **Stale ratchet entries.** After a fix, `test:visual` and `check:metadata` fail with STALE: expected. Remove the entry in the same PR, or in the next one if the fix merged first.
- **ImageMagick 7.** `compare -metric AE` prints `<scaled> (<pixels>)`, never a bare `0` for a difference; read the number in parentheses (the loop in `references/pixel-diff.md` does).
