"use client";
import { LayoutGrid } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { leads } from "@/data/leads";
import { Column, Lead } from "@/types";

const columns: Column<Lead>[] = [
  { key: "id", header: "#" },
  { key: "name", header: "Name" },
  { key: "company", header: "Company" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "value", header: "Value" },
  { key: "tags", header: "Tags", render: (r) => r.tags.join(", ") },
  { key: "assigned", header: "Assigned" },
  { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} /> },
  { key: "source", header: "Source" },
  { key: "lastContact", header: "Last Contact" },
  { key: "created", header: "Created" },
  { key: "fiverrUrl", header: "Fiverr Profile URL" },
];

export default function LeadsPage() {
  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={
          <div className="flex gap-2">
            <span className="rounded-md border border-border-subtle bg-white px-2.5 py-1 text-[13px]">0 Client</span>
            <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[13px] text-red-500">0 Lost Leads - 0%</span>
          </div>
        }
        actions={
          <>
            <NewRecordButton label="New Lead" fields={["Name", "Company", "Email", "Value"]} />
            <button className="rounded-md border border-border-subtle bg-white p-1.5 text-gray-500 hover:bg-gray-50"><LayoutGrid size={16} /></button>
          </>
        }
      />
      <DataTable columns={columns} rows={leads} searchKeys={["name", "company", "email"]} selectable bulkActions />
    </div>
  );
}
