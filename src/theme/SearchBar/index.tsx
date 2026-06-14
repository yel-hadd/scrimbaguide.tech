import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useHistory } from '@docusaurus/router';
import { searchByWorker } from '@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker';

const PER_GROUP_LIMIT = 4;
const SPECIFIC_GROUP_LIMIT = 8;
const FETCH_LIMIT = 50;

interface SearchDoc {
  i: number;
  t: string;
  u: string;
  b: string[];
  s?: string;
  h?: string;
}

interface SearchResult {
  document: SearchDoc;
  type: number;
  page: { b: string[]; t: string };
  tokens: string[];
}

interface ResultGroup {
  label: string;
  results: SearchResult[];
}

function groupResults(results: SearchResult[]): ResultGroup[] {
  const map: Record<string, SearchResult[]> = {
    Courses: [],
    Blog: [],
    Docs: [],
  };
  for (const r of results) {
    const root = r.document.b?.[0] || '';
    if (root === 'Courses') {
      map.Courses.push(r);
    } else if (root === 'Blog') {
      map.Blog.push(r);
    } else {
      map.Docs.push(r);
    }
  }
  return Object.entries(map)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, results: items }));
}

function hitUrl(doc: SearchDoc): string {
  return doc.u + (doc.h || '');
}

export default function SearchBar(): React.ReactElement {
  const { siteConfig: { baseUrl } } = useDocusaurusContext();
  const history = useHistory();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawGrouped = useMemo(() => {
    if (!results) return [];
    return groupResults(results);
  }, [results]);

  const perGroupCounts = useMemo(() => {
    const m: Record<string, number> = { All: results?.length ?? 0 };
    for (const g of rawGrouped) m[g.label] = g.results.length;
    return m;
  }, [rawGrouped, results]);

  const grouped = useMemo(() => {
    return rawGrouped.map((g) => ({
      ...g,
      results: g.results.slice(0, activeFilter === 'All' ? PER_GROUP_LIMIT : SPECIFIC_GROUP_LIMIT),
    }));
  }, [rawGrouped, activeFilter]);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return grouped;
    return grouped.filter((g) => g.label === activeFilter);
  }, [grouped, activeFilter]);

  const flatItems = useMemo(() => {
    const items: { gi: number; ri: number }[] = [];
    filtered.forEach((g, gi) => {
      g.results.forEach((_, ri) => items.push({ gi, ri }));
    });
    return items;
  }, [filtered]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await searchByWorker(baseUrl, '', q, FETCH_LIMIT);
      setResults(res);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [baseUrl]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const openSearch = useCallback(() => {
    setOpen(true);
    setQuery('');
    setResults(null);
    setHighlightIdx(-1);
    setActiveFilter('All');
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
    setHighlightIdx(-1);
    setActiveFilter('All');
    document.body.style.overflow = '';
  }, []);

  const navigate = useCallback((result: SearchResult) => {
    const url = hitUrl(result.document);
    closeSearch();
    history.push(url);
  }, [closeSearch, history]);

  const handleSeeAll = useCallback(() => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (activeFilter !== 'All') params.set('category', activeFilter);
    const url = `/search?${params.toString()}`;
    setOpen(false);
    setQuery('');
    setResults(null);
    setHighlightIdx(-1);
    setActiveFilter('All');
    document.body.style.overflow = '';
    history.push(url);
  }, [query, activeFilter, history]);

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
  }, [flatItems, highlightIdx, grouped, navigate, closeSearch]);

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
      <div className="sg-search-modal" onClick={(e) => e.stopPropagation()}>
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
            {['All', 'Courses', 'Blog', 'Docs'].map((f) => {
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

        <div className="sg-search-body" ref={bodyRef}>
          {loading && (
            <div className="sg-search-status">Searching&hellip;</div>
          )}
          {!loading && !query && (
            <div className="sg-search-status">Start typing to search&hellip;</div>
          )}
          {!loading && query && results && results.length === 0 && (
            <div className="sg-search-status">No results found for &ldquo;{query}&rdquo;.</div>
          )}
          {!loading && filtered.map((group, gi) => (
            <div key={group.label} className="sg-search-group">
              <div className="sg-search-group-label">{group.label}</div>
              {group.results.map((result, ri) => {
                const flatIdx = flatItems.findIndex((f) => f.gi === gi && f.ri === ri);
                const hl = flatIdx === highlightIdx;
                return (
                  <div
                    key={`${gi}-${ri}`}
                    className={'sg-search-result' + (hl ? ' sg-search-result--hl' : '')}
                    onClick={() => navigate(result)}
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
                      <div className="sg-search-result-title">{result.document.t}</div>
                      {result.document.b && (
                        <div className="sg-search-result-path">{result.document.b.slice(result.document.b[0] === 'Courses' ? 2 : 1).join(' / ')}</div>
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
