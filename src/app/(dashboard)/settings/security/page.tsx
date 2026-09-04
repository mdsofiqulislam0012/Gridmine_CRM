"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  X,
  LogOut,
  MonitorSmartphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SecuritySettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdatePassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setNewPassword("");
    setConfirmPassword("");

    setSuccess("Password updated successfully!");

    setTimeout(() => {
      setSuccess("");
    }, 2600);
  };


  const handleSignOutOthers = async () => {
  setError("");
  setSuccess("");

  const { error: signOutError } = await supabase.auth.signOut({
    scope: "others",
  });

  if (signOutError) {
    setError(signOutError.message);
    return;
  }

  setSuccess("Other sessions signed out successfully!");

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
          Security
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your account password and security settings.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <LockKeyhole size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Change Password
            </h2>

            <p className="text-xs text-gray-500">
              Use a strong password with at least 8 characters.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              New Password
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-11 text-sm outline-none transition focus:border-brand"
              />

              <button
                type="button"
                onClick={() => setShowNewPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Confirm New Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-11 text-sm outline-none transition focus:border-brand"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-500">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand">
                <MonitorSmartphone size={18} />
            </div>

            <div>
                <h2 className="text-sm font-semibold text-gray-900">
                Other Sessions
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                Sign out your account from all other devices and browsers.
                </p>
            </div>
            </div>

            <button
            type="button"
            onClick={handleSignOutOthers}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
            <LogOut size={15} />
            Sign Out Other Devices
            </button>
        </div>
        </div>
    </div>
  );
}