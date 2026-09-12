"use client";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, TrendingUp, SlidersHorizontal, FileCheck2, Settings2, FileText, ClipboardList, Plus } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import SummaryCard from "@/components/ui/SummaryCard";
import Tabs from "@/components/ui/Tabs";
import { createClient } from "@/lib/supabase/client";

type OverviewRow = {
  label: string;
  value: number;
  pct: string;
  color: string;
};

function OverviewCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: React.ElementType;
  title: string;
  rows: OverviewRow[];
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-gray-800">
        <Icon size={15} /> {title}
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="text-gray-600">{r.value} {r.label}</span>
              <span className="text-gray-400">{r.pct}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-gray-100">
              <div className={`h-1 rounded-full ${r.color}`} style={{ width: r.pct }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [optionsOpen, setOptionsOpen] = useState(false);
 const defaultVisibleWidgets = {
  customers: true,
  projects: true,
  tasks: true,
  support: true,
  recentActivity: true,
};
type VisibleWidgets = typeof defaultVisibleWidgets;

const [visibleWidgets, setVisibleWidgets] =
  useState<VisibleWidgets>(() => {
  if (typeof window === "undefined") {
    return defaultVisibleWidgets;
  }

  try {
    const saved = localStorage.getItem("dashboard-visible-widgets");

    return saved
      ? {
          ...defaultVisibleWidgets,
          ...JSON.parse(saved),
        }
      : defaultVisibleWidgets;
  } catch {
    return defaultVisibleWidgets;
  }
});

useEffect(() => {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    "dashboard-visible-widgets",
    JSON.stringify(visibleWidgets)
  );
}, [visibleWidgets]);

  const supabase = useMemo(() => createClient(), []);
  const [dashboardStats, setDashboardStats] = useState({
  customers: {
    total: 0,
    active: 0,
    inactive: 0,
  },
  projects: {
    total: 0,
    inProgress: 0,
    onHold: 0,
    finished: 0,
  },
  tasks: {
    total: 0,
    notFinished: 0,
    inProgress: 0,
    complete: 0,
  },
  support: {
    total: 0,
    open: 0,
    inProgress: 0,
    answered: 0,
    onHold: 0,
    closed: 0,
  },
});

const [recentData, setRecentData] = useState({
  customers: [] as any[],
  projects: [] as any[],
  tasks: [] as any[],
  tickets: [] as any[],
});

