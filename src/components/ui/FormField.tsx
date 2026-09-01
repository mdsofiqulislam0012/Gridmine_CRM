export default function FormField({
  label, type = "text", placeholder, textarea,
}: { label: string; type?: string; placeholder?: string; textarea?: boolean }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[13px] font-medium text-gray-700">{label}</span>
      {textarea ? (
        <textarea placeholder={placeholder} rows={3} className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13px] outline-none focus:border-brand" />
      ) : (
        <input type={type} placeholder={placeholder} className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13px] outline-none focus:border-brand" />
      )}
    </label>
  );
}
