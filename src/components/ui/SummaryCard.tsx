type SummaryCardProps = {
  label: string;
  value: string | number;
  color?: string;
};

function getCardTone(label: string) {
  const text = label.toLowerCase();

  if (text.includes("active") && text.includes("customer")) {
    return {
      bg1: "rgba(16, 185, 129, 0.16)",
      bg2: "rgba(255, 255, 255, 0.92)",
      border: "rgba(16, 185, 129, 0.22)",
      shadow: "rgba(16, 185, 129, 0.20)",
      glow: "rgba(16, 185, 129, 0.28)",
    };
  }

  if (text.includes("inactive")) {
    return {
      bg1: "rgba(239, 68, 68, 0.14)",
      bg2: "rgba(255, 255, 255, 0.92)",
      border: "rgba(239, 68, 68, 0.20)",
      shadow: "rgba(239, 68, 68, 0.16)",
      glow: "rgba(239, 68, 68, 0.22)",
    };
  }

  if (text.includes("contact")) {
    return {
      bg1: "rgba(59, 130, 246, 0.14)",
      bg2: "rgba(255, 255, 255, 0.92)",
      border: "rgba(59, 130, 246, 0.20)",
      shadow: "rgba(59, 130, 246, 0.16)",
      glow: "rgba(59, 130, 246, 0.20)",
    };
  }

  return {
    bg1: "rgba(99, 102, 241, 0.10)",
    bg2: "rgba(255, 255, 255, 0.92)",
    border: "rgba(148, 163, 184, 0.22)",
    shadow: "rgba(15, 23, 42, 0.10)",
    glow: "rgba(99, 102, 241, 0.16)",
  };
}

export default function SummaryCard({
  label,
  value,
  color,
}: SummaryCardProps) {
  const tone = getCardTone(label);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border px-5 py-4 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${tone.bg1} 0%, ${tone.bg2} 100%)`,
        borderColor: tone.border,
        boxShadow: `0 14px 34px ${tone.shadow}, inset 0 1px 0 rgba(255,255,255,0.85)`,
      }}
    >
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: tone.glow }}
      />

      <div
        className="absolute left-0 top-0 h-full w-full opacity-60"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.00) 45%)",
        }}
      />

      <div className="relative z-10">
        <p className="text-[13px] font-bold tracking-[0.01em] text-gray-700">
          {label}
        </p>

        <h3
          className={`mt-3 text-[30px] leading-none font-extrabold ${
            color ? color : "text-gray-900"
          }`}
        >
          {value}
        </h3>

        <div className="mt-4 h-[4px] w-16 rounded-full bg-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]" />
      </div>
    </div>
  );
}