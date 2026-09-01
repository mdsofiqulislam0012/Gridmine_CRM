"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { estimates } from "@/data/sales";
import { Column, Estimate } from "@/types";

const columns: Column<Estimate>[] = [
  { key: "id", header: "Estimate #" },
  { key: "customer", header: "Customer" },
  { key: "amount", header: "Amount" },
  { key: "date", header: "Date" },
  { key: "expiryDate", header: "Expiry Date" },
  { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} /> },
];

export default function EstimatesPage() {
  return (
    <div>
      <PageHeader title="Estimates" actions={<NewRecordButton label="New Estimate" fields={["Customer", "Amount", "Expiry Date"]} />} />
      <DataTable columns={columns} rows={estimates} searchKeys={["customer"]} selectable bulkActions />
    </div>
  );
}
