export default function SummaryCard({ label, value, color = "text-gray-800" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-white px-4 py-3">
      <div className={`text-[13px] ${color}`}>{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}
