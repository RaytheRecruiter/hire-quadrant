import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => string | number;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function SortableTable<T>({ columns, data, rowKey, emptyMessage = 'No data' }: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else setSortDir('asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getValue = (row: T, col: Column<T>): string | number => {
    if (col.getValue) return col.getValue(row);
    const val = (row as any)[col.key];
    return val ?? '';
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(filters).forEach(([key, filterVal]) => {
      if (!filterVal) return;
      const col = columns.find(c => c.key === key);
      if (!col) return;
      const lower = filterVal.toLowerCase();
      result = result.filter(row => {
        const val = getValue(row, col);
        return String(val).toLowerCase().includes(lower);
      });
    });

    // Apply sort
    if (sortKey && sortDir) {
      const col = columns.find(c => c.key === sortKey);
      if (col) {
        result.sort((a, b) => {
          const aVal = getValue(a, col);
          const bVal = getValue(b, col);
          let cmp = 0;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            cmp = aVal - bVal;
          } else {
            cmp = String(aVal).localeCompare(String(bVal));
          }
          return sortDir === 'desc' ? -cmp : cmp;
        });
      }
    }

    return result;
  }, [data, sortKey, sortDir, filters, columns]);

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div>
      {hasActiveFilters && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <span>Showing {processedData.length} of {data.length} rows</span>
          <button
            onClick={() => setFilters({})}
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="flex flex-col gap-1">
                    <div
                      className={`flex items-center gap-1 ${col.sortable !== false ? 'cursor-pointer select-none hover:text-gray-700 dark:text-slate-300' : ''}`}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                    >
                      {col.label}
                      {col.sortable !== false && (
                        <span className="inline-flex">
                          {sortKey === col.key && sortDir === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-primary-500" />
                          ) : sortKey === col.key && sortDir === 'desc' ? (
                            <ChevronDown className="h-3.5 w-3.5 text-primary-500" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-gray-300" />
                          )}
                        </span>
                      )}
                      {col.filterable !== false && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === col.key ? null : col.key); }}
                          className={`ml-1 ${filters[col.key] ? 'text-primary-500' : 'text-gray-300 hover:text-gray-500 dark:text-slate-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {activeFilter === col.key && (
                      <div className="relative">
                        <input
                          type="text"
                          value={filters[col.key] || ''}
                          onChange={e => setFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                          placeholder={`Filter ${col.label.toLowerCase()}...`}
                          className="w-full text-xs font-normal normal-case border border-gray-300 dark:border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-300"
                          autoFocus
                        />
                        {filters[col.key] && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, [col.key]: '' }))}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map(row => (
                <tr key={rowKey(row)} className="hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50">
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                      {col.render ? col.render(row) : String(getValue(row, col))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
