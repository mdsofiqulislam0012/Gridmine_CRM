"use client";
import { useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
      useEffect(() => {
      const applySavedTheme = () => {
        const savedTheme =
          localStorage.getItem("gridmine-theme") ?? "light";

        const systemDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

        const shouldUseDark =
          savedTheme === "dark" ||
          (savedTheme === "system" && systemDark);

        document.documentElement.classList.toggle(
          "dark",
          shouldUseDark
        );

        document.documentElement.dataset.theme = shouldUseDark
          ? "dark"
          : "light";
      };

      applySavedTheme();

      const media = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handleSystemThemeChange = () => {
        if (localStorage.getItem("gridmine-theme") === "system") {
          applySavedTheme();
        }
      };

      media.addEventListener("change", handleSystemThemeChange);

      return () => {
        media.removeEventListener(
          "change",
          handleSystemThemeChange
        );
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
