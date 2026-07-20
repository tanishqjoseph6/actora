"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { StageBreakdown } from "@/lib/analytics/types";

type AnalyticsDonutChartProps = {
  title: string;
  subtitle?: string;
  data: StageBreakdown[];
};

export function AnalyticsDonutChart({
  title,
  subtitle,
  data,
}: AnalyticsDonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  const segments = useMemo(() => {
    const circumference = 2 * Math.PI * 40;
    return data.reduce<
      Array<
        StageBreakdown & {
          pct: number;
          dashArray: string;
          dashOffset: number;
        }
      >
    >((segmentsAcc, d, index, arr) => {
      const totalValue = arr.reduce((s, item) => s + item.value, 0);
      const pct = totalValue > 0 ? d.value / totalValue : 0;
      const length = pct * circumference;
      const priorLength = segmentsAcc.reduce(
        (sum, segment) => sum + segment.pct * circumference,
        0
      );

      segmentsAcc.push({
        ...d,
        pct,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -priorLength,
      });

      return segmentsAcc;
    }, []);
  }, [data]);

  return (
    <div className={`${dashboard.cardLg} p-4 sm:p-5 h-full`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && (
          <p className={`text-xs ${dashboard.subtle} mt-0.5`}>{subtitle}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="12"
            />
            {segments.map((seg, i) => (
              <motion.circle
                key={seg.stage}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white tabular-nums">{total}</span>
            <span className={`text-[10px] ${dashboard.subtle}`}>deals</span>
          </div>
        </div>

        <ul className="flex-1 w-full space-y-2.5">
          {segments.map((seg) => (
            <li key={seg.stage} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className={`text-sm ${dashboard.muted} flex-1 truncate`}>
                {seg.label}
              </span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {seg.value}
              </span>
              <span className={`text-xs ${dashboard.subtle} w-10 text-right tabular-nums`}>
                {Math.round(seg.pct * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
