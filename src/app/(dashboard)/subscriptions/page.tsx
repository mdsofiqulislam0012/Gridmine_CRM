"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { subscriptions } from "@/data/subscriptions";
import { Column, Subscription } from "@/types";

const statuses = [
  ["Not Subscribed", "text-gray-500"], ["Active", "text-emerald-600"], ["Future", "text-blue-600"],
  ["Past Due", "text-amber-600"], ["Unpaid", "text-red-500"], ["Incomplete", "text-gray-500"],
  ["Canceled", "text-red-500"], ["Incomplete Expired", "text-gray-500"],
] as const;

const columns: Column<Subscription>[] = [
  { key: "id", header: "#" },
  { key: "name", header: "Subscription Name" },
  { key: "customer", header: "Customer" },
  { key: "project", header: "Project" },
  { key: "status", header: "Status" },
  { key: "nextBilling", header: "Next Billing Cycle" },
  { key: "dateSubscribed", header: "Date Subscribed" },
  { key: "lastSent", header: "Last Sent" },
];

export default function SubscriptionsPage() {
  return (
    <div>
      <PageHeader title="Subscriptions" actions={<NewRecordButton label="New Subscription" fields={["Subscription Name", "Customer", "Project"]} />} />
      <div className="mb-4 rounded-lg border border-border-subtle bg-white p-4">
        <div className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-600">stripe</span>
          Subscriptions Summary
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          {statuses.map(([label, color]) => (
            <span key={label}><span className="font-semibold text-gray-800">0</span> <span className={color}>{label}</span></span>
          ))}
        </div>
      </div>
      <DataTable columns={columns} rows={subscriptions} searchKeys={["name", "customer"]} />
    </div>
  );
}
