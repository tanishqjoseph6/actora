"use client";

import { motion } from "framer-motion";
import { dashboard } from "./dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";

type PremiumMetricCardProps = {
  title: string;
  value: string | number;
  trend?: number;
  sparkline?: number[];
  delay?: number;
  loading?: boolean;
};

export function PremiumMetricCard({
  title,
  value,
  trend = 0,
  sparkline = [3, 5, 4, 7, 6, 8, 9],
  delay = 0,
  loading = false,
}: PremiumMetricCardProps) {
  const trendUp = trend >= 0;
  const max = Math.max(...sparkline, 1);
  const points = sparkline
    .map((v, i) => {
      const x = (i / (sparkline.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const gradientId = `spark-${title.replace(/\s/g, "-")}`;

  if (loading) {
    return (
      <div className={`${dashboard.cardBase} p-4 sm:p-5`} aria-busy="true">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-12 mt-3" />
        <Skeleton className="h-6 w-full mt-3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative ${dashboard.cardInteractive} p-4 sm:p-5 overflow-hidden`}
    >
      <div className="relative">
        <p className={`text-[11px] uppercase tracking-wider font-medium ${dashboard.subtle}`}>
          {title}
        </p>
        <motion.p
          key={String(value)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums truncate"
        >
          {value}
        </motion.p>

        <div className="flex items-end justify-between gap-2 mt-3">
          <span
            className={`text-xs font-medium tabular-nums ${
              trendUp ? "text-[#3B82F6]" : "text-[#94A3B8]"
            }`}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <svg viewBox="0 0 100 40" className="w-14 h-7 opacity-70 group-hover:opacity-100 transition-opacity" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
