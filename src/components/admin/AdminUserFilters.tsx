'use client';

import { useState, useEffect, useRef } from 'react';

interface AdminUserFiltersProps {
  search: string;
  role: string;
  status: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

const selectCls = "py-[0.5rem] px-[0.875rem] pr-[2rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white cursor-pointer outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.875rem_center] transition-colors duration-[200ms] focus:border-charcoal";

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

  useEffect(() => { setLocalSearch(search); }, [search]);

  function handleSearchInput(value: string) {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { onSearchChange(value); }, 300);
  }

  useEffect(() => { return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }; }, []);

  return (
    <div className="flex items-center gap-[1rem] flex-wrap max-sm:flex-col max-sm:items-stretch">
      <div className="flex items-center gap-[0.5rem] py-[0.5rem] px-[0.875rem] bg-white border border-border rounded-[8px] flex-1 min-w-[220px] max-w-[400px] transition-colors duration-[200ms] focus-within:border-charcoal">
        <span className="text-[1rem] text-muted shrink-0">&#x2315;</span>
        <input
          type="text"
          className="flex-1 border-none bg-transparent font-body text-[0.8125rem] text-charcoal outline-none min-w-0 placeholder:text-muted"
          placeholder="Search users by name or email..."
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          aria-label="Search users"
        />
        {localSearch && (
          <button
            type="button"
            className="bg-none border-none text-[0.6875rem] text-muted cursor-pointer p-[2px] leading-none transition-colors duration-[200ms] hover:text-charcoal"
            onClick={() => handleSearchInput('')}
            aria-label="Clear search"
          >
            &#10005;
          </button>
        )}
      </div>

      <select className={selectCls} value={role} onChange={(e) => onRoleChange(e.target.value)} aria-label="Filter by role">
        <option value="">All Roles</option>
        <option value="SUPER_ADMIN">Admin</option>
        <option value="SELLER">Seller</option>
        <option value="BUYER">Buyer</option>
      </select>

      <select className={selectCls} value={status} onChange={(e) => onStatusChange(e.target.value)} aria-label="Filter by status">
        <option value="">All Status</option>
        <option value="ACTV">Active</option>
        <option value="SUSP">Suspended</option>
        <option value="INAC">Inactive</option>
      </select>
    </div>
  );
}
