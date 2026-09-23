"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
    const supabase = useMemo(() => createClient(), []);
      const [userRole, setUserRole] = useState("user");

        useEffect(() => {
        const loadUserRole = async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return;

          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Proposal role error:", error);
            return;
          }

          setUserRole(data?.role || "user");
        };

        loadUserRole();
      }, [supabase]);

      const hasFullAccess =
        userRole === "admin" || userRole === "sub_admin";

  return (
    <div>
      <PageHeader
        title="Proposals"
        actions={
          hasFullAccess ? (
            <NewRecordButton
              label="New Proposal"
              fields={["Subject", "Customer", "Total", "Open Till"]}
            />
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        rows={proposals}
        searchKeys={["subject", "customer"]}
        selectable={hasFullAccess}
        bulkActions={hasFullAccess}
      />
    </div>
  );
}
