import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useHistory } from '@docusaurus/router';
import { PagefindUnavailableError, searchPagefind, type SearchHit } from './pagefind';
import {
  MODAL_FETCH_LIMIT,
  PER_GROUP_LIMIT,
  SPECIFIC_GROUP_LIMIT,
  CATEGORIES,
  buildSearchUrl,
  countByCategory,
  groupHits,
} from './searchUtils.mjs';

/**
 * The site's search modal, now backed by Pagefind (I18N-PLAN.md section 12).
 *
 * Markup, class names, keyboard model and ARIA are unchanged from the lunr
 * version on purpose: `scripts/__tests__/a11y-search.test.mjs` drives this modal
 * through `.sg-search-pill`, `.sg-search-modal`, `.sg-search-input`,
 * `.sg-search-result`, `.sg-search-filter`, `.sg-search-clear` and
 * `.sg-search-footer-link`, and the styling in `src/css/custom.css` is keyed to
 * the same names. Only the data source changed.
 *
 * What that swap means in practice: instead of downloading a 7.8 MB lunr index
 * before the first keystroke, the first query pulls a ~45 KB runtime, a ~72 KB
 * WASM blob and the one ~28 KB index chunk the query touches, then one ~3 KB
 * fragment per displayed result. Pagefind also picks the index matching the
 * page's `<html lang>` by itself, so a visitor on `/de/` searches German pages
 * with no locale wiring here.
 */

/** Debounce before a keystroke turns into a query. Unchanged from the lunr UI. */
const SEARCH_DEBOUNCE_MS = 200;

type Filter = (typeof CATEGORIES)[number];

