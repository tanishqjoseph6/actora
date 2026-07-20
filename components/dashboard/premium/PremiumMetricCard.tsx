"use client";

import { memo, useEffect, useState } from "react";
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

function useAnimatedNumber(value: string | number) {
  const numeric =
    typeof value === "number"
      ? value
      : Number.isFinite(Number(value))
        ? Number(value)
        : null;
  const [display, setDisplay] = useState(numeric ?? value);

  useEffect(() => {
    if (numeric === null) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from =
      typeof display === "number" ? display : 0;
      const duration = 220;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (numeric - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate on value change only
  }, [numeric, value]);

  return display;
}

export const PremiumMetricCard = memo(function PremiumMetricCard({
  title,
  value,
  trend,
  sparkline,
  delay = 0,
  loading = false,
}: PremiumMetricCardProps) {
  const showTrend = trend !== undefined;
  const showSparkline = sparkline !== undefined && sparkline.length > 1;
  const animatedValue = useAnimatedNumber(value);

  if (loading) {
    return (
      <div className={`${dashboard.cardBase} p-4 sm:p-5`} aria-busy="true">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-12 mt-3" />
        {(showTrend || showSparkline) && <Skeleton className="h-6 w-full mt-3" />}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
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
          {animatedValue}
        </motion.p>

        {(showTrend || showSparkline) && (
          <div className="flex items-end justify-between gap-2 mt-3">
            {showTrend ? (
              <span
                className={`text-xs font-medium tabular-nums ${
                  trend >= 0 ? "text-[#3B82F6]" : "text-[#A1A1AA]"
                }`}
              >
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
            ) : (
              <span />
            )}
            {showSparkline && sparkline && (
              <Sparkline title={title} values={sparkline} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

function Sparkline({ title, values }: { title: string; values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const gradientId = `spark-${title.replace(/\s/g, "-")}`;

  return (
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
  );
}
