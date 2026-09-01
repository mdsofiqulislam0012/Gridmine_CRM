"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "./Modal";
import FormField from "./FormField";

export default function NewRecordButton({ label, fields }: { label: string; fields: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand-dark px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
      >
        <Plus size={14} /> {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        {fields.map((f) => <FormField key={f} label={f} />)}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-md border border-border-subtle px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => setOpen(false)} className="rounded-md bg-brand-dark px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90">Save</button>
        </div>
      </Modal>
    </>
  );
}
