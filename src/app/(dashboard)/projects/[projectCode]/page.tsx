"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProjectDetailsPage() {
  const params = useParams<{ projectCode: string }>();
  const projectCode = params?.projectCode;

  const supabase = useMemo(() => createClient(), []);

  const [project, setProject] = useState<any>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectCode) return;

    const loadProject = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("project_code", projectCode)
        .maybeSingle();

      if (error) {
        console.error("Project load error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Project not found or you do not have access.");
        setLoading(false);
        return;
      }

      setProject(data);

      if (data.assigned_to) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .eq("id", data.assigned_to)
          .maybeSingle();

        setAssignedUser(profile ?? null);
      }

      setLoading(false);
    };

    loadProject();
  }, [projectCode, supabase]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading project...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error || "Project not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a
            href="/projects"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {project.name}
            </h1>

            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">
              {project.project_code}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {project.client_name || "No customer"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}

          {copied ? "Link Copied" : "Copy Project Link"}
        </button>
      </div>

      {/* Share URL */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Project Link
        </p>

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={
              typeof window !== "undefined"
                ? window.location.href
                : ""
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />

          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-bold text-gray-900">
            Project Overview
          </h2>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Project ID" value={project.project_code} />

          <Detail
            label="Customer"
            value={project.client_name}
          />

          <Detail
            label="Status"
            value={project.status}
          />

          <Detail
            label="Assigned To"
            value={
              assignedUser?.full_name ||
              assignedUser?.email ||
              "Unassigned"
            }
          />

          <Detail
            label="Start Date"
            value={project.start_date}
          />

          <Detail
            label="Deadline"
            value={project.due_date}
          />

          <Detail
            label="Budget"
            value={
              project.budget !== null &&
              project.budget !== undefined
                ? `$${project.budget}`
                : "—"
            }
          />

          <Detail
            label="Billing Type"
            value={project.billing_type}
          />

          <Detail
            label="Estimated Hours"
            value={project.estimated_hours}
          />
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-gray-900">
          Description
        </h2>

        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
          {project.description || "No description added."}
        </p>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {value || "—"}
      </p>
    </div>
  );
}