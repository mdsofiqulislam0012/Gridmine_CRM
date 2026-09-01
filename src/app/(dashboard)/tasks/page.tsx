"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Plus } from "lucide-react";
import { Column, Task } from "@/types";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function TasksPage() {
  const supabase = useMemo(() => createClient(), []);
 const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

const [newTask, setNewTask] = useState({
  name: "",
  project_id: "",
  status: "Not Started" as Task["status"],
  start_date: "",
  due_date: "",
  assigned_to: "",
  priority: "Medium" as Task["priority"],
});

const [projectOptions, setProjectOptions] = useState<
  { id: string; name: string }[]
>([]);

const [profileOptions, setProfileOptions] = useState<
  { id: string; full_name: string | null }[]
>([]);
useEffect(() => {
  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? null);
  };

  loadCurrentUser();
}, [supabase]);


useEffect(() => {
  const loadProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading projects:", error);
      return;
    }

    setProjectOptions(data ?? []);
  };

  loadProjects();
}, [supabase]);

  useEffect(() => {
  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tasks:", error);
      return;
    }

    const mappedTasks: Task[] = (data ?? []).map((task) => ({
      id: task.id,
      name: task.name,
      project: task.project_id ?? "",
      status: task.status as Task["status"],
      startDate: task.start_date ?? "",
      dueDate: task.due_date ?? "",
      assignedTo: task.assigned_to ?? "",
      assignedToId: task.assigned_to ?? "",
      tags: [],
      priority: (task.priority ?? "Medium") as Task["priority"],
    }));

    setTasks(mappedTasks);
  };

  loadTasks();
}, [supabase]);

useEffect(() => {
  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error loading profiles:", error);
      return;
    }

    setProfileOptions(data ?? []);
  };

  loadProfiles();
}, [supabase]);

const handleCreateTask = async () => {
  if (!newTask.name.trim()) {
    alert("Task name is required.");
    return;
  }

  if (!newTask.project_id) {
    alert("Please select a project.");
    return;
  }

  setCreatingTask(true);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Unable to identify user:", userError);
    alert("Unable to identify logged in user.");
    setCreatingTask(false);
    return;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      project_id: newTask.project_id,
      name: newTask.name.trim(),
      status: newTask.status,
      start_date: newTask.start_date || null,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || null,
      priority: newTask.priority,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating task:", error);
    alert(error.message);
    setCreatingTask(false);
    return;
  }

  const assignedProfile = profileOptions.find(
    (profile) => profile.id === data.assigned_to
  );

  const createdTask: Task = {
    id: data.id,
    name: data.name,
    project: data.project_id ?? "",
    status: data.status as Task["status"],
    startDate: data.start_date ?? "",
    dueDate: data.due_date ?? "",
    assignedTo: assignedProfile?.full_name ?? "",
    assignedToId: data.assigned_to ?? "",
    tags: [],
    priority: (data.priority ?? "Medium") as Task["priority"],
  };

  setTasks((current) => [createdTask, ...current]);

  await updateProjectProgressFromTasks(newTask.project_id);

  setNewTask({
    name: "",
    project_id: "",
    status: "Not Started" as Task["status"],
    start_date: "",
    due_date: "",
    assigned_to: "",
    priority: "Medium" as Task["priority"],
  });

  setNewTaskOpen(false);
  setCreatingTask(false);
};

