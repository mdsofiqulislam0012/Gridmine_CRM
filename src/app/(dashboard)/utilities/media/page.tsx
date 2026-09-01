"use client";
import { Upload, FileImage } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import FilterButton from "@/components/ui/FilterButton";
import EmptyState from "@/components/ui/EmptyState";

const demoFiles = [
  { name: "brand-logo.png", size: "48 KB" },
  { name: "hero-banner.jpg", size: "212 KB" },
  { name: "invoice-template.pdf", size: "88 KB" },
];

export default function MediaPage() {
  const [query, setQuery] = useState("");
  const files = demoFiles.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Media"
        actions={
          <button className="flex items-center gap-1.5 rounded-md bg-brand-dark px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <Upload size={14} /> Upload Media
          </button>
        }
      />
      <div className="mb-3 flex items-center justify-between gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Search media..." />
        <FilterButton />
      </div>
      <div className="rounded-lg border border-border-subtle bg-white">
        {files.length === 0 ? <EmptyState /> : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {files.map((f) => (
              <div key={f.name} className="rounded-md border border-border-subtle p-3 text-center">
                <FileImage className="mx-auto mb-2 text-gray-400" size={28} />
                <div className="truncate text-[12px] font-medium text-gray-700">{f.name}</div>
                <div className="text-[11px] text-gray-400">{f.size}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
