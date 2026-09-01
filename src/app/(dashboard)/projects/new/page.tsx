"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "on_hold"
  | "cancelled"
  | "finished";

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProjectId = searchParams.get("id");
  const supabase = useMemo(() => createClient(), []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"project" | "settings">("project");

  const [form, setForm] = useState({
    name: "",
    client_name: "",

    calculate_progress_from_tasks: true,
    progress: "0",

    billing_type: "fixed_rate",
    status: "in_progress" as ProjectStatus,

    total_rate: "",
    estimated_hours: "",

    members: "",
    start_date: "",
    due_date: "",
    tags: "",

    order_page_url: "",
    conversation_page_url: "",
    files_links: "",
    meeting_url: "",

    custom_offer_message: "",
    order_instruction_url: "",

    project_type: "",
    website_url: "",
    brief_details: "",

    delivered_work_url: "",
    working_file_url: "",
    access_notes: "",

    profit_share: "",
    description: "",

    send_project_created_email: false,
  });

  useEffect(() => {
  if (!editProjectId) return;

  const loadProjectForEdit = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", editProjectId)
      .single();

    if (error) {
      console.error("Error loading project:", error);
      setError(error.message);
      return;
    }

    setForm((current) => ({
      ...current,

      name: data.name ?? "",
      client_name: data.client_name ?? "",

      calculate_progress_from_tasks:
        data.calculate_progress_from_tasks ?? true,

      progress: String(data.progress ?? 0),

      billing_type: data.billing_type ?? "fixed_rate",

      status: (data.status ?? "in_progress") as ProjectStatus,

      total_rate:
        data.total_rate !== null && data.total_rate !== undefined
          ? String(data.total_rate)
          : "",

      estimated_hours:
        data.estimated_hours !== null &&
        data.estimated_hours !== undefined
          ? String(data.estimated_hours)
          : "",

      members: Array.isArray(data.members)
        ? data.members.join(", ")
        : data.members ?? "",

      start_date: data.start_date ?? "",
      due_date: data.due_date ?? "",

      tags: Array.isArray(data.tags)
        ? data.tags.join(", ")
        : data.tags ?? "",

      order_page_url: data.order_page_url ?? "",
      conversation_page_url: data.conversation_page_url ?? "",
      files_links: data.files_links ?? "",
      meeting_url: data.meeting_url ?? "",
      custom_offer_message: data.custom_offer_message ?? "",
      order_instruction_url: data.order_instruction_url ?? "",

      project_type: data.project_type ?? "",
      website_url: data.website_url ?? "",
      brief_details: data.brief_details ?? "",

      delivered_work_url: data.delivered_work_url ?? "",
      working_file_url: data.working_file_url ?? "",
      access_notes: data.access_notes ?? "",

      profit_share: data.profit_share ?? "",
      description: data.description ?? "",

      send_project_created_email:
        data.send_project_created_email ?? false,
    }));
  };

  loadProjectForEdit();
}, [editProjectId, supabase]);

  const updateField = (
    key: keyof typeof form,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setError("");

    if (!form.name.trim()) {
      setError("Project Name is required.");
      return;
    }

    if (!form.client_name.trim()) {
      setError("Customer is required.");
      return;
    }

    if (!form.start_date) {
      setError("Start Date is required.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Unable to identify logged in user.");
      setSaving(false);
      return;
    }

    const progress = Math.min(
      100,
      Math.max(0, Number(form.progress || 0))
    );

    const totalRate = Number(form.total_rate || 0);
    const isEditMode = Boolean(editProjectId);

    const projectData = {
        user_id: user.id,

        name: form.name.trim(),
        client_name: form.client_name.trim(),

        calculate_progress_from_tasks:
          form.calculate_progress_from_tasks,

        progress,
        billing_type: form.billing_type,
        status: form.status,

        total_rate: totalRate,

        // Keep existing budget field synchronized
        budget: totalRate,

        estimated_hours: Number(
          form.estimated_hours || 0
        ),

        members: form.members
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        start_date: form.start_date || null,
        due_date: form.due_date || null,

        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        order_page_url:
          form.order_page_url.trim() || null,

        conversation_page_url:
          form.conversation_page_url.trim() || null,

        files_links:
          form.files_links.trim() || null,

        meeting_url:
          form.meeting_url.trim() || null,

        custom_offer_message:
          form.custom_offer_message.trim() || null,

        order_instruction_url:
          form.order_instruction_url.trim() || null,

        project_type:
          form.project_type.trim() || null,

        website_url:
          form.website_url.trim() || null,

        brief_details:
          form.brief_details.trim() || null,

        delivered_work_url:
          form.delivered_work_url.trim() || null,

        working_file_url:
          form.working_file_url.trim() || null,

        access_notes:
          form.access_notes.trim() || null,

        profit_share: Number(
          form.profit_share || 0
        ),

        description:
          form.description.trim() || null,

        send_project_created_email:
          form.send_project_created_email,
      };
    const { error: saveError } = isEditMode
      ? await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editProjectId!)
          .eq("user_id", user.id)
      : await supabase
          .from("projects")
          .insert(projectData);
          
    if (saveError) {
  setError(saveError.message);
  setSaving(false);
  return;
}

    setSaving(false);

