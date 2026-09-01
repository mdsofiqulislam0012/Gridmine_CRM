import { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon, label, value, total, progress,
}: { icon: LucideIcon; label: string; value: number | string; total?: number | string; progress?: number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-600">
          <Icon size={16} strokeWidth={1.75} />
          <span className="text-[13px]">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-800">
          {value}{total !== undefined && <span className="text-gray-400 font-normal"> / {total}</span>}
        </span>
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-gray-100">
        <div className="h-1 rounded-full bg-brand" style={{ width: `${progress ?? 0}%` }} />
      </div>
    </div>
  );
}
