"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export function CrmStatCard({
  title,
  value,
  hint,
  delay = 0,
}: {
  title: string;
  value: string | number;
  hint?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={`${dashboard.cardInteractive} p-4 sm:p-5 min-w-0`}
    >
      <h3 className={`text-xs sm:text-sm truncate ${dashboard.subtle}`}>{title}</h3>
      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2 tabular-nums truncate">
        {value}
      </p>
      {hint && <p className={`text-xs mt-1 truncate ${dashboard.subtle}`}>{hint}</p>}
    </motion.div>
  );
}
