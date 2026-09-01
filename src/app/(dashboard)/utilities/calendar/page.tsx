"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";

const views = ["Month", "Week", "Day"] as const;
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [view, setView] = useState<(typeof views)[number]>("Month");
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Calendar"
        actions={
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-brand-dark px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <Plus size={14} /> Add Event
          </button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <button className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <button className="rounded-md border border-border-subtle px-2.5 py-1 text-[13px] font-medium hover:bg-gray-50">Today</button>
          <button className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50"><ChevronRight size={16} /></button>
          <span className="ml-1 text-sm font-semibold text-gray-800">September 2026</span>
        </div>
        <div className="flex overflow-hidden rounded-md border border-border-subtle">
          {views.map((v) => (
            <button
              key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-[13px] font-medium ${view === v ? "bg-brand text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >{v}</button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-white">
        <div className="grid grid-cols-7 border-b border-border-subtle text-center text-[12px] font-semibold text-gray-500">
          {days.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 border-b border-r border-border-subtle p-1.5 text-[12px] text-gray-400 last:border-r-0">{((i % 30) + 1)}</div>
          ))}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Event">
        <FormField label="Event Title" />
        <FormField label="Date" type="date" />
        <FormField label="Notes" textarea />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-md border border-border-subtle px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => setOpen(false)} className="rounded-md bg-brand-dark px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90">Save Event</button>
        </div>
      </Modal>
    </div>
  );
}
