import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { MODAL_FETCH_LIMIT, toHit } from './searchUtils.mjs';

/**
 * The browser half of the Pagefind integration: load the runtime, run a query,
 * hand back plain `SearchHit`s. Both `@theme/SearchBar` and `@theme/SearchPage`
 * go through here so there is exactly one copy of the loading rules.
 *
 * THREE THINGS ARE LOAD-BEARING:
 *
 * 1. The runtime is fetched at RUNTIME, never bundled. `/pagefind/pagefind.js`
 *    is written by the Pagefind CLI in `postBuild`, which is AFTER webpack has
 *    finished, so it does not exist when the bundle is compiled. The specifier
 *    is held in a variable and carries `webpackIgnore`, which together stop
 *    webpack from trying to resolve it and stop `tsc` from demanding types for
 *    a module that is not on disk.
 * 2. The path is site-root-absolute and NOT joined to `baseUrl`. Pagefind runs
 *    once over the merged multi-locale tree, so there is a single
 *    `/pagefind/` directory at the root serving every locale. Prefixing it with
 *    `/de/` would 404.
 * 3. Nothing here runs during SSR, and a failed load is a normal outcome, not
 *    an error. Under `docusaurus start` there is no index at all, so the load
 *    rejects and the UI shows its "index only exists in a production build"
 *    state instead of crashing the page.
 */

/** Where the CLI writes its runtime. See point 2 above before changing this. */
const PAGEFIND_BUNDLE_PATH = '/pagefind/pagefind.js';

/** One Pagefind search result, before its content fragment is fetched. */
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindFragment>;
}

interface PagefindFragment {
  url: string;
  excerpt?: string;
  meta?: { title?: string };
}

interface PagefindApi {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
  options?: (options: Record<string, unknown>) => Promise<void>;
  init?: () => Promise<void>;
}

export interface SearchHit {
  url: string;
  title: string;
  excerpt: string;
  category: 'Courses' | 'Blog' | 'Docs';
  path: string;
}

export interface SearchOutcome {
  /** Loaded, ranked, normalized hits. Capped at the caller's `limit`. */
  hits: SearchHit[];
  /** How many results Pagefind matched in total, before the cap. */
  total: number;
}

/** Distinguishes "no index on this deployment" from "no results for this query". */
export class PagefindUnavailableError extends Error {}

let pagefindPromise: Promise<PagefindApi> | null = null;

/**
 * Load the runtime once per page session and share it between the modal and the
 * search page. A rejected promise is discarded so a transient network failure
 * does not permanently disable search for the rest of the session.
 */
export function loadPagefind(): Promise<PagefindApi> {
  if (!ExecutionEnvironment.canUseDOM) {
    return Promise.reject(new PagefindUnavailableError('Pagefind cannot load during SSR'));
  }
  if (!pagefindPromise) {
    // Assigned to a local first: an `import()` of a bare string literal is
    // resolved by webpack at build time even with the magic comment stripped by
    // a future toolchain change, and `tsc` would flag the literal as a missing
    // module. The variable makes both tools treat it as a runtime value.
    const specifier = PAGEFIND_BUNDLE_PATH;
    pagefindPromise = import(/* webpackIgnore: true */ specifier)
      .then((module: PagefindApi) => module)
      .catch((error: unknown) => {
        pagefindPromise = null;
        throw new PagefindUnavailableError(
          `Pagefind runtime unavailable at ${PAGEFIND_BUNDLE_PATH}: ${String(error)}`,
        );
      });
  }
  return pagefindPromise;
}

/**
 * Run a query and materialize the top `limit` results.
 *
 * Pagefind returns the whole ranked list up front but defers each result's
 * content to its own fetch, so the cap is what bounds the request count per
 * keystroke. `total` still reports the uncapped match count, which is what the
 * "See all N results" affordance promises.
 */
export async function searchPagefind(
  query: string,
  limit: number = MODAL_FETCH_LIMIT,
  baseUrl = '/',
): Promise<SearchOutcome> {
  const pagefind = await loadPagefind();
  const search = await pagefind.search(query);
  const loaded = await Promise.all(
    search.results.slice(0, limit).map((result) => result.data()),
  );
  return {
    hits: loaded.map((fragment) => toHit(fragment, baseUrl) as SearchHit),
    total: search.results.length,
  };
}
