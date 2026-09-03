"use client";
import { useMemo, useState } from "react";
import { Column } from "@/types";
import SearchInput from "./SearchInput";
import FilterButton from "./FilterButton";
import EmptyState from "./EmptyState";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Columns3,
  Download,
  RefreshCw,
} from "lucide-react";
type ID = number | string;

export default function DataTable<T extends { id: ID }>({
  columns,
  rows,
  searchKeys,
  selectable,
  bulkActions,
  newButton,
  extraToolbar,
  onRefresh,
}: {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T)[];
  selectable?: boolean;
  bulkActions?: boolean;
  newButton?: React.ReactNode;
  extraToolbar?: React.ReactNode;
  onRefresh?: () => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
  key: string;
  direction: "asc" | "desc";
  } | null>(null);

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);

const visibleColumns = useMemo(
  () => columns.filter((column) => !hiddenColumns.has(column.key)),
  [columns, hiddenColumns]
);

const toggleColumnVisibility = (key: string) => {
  setHiddenColumns((current) => {
    const next = new Set(current);

    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }

    return next;
  });
};

  const filtered = useMemo(() => {
    if (!query || !searchKeys) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
  if (!sortConfig) return filtered;

  return [...filtered].sort((a, b) => {
    const aValue = String(
      (a as Record<string, unknown>)[sortConfig.key] ?? ""
    ).toLowerCase();

    const bValue = String(
      (b as Record<string, unknown>)[sortConfig.key] ?? ""
    ).toLowerCase();

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }

    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }

    return 0;
  });
}, [filtered, sortConfig]);

  const visible = sorted.slice(0, pageSize);
  const allSelected = selectable && visible.length > 0 && visible.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(visible.map((r) => r.id)));
  };
  const toggleOne = (id: ID) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

    const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
        });
      };

      const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <ChevronsUpDown
          size={14}
          className="text-gray-400 opacity-0 transition group-hover:opacity-100"
        />
      );
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-brand" />
    ) : (
      <ChevronDown size={14} className="text-brand" />
    );
  };

    const handleExport = () => {
    if (sorted.length === 0) return;

    const exportColumns = visibleColumns.filter(
      (column) => column.key !== "actions"
    );

    const escapeCsvValue = (value: unknown) => {
      const text = String(value ?? "").replace(/"/g, '""');
      return `"${text}"`;
    };

    const headerRow = exportColumns
      .map((column) => escapeCsvValue(column.header))
      .join(",");

    const dataRows = sorted.map((row) =>
      exportColumns
        .map((column) =>
          escapeCsvValue(
            (row as Record<string, unknown>)[column.key]
          )
        )
        .join(",")
    );

    const csvContent = [headerRow, ...dataRows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `export-${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-md border border-border-subtle bg-white px-2 py-1.5 text-[13px] outline-none">
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
          {bulkActions && (
            <button disabled={selected.size === 0} className="rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              Bulk Actions{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
          )}
          <button
            type="button"
            onClick={() => onRefresh?.()}
            className="rounded-md border border-border-subtle bg-white p-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            title="Refresh data"
          >
            <RefreshCw size={14} />
          </button>
          {newButton}
          {extraToolbar}
        </div>
        <div className="flex items-center gap-2">
          {searchKeys && <SearchInput value={query} onChange={setQuery} />}
          <div className="relative">
          <button
            type="button"
            onClick={() => setColumnsMenuOpen((current) => !current)}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Columns3 size={14} />
            Columns
            <ChevronDown size={13} />
          </button>

          {columnsMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Show / Hide Columns
              </p>

              {columns
                .filter((column) => column.key !== "actions")
                .map((column) => {
                  const isVisible = !hiddenColumns.has(column.key);

                  return (
                    <label
                      key={column.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-gray-700 transition hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumnVisibility(column.key)}
                        className="rounded border-gray-300"
                      />

                      <span>{column.header}</span>
                    </label>
                  );
                })}
            </div>
          )}
        </div>
          <FilterButton />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-gray-500">
                {selectable && (
                  <th className="w-10 px-4 py-2.5">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                  </th>
                )}

                {visibleColumns.map((c) => {
                const isSortable = c.key !== "actions";
                const isActiveSort = sortConfig?.key === c.key;

                return (
                  <th
                    key={c.key}
                    className="px-2 py-2"
                    style={{ width: c.width }}
                  >
                    {isSortable ? (
  <div
    className="group relative flex w-full items-center rounded-lg border border-transparent transition-all duration-200 hover:z-20 hover:-translate-y-[2px] hover:border-gray-200 hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,0.14),0_2px_5px_rgba(15,23,42,0.07)] focus:outline-none"
  >
    <button
      type="button"
      onClick={() => handleSort(c.key)}
      className="flex flex-1 items-center px-3 py-2 text-left font-semibold text-gray-600 hover:text-gray-900"
    >
      {c.header}
    </button>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpenColumnMenu((current) =>
          current === c.key ? null : c.key
        );
      }}
      className="mr-1 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
    >
      <ChevronDown size={14} />
    </button>

    {openColumnMenu === c.key && (
      <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-[0_12px_35px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          onClick={() => {
            setSortConfig({
              key: c.key,
              direction: "asc",
            });
            setOpenColumnMenu(null);
          }}
          className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
        >
          Sort Ascending
        </button>

        <button
          type="button"
          onClick={() => {
            setSortConfig({
              key: c.key,
              direction: "desc",
            });
            setOpenColumnMenu(null);
          }}
          className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
        >
          Sort Descending
        </button>

        <div className="my-1 border-t border-gray-100" />

        <button
          type="button"
          onClick={() => {
            toggleColumnVisibility(c.key);
            setOpenColumnMenu(null);
          }}
          className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
        >
          Hide Column
        </button>
      </div>
        )}
      </div>
        ) : (
      <div className="px-3 py-2 font-semibold text-gray-600">
        {c.header}
      </div>
      )} 
        </th>
          );
        })}

              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={String(row.id)} className="border-b border-border-subtle last:border-0 hover:bg-gray-50">
                  {selectable && (
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} className="rounded border-gray-300" />
                    </td>
                  )}
                  {visibleColumns.map((c) => (
                    <td key={c.key} className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2.5 text-xs text-gray-500">
        <span>Showing {visible.length} of {filtered.length}</span>
      </div>
    </div>
  );
}


