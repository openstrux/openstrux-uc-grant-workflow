"use client";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyState?: React.ReactNode;
  onRowAction?: (row: T) => void;
  getRowKey: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  emptyState,
  onRowAction,
  getRowKey,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
        {emptyState ?? <p>No data</p>}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm bg-white">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider",
                  col.className ?? "",
                ].join(" ")}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowAction ? () => onRowAction(row) : undefined}
              className={[
                "border-b border-slate-100 last:border-b-0 transition-colors",
                onRowAction ? "cursor-pointer hover:bg-slate-50" : "",
              ].join(" ")}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
