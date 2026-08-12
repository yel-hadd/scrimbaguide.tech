import type { Config } from '@docusaurus/types';

/**
 * Search themes: none, deliberately.
 *
 * Client-side search moved from `@easyops-cn/docusaurus-search-local` (lunr) to
 * Pagefind (I18N-PLAN.md section 12). Pagefind is not a Docusaurus theme: the
 * index is produced by a CLI in `postBuild` and the UI is our own swizzles, so
 * the integration lives in `plugins/pagefind` and this array is now empty.
 *
 * Why lunr had to go: it emitted one 7.8 MB JSON index that every visitor
 * downloaded in full before the first keystroke, and it duplicated that monolith
 * into every locale build (~374 MB across the 48-locale roster, blocker B2).
 * Pagefind shards a binary index per language, and the browser fetches only the
 * chunks a query touches.
 *
 * The `/search/` route survives the swap: `plugins/pagefind` registers it (at
 * `/de/search/` and so on under a locale baseUrl) and `config/metadata.ts`
 * advertises it as the `WebSite` `SearchAction` target, whose value is now built
 * per locale as `<origin><localePrefix>/search/?q={search_term_string}`.
 *
 * DO NOT REPLACE THIS WITH `undefined` OR DELETE THE EXPORT.
 * `docusaurus.config.ts` does `themes: searchThemes` as a bare reference. An
 * absent `themes` key is fine, but `themes: undefined` is validated as a present
 * key with a bad value, which fails the config schema rather than falling back.
 */
export const searchThemes: Config['themes'] = [];
