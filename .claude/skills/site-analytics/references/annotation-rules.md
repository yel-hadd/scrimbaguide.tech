# GA4 annotation rules

Every change that could move a metric gets a dated GA4 annotation, so charts show the cause next to the effect. GA4 is the ledger: an annotation lives there and nowhere else. This skill owns the rules; `/site-health` plans and applies them. Claude never edits or deletes an annotation.

## What qualifies: `KIND_RULES`

`scripts/analytics/ga4admin.py` classifies each first-parent merge on `origin/main` by its changed files. The first matching kind wins, in this order:

| Kind | Paths | Color |
|---|---|---|
| `tracking` | `plugins/analytics/**`, `src/components/AffiliateLink.tsx`, `src/utils/{contentGroup*,affiliateDestination*,trackSearch*}`, `scripts/analytics/tracking.json` | RED |
| `conversion` | `src/components/{PricingCTA,CourseCard,VerdictBox,ComparisonTable,ScrimPoster,DesktopStickyCTA,PathAdvisor,CodePreview}*`, `src/utils/moneyPagePaths.ts`, `src/theme/DocItem/**`, `src/constants.ts` | GREEN |
| `catalog` | `data/courses.json`, `data/course-overrides.json`, `data/path-membership.json` | CYAN |
| `seo` | `docusaurus.config.ts`, `sidebars.ts`, `data/course-redirects.json`, `src/content/relatedGuidesMap.ts`, `static/robots.txt`, `scripts/generate-llms-from-sitemap.mjs` | PURPLE |
| `content` | `blog/**`, `docs/**`, `src/pages/**` | BLUE |
| `ux-perf` | `src/css/**`, `src/components/**`, `src/theme/**`, `static/img/**` | BROWN |
| `none` | `.claude/**`, other `scripts/**`, root `*.md`, `Makefile`, `package*.json`, tests, `.github/**` | not annotated |

ORANGE is never used: Google uses it for system annotations. GA4 changes made in the UI (a filter activated, a dimension registered, a key event marked) are `tracking` epochs and are annotated too, with the date from `tracking.json`.

Not qualifying: typo fixes, minor CSS, tooling, and anything of kind `none`, unless the PR body says otherwise.

## The `analytics-note:` PR body line

- `analytics-note: <title of 60 characters or fewer>` forces the PR in (even a kind `none` PR) and supplies the title.
- `analytics-note: skip` forces it out.
- No line: the title falls back to the PR's own title (the merge subject only if `gh` fails or the commit isn't a PR merge), and `KIND_RULES` decides the kind. Such a fallback title is a draft: rewrite it before `apply`, since it wasn't written to describe the change for a chart reader.

Every PR that qualifies carries the line. `/daily-post` PRs carry it by default.

## Format

- One entry: `{date, title, description, color, prs:[int], commits:[sha7], kind}`.
- `date`: the LA date of the deploy completion (`gh run list --workflow deploy.yml --commit SHA`), falling back to the committer date. The backfill uses committer dates only. It must lie between `property_created` (2026-02-06) and today in LA.
- `title`: 60 characters or fewer, says what changed ("Pricing CTA moved above the fold on 4 pricing pages"), never a PR title copied blindly.
- `description`: 150 characters or fewer and names every PR as `PR #n`, or `commits <sha7>` when there is no PR.
- Tracking epochs start the title with `EPOCH:` (existing example: "EPOCH: consent banner + tracking v2", RED, 2026-09-26).

## Grouping

Merges with the same LA date and the same kind become one entry, titled for the batch, with the description "PR #a, PR #b: ...". Different kinds on the same day stay separate entries.

## Matching and owner deletions

`plan` compares each entry with the property's non-system annotations:

- `skip (exists NAME)`: same date and same case-folded title, or same date and overlapping PR or commit sets (`#(\d+)` and `\b[0-9a-f]{7}\b` parsed from the existing text).
- `conflict`: overlapping PRs or commits but a different date. Reported, never created; a human decides.
- `skip (deleted by owner)`: the entry is in `secrets/ops/annotations-log.jsonl` but missing from GA4. The owner removed it on purpose; it is recreated only with `--recreate`, which only the owner asks for.
- `create`: none of the above.

Existing on 2026-09-26: three BLUE entries for PRs #108, #109 and #110, and the RED "EPOCH: consent banner + tracking v2", all dated 2026-09-26, plus one system annotation (ignored by matching).

## Commands

```
python3 scripts/analytics/ga4admin.py annotations list
python3 scripts/analytics/ga4admin.py annotations candidates --since 2026-09-26 [--until DATE] [--backfill]
python3 scripts/analytics/ga4admin.py annotations plan --prs 113,114
python3 scripts/analytics/ga4admin.py annotations plan --since-merged 2026-09-26
python3 scripts/analytics/ga4admin.py annotations plan --file secrets/ops/annotations-plan.json
python3 scripts/analytics/ga4admin.py annotations apply --file secrets/ops/annotations-plan.json --yes
```

- `list`, `candidates` and `plan` are read-only. `plan` prints `create`, `skip` and `conflict` rows and writes nothing.
- `apply` re-runs the plan, then POSTs each `create` row one at a time, at least 1 second apart, to the Admin API v1alpha `reportingDataAnnotations` endpoint, and appends `{ts, name, entry}` to `secrets/ops/annotations-log.jsonl`. A rerun creates nothing. Without `--yes` it sends nothing.
- No command edits or deletes an annotation, and none should be written.
- Who runs what: the `site-ops` agent runs `plan`; the `/site-health` main session runs `apply --yes` after the owner's one approval. This skill only reads (`list`, `candidates`) and reports `health.unannotated_merges`.

## Money

Titles and descriptions are public-safe: never a money figure, a balance or a personal detail, even though the GA4 property is private.
