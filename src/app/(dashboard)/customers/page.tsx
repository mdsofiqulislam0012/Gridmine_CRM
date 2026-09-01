"use client";
import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SummaryCard from "@/components/ui/SummaryCard";
import DataTable from "@/components/ui/DataTable";
import { customers as initialCustomers } from "@/data/customers";
import { Column, Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);

  const toggleActive = (id: number) =>
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));

  const columns: Column<Customer>[] = [
    { key: "id", header: "#" },
    { key: "company", header: "Company" },
    { key: "contact", header: "Primary Contact" },
    { key: "email", header: "Primary Email" },
    { key: "phone", header: "Phone" },
    {
      key: "active", header: "Active",
      render: (r) => (
        <button
          onClick={() => toggleActive(r.id)}
          className={`h-5 w-9 rounded-full transition-colors ${r.active ? "bg-brand" : "bg-gray-300"}`}
        >
          <span className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${r.active ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      ),
    },
    { key: "group", header: "Groups", render: (r) => r.group ? <span className="rounded border border-border-subtle bg-gray-50 px-2 py-0.5 text-xs">{r.group}</span> : "" },
    { key: "dateCreated", header: "Date Created" },
  ];

  const active = customers.filter((c) => c.active).length;

  return (
    <div>
      <PageHeader title="Customers" subtitle={<a href="/customers" className="text-brand hover:underline">Contacts →</a>} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Total Customers" value={String(customers.length)} />
        <SummaryCard label="Active Customers" value={String(active)} color="text-emerald-600" />
        <SummaryCard label="Inactive Customers" value={String(customers.length - active)} color="text-red-500" />
        <SummaryCard label="Active Contacts" value="3" color="text-emerald-600" />
        <SummaryCard label="Inactive Contacts" value="0" color="text-red-500" />
        <SummaryCard label="Contacts Logged In Today" value="0" />
      </div>

      <DataTable columns={columns} rows={customers} searchKeys={["company", "email", "contact"]} selectable bulkActions />
    </div>
  );
}