useEffect(() => {
  const normalizeStatus = (value: any) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const loadDashboardStats = async () => {
    const {
  data: { user },
  } = await supabase.auth.getUser();

  setCurrentUserId(user?.id ?? null);
    const [
      customersResult,
      projectsResult,
      tasksResult,
      supportResult,
    ] = await Promise.all([
      supabase.from("customers").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("support_tickets").select("*"),
    ]);

    if (customersResult.error) {
      console.error("Dashboard customers error:", customersResult.error);
    }

    if (projectsResult.error) {
      console.error("Dashboard projects error:", projectsResult.error);
    }

    if (tasksResult.error) {
      console.error("Dashboard tasks error:", tasksResult.error);
    }

    if (supportResult.error) {
      console.error("Dashboard support error:", supportResult.error);
    }

    const customers = customersResult.data ?? [];
    const projects = projectsResult.data ?? [];
    const tasks = tasksResult.data ?? [];
    const tickets = supportResult.data ?? [];

    const sortNewest = (items: any[]) =>
  [...items].sort(
    (a, b) =>
      new Date(b.created_at ?? b.createdAt ?? 0).getTime() -
      new Date(a.created_at ?? a.createdAt ?? 0).getTime()
  );

setRecentData({
  customers: sortNewest(customers).slice(0, 5),
  projects: sortNewest(projects).slice(0, 5),
  tasks: sortNewest(tasks).slice(0, 5),
  tickets: sortNewest(tickets).slice(0, 5),
});

    const activeCustomers = customers.filter((customer: any) => {
      if (typeof customer.is_active === "boolean") {
        return customer.is_active;
      }

      if (typeof customer.active === "boolean") {
        return customer.active;
      }

      return normalizeStatus(customer.status) === "active";
    }).length;

    const projectStatus = (status: any) => normalizeStatus(status);
    const taskStatus = (status: any) => normalizeStatus(status);
    const ticketStatus = (status: any) => normalizeStatus(status);

    const completedTasks = tasks.filter((task: any) =>
      ["complete", "completed", "done"].includes(
        taskStatus(task.status)
      )
    ).length;

    setDashboardStats({
      customers: {
        total: customers.length,
        active: activeCustomers,
        inactive: customers.length - activeCustomers,
      },

      projects: {
        total: projects.length,
        inProgress: projects.filter(
          (project: any) =>
            projectStatus(project.status) === "inprogress"
        ).length,
        onHold: projects.filter(
          (project: any) =>
            projectStatus(project.status) === "onhold"
        ).length,
        finished: projects.filter((project: any) =>
          ["finished", "complete", "completed"].includes(
            projectStatus(project.status)
          )
        ).length,
      },

      tasks: {
        total: tasks.length,
        notFinished: tasks.length - completedTasks,
        inProgress: tasks.filter(
          (task: any) =>
            taskStatus(task.status) === "inprogress"
        ).length,
        complete: completedTasks,
      },

      support: {
        total: tickets.length,
        open: tickets.filter(
          (ticket: any) => ticketStatus(ticket.status) === "open"
        ).length,
        inProgress: tickets.filter(
          (ticket: any) =>
            ticketStatus(ticket.status) === "inprogress"
        ).length,
        answered: tickets.filter(
          (ticket: any) =>
            ticketStatus(ticket.status) === "answered"
        ).length,
        onHold: tickets.filter(
          (ticket: any) =>
            ticketStatus(ticket.status) === "onhold"
        ).length,
        closed: tickets.filter(
          (ticket: any) =>
            ticketStatus(ticket.status) === "closed"
        ).length,
      },
    });
  };

  loadDashboardStats();

  const channel = supabase
    .channel(`dashboard-live-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "customers",
      },
      loadDashboardStats
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "projects",
      },
      loadDashboardStats
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
      },
      loadDashboardStats
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "support_tickets",
      },
      loadDashboardStats
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [supabase]);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

const getPercent = (value: number, total: number) =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";

const projectOverview = [
  {
    label: "Total Projects",
    value: dashboardStats.projects.total,
    pct: dashboardStats.projects.total > 0 ? "100%" : "0%",
    color: "bg-blue-500",
  },
  {
    label: "In Progress",
    value: dashboardStats.projects.inProgress,
    pct: getPercent(
      dashboardStats.projects.inProgress,
      dashboardStats.projects.total
    ),
    color: "bg-blue-500",
  },
  {
    label: "On Hold",
    value: dashboardStats.projects.onHold,
    pct: getPercent(
      dashboardStats.projects.onHold,
      dashboardStats.projects.total
    ),
    color: "bg-amber-500",
  },
  {
    label: "Finished",
    value: dashboardStats.projects.finished,
    pct: getPercent(
      dashboardStats.projects.finished,
      dashboardStats.projects.total
    ),
    color: "bg-emerald-500",
  },
];

const taskOverview = [
  {
    label: "Total Tasks",
    value: dashboardStats.tasks.total,
    pct: dashboardStats.tasks.total > 0 ? "100%" : "0%",
    color: "bg-blue-500",
  },
  {
    label: "Not Finished",
    value: dashboardStats.tasks.notFinished,
    pct: getPercent(
      dashboardStats.tasks.notFinished,
      dashboardStats.tasks.total
    ),
    color: "bg-amber-500",
  },
  {
    label: "In Progress",
    value: dashboardStats.tasks.inProgress,
    pct: getPercent(
      dashboardStats.tasks.inProgress,
      dashboardStats.tasks.total
    ),
    color: "bg-blue-500",
  },
  {
    label: "Complete",
    value: dashboardStats.tasks.complete,
    pct: getPercent(
      dashboardStats.tasks.complete,
      dashboardStats.tasks.total
    ),
    color: "bg-emerald-500",
  },
];

const supportOverview = [
  {
    label: "Open",
    value: dashboardStats.support.open,
    pct: getPercent(
      dashboardStats.support.open,
      dashboardStats.support.total
    ),
    color: "bg-blue-500",
  },
  {
    label: "In Progress",
    value: dashboardStats.support.inProgress,
    pct: getPercent(
      dashboardStats.support.inProgress,
      dashboardStats.support.total
    ),
    color: "bg-blue-500",
  },
  {
    label: "Answered",
    value: dashboardStats.support.answered,
    pct: getPercent(
      dashboardStats.support.answered,
      dashboardStats.support.total
    ),
    color: "bg-emerald-500",
  },
  {
    label: "On Hold",
    value: dashboardStats.support.onHold,
    pct: getPercent(
      dashboardStats.support.onHold,
      dashboardStats.support.total
    ),
    color: "bg-amber-500",
  },
  {
    label: "Closed",
    value: dashboardStats.support.closed,
    pct: getPercent(
      dashboardStats.support.closed,
      dashboardStats.support.total
    ),
    color: "bg-gray-400",
  },
];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="relative">
          <button onClick={() => setOptionsOpen((v) => !v)} className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50">
            <Settings2 size={14} /> Dashboard Options
          </button>
          {optionsOpen && (
          <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-border-subtle bg-white p-4 shadow-lg">
            <p className="mb-3 text-[13px] font-semibold text-gray-900">
              Dashboard Widgets
            </p>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-[13px] text-gray-700">
                  Customers
                </span>

                <input
                  type="checkbox"
                  checked={visibleWidgets.customers}
                  onChange={(e) =>
                    setVisibleWidgets((prev) => ({
                      ...prev,
                      customers: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-[13px] text-gray-700">
                  Projects
                </span>

                <input
                  type="checkbox"
                  checked={visibleWidgets.projects}
                  onChange={(e) =>
                    setVisibleWidgets((prev) => ({
                      ...prev,
                      projects: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-[13px] text-gray-700">
                  Tasks
                </span>

                <input
                  type="checkbox"
                  checked={visibleWidgets.tasks}
                  onChange={(e) =>
                    setVisibleWidgets((prev) => ({
                      ...prev,
                      tasks: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-[13px] text-gray-700">
                  Support
                </span>

                <input
                  type="checkbox"
                  checked={visibleWidgets.support}
                  onChange={(e) =>
                    setVisibleWidgets((prev) => ({
                      ...prev,
                      support: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-[13px] text-gray-700">
                  Recent Activity
                </span>

                <input
                  type="checkbox"
                  checked={visibleWidgets.recentActivity}
                  onChange={(e) =>
                    setVisibleWidgets((prev) => ({
                      ...prev,
                      recentActivity: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>
            </div>
          </div>
        )}
                </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {visibleWidgets.customers && (
  <a href="/customers" className="block">
    <StatCard
      icon={CreditCard}
      label="Active Customers"
      value={dashboardStats.customers.active}
      total={dashboardStats.customers.total}
      progress={
        dashboardStats.customers.total > 0
          ? Math.round(
              (dashboardStats.customers.active /
                dashboardStats.customers.total) *
                100
            )
          : 0
      }
    />
  </a>
)}

 {visibleWidgets.support && (
  <a href="/support" className="block">
    <StatCard
      icon={TrendingUp}
      label="Open Support Tickets"
      value={dashboardStats.support.open}
      total={dashboardStats.support.total}
      progress={
        dashboardStats.support.total > 0
          ? Math.round(
              (dashboardStats.support.open /
                dashboardStats.support.total) *
                100
            )
          : 0
      }
    />
  </a>
)}

  {visibleWidgets.projects && (
  <a href="/projects" className="block">
    <StatCard
      icon={SlidersHorizontal}
      label="Projects In Progress"
      value={dashboardStats.projects.inProgress}
      total={dashboardStats.projects.total}
      progress={
        dashboardStats.projects.total > 0
          ? Math.round(
              (dashboardStats.projects.inProgress /
                dashboardStats.projects.total) *
                100
            )
          : 0
      }
    />
  </a>
)}

  {visibleWidgets.tasks && (
  <a href="/tasks" className="block">
    <StatCard
      icon={FileCheck2}
      label="Tasks Not Finished"
      value={dashboardStats.tasks.notFinished}
      total={dashboardStats.tasks.total}
      progress={
        dashboardStats.tasks.total > 0
          ? Math.round(
              (dashboardStats.tasks.notFinished /
                dashboardStats.tasks.total) *
                100
            )
          : 0
      }
    />
  </a>
)}

</div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visibleWidgets.projects && (
        <a href="/projects" className="block">
          <OverviewCard
            icon={FileText}
            title="Projects Overview"
            rows={projectOverview}
          />
        </a>
      )}

      {visibleWidgets.tasks && (
        <a href="/tasks" className="block">
          <OverviewCard
            icon={ClipboardList}
            title="Tasks Overview"
            rows={taskOverview}
          />
        </a>
      )}

      {visibleWidgets.support && (
        <a href="/support" className="block">
          <OverviewCard
            icon={FileText}
            title="Support Overview"
            rows={supportOverview}
          />
        </a>
      )}
      </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleWidgets.customers && (
          <a href="/customers" className="block">
            <SummaryCard
              label="Total Customers"
              value={String(dashboardStats.customers.total)}
              color="text-blue-600"
            />
          </a>
        )}

        {visibleWidgets.projects && (
          <a href="/projects" className="block">
            <SummaryCard
              label="Finished Projects"
              value={String(dashboardStats.projects.finished)}
              color="text-emerald-600"
            />
          </a>
        )}

        {visibleWidgets.tasks && (
          <a href="/tasks" className="block">
            <SummaryCard
              label="Completed Tasks"
              value={String(dashboardStats.tasks.complete)}
              color="text-emerald-600"
            />
          </a>
        )}
        </div>

          <div className="rounded-lg border border-border-subtle bg-white">
            <Tabs
              tabs={[
                ...(visibleWidgets.tasks
  ? [
      {
        label: "My Tasks",
                content: (
                  <div className="space-y-3">
                    {recentData.tasks.filter(
                    (task: any) =>
                      task.assigned_to === currentUserId ||
                      task.assignedTo === currentUserId
                  ).length === 0 ? (
                      <p className="text-[13px] text-gray-400">
                        No tasks found
                      </p>
                    ) : (
                      recentData.tasks
                      .filter(
                        (task: any) =>
                          task.assigned_to === currentUserId ||
                          task.assignedTo === currentUserId
                      )
                      .map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-gray-800">
                              {task.title ||
                                task.name ||
                                task.task_name ||
                                "Untitled Task"}
                            </p>

                            <p className="mt-0.5 text-[11px] text-gray-500">
                              {task.status || "No status"}
                            </p>
                          </div>

                          <a
                            href="/tasks"
                            className="shrink-0 text-[12px] font-medium text-brand hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))
                    )}

                    <a
                      href="/tasks"
                      className="inline-block text-[12px] font-semibold text-brand hover:underline"
                    >
                      View All Tasks
                    </a>
                  </div>
                ),
                    },
    ]
  : []),
                ...(visibleWidgets.projects
  ? [
      {
        label: "My Projects",
                content: (
                  <div className="space-y-3">
                    {recentData.projects.length === 0 ? (
                      <p className="text-[13px] text-gray-400">
                        No projects found
                      </p>
                    ) : (
                      recentData.projects.map((project: any) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-gray-800">
                              {project.name ||
                                project.title ||
                                project.project_name ||
                                "Untitled Project"}
                            </p>

                            <p className="mt-0.5 text-[11px] text-gray-500">
                              {project.status || "No status"}
                            </p>
                          </div>

                          <a
                            href="/projects"
                            className="shrink-0 text-[12px] font-medium text-brand hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))
                    )}

                    <a
                      href="/projects"
                      className="inline-block text-[12px] font-semibold text-brand hover:underline"
                    >
                      View All Projects
                    </a>
                  </div>
                  ),
                    },
                  ]
                : []),
                ...(visibleWidgets.customers
  ? [
      {
        label: "Customers",
                  content: (
                    <div className="space-y-3">
                      {recentData.customers.length === 0 ? (
                        <p className="text-[13px] text-gray-400">
                          No customers found
                        </p>
                      ) : (
                        recentData.customers.map((customer: any) => (
                          <div
                            key={customer.id}
                            className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-gray-800">
                                {customer.name ||
                                  customer.full_name ||
                                  customer.company_name ||
                                  customer.email ||
                                  "Unnamed Customer"}
                              </p>

                              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                                {customer.email ||
                                  customer.company ||
                                  customer.status ||
                                  "Customer"}
                              </p>
                            </div>

                            <a
                              href="/customers"
                              className="shrink-0 text-[12px] font-medium text-brand hover:underline"
                            >
                              View
                            </a>
                          </div>
                        ))
                      )}

                      <a
                        href="/customers"
                        className="inline-block text-[12px] font-semibold text-brand hover:underline"
                      >
                        View All Customers
                      </a>
                    </div>
                  ),
                      },
    ]
  : []),
                ...(visibleWidgets.support
  ? [
      {
        label: "Tickets",
                content: (
                  <div className="space-y-3">
                    {recentData.tickets.length === 0 ? (
                      <p className="text-[13px] text-gray-400">
                        No support tickets found
                      </p>
                    ) : (
                      recentData.tickets.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-gray-800">
                              {ticket.subject || "Support Ticket"}
                            </p>

                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
                              <span>{ticket.status || "Open"}</span>

                              {ticket.priority && (
                                <>
                                  <span>•</span>
                                  <span>{ticket.priority}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <a
                            href={`/support?ticket=${ticket.id}`}
                            className="shrink-0 text-[12px] font-medium text-brand hover:underline"
                          >
                            Open
                          </a>
                        </div>
                      ))
                    )}

                    <a
                      href="/support"
                      className="inline-block text-[12px] font-semibold text-brand hover:underline"
                    >
                      View All Tickets
                    </a>
                  </div>
                ),
                    },
    ]
  : []),
            ...(visibleWidgets.recentActivity
          ? [
              {
              label: "Recent Activity",
                  content: (
                    <div className="space-y-3">
                      {[
                        ...recentData.projects.map((item: any) => ({
                          id: `project-${item.id}`,
                          type: "Project",
                          title:
                            item.name ||
                            item.title ||
                            item.project_name ||
                            "Untitled Project",
                          href: "/projects",
                          createdAt: item.created_at || item.createdAt,
                        })),

                        ...recentData.tasks.map((item: any) => ({
                          id: `task-${item.id}`,
                          type: "Task",
                          title:
                            item.title ||
                            item.name ||
                            item.task_name ||
                            "Untitled Task",
                          href: "/tasks",
                          createdAt: item.created_at || item.createdAt,
                        })),

                        ...recentData.customers.map((item: any) => ({
                          id: `customer-${item.id}`,
                          type: "Customer",
                          title:
                            item.name ||
                            item.full_name ||
                            item.company_name ||
                            item.email ||
                            "Customer",
                          href: "/customers",
                          createdAt: item.created_at || item.createdAt,
                        })),

                        ...recentData.tickets.map((item: any) => ({
                          id: `ticket-${item.id}`,
                          type: "Support",
                          title: item.subject || "Support Ticket",
                          href: `/support?ticket=${item.id}`,
                          createdAt: item.created_at || item.createdAt,
                        })),
                      ]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt || 0).getTime() -
                            new Date(a.createdAt || 0).getTime()
                        )
                        .slice(0, 6)
                        .map((activity) => (
                          <a
                            key={activity.id}
                            href={activity.href}
                            className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-gray-800">
                                {activity.title}
                              </p>

                              <p className="mt-0.5 text-[11px] text-gray-500">
                                {activity.type}
                              </p>
                            </div>

                            <span className="shrink-0 text-[11px] font-medium text-brand">
                              View
                            </span>
                          </a>
                            ))}
                          </div>
                        ),
                      },
                    ]
               : []),
              ]}
            />
          </div>
                
        </div>

        <div className="space-y-4">
          {visibleWidgets.customers && (
            <div className="rounded-lg border border-border-subtle bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-gray-800">
                Recent Customers
              </span>

              <a
                href="/customers"
                className="text-[12px] font-medium text-brand hover:underline"
              >
                View All
              </a>
            </div>

            {recentData.customers.length === 0 ? (
              <p className="text-[13px] text-gray-400">
                No customers found
              </p>
            ) : (
              <div className="space-y-3">
                {recentData.customers.slice(0, 5).map((customer: any) => {
                  const customerName =
                    customer.name ||
                    customer.full_name ||
                    customer.company_name ||
                    customer.email ||
                    "Unnamed Customer";

                  const isActive =
                    typeof customer.is_active === "boolean"
                      ? customer.is_active
                      : typeof customer.active === "boolean"
                        ? customer.active
                        : String(customer.status || "").toLowerCase() === "active";

                  return (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-gray-800">
                          {customerName}
                        </p>

                        <p className="mt-0.5 truncate text-[11px] text-gray-500">
                          {customer.email || customer.company || "Customer"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
          {(
          visibleWidgets.customers ||
          visibleWidgets.projects ||
          visibleWidgets.tasks ||
          visibleWidgets.support
        ) && (
          <div className="rounded-lg border border-border-subtle bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-gray-800">
              Work Overview
            </p>

            <span className="text-[11px] text-gray-400">
              Live
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-600">
                Active Customers
              </span>

              <span className="text-[13px] font-bold text-gray-900">
                {dashboardStats.customers.active}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-600">
                Projects In Progress
              </span>

              <span className="text-[13px] font-bold text-gray-900">
                {dashboardStats.projects.inProgress}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-600">
                Tasks Not Finished
              </span>

              <span className="text-[13px] font-bold text-gray-900">
                {dashboardStats.tasks.notFinished}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-600">
                Open Support Tickets
              </span>

              <span className="text-[13px] font-bold text-gray-900">
                {dashboardStats.support.open}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
            <a
              href="/projects"
              className="rounded-md bg-gray-50 px-2 py-2 text-center text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
            >
              Projects
            </a>

            <a
              href="/tasks"
              className="rounded-md bg-gray-50 px-2 py-2 text-center text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
            >
              Tasks
            </a>

            <a
              href="/customers"
              className="rounded-md bg-gray-50 px-2 py-2 text-center text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
            >
              Customers
            </a>

            <a
              href="/support"
              className="rounded-md bg-gray-50 px-2 py-2 text-center text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
            >
              Support
            </a>
          </div>
        </div>
        )}
        </div>
      </div>
    </div>
  );
}
