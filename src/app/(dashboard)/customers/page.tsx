"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SummaryCard from "@/components/ui/SummaryCard";
import DataTable from "@/components/ui/DataTable";
import { Column, Customer } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Eye, Pencil, Plus, X } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const supabase = useMemo(() => createClient(), []);

  
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
const [savingCustomer, setSavingCustomer] = useState(false);
const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
const [success, setSuccess] = useState("");
const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
const [statusFilter, setStatusFilter] = useState<
  "all" | "active" | "inactive"
>("all");
const [filtersReady, setFiltersReady] = useState(false);

const [groupFilter, setGroupFilter] = useState("all");

const [dateFilter, setDateFilter] = useState<
  "all" | "today" | "7days" | "30days"
>("all");

useEffect(() => {
  const savedFilters = localStorage.getItem("customerFilters");

  if (savedFilters) {
    const parsed = JSON.parse(savedFilters);

    setStatusFilter(parsed.status ?? "all");
    setGroupFilter(parsed.group ?? "all");
    setDateFilter(parsed.date ?? "all");
  }

  setFiltersReady(true);
}, []);

useEffect(() => {
  if (!filtersReady) return;

  localStorage.setItem(
    "customerFilters",
    JSON.stringify({
      status: statusFilter,
      group: groupFilter,
      date: dateFilter,
    })
  );
}, [filtersReady, statusFilter, groupFilter, dateFilter]);

const customerGroups = useMemo(() => {
  return Array.from(
    new Set(
      customers
        .map((customer) => customer.group)
        .filter((group) => group && group.trim() !== "")
    )
  );
}, [customers]);

const filteredCustomers = useMemo(() => {
  return customers.filter((customer) => {
    if (statusFilter === "active" && !customer.active) {
      return false;
    }

    if (statusFilter === "inactive" && customer.active) {
      return false;
    }

    if (groupFilter !== "all" && customer.group !== groupFilter) {
      return false;
    }

    if (dateFilter !== "all") {
      const customerDate = new Date(customer.dateCreated);

      if (Number.isNaN(customerDate.getTime())) {
        return false;
      }

      const now = new Date();

      if (
        dateFilter === "today" &&
        customerDate.toLocaleDateString() !== now.toLocaleDateString()
      ) {
        return false;
      }

      if (dateFilter === "7days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        if (customerDate < sevenDaysAgo) {
          return false;
        }
      }

      if (dateFilter === "30days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        if (customerDate < thirtyDaysAgo) {
          return false;
        }
      }
    }

    return true;
  });
}, [customers, statusFilter, groupFilter, dateFilter]);
  const activeFilterCount = [
  statusFilter !== "all",
  groupFilter !== "all",
  dateFilter !== "all",
  ].filter(Boolean).length;

const [newCustomer, setNewCustomer] = useState({
  name: "",
  company: "",
  email: "",
  phone: "",
  group_name: "Fiverr",
  active: true,
});

const loadCustomers = useCallback(async () => {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, company, email, phone, status, group_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading customers:", error);
    return;
  }

  const mappedCustomers: Customer[] = (data ?? []).map((customer) => ({
    id: customer.id,
    company: customer.company ?? "",
    contact: customer.name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    active: customer.status === "active",
    group: customer.group_name ?? "",
    dateCreated: customer.created_at
      ? new Date(customer.created_at).toLocaleDateString()
      : "",
  }));

  setCustomers(mappedCustomers);
}, [supabase]);

useEffect(() => {
  loadCustomers();
}, [loadCustomers]);

