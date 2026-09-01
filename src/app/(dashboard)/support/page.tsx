"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { tickets } from "@/data/tickets";
import { Column, Ticket } from "@/types";

const counts = { Open: 0, "In Progress": 0, Answered: 0, "On Hold": 0, Closed: 0 };

const columns: Column<Ticket>[] = [
  { key: "id", header: "#" },
  { key: "subject", header: "Subject" },
  { key: "tags", header: "Tags", render: (r) => r.tags.join(", ") },
  { key: "department", header: "Department" },
  { key: "service", header: "Service" },
  { key: "contact", header: "Contact" },
  { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} /> },
  { key: "priority", header: "Priority", render: (r) => <StatusBadge label={r.priority} /> },
  { key: "lastReply", header: "Last Reply" },
  { key: "created", header: "Created" },
];

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Support" actions={<NewRecordButton label="New Ticket" fields={["Subject", "Department", "Contact"]} />} />
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.entries(counts) as [string, number][]).map(([label, count]) => (
          <span key={label} className="rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px]">
            {count} <StatusBadge label={label} />
          </span>
        ))}
      </div>
      <DataTable columns={columns} rows={tickets} searchKeys={["subject", "contact"]} selectable bulkActions />
    </div>
  );
}
