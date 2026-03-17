'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './admin.module.css';

interface AdminUserFiltersProps {
  search: string;
  role: string;
  status: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function AdminUserFilters({
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: AdminUserFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  function handleSearchInput(value: string) {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={styles.filters}>
      <div className={styles.searchField}>
        <span className={styles.searchIcon}>&#x2315;</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search users by name or email..."
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          aria-label="Search users"
        />
        {localSearch && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => handleSearchInput('')}
            aria-label="Clear search"
          >
            &#10005;
          </button>
        )}
      </div>

      <select
        className={styles.filterSelect}
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        aria-label="Filter by role"
      >
        <option value="">All Roles</option>
        <option value="SUPER_ADMIN">Admin</option>
        <option value="SELLER">Seller</option>
        <option value="BUYER">Buyer</option>
      </select>

      <select
        className={styles.filterSelect}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All Status</option>
        <option value="ACTV">Active</option>
        <option value="SUSP">Suspended</option>
        <option value="INAC">Inactive</option>
      </select>
    </div>
  );
}
