"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { TimeSeriesPoint } from "@/lib/analytics/types";

type AnalyticsBarChartProps = {
  title: string;
  subtitle?: string;
  data: TimeSeriesPoint[];
  height?: number;
};

export function AnalyticsBarChart({
  title,
  subtitle,
  data,
  height = 200,
}: AnalyticsBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={`${dashboard.cardLg} p-4 sm:p-5 h-full flex flex-col`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className={`text-xs ${dashboard.subtle} mt-0.5`}>{subtitle}</p>
          )}
        </div>
        <p className="text-lg font-bold text-white tabular-nums">{total}</p>
      </div>

      <div
        className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2"
        style={{ height }}
      >
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2 min-w-0 h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[#1D4ED8] to-[#3B82F6] min-h-[4px] relative group"
                title={`${d.label}: ${d.value}`}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap">
                  {d.value}
                </span>
              </motion.div>
              <span className={`text-[10px] ${dashboard.subtle} truncate w-full text-center`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
