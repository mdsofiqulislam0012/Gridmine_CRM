"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import { payments } from "@/data/sales";
import { Column, Payment } from "@/types";

const columns: Column<Payment>[] = [
  { key: "id", header: "Payment #" },
  { key: "invoiceId", header: "Invoice #" },
  { key: "mode", header: "Payment Mode" },
  { key: "transactionId", header: "Transaction ID" },
  { key: "customer", header: "Customer" },
  { key: "amount", header: "Amount" },
  { key: "date", header: "Date" },
];

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader title="Payments" />
      <DataTable columns={columns} rows={payments} searchKeys={["customer", "transactionId"]} selectable bulkActions />
    </div>
  );
}
