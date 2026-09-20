"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Plus,
  Pencil,
  X,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import { createClient } from "@/lib/supabase/client";
import { Column } from "@/types";

type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "on_hold"
  | "cancelled"
  | "finished";

type ProjectRow = {
  id: string;
  project_code: string | null;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  assigned_to: string | null;
  created_at: string;
};

const statuses: {
  value: ProjectStatus;
  label: string;
}[] = [
  {
    value: "not_started",
    label: "Not Started",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "on_hold",
    label: "On Hold",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "finished",
    label: "Finished",
  },
];

export default function ProjectsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userRole, setUserRole] = useState("user");

  const [projects, setProjects] = useState<ProjectRow[]>([]);

    const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
    const [editProjectOpen, setEditProjectOpen] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [projectUsers, setProjectUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] =
    useState<ProjectStatus | null>(null);

  const [error, setError] = useState("");

useEffect(() => {
  const loadUserRole = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Project role error:", error);
      return;
    }

    setUserRole(data?.role || "user");
  };

  loadUserRole();
}, [supabase]);

const hasFullAccess =
userRole === "admin" || userRole === "sub_admin";

  /* ----------------------------
     LOAD PROJECTS
  ----------------------------- */
  const loadProjectUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Project users error:", error);
    return;
  }

  setProjectUsers(data ?? []);
};

  const loadProjects = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        project_code,
        name,
        client_name,
        status,
        description,
        start_date,
        due_date,
        budget,
        assigned_to,
        created_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setProjects((data ?? []) as ProjectRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();

    const channel = supabase
      .channel("projects-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          loadProjects();
          loadProjectUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  /* ----------------------------
     STATUS COUNTS
  ----------------------------- */

  const statusCounts = useMemo(() => {
    return {
      not_started: projects.filter(
        (project) => project.status === "not_started"
      ).length,

      in_progress: projects.filter(
        (project) => project.status === "in_progress"
      ).length,

      on_hold: projects.filter(
        (project) => project.status === "on_hold"
      ).length,

      cancelled: projects.filter(
        (project) => project.status === "cancelled"
      ).length,

      finished: projects.filter(
        (project) => project.status === "finished"
      ).length,
    };
  }, [projects]);

  /* ----------------------------
     FILTER
  ----------------------------- */

  const rows = statusFilter
    ? projects.filter(
        (project) => project.status === statusFilter
      )
    : projects;

  /* ----------------------------
     UPDATE STATUS
  ----------------------------- */

  const handleStatusChange = async (
    projectId: string,
    status: ProjectStatus
  ) => {
    const { error } = await supabase
      .from("projects")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    /*
      Immediate UI update.
      Realtime will also confirm the change.
    */

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status,
            }
          : project
      )
    );
  };