const updateProjectProgressFromTasks = async (projectId: string) => {
  // Check whether this project uses automatic task progress
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("calculate_progress_from_tasks")
    .eq("id", projectId)
    .single();

  if (projectError) {
    console.error("Error loading project:", projectError);
    return;
  }

  if (!project?.calculate_progress_from_tasks) {
    return;
  }

  // Get all tasks belonging to this project
  const { data: projectTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("status")
    .eq("project_id", projectId);

  if (tasksError) {
    console.error("Error loading project tasks:", tasksError);
    return;
  }

  const totalTasks = projectTasks?.length ?? 0;

  const completedTasks =
    projectTasks?.filter((task) => task.status === "Complete").length ?? 0;

  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      progress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (updateError) {
    console.error("Error updating project progress:", updateError);
  }
};

 const setStatus = async (
  id: string | number,
  status: Task["status"]
) => {
  const currentTask = tasks.find((task) => task.id === id);
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(id));

  if (error) {
    console.error("Error updating task status:", error);
    return;
  }

  setTasks((current) =>
    current.map((task) =>
      task.id === id
        ? { ...task, status }
        : task
    )
  );
  if (currentTask?.project) {
  await updateProjectProgressFromTasks(currentTask.project);
}
};

  const rows = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;
  const liveTaskStatusCounts = {
  "Not Started": tasks.filter((task) => task.status === "Not Started").length,
  "In Progress": tasks.filter((task) => task.status === "In Progress").length,
  Testing: tasks.filter((task) => task.status === "Testing").length,
  "Awaiting Feedback": tasks.filter(
    (task) => task.status === "Awaiting Feedback"
  ).length,
  Complete: tasks.filter((task) => task.status === "Complete").length,
};
  const statusOptions: Task["status"][] = ["Not Started", "In Progress", "Testing", "Awaiting Feedback", "Complete"];

  const columns: Column<Task>[] = [
      {
    key: "id",
    header: "#",
    render: (r) => String(r.id).slice(0, 8),
  },
    { key: "name", header: "Name" },
    {
      key: "project",
      header: "Project",
      render: (r) => {
      const projectName = projectOptions.find(
        (project) => project.id === r.project
      )?.name;

      return projectName ? (
        <Link
          href="/projects"
          className="font-medium text-brand hover:underline"
        >
          {projectName}
        </Link>
      ) : (
        "No Project"
      );
    },
    },
    {
      key: "status", header: "Status",
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => setStatus(r.id, e.target.value as Task["status"])}
          className="rounded-md border border-border-subtle bg-white px-2 py-1 text-xs outline-none"
        >
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    { key: "startDate", header: "Start Date" },
    { key: "dueDate", header: "Due Date" },
    {
    key: "assignedTo",
    header: "Assigned To",
    render: (r) =>
      profileOptions.find((profile) => profile.id === r.assignedToId)?.full_name ||
      "Unassigned",
  },
    { key: "priority", header: "Priority", render: (r) => <StatusBadge label={r.priority} /> },
  ];

    return (
      <div>
        <PageHeader
    title="Tasks"
    subtitle={
      <a href="/tasks" className="text-brand hover:underline">
        Tasks Overview
      </a>
    }
    actions={
      <button
        type="button"
        onClick={() => setNewTaskOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
      >
        <Plus size={15} />
        New Task
      </button>
    }
  />

        {newTaskOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setNewTaskOpen(false)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="task-dialog-enter w-full max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  New Task
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Create a new task for your project.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNewTaskOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Body */}
<div className="space-y-4 p-5">

  {/* Task Name */}
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-gray-700">
      Task Name <span className="text-red-500">*</span>
    </span>

    <input
      type="text"
      value={newTask.name}
      onChange={(e) =>
        setNewTask((current) => ({
          ...current,
          name: e.target.value,
        }))
      }
      placeholder="Enter task name"
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
    />
  </label>

      {/* Project */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-gray-700">
          Project <span className="text-red-500">*</span>
        </span>

        <select
          value={newTask.project_id}
          onChange={(e) =>
            setNewTask((current) => ({
              ...current,
              project_id: e.target.value,
            }))
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
        >
          <option value="">Select a project</option>

          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      {/* Status + Priority */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

  {/* Status */}
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-gray-700">
      Status
    </span>

    <select
      value={newTask.status}
      onChange={(e) =>
        setNewTask((current) => ({
          ...current,
          status: e.target.value as Task["status"],
        }))
      }
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
    >
      <option value="Not Started">Not Started</option>
      <option value="In Progress">In Progress</option>
      <option value="Testing">Testing</option>
      <option value="Awaiting Feedback">Awaiting Feedback</option>
      <option value="Complete">Complete</option>
    </select>
  </label>

    {/* Priority */}
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">
        Priority
      </span>

      <select
        value={newTask.priority}
        onChange={(e) =>
          setNewTask((current) => ({
            ...current,
            priority: e.target.value as Task["priority"],
          }))
        }
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </label>

  </div>
  {/* Start Date + Due Date */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

  {/* Start Date */}
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-gray-700">
      Start Date
    </span>

    <input
      type="date"
      value={newTask.start_date}
      onChange={(e) =>
        setNewTask((current) => ({
          ...current,
          start_date: e.target.value,
        }))
      }
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
    />
  </label>

  {/* Due Date */}
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-gray-700">
      Due Date
    </span>

    <input
      type="date"
      value={newTask.due_date}
      min={newTask.start_date || undefined}
      onChange={(e) =>
        setNewTask((current) => ({
          ...current,
          due_date: e.target.value,
        }))
      }
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
      />
        </label>
      </div>
      {/* Assigned To */}
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">
        Assigned To
      </span>

      <select
        value={newTask.assigned_to}
        onChange={(e) =>
          setNewTask((current) => ({
            ...current,
            assigned_to: e.target.value,
          }))
        }
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
      >
        <option value="">Select a member</option>

        {profileOptions.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.full_name || "Unnamed User"}
          </option>
        ))}
      </select>
    </label>
    </div>
    {/* Footer */}
<div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
  <button
    type="button"
    onClick={() => setNewTaskOpen(false)}
    disabled={creatingTask}
    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={handleCreateTask}
    disabled={creatingTask}
    className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {creatingTask ? "Creating..." : "Create Task"}
  </button>
</div>
  </div>
</div>
      )}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(Object.entries(liveTaskStatusCounts) as [string, number][]).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? null : status)}
            className={`rounded-lg border px-4 py-2.5 text-left ${statusFilter === status ? "border-brand bg-brand/5" : "border-border-subtle bg-white"}`}
          >
            <div className="text-[13px] text-gray-600">{count} <span className="font-medium text-gray-800">{status}</span></div>
            <div className="text-[11px] text-gray-400">
              My Tasks:{" "}
              {currentUserId
                ? tasks.filter(
                    (task) =>
                      task.status === status &&
                      task.assignedToId === currentUserId
                  ).length
                : 0}
            </div>
          </button>
        ))}
      </div>
      <DataTable columns={columns} rows={rows} searchKeys={["name", "assignedTo"]} selectable bulkActions />
    </div>
  );
}