const handleCreateCustomer = async () => {
  if (!newCustomer.company.trim()) {
  alert("Company name is required.");
  return;
}

  setSavingCustomer(true);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Unable to identify user:", userError);
    setSavingCustomer(false);
    return;
  }

  const isEditMode = Boolean(editingCustomerId);

    const customerData = {
      user_id: user.id,
      name: newCustomer.name.trim() || null,
      company: newCustomer.company.trim(),
      email: newCustomer.email.trim() || null,
      phone: newCustomer.phone.trim() || null,
      group_name: newCustomer.group_name || null,
      status: newCustomer.active ? "active" : "inactive",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = isEditMode
      ? await supabase
          .from("customers")
          .update(customerData)
          .eq("id", editingCustomerId!)
          .select("*")
          .single()
      : await supabase
        .from("customers")
      .insert(customerData)
     .select("*")
    .single();

  if (error) {
    console.error("Error creating customer:", error);
    alert(error.message);
    setSavingCustomer(false);
    return;
  }

  const createdCustomer: Customer = {
    id: data.id,
    company: data.company ?? "",
    contact: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    active: data.status === "active",
    group: data.group_name ?? "",
    dateCreated: data.created_at
      ? new Date(data.created_at).toLocaleDateString()
      : "",
  };

  setCustomers((current) =>
  isEditMode
    ? current.map((customer) =>
        String(customer.id) === String(editingCustomerId)
          ? createdCustomer
          : customer
      )
    : [createdCustomer, ...current]
  );
  setSuccess(
  isEditMode
    ? "Customer updated successfully!"
    : "Customer created successfully!"
);

setTimeout(() => {
  setSuccess("");
}, 2600);

  setNewCustomer({
  name: "",
  company: "",
  email: "",
  phone: "",
  group_name: "Fiverr",
  active: true,
});

  setNewCustomerOpen(false);
  setEditingCustomerId(null);
  setSavingCustomer(false);
};

  const toggleActive = async (id: string | number) => {
  const customer = customers.find((c) => c.id === id);

  if (!customer) return;

  const newActiveStatus = !customer.active;

  const { error } = await supabase
    .from("customers")
    .update({
      status: newActiveStatus ? "active" : "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(id));

  if (error) {
    console.error("Error updating customer status:", error);
    return;
  }

  setCustomers((current) =>
    current.map((c) =>
      c.id === id ? { ...c, active: newActiveStatus } : c
    )
  );
  };  

  const handleBulkAction = async (
  action: "active" | "inactive" | "delete",
  selectedIds: (string | number)[]
) => {
  const ids = selectedIds.map(String);

  if (action === "delete") {
    const confirmed = window.confirm(
      `Delete ${ids.length} selected customer${ids.length > 1 ? "s" : ""}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Error deleting customers:", error);
      alert(error.message);
      return;
    }
  } else {
    const { error } = await supabase
      .from("customers")
      .update({
        status: action === "active" ? "active" : "inactive",
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) {
      console.error("Error updating customers:", error);
      alert(error.message);
      return;
    }
  }

  await loadCustomers();
};

  const columns: Column<Customer>[] = [
    { key: "id", header: "#" },
    {
      key: "company",
      header: "Company",
      render: (customer) => (
        <button
          type="button"
          onClick={() => setViewingCustomer(customer)}
          className="font-medium text-gray-800 transition hover:text-brand hover:underline"
        >
          {customer.company || "—"}
        </button>
      ),
    },
    { key: "contact", header: "Primary Contact" },
    { key: "email", header: "Primary Email" },
    { key: "phone", header: "Phone" },
   {
      key: "active",
      header: "Active",
      render: (r) => (
        <div className="flex w-full items-center justify-center">
          <button
            type="button"
            onClick={() => toggleActive(r.id)}
            className={`relative h-7 w-12 rounded-full transition-all duration-200 ${
              r.active
                ? "bg-blue-500 shadow-[0_4px_10px_rgba(59,130,246,0.30)]"
                : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                r.active ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      ),
    },
    { key: "group", header: "Groups", render: (r) => r.group ? <span className="rounded border border-border-subtle bg-gray-50 px-2 py-0.5 text-xs">{r.group}</span> : "" },
    { key: "dateCreated", header: "Date Created" },

            {
              key: "actions",
              header: "Actions",
              render: (customer) => (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingCustomer(customer)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Eye size={13} />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomerId(String(customer.id));

                      setNewCustomer({
                        name: customer.contact ?? "",
                        company: customer.company ?? "",
                        email: customer.email ?? "",
                        phone: customer.phone ?? "",
                        group_name: customer.group ?? "Fiverr",
                        active: customer.active,
                      });

                      setNewCustomerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                </div>
              ),
            },
  ];

  const active = customers.filter((c) => c.active).length;
  const activeContacts = customers.filter(
    (customer) => customer.contact.trim() !== "" && customer.active
    ).length;

    const inactiveContacts = customers.filter(
      (customer) => customer.contact.trim() !== "" && !customer.active
    ).length;

    const today = new Date().toLocaleDateString();

    const contactsLoggedToday = customers.filter(
      (customer) =>
        customer.contact.trim() !== "" &&
        customer.dateCreated === today
    ).length;

  return (
    <div>
      {success && (
        <div className="toast-card-motion fixed bottom-6 right-6 z-[100] w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="flex items-start gap-3 px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Changes saved
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                {success}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="toast-progress h-[3px] w-full bg-green-500" />
        </div>
      )}
      <PageHeader
        title="Customers"
        subtitle={
          <a href="/customers" className="text-brand hover:underline">
            Contacts
          </a>
        }
        actions={
          <button
            type="button"
            onClick={() => setNewCustomerOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={15} />
            New Customer
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {viewingCustomer && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    onMouseDown={() => setViewingCustomer(null)}
  >
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Customer Details
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            View complete customer information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewingCustomer(null)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={17} />
        </button>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Company
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {viewingCustomer.company || "—"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Primary Contact
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {viewingCustomer.contact || "—"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Email
          </p>
          {viewingCustomer.email ? (
              <a
                href={`mailto:${viewingCustomer.email}`}
                className="mt-1 block break-all text-sm font-semibold text-brand hover:underline"
              >
                {viewingCustomer.email}
              </a>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-900">—</p>
            )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Phone
          </p>
          {viewingCustomer.phone ? (
              <a
                href={`tel:${viewingCustomer.phone}`}
                className="mt-1 block text-sm font-semibold text-brand hover:underline"
              >
                {viewingCustomer.phone}
              </a>
            ) : ( 
              <p className="mt-1 text-sm font-semibold text-gray-900">—</p>
            )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Group
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {viewingCustomer.group || "—"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Status
          </p>

          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              viewingCustomer.active
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {viewingCustomer.active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 sm:col-span-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Date Created
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {viewingCustomer.dateCreated || "—"}
          </p>
        </div>
      </div>

        {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => setViewingCustomer(null)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                const customer = viewingCustomer;

                setEditingCustomerId(String(customer.id));

                setNewCustomer({
                  name: customer.contact ?? "",
                  company: customer.company ?? "",
                  email: customer.email ?? "",
                  phone: customer.phone ?? "",
                  group_name: customer.group ?? "Fiverr",
                  active: customer.active,
                });

                setViewingCustomer(null);
                setNewCustomerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Pencil size={14} />
              Edit Customer
            </button>
          </div>
              </div>
            </div>
          )}
        {newCustomerOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onMouseDown={() => setNewCustomerOpen(false)}
      >
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {editingCustomerId ? "Edit Customer" : "New Customer"}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {editingCustomerId
                  ? "Update the existing customer information."
                  : "Add a new customer to your CRM."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewCustomerOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={17} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Company *
              </span>
              <input
                type="text"
                value={newCustomer.company}
                onChange={(e) =>
                  setNewCustomer((current) => ({
                    ...current,
                    company: e.target.value,
                  }))
                }
                placeholder="Enter company name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Primary Contact
              </span>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter primary contact name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Email
                </span>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Phone
                </span>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer((current) => ({
                      ...current,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Phone number"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
            </div>
          </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Group
              </span>

              <select
                value={newCustomer.group_name}
                onChange={(e) =>
                  setNewCustomer((current) => ({
                    ...current,
                    group_name: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              >
                <option value="Fiverr">Fiverr</option>
                <option value="Direct - Local">Direct - Local</option>
                <option value="Direct">Direct</option>
                <option value="Referral">Referral</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <div className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Active
              </span>

              <button
                type="button"
                onClick={() =>
                  setNewCustomer((current) => ({
                    ...current,
                    active: !current.active,
                  }))
                }
                className={`relative h-10 w-full rounded-lg border px-3 transition ${
                  newCustomer.active
                    ? "border-brand bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {newCustomer.active ? "Active" : "Inactive"}
                  </span>

                  <span
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      newCustomer.active ? "bg-brand" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                        newCustomer.active
                          ? "translate-x-[18px]"
                          : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => setNewCustomerOpen(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreateCustomer}
              disabled={savingCustomer}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCustomer
                ? "Saving..."
                  : editingCustomerId
                ? "Save"
              : "Save Customer"}
            </button>
          </div>
        </div>
      </div>
    )}
        <SummaryCard label="Total Customers" value={String(customers.length)} />
        <SummaryCard label="Active Customers" value={String(active)} color="text-emerald-600" />
        <SummaryCard label="Inactive Customers" value={String(customers.length - active)} color="text-red-500" />
        <SummaryCard label="Active Contacts" value={String(activeContacts)} color="text-emerald-600" />
        <SummaryCard label="Inactive Contacts" value={String(inactiveContacts)} color="text-red-500" />
        <SummaryCard label="Contacts Logged In Today" value={String(contactsLoggedToday)} />
      </div>

      <div
      className="relative mt-4 rounded-2xl border border-white/70 bg-white/90 p-[1px] transition-all duration-300 hover:-translate-y-[2px]"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(23npm9,246,255,0.90) 50%, rgba(255,255,255,0.98) 100%)",
        boxShadow:
          "0 20px 50px rgba(15,23,42,0.12), 0 8px 24px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      <div className="overflow-visible rounded-[15px] bg-white/95">
        <DataTable
          columns={columns}
          rows={filteredCustomers}
          searchKeys={["company", "email", "contact"]}
          selectable
          bulkActions
          onRefresh={loadCustomers}
          onBulkAction={handleBulkAction}
          activeFilterCount={activeFilterCount}
          columnVisibilityKey="customers-table-columns" 
          filterContent={
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">
          Status
        </label>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as "all" | "active" | "inactive"
            )
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">
          Group
        </label>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="all">All Groups</option>

          {customerGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">
          Date Created
        </label>

        <select
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(
              e.target.value as "all" | "today" | "7days" | "30days"
            )
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setGroupFilter("all");
              setDateFilter("all");
            }}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Clear Filters
          </button>
        </div>
      }
    />
      </div>
    </div>
    </div>
  );
}
