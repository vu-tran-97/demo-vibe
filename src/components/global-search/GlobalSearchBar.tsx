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
import styles from './global-search.module.css';

export function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced suggestion fetch
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchSearchSuggestions(q.trim());
        setSuggestions(result.suggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    fetchSuggestions(value);
  };

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    setQuery('');
    router.push(`/dashboard/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.trim()
      ? suggestions
      : recentSearches.map((s) => ({ type: 'recent' as const, id: s, title: s }));
    const maxIndex = items.length - 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault();
      handleSearch(items[activeIndex].title);
    }
  };

  const showDropdown = isOpen && (
    (query.trim().length === 0 && recentSearches.length > 0) ||
    (query.trim().length > 0 && (suggestions.length > 0 || loading))
  );

  return (
    <div className={styles.container} ref={containerRef}>
      <form onSubmit={handleSubmit} className={styles.searchBox}>
        <span className={styles.searchIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search anything..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            setRecentSearches(getRecentSearches());
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <kbd className={styles.searchKbd}>
          {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl+'}K
        </kbd>
      </form>

      {showDropdown && (
        <div className={styles.dropdown}>
          {/* Recent Searches */}
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <div className={styles.dropdownSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Recent Searches</span>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={handleClearRecent}
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={search}
                  type="button"
                  className={`${styles.dropdownItem} ${activeIndex === index ? styles.dropdownItemActive : ''}`}
                  onClick={() => handleSearch(search)}
                >
                  <span className={styles.itemIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <span className={styles.itemText}>{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {query.trim().length > 0 && loading && (
            <div className={styles.loadingRow}>
              <div className={styles.miniSpinner} />
              <span>Searching...</span>
            </div>
          )}

          {/* Suggestions */}
          {query.trim().length > 0 && !loading && suggestions.length > 0 && (
            <div className={styles.dropdownSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Suggestions</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  type="button"
                  className={`${styles.dropdownItem} ${activeIndex === index ? styles.dropdownItemActive : ''}`}
                  onClick={() => handleSearch(suggestion.title)}
                >
                  <span className={styles.itemIcon}>
                    {suggestion.type === 'product' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    )}
                  </span>
                  <span className={styles.itemText}>{suggestion.title}</span>
                  <span className={styles.itemType}>{suggestion.type === 'product' ? 'Product' : 'Post'}</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.trim().length > 0 && !loading && suggestions.length === 0 && (
            <div className={styles.emptyRow}>
              No suggestions found. Press Enter to search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
