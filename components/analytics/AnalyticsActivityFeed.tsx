"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { formatActivityTime } from "@/lib/analytics/mock-data";
import type { ActivityItem } from "@/lib/analytics/types";

const TYPE_META: Record<
  ActivityItem["type"],
  { icon: string; color: string }
> = {
  email: { icon: "✉️", color: "bg-[#3B82F6]/15 border-[#3B82F6]/30" },
  task: { icon: "✓", color: "bg-[#1E293B] border-[#334155]" },
  deal: { icon: "💼", color: "bg-[#3B82F6]/10 border-[#3B82F6]/25" },
  meeting: { icon: "📅", color: "bg-[#0A0A0A] border-white/[0.06]" },
  ai: { icon: "✦", color: "bg-[#3B82F6]/20 border-[#3B82F6]/35" },
};

type AnalyticsActivityFeedProps = {
  items: ActivityItem[];
};

export function AnalyticsActivityFeed({ items }: AnalyticsActivityFeedProps) {
  return (
    <div className={`${dashboard.cardLg} p-4 sm:p-5`}>
      <h3 className="text-sm font-semibold text-white mb-4">Recent activity</h3>
      <ul className="space-y-3">
        {items.map((item, i) => {
          const meta = TYPE_META[item.type];
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-[18px] border border-white/[0.06] bg-[#0A0A0A]/50 hover:border-[#3B82F6]/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm shrink-0 ${meta.color}`}
              >
                {meta.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {item.title}
                  </p>
                  <time
                    className={`text-[10px] ${dashboard.subtle} shrink-0 tabular-nums`}
                    dateTime={item.timestamp}
                  >
                    {formatActivityTime(item.timestamp)}
                  </time>
                </div>
                <p className={`text-xs ${dashboard.muted} mt-0.5 line-clamp-2`}>
                  {item.detail}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
