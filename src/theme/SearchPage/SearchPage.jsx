import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useHistory, useLocation } from "@docusaurus/router";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";
import Link from "@docusaurus/Link";
import { translate } from "@docusaurus/Translate";
import { usePluralForm } from "@docusaurus/theme-common";
import { PagefindUnavailableError, searchPagefind } from "../SearchBar/pagefind";
import {
  CATEGORIES,
  PAGE_FETCH_LIMIT,
  categoryFromSearch,
  countByCategory,
  groupHitsByCategory,
  parseExcerpt,
  queryFromSearch,
} from "../SearchBar/searchUtils.mjs";
import styles from "./SearchPage.module.css";

/**
 * The crawlable `/search` page, now backed by Pagefind (I18N-PLAN.md section 12).
 *
 * The route is registered by `plugins/pagefind` rather than by a search theme,
 * because the page has to keep existing: `config/metadata.ts` advertises it as
 * the `WebSite` `SearchAction` target, and that target is now locale-aware
 * (`/de/search/?q=`). The page itself stays `noindex, follow`.
 *
 * Everything the old easyops-backed version imported from that package is gone
 * (`useSearchQuery`, `searchByWorker`, `highlightStemmed`, `getStemmedPositions`,
 * `LoadingRing`, `Mark`, the search-context selector). What replaced each:
 *
 *   - `useSearchQuery`  -> the `?q=` / `?category=` sync below, which is the
 *                          same behaviour minus the version/context handling
 *                          this site never used.
 *   - stemmed highlight -> Pagefind's own excerpt, parsed into `<mark>` runs by
 *                          `parseExcerpt` so React does the escaping instead of
 *                          `dangerouslySetInnerHTML`.
 *   - search contexts   -> deleted. They keyed off docs versioning, which is off.
 */

/** Query debounce while typing directly into the page's input. */
const SEARCH_DEBOUNCE_MS = 200;

export default function SearchPage() {
    return (<Layout>
      <SearchPageContent />
    </Layout>);
}