const handleSaveEdit = async () => {
  if (!editingProject) return;

  setSavingEdit(true);
  setError("");

  const { error } = await supabase
    .from("projects")
    .update({
      name: editingProject.name,
      client_name: editingProject.client_name,
      status: editingProject.status,
      description: editingProject.description,
      start_date: editingProject.start_date,
      due_date: editingProject.due_date,
      budget: editingProject.budget,
      assigned_to: editingProject.assigned_to || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", editingProject.id);

  if (error) {
    console.error("Error updating project:", error);
    setError(error.message);
    setSavingEdit(false);
    return;
  }

  await loadProjects();

  setEditingProject(null);
  setEditProjectOpen(false);
  setSavingEdit(false);
};
  /* ----------------------------
     TABLE COLUMNS
  ----------------------------- */

  const columns: Column<ProjectRow>[] = [ 
     {
  key: "project_code",
  header: "Project ID",
 render: (project) => (
  project.project_code ? (
    <Link
      href={`/projects/${project.project_code}`}
      className="text-xs font-semibold text-blue-600 hover:underline"
    >
      {project.project_code}
    </Link>
  ) : (
    <span className="text-xs text-gray-400">—</span>
  )
),
},

    {
      key: "name",
      header: "Project Name",
      render: (project) => (
        <span className="font-medium text-gray-800">
          {project.name}
        </span>
      ),
    },

    {
      key: "client_name",
      header: "Customer",
      render: (project) =>
        project.client_name || "-",
    },

    {
      key: "start_date",
      header: "Start Date",
      render: (project) =>
        project.start_date || "-",
    },

    {
      key: "due_date",
      header: "Deadline",
      render: (project) =>
        project.due_date || "-",
    },

    {
      key: "budget",
      header: "Budget",
      render: (project) => (
        <span>
          $
          {Number(
            project.budget || 0
          ).toLocaleString()}
        </span>
      ),
    },

    {
      key: "status",
      header: "Status",

      render: (project) => (
        <select
  value={project.status}
  disabled={!hasFullAccess}
  onChange={(e) => {
    if (!hasFullAccess) return;

    handleStatusChange(
      project.id,
      e.target.value as ProjectStatus
    );
  }}
  className={`rounded-md border border-border-subtle bg-white px-2 py-1.5 text-[12px] font-medium text-gray-700 outline-none focus:border-brand ${
    hasFullAccess
      ? "cursor-pointer"
      : "cursor-not-allowed opacity-60"
  }`}
>
  {statuses.map((status) => (
    <option key={status.value} value={status.value}>
      {status.label}
    </option>
  ))}
</select>
      ),
    },
      {
    key: "actions",
    header: "Actions",
    render: (project) => (
      <Link
  href={
    hasFullAccess
      ? `/projects/new?id=${project.id}`
      : "#"
  }
  onClick={(e) => {
    if (!hasFullAccess) {
      e.preventDefault();
    }
  }}
  aria-disabled={!hasFullAccess}
  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
    hasFullAccess
      ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
  }`}
>
  <Pencil size={13} />
  Edit
</Link>
    ),
  },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        actions={
          <>
            <Link
              href={hasFullAccess ? "/projects/new" : "#"}
              onClick={(e) => {
                if (!hasFullAccess) {
                  e.preventDefault();
                }
              }}
              aria-disabled={!hasFullAccess}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold text-white transition ${
                hasFullAccess
                  ? "bg-brand hover:opacity-90"
                  : "cursor-not-allowed bg-brand/50"
              }`}
            >
              <Plus size={15} />
              New Project
            </Link>
            <button
              className="
                rounded-md
                border
                border-border-subtle
                bg-white
                p-1.5
                text-gray-500
                hover:bg-gray-50
              "
            >
              <LayoutGrid size={16} />
            </button>
          </>
        }
      />
          {editProjectOpen && editingProject && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Edit Project
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Update your project information.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditProjectOpen(false);
                setEditingProject(null);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
<div className="space-y-4 p-5">

  {/* Project Name */}
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-gray-700">
      Project Name
    </span>

    <input
      type="text"
      value={editingProject.name}
      onChange={(e) =>
        setEditingProject({
          ...editingProject,
          name: e.target.value,
        })
      }
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
    />
  </label>

  {/* Customer */}
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-gray-700">
      Customer
    </span>

    <input
      type="text"
      value={editingProject.client_name ?? ""}
      onChange={(e) =>
        setEditingProject({
          ...editingProject,
          client_name: e.target.value,
        })
      }
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
    />
  </label>
<label className="block">
  <span className="mb-1.5 block text-xs font-semibold text-gray-700">
    Assigned To
  </span>

  <select
    value={editingProject.assigned_to ?? ""}
    onChange={(e) =>
      setEditingProject({
        ...editingProject,
        assigned_to: e.target.value || null,
      })
    }
    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
  >
    <option value="">Unassigned</option>

    {projectUsers.map((profile: any) => (
      <option key={profile.id} value={profile.id}>
        {profile.full_name || profile.email || "User"}
      </option>
    ))}
  </select>
</label>
</div>
<div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
  <button
    type="button"
    onClick={() => {
      setEditProjectOpen(false);
      setEditingProject(null);
    }}
    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={handleSaveEdit}
    disabled={savingEdit}
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {savingEdit ? "Saving..." : "Save Changes"}
  </button>
</div>
        </div>
      </div>
    )}

      {/* STATUS FILTERS */}

      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((status) => {
          const active =
            statusFilter === status.value;

          return (
            <button
              key={status.value}
              onClick={() =>
                setStatusFilter(
                  active
                    ? null
                    : status.value
                )
              }
              className={`
                rounded-md border px-3 py-1.5
                text-[13px] font-medium
                ${
                  active
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border-subtle bg-white text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              {statusCounts[status.value]}{" "}
              {status.label}
            </button>
          );
        })}
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TABLE */}

      {loading ? (
        <div className="rounded-lg border border-border-subtle bg-white p-6 text-sm text-gray-400">
          Loading projects...
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          searchKeys={[
          "project_code",
          "name",
          "client_name",
        ]}
        />
      )}
    </div>
  );
}