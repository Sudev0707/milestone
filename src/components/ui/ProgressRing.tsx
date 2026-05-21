import { motion } from "framer-motion";

export function ProgressRing({
  value, size = 64, stroke = 6, label,
}: { value: number; size?: number; stroke?: number; label?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--muted)" strokeWidth={stroke} fill="none"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--primary)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums">
        {label ?? `${Math.round(value)}%`}
      </div>
    </div>
  );
}
