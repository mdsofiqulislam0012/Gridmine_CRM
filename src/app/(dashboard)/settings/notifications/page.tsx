"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Mail, X } from "lucide-react";

export default function NotificationSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [customerUpdates, setCustomerUpdates] = useState(true);

  const [settingsReady, setSettingsReady] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("notificationSettings");

    if (saved) {
      const parsed = JSON.parse(saved);

      setEmailNotifications(parsed.emailNotifications ?? true);
      setProjectUpdates(parsed.projectUpdates ?? true);
      setTaskUpdates(parsed.taskUpdates ?? true);
      setCustomerUpdates(parsed.customerUpdates ?? true);
    }

    setSettingsReady(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem(
      "notificationSettings",
      JSON.stringify({
        emailNotifications,
        projectUpdates,
        taskUpdates,
        customerUpdates,
      })
    );

    setSuccess("Notification preferences saved successfully!");

    setTimeout(() => {
      setSuccess("");
    }, 2600);
  };

  if (!settingsReady) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Loading notification settings...
      </div>
    );
  }

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
          Notifications
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose which CRM notifications you want to receive.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <Bell size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Notification Preferences
            </h2>
            <p className="text-xs text-gray-500">
              Control the alerts you receive from Gridmine CRM.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <SettingRow
            icon={<Mail size={16} />}
            title="Email Notifications"
            description="Receive CRM notifications by email."
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />

          <SettingRow
            icon={<Bell size={16} />}
            title="Project Updates"
            description="Receive notifications when projects change."
            checked={projectUpdates}
            onChange={setProjectUpdates}
          />

          <SettingRow
            icon={<Bell size={16} />}
            title="Task Updates"
            description="Receive notifications for task activity."
            checked={taskUpdates}
            onChange={setTaskUpdates}
          />

          <SettingRow
            icon={<Bell size={16} />}
            title="Customer Updates"
            description="Receive notifications for customer activity."
            checked={customerUpdates}
            onChange={setCustomerUpdates}
          />
        </div>

        <div className="flex justify-end border-t border-gray-100 p-5">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>

        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-brand" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}