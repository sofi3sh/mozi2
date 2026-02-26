"use client";

import React, { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
  cell?: (row: T) => React.ReactNode;
  // If no cell provided, will render (row as any)[key]
};

function cmp(a: any, b: any) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  const va = a instanceof Date ? a.getTime() : a;
  const vb = b instanceof Date ? b.getTime() : b;

  if (typeof va === "number" && typeof vb === "number") return va - vb;
  if (typeof va === "boolean" && typeof vb === "boolean") return Number(va) - Number(vb);

  return String(va).localeCompare(String(vb), "uk", { numeric: true, sensitivity: "base" });
}

function Arrow({ dir }: { dir: SortDir }) {
  return (
    <span style={{ opacity: 0.8, fontWeight: 950, marginLeft: 6, color: "var(--accent)" }}>
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

export default function DataTable<T>({
  rows,
  columns,
  getRowId,
  initialSortKey,
  initialSortDir = "asc",
  empty,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  initialSortKey?: string;
  initialSortDir?: SortDir;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
}) {
  const sortableCols = columns.filter((c) => c.sortable);
  const [sortKey, setSortKey] = useState<string>(initialSortKey ?? sortableCols[0]?.key ?? "");
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortable) return rows;

    const list = rows.slice();
    list.sort((ra, rb) => {
      const a = col.sortValue ? col.sortValue(ra) : (ra as any)[sortKey];
      const b = col.sortValue ? col.sortValue(rb) : (rb as any)[sortKey];
      const d = cmp(a, b);
      return sortDir === "asc" ? d : -d;
    });
    return list;
  }, [rows, columns, sortKey, sortDir]);

  function clickHeader(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (!sorted.length) {
    return <>{empty ?? <div className="ui-subtitle">Поки немає даних.</div>}</>;
  }

  return (
    <div className="ui-tableWrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sortKey === c.key;
              return (
                <th
                  key={c.key}
                  className={c.sortable ? "ui-th ui-thSort" : "ui-th"}
                  style={{
                    width: c.width,
                    textAlign: c.align ?? "left",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => clickHeader(c.key)}
                >
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    {c.header}
                    {active && c.sortable ? <Arrow dir={sortDir} /> : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {sorted.map((row) => (
            <tr
              key={getRowId(row)}
              className={onRowClick ? "ui-tr ui-trClickable" : "ui-tr"}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className="ui-td"
                  style={{ textAlign: c.align ?? "left" }}
                >
                  {c.cell ? c.cell(row) : String((row as any)[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
