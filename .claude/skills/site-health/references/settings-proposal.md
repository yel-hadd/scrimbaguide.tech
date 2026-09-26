# Proposal: `.claude/settings.json` permission rules (owner decision D1)

**Status: adopted by the owner on 2026-09-26** as `.claude/settings.json`, with the prefix form for the Indexing rule (`Bash(python3 scripts/analytics/indexing.py submit:*)`, so dry runs prompt too). Change the rules there, not here.

## Why

`/site-health` makes two kinds of external write (GA4 annotations, Indexing API submissions), and a few repo commands are destructive in this setup (`npm ci` wipes the shared `node_modules`; `generate:data` once rolled the catalog back four months). Today these are held back by instructions: the site-ops agent is told never to run them, and the main session asks in chat before each write. The rules below would turn that into a harness gate: `ask` shows the owner one permission prompt per command, `deny` blocks it outright.

## Proposed content

```json
{
  "permissions": {
    "ask": [
      "Bash(gh pr merge:*)",
      "Bash(python3 scripts/analytics/ga4admin.py annotations apply:*)",
      "Bash(python3 scripts/analytics/ga4admin.py dims create:*)",
      "Bash(python3 scripts/analytics/indexing.py submit:*--send*)",
      "Bash(npm run generate:data:*)", "Bash(make generate:*)", "Bash(make pipeline:*)"
    ],
    "deny": [
      "Bash(git push --force:*)", "Bash(git push -f:*)", "Bash(git push --force-with-lease:*)",
      "Bash(git push origin main:*)", "Bash(git push origin HEAD:main:*)",
      "Bash(npm install:*)", "Bash(npm i:*)"
    ]
  }
}
```

## Notes for the decision

- Ordinary `git push` of feature and `ops/*` branches is not gated.
- `gh pr merge` is `ask`, not `deny`, so a run the owner has authorized to merge can still do it after one prompt. The owner may deny it instead in `settings.local.json`.
- If the Bash matcher does not support the `*--send*` infix pattern, use the prefix `Bash(python3 scripts/analytics/indexing.py submit:*)`. Dry runs then prompt too, which is acceptable.
- `npm ci` is not listed; consider adding `"Bash(npm ci:*)"` to `deny`, since `make install` and CI are the only places it belongs.
- After approval, verify once: run `/site-health post-merge <PR#>` and confirm each `ask` surfaces a single prompt to the owner in the main session. Subagents never run gated commands.

## Before adoption

The main session asked in chat before each external write. Since adoption the permission prompt is the approval (SKILL.md, "Approval").
