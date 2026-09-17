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
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [showTimeLogForm, setShowTimeLogForm] = useState(false);

const [timeLogForm, setTimeLogForm] = useState({
  log_date: new Date().toISOString().split("T")[0],
  hours: "",
  minutes: "",
  note: "",
});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectCode) return;

    const loadProject = async () => {
      const {
  data: { user },
} = await supabase.auth.getUser();

setCurrentUserId(user?.id ?? null);

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
      const { data: memberRows, error: memberRowsError } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", data.id);

    if (memberRowsError) {
      console.error("Project members error:", memberRowsError);
    } else {
      const memberIds = (memberRows ?? [])
        .map((member: any) => member.user_id)
        .filter(Boolean);

      if (memberIds.length > 0) {
        const { data: memberProfiles, error: memberProfilesError } =
          await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url, role")
            .in("id", memberIds);

        if (memberProfilesError) {
          console.error(
            "Project member profiles error:",
            memberProfilesError
          );
        } else {
          setProjectMembers(memberProfiles ?? []);
        }
      } else {
        setProjectMembers([]);
      }
    }
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", data.id)
          .order("created_at", { ascending: false });

        if (tasksError) {
          console.error("Project tasks error:", tasksError);
        } else {
          setProjectTasks(tasksData ?? []);
        }

        const { data: timeLogsData, error: timeLogsError } = await supabase
        .from("project_time_logs")
        .select("*")
        .eq("project_id", data.id)
        .order("log_date", { ascending: true });

      if (timeLogsError) {
        console.error("Project time logs error:", timeLogsError);
      } else {
        setTimeLogs(timeLogsData ?? []);
      }
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

  const handleSaveTime = async () => {
  if (!project?.id) return;

  const hours = Math.max(0, Number(timeLogForm.hours || 0));
  const minutes = Math.max(0, Number(timeLogForm.minutes || 0));

  const totalMinutes = Math.round(hours * 60 + minutes);

  if (!timeLogForm.log_date || totalMinutes <= 0) {
    setError("Please enter a valid time.");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setError("You must be signed in.");
    return;
  }

  const { data: newLog, error: insertError } = await supabase
    .from("project_time_logs")
    .insert({
      project_id: project.id,
      user_id: user.id,
      log_date: timeLogForm.log_date,
      minutes: totalMinutes,
      note: timeLogForm.note.trim() || null,
    })
    .select("*")
    .single();

  if (insertError) {
    setError(insertError.message);
    return;
  }

  setTimeLogs((current) => [...current, newLog]);

  setTimeLogForm({
    log_date: new Date().toISOString().split("T")[0],
    hours: "",
    minutes: "",
    note: "",
  });

  setShowTimeLogForm(false);
  setError("");
};

  const totalLoggedMinutes = timeLogs.reduce(
  (total: number, log: any) => total + Number(log.minutes ?? 0),
  0
);

const totalLoggedHours = `${String(
  Math.floor(totalLoggedMinutes / 60)
).padStart(2, "0")}:${String(totalLoggedMinutes % 60).padStart(2, "0")}`;

const today = new Date();

const monday = new Date(today);
const currentDay = today.getDay();

monday.setDate(
  today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)
);
monday.setHours(0, 0, 0, 0);

const weeklyLoggedMinutes = Array(7).fill(0);

