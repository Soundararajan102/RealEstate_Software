'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  FileQuestion,
} from 'lucide-react';
import { SkeletonTableRow } from './Skeleton';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (item: T) => React.ReactNode;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  externalSearchValue?: string;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  initialPageSize?: number;
  maxHeightClass?: string;
  ariaLabel?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  searchPlaceholder = 'Search records...',
  onSearchChange,
  externalSearchValue,
  filterSlot,
  actionSlot,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display in this ledger.',
  initialPageSize = 25,
  maxHeightClass = 'max-h-[calc(100vh-320px)]',
  ariaLabel = 'Data table',
}: DataTableProps<T>) {
  // Local search if not controlled externally
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = externalSearchValue !== undefined ? externalSearchValue : internalSearch;

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
    setPage(1);
  };

  const clearSearch = () => {
    handleSearchChange('');
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // 1. Client-side filtering when external search handler is not provided
  const filteredData = useMemo(() => {
    if (onSearchChange || !searchQuery.trim()) {
      return data;
    }
    const q = searchQuery.toLowerCase().trim();
    return data.filter((item) =>
      Object.values(item).some((val) => {
        if (val == null) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(
            (nested) => nested != null && String(nested).toLowerCase().includes(q),
          );
        }
        return String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, searchQuery, onSearchChange]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // 3. Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="space-y-3">
      {/* Search, Filter & Action Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search input"
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {filterSlot}
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
            Records: <strong className="text-slate-900">{totalItems}</strong>
          </span>
          {actionSlot}
        </div>
      </div>

      {/* Main Table with Absolute Scroll Containment & Sticky Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className={`overflow-x-auto overflow-y-auto ${maxHeightClass}`}>
          <table className="w-full text-left text-xs border-collapse" role="grid" aria-label={ariaLabel}>
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-xs">
              <tr>
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      style={{ width: col.width }}
                      aria-sort={
                        isSorted
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                      className={`py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 ${alignClass} ${col.className || ''}`}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={`inline-flex items-center space-x-1 group hover:text-slate-900 focus-visible:outline-hidden cursor-pointer ${
                            col.align === 'right'
                              ? 'flex-row-reverse space-x-reverse'
                              : col.align === 'center'
                                ? 'justify-center'
                                : ''
                          }`}
                        >
                          <span>{col.header}</span>
                          <span className="text-slate-400 group-hover:text-slate-900">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3 h-3 text-slate-900" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-slate-900" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonTableRow key={idx} columns={columns.length} />
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 px-4 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-full mb-2">
                        <FileQuestion className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {searchQuery ? 'No matching records' : emptyTitle}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchQuery
                          ? `No entries matched your query "${searchQuery}".`
                          : emptyDescription}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="mt-3 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded cursor-pointer"
                        >
                          Clear search filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => (
                  <tr
                    key={keyExtractor(item)}
                    className="hover:bg-slate-50/80 transition-colors focus-within:bg-slate-50/80"
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                            ? 'text-center'
                            : 'text-left';

                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-3.5 text-xs text-slate-700 ${alignClass} ${col.className || ''}`}
                        >
                          {col.render ? col.render(item) : (item[col.key] ?? '—')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized Enterprise Pagination Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-slate-600">
            <span>
              Showing <strong className="text-slate-900">{startRecord}</strong> to{' '}
              <strong className="text-slate-900">{endRecord}</strong> of{' '}
              <strong className="text-slate-900">{totalItems}</strong> entries
            </span>

            <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
              <label htmlFor="page-size-select" className="text-slate-500 text-[11px]">
                Rows per page:
              </label>
              <select
                id="page-size-select"
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="py-1 px-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 text-[11px] mr-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              aria-label="Previous page"
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              aria-label="Next page"
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
