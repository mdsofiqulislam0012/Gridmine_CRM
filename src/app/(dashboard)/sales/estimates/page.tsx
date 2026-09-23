"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
        console.error("Estimate role error:", error);
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
        title="Estimates"
        actions={
          hasFullAccess ? (
            <NewRecordButton
              label="New Estimate"
              fields={["Customer", "Amount", "Expiry Date"]}
            />
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        rows={estimates}
        searchKeys={["customer"]}
        selectable={hasFullAccess}
        bulkActions={hasFullAccess}
      />
    </div>
  );
}
