"use client";

import { motion } from "framer-motion";
import { dashboard } from "./dashboard-tokens";

const SCHEDULE = [
  { time: "10:00", title: "Investor sync", tag: "Meeting" },
  { time: "14:30", title: "Product review", tag: "Internal" },
  { time: "16:00", title: "Enterprise demo", tag: "Sales" },
];

const AI_ACTIVITY = [
  { action: "Drafted reply", target: "Acme Corp", ago: "2m ago" },
  { action: "Scored lead", target: "Nova Systems", ago: "18m ago" },
  { action: "Summarized thread", target: "Partnership inquiry", ago: "1h ago" },
];

const AUTOMATIONS = [
  { name: "Lead routing", status: "active" as const, runs: 24 },
  { name: "Follow-up sequences", status: "active" as const, runs: 12 },
  { name: "Meeting prep", status: "paused" as const, runs: 3 },
];

const SYSTEM_HEALTH = [
  { label: "Gmail API", status: "healthy" as const },
  { label: "AI Gateway", status: "healthy" as const },
  { label: "CRM Sync", status: "healthy" as const },
  { label: "Webhooks", status: "degraded" as const },
];

export function DashboardWidgets() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 lg:mb-10">
      <WidgetCard title="Today's Schedule" delay={0}>
        <ul className="space-y-3">
          {SCHEDULE.map((item) => (
            <li key={item.title} className="flex items-start gap-3 group">
              <span className="text-xs font-mono text-[#2563EB] tabular-nums shrink-0 pt-0.5">
                {item.time}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate group-hover:text-[#93C5FD] transition-colors">
                  {item.title}
                </p>
                <span className={`text-[10px] uppercase tracking-wide ${dashboard.subtle}`}>
                  {item.tag}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </WidgetCard>

      <WidgetCard title="Recent AI Activity" delay={0.05}>
        <ul className="space-y-3">
          {AI_ACTIVITY.map((item) => (
            <li key={item.target + item.ago} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-white truncate">
                  <span className="text-[#3B82F6]">{item.action}</span>
                </p>
                <p className={`text-xs truncate ${dashboard.subtle}`}>{item.target}</p>
              </div>
              <span className={`text-[10px] shrink-0 ${dashboard.subtle}`}>{item.ago}</span>
            </li>
          ))}
        </ul>
      </WidgetCard>

      <WidgetCard title="Automation Status" delay={0.1}>
        <ul className="space-y-3">
          {AUTOMATIONS.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{item.name}</p>
                <p className={`text-xs ${dashboard.subtle}`}>{item.runs} runs today</p>
              </div>
              <StatusPill status={item.status} />
            </li>
          ))}
        </ul>
      </WidgetCard>

      <WidgetCard title="System Health" delay={0.15}>
        <ul className="space-y-3">
          {SYSTEM_HEALTH.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-2">
              <span className={`text-sm ${dashboard.muted}`}>{item.label}</span>
              <HealthDot status={item.status} />
            </li>
          ))}
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

function StatusPill({ status }: { status: "active" | "paused" }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
        status === "active"
          ? "bg-[#2563EB]/15 text-[#93C5FD] border-[#2563EB]/30"
          : "bg-[#111827] text-[#64748B] border-[#1E293B]"
      }`}
    >
      {status}
    </span>
  );
}

function HealthDot({ status }: { status: "healthy" | "degraded" }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "healthy" ? "bg-[#2563EB]" : "bg-[#64748B] animate-pulse"
        }`}
      />
      <span className={status === "healthy" ? "text-[#93C5FD]" : "text-[#94A3B8]"}>
        {status === "healthy" ? "Healthy" : "Degraded"}
      </span>
    </span>
  );
}
