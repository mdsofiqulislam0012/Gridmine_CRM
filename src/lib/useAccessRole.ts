"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAccessRole() {
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
        console.error("Role load error:", error);
        return;
      }

      setUserRole(data?.role || "user");
    };

    loadUserRole();
  }, [supabase]);

  const hasFullAccess =
    userRole === "admin" || userRole === "sub_admin";

  return {
    userRole,
    hasFullAccess,
  };
}