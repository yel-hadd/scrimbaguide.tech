# RTL / CJK fixtures (throwaway)

Hand-written Arabic and Japanese pages whose only job is to make the Phase 4 CSS
work **visible**. Not production copy, never translated, never shipped, and not
localization output: the Arabic below was written to exercise layout, not to be
read by an Arabic speaker.

## Why they exist

Under the Phase 2 fail-closed coverage rule a locale with zero coverage builds
**zero pages**. So `npx docusaurus start --locale ar` on a bare roster entry
renders the navbar, the footer and nothing else, which validates mirroring,
logical properties and icon flipping while validating **none** of the four
things this phase exists to fix:

1. Arabic font fallback and tofu (`.notdef` boxes) at every weight in use.
2. Code spans and code blocks rendering LTR inside Arabic paragraphs.
3. `:lang(ja)` line breaking in cards, tables and the sidebar.
4. Title overflow / clipping against the C5 title budget.

Each fixture is chosen for one of those, plus the layout surfaces listed in the
plan's visual-pass checklist.

| Fixture | Surface it exercises | What it is for |
|---|---|---|
| `ar/…/pages/rtl-home.mdx` | hero, trust bar, path cards, disclosure notice | mirrored homepage layout, accent bars, long-title clipping |
| `ar/…/docs/current/paths/frontend-developer-path.mdx` | path page, FAQ accordion, CTA row | money-page mirroring, accordion chevron direction |
| `ar/…/docs/current/comparisons/scrimba-vs-codecademy.mdx` | table, verdict box | `text-align: start`, the mobile scroll-fade edge, pros/cons markers |
| `ar/…/docs/current/courses/react/learn-react.mdx` | code blocks, inline code, versions | **bidi isolation**, the single highest-value assertion here |
| `ja/…/docs/current/paths/frontend-developer-path.mdx` | same path page in Japanese | `line-break: strict`, unspaced-run overflow, CJK system stack |

## How to run them

They live under a dot-directory on purpose: `i18n/.rtl-fixtures/` is not a
locale, so Docusaurus never reads it, the coverage manifest never counts it as
translated content (which would earn `ar` an hreflang entry for pages that are
gibberish), and `scripts/check-content.mjs` skips it along with every other dot
directory.

To use them, stage them into a real locale directory and start with the Phase 2
coverage escape hatch:

```bash
# 1. ar must exist in i18n/locales.config.ts (status 'draft' is enough) and be
#    temporarily promoted to 'live' so i18n.locales contains it.
# 2. Stage the fixtures.
cp -r i18n/.rtl-fixtures/ar i18n/ar
cp -r i18n/.rtl-fixtures/ja i18n/ja

# 3. Full coverage, or the fail-closed rule excludes every route.
I18N_COVERAGE=full npx docusaurus start --locale ar
I18N_COVERAGE=full npx docusaurus start --locale ja
```

Delete `i18n/ar/` and `i18n/ja/` and revert the roster status afterwards. A
staged fixture left on disk reads to the coverage manifest as a real
translation, which is exactly the invariant-4 violation the manifest exists to
prevent.

## Done-assertions (all four required)

- No tofu glyphs anywhere, at every weight the page uses.
- Code spans render LTR inside Arabic paragraphs: `npm install react` reads in
  that order, not reversed.
- No title clipping at the C5 title budget, in the navbar, cards and headings.
- `axe` clean, in both `ar` and `ja`.
