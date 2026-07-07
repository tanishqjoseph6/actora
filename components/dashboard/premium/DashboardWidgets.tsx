"use client";

import { motion } from "framer-motion";
import type {
  DashboardAutomationPreview,
  DashboardMeetingPreview,
} from "@/lib/dashboard/types";
import { SkeletonListRows } from "@/components/ui/Skeleton";
import { dashboard } from "./dashboard-tokens";

type DashboardWidgetsProps = {
  todaysMeetings: DashboardMeetingPreview[];
  automations: DashboardAutomationPreview[];
  connectedGmailAccounts: number;
  loading?: boolean;
};

function formatMeetingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function DashboardWidgets({
  todaysMeetings,
  automations,
  connectedGmailAccounts,
  loading = false,
}: DashboardWidgetsProps) {
  const gmailHealthy = connectedGmailAccounts > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 lg:mb-10">
      <WidgetCard title="Today's Schedule" delay={0}>
        {loading ? (
          <SkeletonListRows rows={3} />
        ) : todaysMeetings.length === 0 ? (
          <EmptyState message="No meetings scheduled today." />
        ) : (
          <ul className="space-y-3">
            {todaysMeetings.map((item) => (
              <li key={item.id} className="flex items-start gap-3 group">
                <span className="text-xs font-mono text-[#2563EB] tabular-nums shrink-0 pt-0.5">
                  {formatMeetingTime(item.startsAt)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate group-hover:text-[#93C5FD] transition-colors">
                    {item.title}
                  </p>
                  <span className={`text-[10px] uppercase tracking-wide ${dashboard.subtle}`}>
                    {item.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard title="Recent AI Activity" delay={0.05}>
        <EmptyState message="AI activity will appear here after you generate replies." />
      </WidgetCard>

      <WidgetCard title="Automation Status" delay={0.1}>
        {loading ? (
          <SkeletonListRows rows={3} />
        ) : automations.length === 0 ? (
          <EmptyState message="No automations yet." />
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

function EmptyState({ message }: { message: string }) {
  return <p className={`text-sm ${dashboard.subtle}`}>{message}</p>;
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
          ? "bg-[#2563EB]/15 text-[#93C5FD] border-[#2563EB]/30"
          : "bg-[#111827] text-[#64748B] border-[#1E293B]"
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
          status === "healthy" ? "bg-[#2563EB]" : "bg-[#64748B] animate-pulse"
        }`}
      />
      <span className={status === "healthy" ? "text-[#93C5FD]" : "text-[#94A3B8]"}>
        {label}
      </span>
    </span>
  );
}
