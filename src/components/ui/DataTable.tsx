"use client";
import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Column } from "@/types";
import SearchInput from "./SearchInput";
import FilterButton from "./FilterButton";
import EmptyState from "./EmptyState";

export default function DataTable<T extends { id: ID_ }>({
  columns, rows, searchKeys, selectable, bulkActions, newButton, extraToolbar,
}: {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T)[];
  selectable?: boolean;
  bulkActions?: boolean;
  newButton?: React.ReactNode;
  extraToolbar?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<ID_>>(new Set());

  const filtered = useMemo(() => {
    if (!query || !searchKeys) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, query, searchKeys]);

  const visible = filtered.slice(0, pageSize);
  const allSelected = selectable && visible.length > 0 && visible.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(visible.map((r) => r.id)));
  };
  const toggleOne = (id: ID_) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-md border border-border-subtle bg-white px-2 py-1.5 text-[13px] outline-none">
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
          {bulkActions && (
            <button disabled={selected.size === 0} className="rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              Bulk Actions{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
          )}
          <button className="rounded-md border border-border-subtle bg-white p-1.5 text-gray-500 hover:bg-gray-50"><RefreshCw size={14} /></button>
          {newButton}
          {extraToolbar}
        </div>
        <div className="flex items-center gap-2">
          {searchKeys && <SearchInput value={query} onChange={setQuery} />}
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
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-2.5 font-semibold" style={{ width: c.width }}>{c.header}</th>
                ))}
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
                  {columns.map((c) => (
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

type ID_ = number | string;
