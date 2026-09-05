"use client";
import { useEffect, useMemo, useState } from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { createClient } from "@/lib/supabase/client";


export default function CrmShell({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
  const applyTheme = (mode: "light" | "dark" | "system") => {
    const isDark =
      mode === "dark" ||
      (mode === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = mode;
  };

  const loadTheme = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const localTheme =
        (localStorage.getItem("gridmine-theme") as
          | "light"
          | "dark"
          | "system") || "system";

      applyTheme(localTheme);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("appearance_mode")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error loading saved theme:", error);
      return;
    }

    const savedTheme =
      (data?.appearance_mode as "light" | "dark" | "system") || "system";

    localStorage.setItem("gridmine-theme", savedTheme);
    applyTheme(savedTheme);
  };

  loadTheme();
}, [supabase]);

useEffect(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleSystemThemeChange = () => {
    const currentTheme =
      (localStorage.getItem("gridmine-theme") as
        | "light"
        | "dark"
        | "system") || "system";

    if (currentTheme === "system") {
      document.documentElement.classList.toggle(
        "dark",
        mediaQuery.matches
      );

      document.documentElement.dataset.theme = "system";
    }
  };

  mediaQuery.addEventListener("change", handleSystemThemeChange);

  return () => {
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  };
}, []);


  return (
    <div className="flex min-h-screen">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4">{children}</main>
      </div>
    </div>
  );
}
