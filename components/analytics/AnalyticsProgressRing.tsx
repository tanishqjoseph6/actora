"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type AnalyticsProgressRingProps = {
  value: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
};

export function AnalyticsProgressRing({
  value,
  label,
  sublabel,
  size = 120,
  strokeWidth = 10,
  color = "#3B82F6",
}: AnalyticsProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white tabular-nums">
            {Math.round(pct)}
          </span>
          <span className={`text-[10px] ${dashboard.subtle}`}>%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-white mt-3">{label}</p>
      {sublabel && (
        <p className={`text-xs ${dashboard.subtle} mt-0.5`}>{sublabel}</p>
      )}
    </div>
  );
}