function SearchPageContent() {
    const { siteConfig: { baseUrl } } = useDocusaurusContext();
    const { selectMessage } = usePluralForm();
    const location = useLocation();
    const history = useHistory();

    const [searchQuery, setSearchQuery] = useState(() => queryFromSearch(location.search));
    const [hits, setHits] = useState(undefined);
    const [total, setTotal] = useState(0);
    const [searching, setSearching] = useState(false);
    const [unavailable, setUnavailable] = useState(false);
    const [category, setCategory] = useState(() => categoryFromSearch(location.search));
    // Same out-of-order guard as the modal: fragment loads are parallel fetches,
    // so a slower earlier query must not overwrite a faster later one.
    const requestRef = useRef(0);

    const pageTitle = useMemo(() => searchQuery
        ? translate({
            id: "theme.SearchPage.existingResultsTitle",
            message: 'Search results for "{query}"',
            description: "The search page title for non-empty query",
        }, {
            query: searchQuery,
        })
        : translate({
            id: "theme.SearchPage.emptyResultsTitle",
            message: "Search the documentation",
            description: "The search page title for empty query",
        }), [searchQuery]);

    // Keep `?q=` in the address bar in step with the input, so the page stays
    // linkable and the SearchAction target keeps working. `replace`, not `push`:
    // typing a query must not fill the back button with one entry per keystroke.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if ((params.get("q") || "") === searchQuery) return;
        if (searchQuery) {
            params.set("q", searchQuery);
        } else {
            params.delete("q");
        }
        const search = params.toString();
        history.replace({ search: search ? `?${search}` : "" });
        // `location.search` is deliberately not a dependency: this effect writes
        // it, and reading it back here would loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, history]);

    // The other direction: a pasted or back-navigated URL wins over local state.
    useEffect(() => {
        const fromUrl = queryFromSearch(location.search);
        if (fromUrl !== searchQuery) setSearchQuery(fromUrl);
        const categoryFromUrl = categoryFromSearch(location.search);
        if (categoryFromUrl !== category) setCategory(categoryFromUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setHits(undefined);
            setTotal(0);
            return undefined;
        }
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const outcome = await searchPagefind(searchQuery, PAGE_FETCH_LIMIT, baseUrl);
                if (requestRef.current !== requestId) return;
                setUnavailable(false);
                setHits(outcome.hits);
                setTotal(outcome.total);
            } catch (error) {
                if (requestRef.current !== requestId) return;
                setUnavailable(error instanceof PagefindUnavailableError);
                setHits([]);
                setTotal(0);
            }
            if (requestRef.current === requestId) setSearching(false);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchQuery, baseUrl]);

    const handleSearchInputChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    const handleCategoryChange = useCallback((next) => {
      setCategory(next);
      const params = new URLSearchParams(location.search);
      if (next === 'All') {
        params.delete('category');
      } else {
        params.set('category', next);
      }
      history.replace({ search: params.toString() });
    }, [location.search, history]);

    const grouped = useMemo(() => (hits ? groupHitsByCategory(hits) : null), [hits]);

    const filteredResults = useMemo(() => {
      if (!hits || !grouped) return hits;
      if (category === 'All') return hits;
      return grouped[category] || [];
    }, [hits, grouped, category]);

    const perGroupCounts = useMemo(() => countByCategory(hits || []), [hits]);

    // Pagefind ranks the full match list but only the first PAGE_FETCH_LIMIT
    // fragments are fetched, so say so rather than quietly reporting a smaller
    // number than the modal's "See all N results" promised.
    const truncated = hits ? total > hits.length : false;

    return (<React.Fragment>
      <Head>
        {/*
         We should not index search pages
          See https://github.com/facebook/docusaurus/pull/3233
        */}
        {/* Must be name="robots", not property=". Crawlers only read the
            name attribute; property is Open Graph/RDFa, so the previous
            property="robots" left this internal search-results page fully
            indexable. Google's guidance is to keep site-search results out
            of the index. */}
        <meta name="robots" content="noindex, follow"/>
        <title>{pageTitle}</title>
      </Head>

      <div className="container margin-vert--lg">
        <h1>{pageTitle}</h1>

        <div className="row">
          <div className="col col--12">
            <input type="search" name="q" className={styles.searchQueryInput} aria-label="Search" onChange={handleSearchInputChange} value={searchQuery} autoComplete="off" autoFocus/>
          </div>
        </div>

        {hits && hits.length > 0 && (
          <div className="margin-bottom--md" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map((f) => {
              const count = perGroupCounts[f];
              const active = category === f;
              return (
                <button
                  key={f}
                  onClick={() => handleCategoryChange(f)}
                  disabled={count === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.2rem 0.55rem',
                    border: `1px solid ${active ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)'}`,
                    borderRadius: '999px',
                    background: active ? 'var(--ifm-color-primary)' : 'var(--ifm-background-color)',
                    color: active ? 'var(--sg-search-filter-active-text)' : 'var(--ifm-color-emphasis-700)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: count === 0 ? 'default' : 'pointer',
                    opacity: count === 0 ? 0.35 : 1,
                    fontFamily: 'inherit',
                    lineHeight: 1.4,
                    transition: 'border-color 0.12s, background 0.12s, color 0.12s',
                  }}
                >
                  {f}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {searching && searchQuery && (<p aria-live="polite">
            {translate({
                id: "theme.SearchPage.fetchingNewResults",
                message: "Fetching new results...",
            })}
          </p>)}

        {!searching && unavailable && searchQuery && (<p>
            The search index is only generated during a production build, so
            search is unavailable on this deployment.
          </p>)}

        {!searching && !unavailable && filteredResults &&
            (filteredResults.length > 0 ? (<p>
              {selectMessage(filteredResults.length, translate({
                    id: "theme.SearchPage.documentsFound.plurals",
                    message: "1 document found|{count} documents found",
                    description: 'Pluralized label for "{count} documents found". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',
                }, { count: filteredResults.length }))}
              {truncated && category === 'All' ? ` (top ${filteredResults.length} of ${total})` : ''}
            </p>) : (<p>
              {translate({
                    id: "theme.SearchPage.noResultsText",
                    message: "No documents were found",
                    description: "The paragraph for empty search result",
                })}
            </p>))}

        <section>
          {filteredResults &&
            filteredResults.map((hit) => (<SearchResultItem key={hit.url} hit={hit}/>))}
        </section>
      </div>
    </React.Fragment>);
}

function SearchResultItem({ hit }) {
    const excerpt = parseExcerpt(hit.excerpt);
    return (<article className={styles.searchResultItem}>
      <h2>
        <Link to={hit.url}>{hit.title}</Link>
      </h2>
      {hit.path && (<p className={styles.searchResultItemPath}>
          {hit.path}
        </p>)}
      {excerpt.length > 0 && (<p className={styles.searchResultItemSummary}>
          {excerpt.map((segment, index) => (segment.mark
            ? <mark key={index}>{segment.text}</mark>
            : <React.Fragment key={index}>{segment.text}</React.Fragment>))}
        </p>)}
    </article>);
}
