"use client";

import { useState, useMemo } from "react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  ArrowUpDownIcon,
} from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableAction<T> {
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: DataTableAction<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  getRowId?: (row: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  searchKey,
  searchPlaceholder = "Buscar...",
  pageSize = 20,
  emptyMessage = "Nenhum item encontrado",
  getRowId,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...data];

    // Search
    if (search && searchKey) {
      const q = search.toLowerCase();
      result = result.filter((row) => {
        const val = row[searchKey];
        return typeof val === "string" && val.toLowerCase().includes(q);
      });
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortAsc
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return result;
  }, [data, search, searchKey, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div>
      {/* Search bar */}
      {searchKey && (
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-[2px] border-2 border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border bg-bg-inset">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3 ${col.className ?? ""}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-text-2"
                    >
                      {col.label}
                      <ArrowUpDownIcon className="size-3" />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                  Acoes
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center font-mono text-[12px] text-text-3"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr
                  key={getRowId ? getRowId(row) : idx}
                  className="border-b border-border transition-colors hover:bg-bg-hover"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-[13px] text-text-2 ${col.className ?? ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {actions.map((action) => (
                          <Button
                            key={action.label}
                            size="xs"
                            variant={action.variant ?? "ghost"}
                            onClick={() => action.onClick(row)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-[11px] text-text-3">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeftIcon className="size-3" />
            </Button>
            <span className="font-mono text-[11px] text-text-3">
              {page} / {totalPages}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRightIcon className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
