"use client";
import { Filter } from "lucide-react";
import { useState } from "react";

export default function FilterButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
      >
        <Filter size={14} /> Filters
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-border-subtle bg-white p-3 shadow-lg">
          <p className="text-xs text-gray-500">Filter options will be available in a future update.</p>
        </div>
      )}
    </div>
  );
}