setSuccess(
  isEditMode
    ? "Project updated successfully!"
    : "Project created successfully!"
);

setTimeout(() => {
  router.push("/projects");
  router.refresh();
}, 1200);
  };

  const inputClass =
    "w-full rounded-md border border-border-subtle bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10";

  const labelClass =
    "mb-1.5 block text-[12px] font-semibold text-gray-700";

  return (
    <div className="mx-auto max-w-4xl pb-12">
      {success && (
      <div className="fixed right-6 top-24 z-[100] w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
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
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={14} />
          </button>

        </div>

        <div className="toast-progress h-[3px] w-full bg-green-500" />
      </div>
    )}
      {/* Heading */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          Add New Project
        </h1>
      </div>

      {/* Form Card */}
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-border-subtle bg-gray-50 px-5">
        <button
          type="button"
          onClick={() => setActiveTab("project")}
          className={`px-3 py-3 text-[13px] font-semibold transition ${
            activeTab === "project"
              ? "border-b-2 border-brand text-gray-900"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Project
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-3 py-3 text-[13px] font-semibold transition ${
            activeTab === "settings"
              ? "border-b-2 border-brand text-gray-900"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Project Settings
        </button>
      </div>

        <div className="space-y-5 p-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
              
            </div>
            
          )}
          {activeTab === "project" && (
          <div className="space-y-5">
          

          {/* Project Name */}
          <label className="block">
            <span className={labelClass}>
              <span className="text-red-500">*</span>{" "}
              Project Name
            </span>

            <input
              value={form.name}
              onChange={(e) =>
                updateField("name", e.target.value)
              }
              className={inputClass}
            />
          </label>

          {/* Customer */}
          <label className="block">
            <span className={labelClass}>
              <span className="text-red-500">*</span>{" "}
              Customer
            </span>

            <input
              value={form.client_name}
              onChange={(e) =>
                updateField(
                  "client_name",
                  e.target.value
                )
              }
              placeholder="Select or type customer name"
              className={inputClass}
            />
          </label>

          {/* Progress Checkbox */}
          <label className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
            <input
              type="checkbox"
              checked={
                form.calculate_progress_from_tasks
              }
              onChange={(e) =>
                updateField(
                  "calculate_progress_from_tasks",
                  e.target.checked
                )
              }
            />

            Calculate progress through tasks
          </label>

          {/* Progress */}
          <label className="block">
            <input
              type="range"
              min="0"
              max="100"
              value={form.progress}
              disabled={form.calculate_progress_from_tasks}
              onChange={(e) =>
                updateField(
                  "progress",
                  e.target.value
                )
              }
              className={`w-full accent-brand ${
                form.calculate_progress_from_tasks
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer"
              }`}
            />
          </label>

          {/* Billing + Status */}
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className={labelClass}>
                <span className="text-red-500">*</span>{" "}
                Billing Type
              </span>

              <select
                value={form.billing_type}
                onChange={(e) =>
                  updateField(
                    "billing_type",
                    e.target.value
                  )
                }
                className={inputClass}
              >
                <option value="fixed_rate">
                  Fixed Rate
                </option>

                <option value="project_hours">
                  Project Hours
                </option>

                <option value="task_hours">
                  Task Hours
                </option>
              </select>
            </label>

            <label>
              <span className={labelClass}>
                Status
              </span>

              <select
                value={form.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value
                  )
                }
                className={inputClass}
              >
                <option value="not_started">
                  Not Started
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="on_hold">
                  On Hold
                </option>

                <option value="finished">
                  Finished
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </label>
          </div>

          {/* Rate */}
          <label className="block">
            <span className={labelClass}>
              Total Rate
            </span>

            <input
              type="number"
              min="0"
              value={form.total_rate}
              onChange={(e) =>
                updateField(
                  "total_rate",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </label>

          {/* Estimated + Member */}
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className={labelClass}>
                Estimated Hours
              </span>

              <input
                type="number"
                min="0"
                value={form.estimated_hours}
                onChange={(e) =>
                  updateField(
                    "estimated_hours",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </label>

            <label>
              <span className={labelClass}>
                Members
              </span>

              <input
                value={form.members}
                onChange={(e) =>
                  updateField(
                    "members",
                    e.target.value
                  )
                }
                placeholder="Member 1, Member 2"
                className={inputClass}
              />
            </label>
          </div>

          {/* Dates */}
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className={labelClass}>
                <span className="text-red-500">*</span>{" "}
                Start Date
              </span>

              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  updateField(
                    "start_date",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </label>

            <label>
              <span className={labelClass}>
                Deadline
              </span>

              <input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  updateField(
                    "due_date",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </label>
          </div>

          {/* Tags */}
          <label className="block">
            <span className={labelClass}>
              Tags
            </span>

            <input
              value={form.tags}
              onChange={(e) =>
                updateField(
                  "tags",
                  e.target.value
                )
              }
              placeholder="WordPress, UI/UX, Development"
              className={inputClass}
            />
          </label>

          {/* Order Page */}
          <label className="block">
            <span className={labelClass}>
              Order Page Screenshot / Link
            </span>

            <input
              type="url"
              value={form.order_page_url}
              onChange={(e) =>
                updateField(
                  "order_page_url",
                  e.target.value
                )
              }
              placeholder="https://..."
              className={inputClass}
            />
          </label>

          {/* Conversation */}
          <label className="block">
            <span className={labelClass}>
              Conversation Page Screenshot / Link
            </span>

            <input
              type="url"
              value={
                form.conversation_page_url
              }
              onChange={(e) =>
                updateField(
                  "conversation_page_url",
                  e.target.value
                )
              }
              placeholder="https://..."
              className={inputClass}
            />
          </label>

          {/* Files */}
          <label className="block">
            <span className={labelClass}>
              Files / Links (If Any)
            </span>

            <textarea
              rows={3}
              value={form.files_links}
              onChange={(e) =>
                updateField(
                  "files_links",
                  e.target.value
                )
              }
              placeholder="Google Drive, Figma, Dropbox, etc."
              className={inputClass}
            />
          </label>

          {/* Meeting Link */}
          <label className="block">
            <span className={labelClass}>
              Meeting Link (If Any)
            </span>

            <input
              type="url"
              value={form.meeting_url}
              onChange={(e) =>
                updateField(
                  "meeting_url",
                  e.target.value
                )
              }
              placeholder="https://..."
              className={inputClass}
            />
          </label>

          {/* Custom Offer */}
          <label className="block">
            <span className={labelClass}>
              Custom Offer Message
            </span>

            <textarea
              rows={4}
              value={
                form.custom_offer_message
              }
              onChange={(e) =>
                updateField(
                  "custom_offer_message",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </label>

          {/* Instruction */}
          <label className="block">
            <span className={labelClass}>
              Order Instruction Sheet
            </span>

            <input
              type="url"
              value={
                form.order_instruction_url
              }
              onChange={(e) =>
                updateField(
                  "order_instruction_url",
                  e.target.value
                )
              }
              placeholder="https://..."
              className={inputClass}
            />
          </label>

          {/* Project Type */}
          <label className="block">
            <span className={labelClass}>
              Project Type
            </span>

            <select
              value={form.project_type}
              onChange={(e) =>
                updateField(
                  "project_type",
                  e.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                Nothing selected
              </option>

              <option value="wordpress">
                WordPress
              </option>

              <option value="shopify">
                Shopify
              </option>

              <option value="ui_ux">
                UI/UX Design
              </option>

              <option value="web_development">
                Web Development
              </option>

              <option value="seo">SEO</option>

              <option value="other">
                Other
              </option>
            </select>
          </label>

          {/* Website */}
          <label className="block">
            <span className={labelClass}>
              Website URL
            </span>

            <input
              type="url"
              value={form.website_url}
              onChange={(e) =>
                updateField(
                  "website_url",
                  e.target.value
                )
              }
              placeholder="https://..."
              className={inputClass}
            />
          </label>

          {/* Brief */}
          <label className="block">
            <span className={labelClass}>
              Brief Details
            </span>

            <textarea
              rows={4}
              value={form.brief_details}
              onChange={(e) =>
                updateField(
                  "brief_details",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </label>
            </div>
          )}

          {activeTab === "settings" && (
          <div className="space-y-5">

          {/* Delivered Work */}
          <label className="block">
            <span className={labelClass}>
              Delivered Work
            </span>

            <input
              value={form.delivered_work_url}
              onChange={(e) =>
                updateField(
                  "delivered_work_url",
                  e.target.value
                )
              }
              placeholder="Delivery link"
              className={inputClass}
            />
          </label>

          {/* Working file */}
          <label className="block">
            <span className={labelClass}>
              Working File
            </span>

            <input
              value={form.working_file_url}
              onChange={(e) =>
                updateField(
                  "working_file_url",
                  e.target.value
                )
              }
              placeholder="Figma / Drive / source files"
              className={inputClass}
            />
          </label>

          {/* Access */}
          <label className="block">
            <span className={labelClass}>
              Access Notes
            </span>

            <textarea
              rows={4}
              value={form.access_notes}
              onChange={(e) =>
                updateField(
                  "access_notes",
                  e.target.value
                )
              }
              placeholder="Login URL, username or access instructions. Avoid storing passwords."
              className={inputClass}
            />
          </label>

          {/* Profit */}
          <label className="block md:max-w-[50%]">
            <span className={labelClass}>
              Profit Share
            </span>

            <input
              type="number"
              min="0"
              value={form.profit_share}
              onChange={(e) =>
                updateField(
                  "profit_share",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </label>

          {/* Description */}
          <label className="block">
            <span className={labelClass}>
              Description
            </span>

            <textarea
              rows={7}
              value={form.description}
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value
                )
              }
              className={inputClass}
              placeholder="Full project description..."
            />
          </label>

          {/* Email checkbox */}
          <label className="flex items-center gap-2 border-t border-border-subtle pt-4 text-[13px] text-gray-700">
            <input
              type="checkbox"
              checked={
                form.send_project_created_email
              }
              onChange={(e) =>
                updateField(
                  "send_project_created_email",
                  e.target.checked
                )
              }
            />

            Send project created email
          </label>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border-subtle bg-gray-50 px-5 py-4">
          <button
            type="button"
            onClick={() =>
              router.push("/projects")
            }
            className="rounded-md border border-border-subtle bg-white px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-brand px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Project"}
          </button>
        </div>
      </div>
    </div>
  );
}