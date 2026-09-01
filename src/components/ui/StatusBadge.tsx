const TONE: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-red-50 text-red-600 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  default: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_TONE: Record<string, keyof typeof TONE> = {
  Finished: "success", Complete: "success", Paid: "success", Accepted: "success", Active: "success", Answered: "success",
  "In Progress": "info", Sent: "info", Open: "info", "Not Started": "default", Draft: "default",
  Cancelled: "danger", Overdue: "danger", Declined: "danger", Closed: "danger", Unpaid: "danger",
  "On Hold": "warning", "Partially Paid": "warning", Testing: "warning", "Awaiting Feedback": "warning", "Not Sent": "warning",
  Low: "default", Medium: "warning", High: "danger",
};

export default function StatusBadge({ label }: { label: string }) {
  const tone = STATUS_TONE[label] ?? "default";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>
      {label}
    </span>
  );
}
