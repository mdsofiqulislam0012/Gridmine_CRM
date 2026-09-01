"use client";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, TrendingUp, SlidersHorizontal, FileCheck2, Settings2, FileText, ClipboardList, Plus } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import SummaryCard from "@/components/ui/SummaryCard";
import Tabs from "@/components/ui/Tabs";
import { createClient } from "@/lib/supabase/client";

const invoiceOverview = [
  { label: "Draft", value: 1, pct: "0.19%", color: "bg-gray-300" },
  { label: "Not Sent", value: 97, pct: "18.23%", color: "bg-gray-500" },
  { label: "Unpaid", value: 57, pct: "10.71%", color: "bg-red-500" },
  { label: "Partially Paid", value: 3, pct: "0.56%", color: "bg-amber-500" },
  { label: "Overdue", value: 38, pct: "7.14%", color: "bg-amber-500" },
  { label: "Paid", value: 433, pct: "81.39%", color: "bg-emerald-500" },
];
const estimateOverview = ["Draft", "Not Sent", "Sent", "Expired", "Declined", "Accepted"].map((l) => ({ label: l, value: 0, pct: "0%", color: "bg-gray-300" }));
const proposalOverview = ["Draft", "Sent", "Open", "Revised", "Declined", "Accepted"].map((l) => ({ label: l, value: 0, pct: "0%", color: "bg-gray-300" }));

function OverviewCard({ icon: Icon, title, rows }: { icon: React.ElementType; title: string; rows: typeof invoiceOverview }) {
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
    const supabase = useMemo(() => createClient(), []);

  const [projectStats, setProjectStats] = useState({
    total: 0,
    inProgress: 0,
  });


    useEffect(() => {
    const loadProjectStats = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, status");

      if (error) {
        console.error("Project stats error:", error);
        return;
      }

      const projects = data ?? [];

      const total = projects.length;

      const inProgress = projects.filter(
        (project) => project.status === "in_progress"
      ).length;

      setProjectStats({
        total,
        inProgress,
      });
    };

    loadProjectStats();

    const channel = supabase
      .channel("dashboard-projects")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          loadProjectStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="relative">
          <button onClick={() => setOptionsOpen((v) => !v)} className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50">
            <Settings2 size={14} /> Dashboard Options
          </button>
          {optionsOpen && (
            <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-border-subtle bg-white p-3 shadow-lg">
              <p className="text-xs text-gray-500">Widget customization will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CreditCard} label="Invoices Awaiting Payment" value={98} total={531} progress={18} />
        <StatCard icon={TrendingUp} label="Converted Leads" value={0} total={0} progress={0} />
        <StatCard
          icon={SlidersHorizontal}
          label="Projects In Progress"
          value={projectStats.inProgress}
          total={projectStats.total}
          progress={
            projectStats.total > 0
              ? Math.round(
                  (projectStats.inProgress / projectStats.total) * 100
                )
              : 0
          }
        />
        <StatCard icon={FileCheck2} label="Tasks Not Finished" value={42} total={158} progress={27} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <OverviewCard icon={FileText} title="Invoice overview" rows={invoiceOverview} />
            <OverviewCard icon={ClipboardList} title="Estimate overview" rows={estimateOverview} />
            <OverviewCard icon={FileText} title="Proposal overview" rows={proposalOverview} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label="Outstanding Invoices" value="$21,439.00" color="text-amber-600" />
            <SummaryCard label="Past Due Invoices" value="$8,750.00" color="text-red-500" />
            <SummaryCard label="Paid Invoices" value="$43,577.20" color="text-emerald-600" />
          </div>

          <div className="rounded-lg border border-border-subtle bg-white">
            <Tabs
              tabs={[
                { label: "My Tasks", content: <a href="/tasks" className="text-[13px] text-brand hover:underline">View All</a> },
                { label: "My Projects", content: <a href="/projects" className="text-[13px] text-brand hover:underline">View All</a> },
                { label: "My Reminders", content: <p className="text-[13px] text-gray-400">No reminders found</p> },
                { label: "Tickets", content: <a href="/support" className="text-[13px] text-brand hover:underline">View All</a> },
                { label: "Announcements", content: <p className="text-[13px] text-gray-400">No announcements found</p> },
              ]}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border-subtle bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-gray-800">My To Do Items</span>
              <div className="flex items-center gap-2 text-[12px]">
                <a href="#" className="text-brand hover:underline">View All</a>
                <button className="flex items-center gap-1 text-brand hover:underline"><Plus size={12} /> New To Do</button>
              </div>
            </div>
            <div className="mb-3">
              <p className="mb-1 text-[12.5px] font-medium text-amber-600">Latest to do&apos;s</p>
              <p className="text-[13px] text-gray-400">No todos found</p>
            </div>
            <div>
              <p className="mb-1 text-[12.5px] font-medium text-emerald-600">Latest finished to do&apos;s</p>
              <p className="text-[13px] text-gray-400">No finished todos found</p>
            </div>
          </div>

          <div className="rounded-lg border border-border-subtle bg-white p-4">
            <p className="mb-3 text-[13px] font-semibold text-gray-800">Leads Overview</p>
            <div className="flex items-center justify-center gap-4 text-[12px] text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Client</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Lost Leads</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
