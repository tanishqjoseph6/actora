"use client";

import { motion } from "framer-motion";
import { Bot, Workflow } from "lucide-react";
import type {
  DashboardAutomationPreview,
  DashboardMeetingPreview,
} from "@/lib/dashboard/types";
import { CompactEmptyState } from "@/components/ui/CompactEmptyState";
import { SkeletonListRows } from "@/components/ui/Skeleton";
import { useCalendarAccount } from "@/hooks/useCalendarAccount";
import { TodaysScheduleWidget } from "./TodaysScheduleWidget";
import { dashboard } from "./dashboard-tokens";

type DashboardWidgetsProps = {
  todaysMeetings: DashboardMeetingPreview[];
  automations: DashboardAutomationPreview[];
  connectedGmailAccounts: number;
  loading?: boolean;
};

export function DashboardWidgets({
  todaysMeetings,
  automations,
  connectedGmailAccounts,
  loading = false,
}: DashboardWidgetsProps) {
  const gmailHealthy = connectedGmailAccounts > 0;
  const { connected: calendarConnected } = useCalendarAccount();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 lg:mb-10">
      <WidgetCard title="Today's Schedule" delay={0}>
        <TodaysScheduleWidget
          todaysMeetings={todaysMeetings}
          loading={loading}
        />
      </WidgetCard>

      <WidgetCard title="Recent AI Activity" delay={0.05}>
        <CompactEmptyState
          icon={Bot}
          title="No AI activity yet"
          description="Generate inbox replies or chat with Roxx AI to see activity here."
          cta={{ label: "Open Roxx AI", href: "/dashboard" }}
          className="border-0 bg-transparent py-6"
        />
      </WidgetCard>

      <WidgetCard title="Automation Status" delay={0.1}>
        {loading ? (
          <SkeletonListRows rows={3} />
        ) : automations.length === 0 ? (
          <CompactEmptyState
            icon={Workflow}
            title="No automations yet"
            description="Build workflows to automate inbox, CRM, and follow-ups."
            cta={{ label: "Create automation", href: "/dashboard/automations" }}
            className="border-0 bg-transparent py-6"
          />
        ) : (
          <ul className="space-y-3">
            {automations.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{item.name}</p>
                  <p className={`text-xs ${dashboard.subtle}`}>
                    {item.runsToday} run{item.runsToday === 1 ? "" : "s"} today
                  </p>
                </div>
                <StatusPill status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard title="System Health" delay={0.15}>
        <ul className="space-y-3">
          <li className="flex items-center justify-between gap-2">
            <span className={`text-sm ${dashboard.muted}`}>Gmail</span>
            <HealthDot
              status={gmailHealthy ? "healthy" : "degraded"}
              label={
                gmailHealthy
                  ? `${connectedGmailAccounts} connected`
                  : "Not connected"
              }
            />
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className={`text-sm ${dashboard.muted}`}>Calendar</span>
            <HealthDot
              status={calendarConnected ? "healthy" : "degraded"}
              label={calendarConnected ? "Synced" : "Not connected"}
            />
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className={`text-sm ${dashboard.muted}`}>AI Gateway</span>
            <HealthDot status="healthy" label="Ready" />
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className={`text-sm ${dashboard.muted}`}>Database</span>
            <HealthDot status="healthy" label="Connected" />
          </li>
        </ul>
      </WidgetCard>
    </div>
  );
}

function WidgetCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={`${dashboard.cardBase} ${dashboard.cardHover} p-5`}
    >
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

function StatusPill({ status }: { status: string }) {
  const active = status === "active" || status === "published";
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
        active
          ? "bg-[#3B82F6]/15 text-[#93C5FD] border-[#3B82F6]/30"
          : "bg-[#111111] text-[#71717A] border-white/[0.06]"
      }`}
    >
      {status}
    </span>
  );
}

function HealthDot({
  status,
  label,
}: {
  status: "healthy" | "degraded";
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "healthy" ? "bg-[#3B82F6]" : "bg-[#64748B] animate-pulse"
        }`}
      />
      <span className={status === "healthy" ? "text-[#93C5FD]" : "text-[#A1A1AA]"}>
        {label}
      </span>
    </span>
  );
}
