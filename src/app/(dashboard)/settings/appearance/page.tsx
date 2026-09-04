"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Laptop,
  Moon,
  Sun,
  X,
} from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("gridmine-theme") as ThemeMode | null) ?? "light";

    setTheme(savedTheme);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;

    const shouldUseDark =
      mode === "dark" ||
      (mode === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", shouldUseDark);
    root.dataset.theme = shouldUseDark ? "dark" : "light";
  };

  const handleSave = () => {
    localStorage.setItem("gridmine-theme", theme);
    applyTheme(theme);

    setSuccess("Appearance settings saved successfully!");

    setTimeout(() => {
      setSuccess("");
    }, 2600);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
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
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100"
            >
              <X size={14} />
            </button>
          </div>

          <div className="toast-progress h-[3px] w-full bg-green-500" />
        </div>
      )}

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