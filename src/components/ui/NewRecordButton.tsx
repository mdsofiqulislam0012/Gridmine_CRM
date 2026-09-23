"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "./Modal";
import FormField from "./FormField";

type NewRecordButtonProps = {
  label: string;
  fields: string[];
  onSave?: (values: Record<string, string>) => Promise<void> | void;
};

export default function NewRecordButton({
  label,
  fields,
  onSave,
}: NewRecordButtonProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (onSave) {
        await onSave(values);
      }

      setValues({});
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand-dark px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
      >
        <Plus size={14} />
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={label}
      >
        {fields.map((field) => (
          <FormField
            key={field}
            label={field}
            value={values[field] ?? ""}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                [field]: value,
              }))
            }
          />
        ))}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={saving}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-brand-dark px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </>
  );
}