"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { TimeSeriesPoint } from "@/lib/analytics/types";

type AnalyticsLineChartProps = {
  title: string;
  subtitle?: string;
  data: TimeSeriesPoint[];
  formatValue?: (n: number) => string;
  height?: number;
  color?: string;
};

export function AnalyticsLineChart({
  title,
  subtitle,
  data,
  formatValue = (n) => n.toLocaleString(),
  height = 200,
  color = "#2563EB",
}: AnalyticsLineChartProps) {
  const gradientId = useId();
  const safeData = data.length ? data : [{ label: "—", value: 0 }];
  const max = Math.max(...safeData.map((d) => d.value), 1);
  const min = Math.min(...safeData.map((d) => d.value));
  const range = max - min || 1;
  const pad = 8;
  const w = 100;
  const h = 100;

  const points = safeData.map((d, i) => {
    const x = pad + (i / Math.max(safeData.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2);
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const latest = safeData[safeData.length - 1]?.value ?? 0;

  return (
    <div className={`${dashboard.cardLg} p-4 sm:p-5 h-full flex flex-col`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className={`text-xs ${dashboard.subtle} mt-0.5`}>{subtitle}</p>
          )}
        </div>
        <p className="text-lg font-bold text-white tabular-nums">
          {formatValue(latest)}
        </p>
      </div>

      <div className="flex-1 min-h-0" style={{ height }}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={pad}
              y1={h - pad - pct * (h - pad * 2)}
              x2={w - pad}
              y2={h - pad - pct * (h - pad * 2)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="#3B82F6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div className="flex justify-between mt-2 gap-1">
        {safeData.map((d) => (
          <span
            key={d.label}
            className={`text-[10px] ${dashboard.subtle} truncate flex-1 text-center`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
