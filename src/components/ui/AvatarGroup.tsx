const COLORS = ["bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-violet-600", "bg-rose-600"];

export default function AvatarGroup({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, 3).map((n, i) => (
        <div
          key={n + i}
          title={n}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white ${COLORS[i % COLORS.length]}`}
        >
          {n.slice(0, 1).toUpperCase()}
        </div>
      ))}
      {names.length > 3 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-[10px] font-semibold text-gray-700">
          +{names.length - 3}
        </div>
      )}
    </div>
  );
}
