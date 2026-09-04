"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Mail, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountSettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  

  useEffect(() => {
    const loadAccount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? "");
      setLoading(false);
    };

    loadAccount();
  }, [supabase]);

  const handleSave = async () => {
  setError("");
  setSuccess("");

  const cleanEmail = email.trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    setError("Please enter a valid email address.");
    return;
  }

  setSaving(true);

  const { error: updateError } = await supabase.auth.updateUser({
    email: cleanEmail,
  });

  if (updateError) {
    setError(updateError.message);
    setSaving(false);
    return;
  }

  setSaving(false);
  setSuccess("Account email updated successfully!");

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
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100"
            >
                <X size={14} />
            </button>
            </div>

            <div className="toast-progress h-[3px] w-full bg-green-500" />
        </div>
        )}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <Mail size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Account Email
            </h2>
            <p className="text-xs text-gray-500">
              Email connected to your Gridmine account.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading account...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-500">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}