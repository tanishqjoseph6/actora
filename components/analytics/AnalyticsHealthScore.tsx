"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  healthRatingColor,
  healthRatingLabel,
} from "@/lib/analytics/format";
import type { AnalyticsSnapshot } from "@/lib/analytics/types";
import { AnalyticsProgressRing } from "./AnalyticsProgressRing";

type AnalyticsHealthScoreProps = {
  snapshot: AnalyticsSnapshot;
  loading?: boolean;
};

const BREAKDOWN_LABELS: Array<{
  key: keyof AnalyticsSnapshot["productivity"];
  label: string;
}> = [
  { key: "inboxZero", label: "Inbox Zero" },
  { key: "crmActivity", label: "CRM Activity" },
  { key: "tasksCompleted", label: "Tasks" },
  { key: "meetingsAttended", label: "Meetings" },
  { key: "automationUsage", label: "Automations" },
  { key: "roxxUsage", label: "Roxx AI" },
];

export function AnalyticsHealthScore({
  snapshot,
  loading = false,
}: AnalyticsHealthScoreProps) {
  const { overview, productivity } = snapshot;
  const ratingColor = healthRatingColor(overview.healthRating);

  if (loading) {
    return (
      <div className={`${dashboard.cardLg} p-5 sm:p-6 mb-6 lg:mb-8 animate-pulse`}>
        <div className="h-4 w-32 bg-white/5 rounded mb-4" />
        <div className="h-24 w-full bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${dashboard.cardLg} p-5 sm:p-6 mb-6 lg:mb-8 overflow-hidden relative`}
    >
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${ratingColor}, transparent 60%)`,
        }}
      />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
        <div className="flex items-center gap-5 shrink-0">
          <AnalyticsProgressRing
            value={overview.workspaceHealthScore}
            label=""
            size={100}
            strokeWidth={8}
            color={ratingColor}
          />
          <div>
            <p className={`text-xs uppercase tracking-wider ${dashboard.subtle}`}>
              Workspace Health
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums mt-1">
              {overview.workspaceHealthScore}
              <span className="text-lg text-[#71717A] font-medium">/100</span>
            </p>
            <p
              className="text-sm font-semibold mt-1"
              style={{ color: ratingColor }}
            >
              {healthRatingLabel(overview.healthRating)}
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {BREAKDOWN_LABELS.map(({ key, label }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="text-center"
            >
              <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#3B82F6]"
                  initial={{ width: 0 }}
                  animate={{ width: `${productivity[key]}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              </div>
              <p className={`text-[10px] ${dashboard.subtle} truncate`}>
                {label}
              </p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {Math.round(productivity[key])}%
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
