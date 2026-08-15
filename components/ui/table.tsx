import type { ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";

type TableColumn<T> = {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
};

export function Table<T>({ columns, data, rowKey, emptyMessage = "Tidak ada data." }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background/60">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={combineClassNames(
                  "px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-b-0 hover:bg-background/40">
              {columns.map((column, index) => (
                <td key={index} className={combineClassNames("px-6 py-3", column.className)}>
                  {column.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}