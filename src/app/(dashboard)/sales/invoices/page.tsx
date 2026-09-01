"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { invoices } from "@/data/sales";
import { Column, Invoice } from "@/types";

const columns: Column<Invoice>[] = [
  { key: "id", header: "Invoice #" },
  { key: "customer", header: "Customer" },
  { key: "amount", header: "Amount" },
  { key: "tax", header: "Total Tax" },
  { key: "date", header: "Date" },
  { key: "dueDate", header: "Due Date" },
  { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} /> },
];

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader title="Invoices" actions={<NewRecordButton label="New Invoice" fields={["Customer", "Amount", "Due Date"]} />} />
      <DataTable columns={columns} rows={invoices} searchKeys={["customer"]} selectable bulkActions />
    </div>
  );
}