export default function SearchBar(): React.ReactElement {
  const { siteConfig: { baseUrl } } = useDocusaurusContext();
  const history = useHistory();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic query id. Pagefind fragment fetches are parallel network calls, so
  // a slow query can land after a faster later one; without this the modal can
  // display results for a prefix the user has already typed past.
  const requestRef = useRef(0);

  const rawGrouped = useMemo(() => (results ? groupHits(results) : []), [results]);

  const perGroupCounts = useMemo(() => {
    const counts = countByCategory(results ?? []);
    // `All` reports Pagefind's uncapped match count, which is what the footer
    // promises to show on `/search`. The per-group counts can only describe the
    // fragments actually loaded.
    return { ...counts, All: total };
  }, [results, total]);

  const grouped = useMemo(() => rawGrouped.map((group) => ({
    ...group,
    results: group.results.slice(0, activeFilter === 'All' ? PER_GROUP_LIMIT : SPECIFIC_GROUP_LIMIT),
  })), [rawGrouped, activeFilter]);

  const filtered = useMemo(() => (
    activeFilter === 'All' ? grouped : grouped.filter((group) => group.label === activeFilter)
  ), [grouped, activeFilter]);

  const flatItems = useMemo(() => {
    const items: { gi: number; ri: number }[] = [];
    filtered.forEach((group, gi) => {
      group.results.forEach((_, ri) => items.push({ gi, ri }));
    });
    return items;
  }, [filtered]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      setTotal(0);
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    try {
      const outcome = await searchPagefind(q, MODAL_FETCH_LIMIT, baseUrl);
      if (requestRef.current !== requestId) return;
      setUnavailable(false);
      setResults(outcome.hits);
      setTotal(outcome.total);
    } catch (error) {
      if (requestRef.current !== requestId) return;
      // A missing index is a deployment state (dev server, or a build whose
      // postBuild was skipped), not a failed query. It gets its own message so
      // it never reads as "your search matched nothing".
      setUnavailable(error instanceof PagefindUnavailableError);
      setResults([]);
      setTotal(0);
    }
    if (requestRef.current === requestId) setLoading(false);
  }, [baseUrl]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const openSearch = useCallback(() => {
    setOpen(true);
    setQuery('');
    setResults(null);
    setTotal(0);
    setHighlightIdx(-1);
    setActiveFilter('All');
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
    setTotal(0);
    setHighlightIdx(-1);
    setActiveFilter('All');
    document.body.style.overflow = '';
  }, []);

  const navigate = useCallback((hit: SearchHit) => {
    closeSearch();
    history.push(hit.url);
  }, [closeSearch, history]);

  const handleSeeAll = useCallback(() => {
    const url = buildSearchUrl(query, activeFilter, baseUrl);
    setOpen(false);
    setQuery('');
    setResults(null);
    setTotal(0);
    setHighlightIdx(-1);
    setActiveFilter('All');
    document.body.style.overflow = '';
    history.push(url);
  }, [query, activeFilter, baseUrl, history]);

  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightIdx < 0 || !bodyRef.current) return;
    const hl = bodyRef.current.querySelector('.sg-search-result--hl');
    hl?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIdx >= 0 && flatItems[highlightIdx]) {
          const { gi, ri } = flatItems[highlightIdx];
          navigate(filtered[gi].results[ri]);
        }
        break;
      case 'Escape':
        closeSearch();
        break;
    }
  }, [flatItems, highlightIdx, filtered, navigate, closeSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) openSearch();
      }
      if (e.key === 'Escape' && open) closeSearch();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, openSearch, closeSearch]);

  const pill = (
    <button className="sg-search-pill" onClick={openSearch} aria-label="Search guides & blog">
      <svg className="sg-search-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span className="sg-search-pill-text">Search guides & blog&hellip;</span>
      <kbd className="sg-search-pill-kbd">&#8984;K</kbd>
    </button>
  );

  const modal = open && createPortal(
    <div className="sg-search-overlay" onClick={closeSearch}>
      <div className="sg-search-modal" role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.stopPropagation()}>
        <div className="sg-search-header">
          <svg className="sg-search-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="sg-search-input"
            type="text"
            placeholder="Search guides & blog&hellip;"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlightIdx(-1); }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <button
            className="sg-search-clear"
            onClick={closeSearch}
            aria-label="Close search"
          >
            &times;
          </button>
        </div>

        {!loading && query && results && results.length > 0 && (
          <div className="sg-search-filters">
            {CATEGORIES.map((f) => {
              const count = perGroupCounts[f] ?? 0;
              return (
                <button
                  key={f}
                  className={'sg-search-filter' + (activeFilter === f ? ' sg-search-filter--active' : '') + (count === 0 ? ' sg-search-filter--empty' : '')}
                  onClick={() => { setActiveFilter(f); setHighlightIdx(-1); }}
                  disabled={count === 0}
                >
                  {f}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        <div className="sg-search-body" ref={bodyRef} tabIndex={0}>
          {loading && (
            <div className="sg-search-status">Searching&hellip;</div>
          )}
          {!loading && !query && (
            <div className="sg-search-status">Start typing to search&hellip;</div>
          )}
          {!loading && query && unavailable && (
            <div className="sg-search-status">
              Search is unavailable here. The index is generated during a production build.
            </div>
          )}
          {!loading && query && !unavailable && results && results.length === 0 && (
            <div className="sg-search-status">No results found for &ldquo;{query}&rdquo;.</div>
          )}
          {!loading && filtered.map((group, gi) => (
            <div key={group.label} className="sg-search-group">
              <h2 className="sg-search-group-label">{group.label}</h2>
              {group.results.map((hit, ri) => {
                const flatIdx = flatItems.findIndex((f) => f.gi === gi && f.ri === ri);
                const hl = flatIdx === highlightIdx;
                return (
                  <div
                    key={hit.url}
                    className={'sg-search-result' + (hl ? ' sg-search-result--hl' : '')}
                    onClick={() => navigate(hit)}
                    onMouseEnter={() => setHighlightIdx(flatIdx)}
                  >
                    <div className="sg-search-result-icon">
                      {group.label === 'Courses' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      ) : group.label === 'Blog' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      )}
                    </div>
                    <div className="sg-search-result-info">
                      <div className="sg-search-result-title">{hit.title}</div>
                      {hit.path && (
                        <div className="sg-search-result-path">{hit.path}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

          {query && (
          <div className="sg-search-footer">
            <button
              className="sg-search-footer-link"
              onClick={handleSeeAll}
            >
              See all {perGroupCounts[activeFilter] ?? 0} results &rarr;
            </button>
            <div className="sg-search-footer-hints">
              <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate</span>
              <span><kbd>&#9166;</kbd> Open</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      {pill}
      {modal}
    </>
  );
}
