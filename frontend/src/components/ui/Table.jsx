// src/components/ui/Table.jsx
// A reusable data table with loading skeletons, empty state, and optional pagination.
// Use this for all list pages (clients, projects, tickets, etc.)

import { Loader2 } from 'lucide-react';

export default function Table({
  columns = [],       // Array of { key, label, render? }
  data = [],          // Array of row objects
  loading = false,    // Show skeleton when true
  emptyMessage = 'No data found.',
  onRowClick,         // Optional: callback when a row is clicked
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        {/* Table header */}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Loading state — shows placeholder skeleton rows */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            /* Empty state */
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-16 text-slate-400"
              >
                <Loader2 size={24} className="mx-auto mb-2 text-slate-300" />
                <p>{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            /* Actual data rows */
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-b border-slate-50 transition-colors
                  ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                  ${onRowClick ? 'cursor-pointer hover:bg-accent/5' : 'hover:bg-slate-50/50'}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {/* Use custom render function if provided, otherwise show raw value */}
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
