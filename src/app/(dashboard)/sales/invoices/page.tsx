"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { Column, Invoice } from "@/types";
import { useAccessRole } from "@/lib/useAccessRole";

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
  const { hasFullAccess } = useAccessRole();
  const supabase = useMemo(() => createClient(), []);
  const [invoiceRows, setInvoiceRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadInvoices = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        amount,
        tax,
        issue_date,
        due_date,
        status,
        customer:customers!invoices_customer_id_fkey (
          name,
          company
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Invoice load error:", error);
      setLoading(false);
      return;
    }

    const mappedInvoices: Invoice[] = (data ?? []).map((row: any) => {
      const customer = Array.isArray(row.customer)
        ? row.customer[0]
        : row.customer;

      return {
        id: `INV-${String(row.invoice_number).padStart(4, "0")}`,
        customer:
          customer?.company || customer?.name || "Unknown Customer",
        amount: `$${Number(row.amount ?? 0).toFixed(2)}`,
        tax: `$${Number(row.tax ?? 0).toFixed(2)}`,
        date: row.issue_date ?? "",
        dueDate: row.due_date ?? "",
        status: row.status as Invoice["status"],
      };
    });

    setInvoiceRows(mappedInvoices);
    setLoading(false);
  };

  loadInvoices();
}, [supabase]);

const handleCreateInvoice = async (
  values: Record<string, string>
) => {
  const customerInput = values["Customer"]?.trim();
  const amountInput = values["Amount"]?.trim();
  const dueDate = values["Due Date"]?.trim();
  const now = new Date();

const issueDate = `${now.getFullYear()}-${String(
  now.getMonth() + 1
).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (!customerInput || !amountInput) {
    alert("Customer and Amount are required.");
    return;
  }

  const amount = Number(amountInput);

  if (Number.isNaN(amount) || amount < 0) {
    alert("Please enter a valid amount.");
    return;
  }

  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .select("id, name, company");

  if (customerError) {
    console.error("Customer load error:", customerError);
    alert("Could not load customers.");
    return;
  }

  const normalizedCustomer = customerInput.toLowerCase();

  const matchedCustomer = (customers ?? []).find(
    (customer: any) =>
      customer.name?.toLowerCase() === normalizedCustomer ||
      customer.company?.toLowerCase() === normalizedCustomer
  );

  if (!matchedCustomer) {
    alert("Customer not found. Enter the exact customer name or company.");
    return;
  }

  const { error } = await supabase.from("invoices").insert({
    customer_id: matchedCustomer.id,
    amount,
    due_date: dueDate || null,
    issue_date: issueDate,
  });

  if (error) {
    console.error("Invoice create error:", error);
    alert("Invoice could not be created.");
    return;
  }

  alert("Invoice created successfully.");
  window.location.reload();
};

  return (
    <div>
      <PageHeader
        title="Invoices"
        actions={
          hasFullAccess ? (
            <NewRecordButton
              label="New Invoice"
              fields={["Customer", "Amount", "Due Date"]}
              onSave={handleCreateInvoice}
            />
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        rows={loading ? [] : invoiceRows}
        searchKeys={["customer"]}
        selectable={hasFullAccess}
        bulkActions={hasFullAccess}
      />
    </div>
  );
}
