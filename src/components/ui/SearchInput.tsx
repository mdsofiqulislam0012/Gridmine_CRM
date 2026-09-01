"use client";
import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search..." }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-56 rounded-md border border-border-subtle bg-white py-1.5 pl-8 pr-3 text-[13px] outline-none focus:border-brand"
      />
    </div>
  );
}
