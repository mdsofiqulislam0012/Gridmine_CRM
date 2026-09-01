export default function EmptyState({ message = "No entries found" }: { message?: string }) {
  return <div className="px-4 py-6 text-sm text-gray-500">{message}</div>;
}