timeLogs.forEach((log: any) => {
  if (!log.log_date) return;

  const logDate = new Date(`${log.log_date}T00:00:00`);

  const diffDays = Math.floor(
    (logDate.getTime() - monday.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays >= 0 && diffDays < 7) {
    weeklyLoggedMinutes[diffDays] += Number(log.minutes ?? 0);
  }
});

const maxWeeklyMinutes = Math.max(
  ...weeklyLoggedMinutes,
  60
);

  const totalTasks = projectTasks.length;

const openTasks = projectTasks.filter((task: any) => {
  const status = String(task.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  return !["complete", "completed", "done", "finished"].includes(status);
}).length;

const taskProgress =
  totalTasks > 0
    ? Math.round(((totalTasks - openTasks) / totalTasks) * 100)
    : 0;

const daysLeft = project?.due_date
  ? Math.max(
      0,
      Math.ceil(
        (new Date(project.due_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    )
  : null;

  const totalProjectDays =
  project?.start_date && project?.due_date
    ? Math.max(
        1,
        Math.floor(
          (new Date(`${project.due_date}T00:00:00`).getTime() -
            new Date(`${project.start_date}T00:00:00`).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )
    : 0;

const dailyRequiredProgress =
  totalProjectDays > 0
    ? 100 / totalProjectDays
    : 0;
const expectedProgress = (() => {
  if (!project?.start_date || !project?.due_date || totalProjectDays <= 0) {
    return 0;
  }

  const start = new Date(`${project.start_date}T00:00:00`);
  const end = new Date(`${project.due_date}T00:00:00`);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  if (todayDate < start) return 0;
  if (todayDate > end) return 100;

  const elapsedDays =
    Math.floor(
      (todayDate.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return Math.min(
    100,
    Math.round(elapsedDays * dailyRequiredProgress)
  );
})();

const timeProgress =
  totalProjectDays > 0 && daysLeft !== null
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((totalProjectDays - daysLeft) / totalProjectDays) * 100
          )
        )
      )
    : 0;

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
      <div className="flex flex-wrap items-center justify-between gap-4">
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

          {projectMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {projectMembers.slice(0, 4).map((member: any) => (
              <div
                key={member.id}
                title={member.full_name || member.email || "Member"}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-gray-100"
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name || "Member"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-600">
                    {(member.full_name || member.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {projectMembers.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-semibold text-gray-600">
                +{projectMembers.length - 4}
              </div>
            )}
          </div>

          <span className="text-xs font-medium text-gray-600">
            {projectMembers.length}{" "}
            {projectMembers.length === 1 ? "member" : "members"}
          </span>
        </div>
      )}

          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {String(project.status || "No status")
              .replaceAll("_", " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          {project.client_name || "No customer"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {currentUserId === project.user_id && (
        <a
          href={`/projects/new?id=${project.id}`}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Edit Project
        </a>
      )}

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Link Copied" : "Copy Project Link"}
        </button>
      </div>
    </div>

    {/* Project Navigation */}
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
      {[
        "Overview",
        "Tasks",
        "Timesheets",
        "Milestones",
        "Files",
        "Discussions",
        "Gantt",
        "Tickets",
        "Sales",
        "Notes",
        "Activity",
      ].map((item, index) => (
        <button
          key={item}
          type="button"
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
            index === 0
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {item}
        </button>
      ))}
    </div>

    {/* Project Progress */}
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">
          Project Progress
        </p>

        <span className="text-sm font-semibold text-gray-600">
          100%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: "100%" }}
        />
      </div>
    </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">

        {/* LEFT SIDE */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">
              Overview
            </h2>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-2">
            <div className="space-y-5">
              <Detail
                label="Project #"
                value={project.project_code}
              />

              <Detail
                label="Billing Type"
                value={project.billing_type}
              />

              <Detail
                label="Status"
                value={project.status}
              />

              <Detail
                label="Start Date"
                value={project.start_date}
              />

              <Detail
                label="Completed Date"
                value={project.completed_date}
              />

              <Detail
                label="Order Page Screenshot"
                value={project.order_page_url}
              />

              <Detail
                label="Files / Links"
                value={project.files_links}
              />
            </div>

            <div className="space-y-5">
              <Detail
                label="Customer"
                value={project.client_name}
              />

              <Detail
                label="Total Rate"
                value={
                  project.total_rate !== null &&
                  project.total_rate !== undefined
                    ? `$${Number(project.total_rate).toLocaleString()}`
                    : project.budget !== null &&
                      project.budget !== undefined
                    ? `$${Number(project.budget).toLocaleString()}`
                    : "—"
                }
              />

              <Detail
                label="Date Created"
                value={
                  project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : "—"
                }
              />

              <Detail
                label="Deadline"
                value={project.due_date}
              />

              <Detail
                label="Total Logged Hours"
                value={totalLoggedHours}
              />

              <Detail
                label="Conversation Page Screenshot"
                value={project.conversation_page_url}
              />

              <Detail
                label="Custom Offer Message"
                value={project.custom_offer_message}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold text-gray-900">
              {project.name || "Untitled Project"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {project.description || "No project summary added yet."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {openTasks} / {totalTasks} Open Tasks
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {taskProgress}%
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {daysLeft !== null ? daysLeft : "—"} Days Left
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {timeProgress}%
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
              </div>
              
            </div>
{/* Project Pulse */}
<div className="relative min-h-[320px] overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
  {/* Animated background */}
  <div className="pointer-events-none absolute inset-0">
    <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/40 blur-3xl animate-pulse" />
  </div>

  <div className="relative flex h-full flex-col">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-bold text-gray-900">
          Project Pulse
        </h3>

        <p className="mt-1 text-xs text-gray-400">
          Live project overview
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>

        <span className="text-xs font-semibold text-emerald-600">
          Active
        </span>
      </div>
    </div>

    {/* Animated center */}
    <div className="flex flex-1 items-center justify-center py-6">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-blue-200 animate-ping opacity-20" />

        <div className="absolute inset-2 rounded-full border-4 border-dashed border-blue-400 animate-spin [animation-duration:8s]" />

        <div className="absolute inset-8 rounded-full border border-blue-100 animate-pulse" />

        <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-blue-50 shadow-sm">
          <span className="text-2xl font-bold text-blue-600">
            {expectedProgress}%
          </span>

          <span className="text-[10px] font-medium text-gray-400">
            Expected Today
          </span>
          <span className="mt-1 text-[10px] font-semibold text-blue-500">
            {dailyRequiredProgress.toFixed(1)}% / day
          </span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2">
  <div className="rounded-lg bg-gray-50 p-3 text-center">
    <p className="text-lg font-bold text-gray-900">
      {totalProjectDays}
    </p>
    <p className="text-[10px] text-gray-400">
      Total Days
    </p>
  </div>

  <div className="rounded-lg bg-gray-50 p-3 text-center">
    <p className="text-lg font-bold text-gray-900">
      {projectMembers.length}
    </p>
    <p className="text-[10px] text-gray-400">
      Members
    </p>
  </div>

  <div className="rounded-lg bg-gray-50 p-3 text-center">
    <p className="text-lg font-bold text-gray-900">
      {totalTasks}
    </p>
    <p className="text-[10px] text-gray-400">
      Tasks
    </p>
  </div>
</div>
  </div>
</div>
          </div>
        </div>
        {/* Expenses */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Expenses
            </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
              <p className="text-xs text-gray-400">
                Total Expenses
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                ${Number(project.total_expenses ?? 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-blue-500">
                Billable Expenses
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                ${Number(project.billable_expenses ?? 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-emerald-500">
                Billed Expenses
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                ${Number(project.billed_expenses ?? 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-red-500">
                Unbilled Expenses
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                ${Number(project.unbilled_expenses ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        {/* Total Logged Hours */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Total Logged Hours
              </h3>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {totalLoggedHours}
              </p>
            </div>

            <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              This Week
            </span>

            <button
              type="button"
              onClick={() => setShowTimeLogForm(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              + Log Time
            </button>
          </div>
          </div>

          {showTimeLogForm && (
  <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">
          Date
        </span>
        <input
          type="date"
          value={timeLogForm.log_date}
          onChange={(e) =>
            setTimeLogForm((current) => ({
              ...current,
              log_date: e.target.value,
            }))
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">
          Hours
        </span>
        <input
          type="number"
          min="0"
          value={timeLogForm.hours}
          onChange={(e) =>
            setTimeLogForm((current) => ({
              ...current,
              hours: e.target.value,
            }))
          }
          placeholder="0"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">
          Minutes
        </span>
        <input
          type="number"
          min="0"
          max="59"
          value={timeLogForm.minutes}
          onChange={(e) =>
            setTimeLogForm((current) => ({
              ...current,
              minutes: e.target.value,
            }))
          }
          placeholder="0"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </label>
    </div>

    <label className="mt-3 block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        Note
      </span>
      <input
        type="text"
        value={timeLogForm.note}
        onChange={(e) =>
          setTimeLogForm((current) => ({
            ...current,
            note: e.target.value,
          }))
        }
        placeholder="What did you work on?"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      />
    </label>

    <div className="mt-3 flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setShowTimeLogForm(false)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600"
      >
        Cancel
      </button>

      <button
      type="button"
      onClick={handleSaveTime}
      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
    >
      Save Time
    </button>
    </div>
  </div>
)}

          <div className="relative h-44">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[1, 2, 3, 4, 5].map((line) => (
                <div
                  key={line}
                  className="border-t border-gray-100"
                />
              ))}
            </div>

            {/* Days */}
            <div className="relative flex h-full items-end justify-between gap-2 pt-3">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day, index) => {
                const minutes = weeklyLoggedMinutes[index] ?? 0;

                const height =
                  minutes > 0
                    ? Math.max(6, (minutes / maxWeeklyMinutes) * 100)
                    : 0;

                return (
                  <div
                    key={day}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <div className="mb-1 text-[10px] font-medium text-gray-500">
                      {minutes > 0
                        ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
                        : ""}
                    </div>

                    <div
                      className="w-full max-w-8 rounded-t bg-blue-400/70 transition-all"
                      style={{
                        height: `${height}%`,
                        minHeight: minutes > 0 ? "4px" : "0px",
                      }}
                    />

                    <span className="mt-2 text-[10px] text-gray-400">
                      {day.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Project Details */}
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-bold text-gray-900">
        Additional Project Details
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail
          label="Delivered Work"
          value={project.delivered_work_url}
        />

        <Detail
          label="Order Instructions"
          value={project.order_instruction_url}
        />

        <Detail
          label="Access Notes"
          value={project.access_notes}
        />

        <Detail
          label="Project Type"
          value={project.project_type}
        />

        <Detail
          label="Profit Share"
          value={project.profit_share}
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

     {typeof value === "string" && value.startsWith("http") ? (
  <a
    href={value}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-1 block break-words text-sm font-semibold text-blue-600 hover:underline"
  >
    Open Link
  </a>
) : (
  <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-gray-800">
    {value || "—"}
  </p>
)}
    </div>
  );
}