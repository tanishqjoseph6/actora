"use client";

import { motion } from "framer-motion";

type PremiumMetricCardProps = {
  title: string;
  value: string | number;
  trend?: number;
  sparkline?: number[];
  delay?: number;
};

export function PremiumMetricCard({
  title,
  value,
  trend = 0,
  sparkline = [3, 5, 4, 7, 6, 8, 9],
  delay = 0,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-[20px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl p-4 sm:p-5 overflow-hidden hover:border-[#1E293B] hover: transition-shadow duration-300"
    >
      <div className="absolute inset-0 bg-[#2563EB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{title}</p>
        <motion.p
          key={String(value)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums"
        >
          {value}
        </motion.p>

        <div className="flex items-end justify-between gap-2 mt-3">
          <span
            className={`text-xs font-semibold tabular-nums ${trendUp ? "text-emerald-400" : "text-rose-400"}`}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <svg viewBox="0 0 100 40" className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden>
            <defs>
              <linearGradient id={`spark-${title.replace(/\s/g, "")}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke={`url(#spark-${title.replace(/\s/g, "")})`}
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
