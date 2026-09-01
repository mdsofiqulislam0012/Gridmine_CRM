"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { proposals } from "@/data/sales";
import { Column, Proposal } from "@/types";

const columns: Column<Proposal>[] = [
  { key: "id", header: "Proposal #" },
  { key: "subject", header: "Subject" },
  { key: "customer", header: "Customer" },
  { key: "total", header: "Total" },
  { key: "date", header: "Date" },
  { key: "openTill", header: "Open Till" },
  { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} /> },
];

export default function ProposalsPage() {
  return (
    <div>
      <PageHeader title="Proposals" actions={<NewRecordButton label="New Proposal" fields={["Subject", "Customer", "Total", "Open Till"]} />} />
      <DataTable columns={columns} rows={proposals} searchKeys={["subject", "customer"]} selectable bulkActions />
    </div>
  );
}
