"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Laptop,
  Moon,
  Sun,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { showGlobalToast } from "@/components/ui/GlobalToast";

type ThemeMode = "light" | "dark" | "system";

export default function AppearanceSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
  const loadAppearance = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("appearance_mode")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error loading appearance:", error);
      return;
    }

    const savedTheme = (data?.appearance_mode ?? "system") as ThemeMode;

    setTheme(savedTheme);
    applyTheme(savedTheme);
  };

  loadAppearance();
}, [supabase]);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;

    const shouldUseDark =
      mode === "dark" ||
      (mode === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", shouldUseDark);
    root.dataset.theme = shouldUseDark ? "dark" : "light";
  };

  const handleSave = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Unable to identify user:", userError);
    alert("User session not found.");
    return;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      appearance_mode: theme,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error saving appearance:", updateError);
    alert(updateError.message);
    return;
  }

  // Keep local cache so the current CRM shell updates immediately.
  localStorage.setItem("gridmine-theme", theme);

  applyTheme(theme);

  showGlobalToast({
  title: "Changes saved",
  message: "Appearance settings saved successfully!",
  type: "success",
  duration: 2600,
});
};

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Appearance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose how Gridmine CRM looks on your device.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Theme
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Select your preferred interface appearance.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ThemeCard
            title="Light"
            description="Use a bright interface."
            icon={<Sun size={21} />}
            selected={theme === "light"}
            onClick={() => setTheme("light")}
          />

          <ThemeCard
            title="Dark"
            description="Use a darker interface."
            icon={<Moon size={21} />}
            selected={theme === "dark"}
            onClick={() => setTheme("dark")}
          />

          <ThemeCard
            title="System"
            description="Follow your device theme."
            icon={<Laptop size={21} />}
            selected={theme === "system"}
            onClick={() => setTheme("system")}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Save Appearance
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  title,
  description,
  icon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-brand bg-brand/5 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
          <Check size={12} />
        </span>
      )}

      <div className="mb-3 text-gray-600">{icon}</div>

      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </button>
  );
} 