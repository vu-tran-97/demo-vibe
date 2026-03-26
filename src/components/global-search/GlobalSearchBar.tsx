'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchSearchSuggestions,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  type SearchSuggestion,
} from '@/lib/search';

const dropdownItemCls = "flex items-center gap-[0.5rem] w-full py-[0.5rem] px-[1rem] font-body text-[0.8125rem] text-charcoal bg-transparent border-none cursor-pointer text-left transition-colors duration-[200ms] hover:bg-ivory";
const sectionTitleCls = "text-[0.6875rem] font-semibold text-muted uppercase tracking-[0.08em]";
const itemIconCls = "flex items-center text-muted shrink-0";
const itemTextCls = "flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap";

export function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setRecentSearches(getRecentSearches()); }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); setIsOpen(true); }
      if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestionsDebounced = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length === 0) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try { const result = await fetchSearchSuggestions(q.trim()); setSuggestions(result.suggestions); }
      catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); setActiveIndex(-1); fetchSuggestionsDebounced(e.target.value); };

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed); setRecentSearches(getRecentSearches()); setIsOpen(false); setQuery('');
    router.push(`/dashboard/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleSearch(query); };
  const handleClearRecent = () => { clearRecentSearches(); setRecentSearches([]); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.trim() ? suggestions : recentSearches.map((s) => ({ type: 'recent' as const, id: s, title: s }));
    const maxIndex = items.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex)); }
    else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) { e.preventDefault(); handleSearch(items[activeIndex].title); }
  };

  const showDropdown = isOpen && ((query.trim().length === 0 && recentSearches.length > 0) || query.trim().length > 0);

  const handleMobileSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed); setRecentSearches(getRecentSearches()); setMobileOpen(false); setQuery('');
    router.push(`/dashboard/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleMobileSubmit = (e: React.FormEvent) => { e.preventDefault(); handleMobileSearch(query); };

  const searchSvg = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
  const clockSvg = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

  function suggestionIcon(type: string) {
    return type === 'product'
      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
  }

  return (
    <>
      {/* Desktop search bar */}
      <div className="relative max-sm:hidden" ref={containerRef}>
        <form onSubmit={handleSubmit} className="flex items-center gap-[0.5rem] py-[0.5rem] px-[0.875rem] bg-white border border-border rounded-[8px] min-w-[260px] transition-colors duration-[200ms] focus-within:border-charcoal sm:max-md:min-w-[200px]">
          <span className="flex items-center text-muted shrink-0">{searchSvg}</span>
          <input ref={inputRef} type="text" className="flex-1 border-none bg-transparent font-body text-[0.8125rem] text-charcoal outline-none placeholder:text-muted" placeholder="Search anything..." value={query} onChange={handleInputChange} onFocus={() => { setIsOpen(true); setRecentSearches(getRecentSearches()); }} onKeyDown={handleKeyDown} autoComplete="off" />
          <kbd className="font-body text-[0.6875rem] text-muted bg-ivory py-[2px] px-[6px] rounded-[4px] border border-border shrink-0">
            {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl+'}K
          </kbd>
        </form>

        {showDropdown && (
          <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-border rounded-[12px] shadow-soft z-[100] max-h-[360px] overflow-y-auto animate-fade-in">
            {query.trim().length === 0 && recentSearches.length > 0 && (
              <div className="py-[0.25rem]">
                <div className="flex items-center justify-between py-[0.5rem] px-[1rem]">
                  <span className={sectionTitleCls}>Recent Searches</span>
                  <button type="button" className="font-body text-[0.6875rem] text-muted bg-transparent border-none cursor-pointer py-[2px] px-[6px] rounded-[4px] transition-all duration-[200ms] hover:text-charcoal hover:bg-ivory" onClick={handleClearRecent}>Clear</button>
                </div>
                {recentSearches.map((search, index) => (
                  <button key={search} type="button" className={`${dropdownItemCls} ${activeIndex === index ? '!bg-ivory' : ''}`} onClick={() => handleSearch(search)}>
                    <span className={itemIconCls}>{clockSvg}</span>
                    <span className={itemTextCls}>{search}</span>
                  </button>
                ))}
              </div>
            )}
            {query.trim().length > 0 && loading && (
              <div className="flex items-center gap-[0.5rem] p-[1rem] text-[0.8125rem] text-muted">
                <div className="w-[14px] h-[14px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
                <span>Searching...</span>
              </div>
            )}
            {query.trim().length > 0 && !loading && suggestions.length > 0 && (
              <div className="py-[0.25rem]">
                <div className="flex items-center justify-between py-[0.5rem] px-[1rem]">
                  <span className={sectionTitleCls}>Suggestions</span>
                </div>
                {suggestions.map((suggestion, index) => (
                  <button key={`${suggestion.type}-${suggestion.id}`} type="button" className={`${dropdownItemCls} ${activeIndex === index ? '!bg-ivory' : ''}`} onClick={() => handleSearch(suggestion.title)}>
                    <span className={itemIconCls}>{suggestionIcon(suggestion.type)}</span>
                    <span className={itemTextCls}>{suggestion.title}</span>
                    <span className="text-[0.6875rem] text-muted bg-ivory py-[2px] px-[8px] rounded-[4px] shrink-0">{suggestion.type === 'product' ? 'Product' : 'Post'}</span>
                  </button>
                ))}
              </div>
            )}
            {query.trim().length > 0 && !loading && suggestions.length === 0 && (
              <div className="flex items-center gap-[0.5rem] p-[1rem] text-[0.8125rem] text-muted">No suggestions found. Press Enter to search.</div>
            )}
          </div>
        )}
      </div>

      {/* Mobile search trigger */}
      <button type="button" className="hidden max-sm:flex items-center justify-center w-[36px] h-[36px] rounded-[8px] bg-transparent border border-border text-charcoal cursor-pointer transition-all duration-[200ms] shrink-0 hover:bg-ivory hover:border-charcoal" onClick={() => { setMobileOpen(true); setRecentSearches(getRecentSearches()); setTimeout(() => mobileInputRef.current?.focus(), 100); }} aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="hidden max-sm:block fixed inset-0 z-[200] bg-white animate-fade-in">
          <div className="h-full flex flex-col overflow-y-auto">
            <form onSubmit={handleMobileSubmit} className="flex items-center gap-[0.5rem] p-[1rem] border-b border-border-light">
              <span className="flex items-center text-muted shrink-0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg></span>
              <input ref={mobileInputRef} type="text" className="flex-1 border-none bg-transparent font-body text-[1rem] text-charcoal outline-none placeholder:text-muted" placeholder="Search anything..." value={query} onChange={handleInputChange} autoComplete="off" />
              <button type="button" className="font-body text-[0.8125rem] font-medium text-charcoal bg-transparent border-none cursor-pointer py-[0.375rem] px-[0.5rem] shrink-0 transition-colors duration-[200ms] hover:text-gold-dark" onClick={() => { setMobileOpen(false); setQuery(''); }}>Cancel</button>
            </form>
            {query.trim().length === 0 && recentSearches.length > 0 && (
              <div className="py-[0.25rem]">
                <div className="flex items-center justify-between py-[0.5rem] px-[1rem]">
                  <span className={sectionTitleCls}>Recent Searches</span>
                  <button type="button" className="font-body text-[0.6875rem] text-muted bg-transparent border-none cursor-pointer py-[2px] px-[6px] rounded-[4px] transition-all duration-[200ms] hover:text-charcoal hover:bg-ivory" onClick={handleClearRecent}>Clear</button>
                </div>
                {recentSearches.map((search) => (
                  <button key={search} type="button" className={dropdownItemCls} onClick={() => handleMobileSearch(search)}>
                    <span className={itemIconCls}>{clockSvg}</span>
                    <span className={itemTextCls}>{search}</span>
                  </button>
                ))}
              </div>
            )}
            {query.trim().length > 0 && loading && (
              <div className="py-[0.25rem]"><div className="flex items-center gap-[0.5rem] p-[1rem] text-[0.8125rem] text-muted"><div className="w-[14px] h-[14px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" /><span>Searching...</span></div></div>
            )}
            {query.trim().length > 0 && !loading && suggestions.length > 0 && (
              <div className="py-[0.25rem]">
                {suggestions.map((suggestion) => (
                  <button key={`m-${suggestion.type}-${suggestion.id}`} type="button" className={dropdownItemCls} onClick={() => handleMobileSearch(suggestion.title)}>
                    <span className={itemIconCls}>{suggestionIcon(suggestion.type)}</span>
                    <span className={itemTextCls}>{suggestion.title}</span>
                    <span className="text-[0.6875rem] text-muted bg-ivory py-[2px] px-[8px] rounded-[4px] shrink-0">{suggestion.type === 'product' ? 'Product' : 'Post'}</span>
                  </button>
                ))}
              </div>
            )}
            {query.trim().length > 0 && !loading && suggestions.length === 0 && (
              <div className="py-[0.25rem]"><div className="flex items-center gap-[0.5rem] p-[1rem] text-[0.8125rem] text-muted">No suggestions found. Press Enter to search.</div></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
