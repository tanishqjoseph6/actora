"use client";

import { motion } from "framer-motion";
import type { AutomationView } from "@/lib/automations/types";

const NAV_ITEMS: {
  id: AutomationView;
  label: string;
  icon: string;
  disabled?: boolean;
}[] = [
  { id: "templates", label: "Automation Templates", icon: "📋" },
  { id: "my-automations", label: "My Automations", icon: "⚡" },
  { id: "drafts", label: "Drafts", icon: "📝" },
  { id: "history", label: "History", icon: "🕐" },
  { id: "marketplace", label: "Marketplace", icon: "🛒", disabled: true },
];

type AutomationNavSidebarProps = {
  activeView: AutomationView;
  onViewChange: (view: AutomationView) => void;
};

export function AutomationNavSidebar({
  activeView,
  onViewChange,
}: AutomationNavSidebarProps) {
  return (
    <aside className="w-full lg:w-56 xl:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-[#00D4FF]/10 bg-[#071426]/50 backdrop-blur-xl">
      <nav className="flex lg:flex-col gap-1 p-3 lg:p-4 overflow-x-auto lg:overflow-x-visible premium-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => !item.disabled && onViewChange(item.id)}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0
                ${item.disabled
                  ? "opacity-50 cursor-not-allowed text-gray-500"
                  : active
                    ? "bg-gradient-to-r from-[#4F8CFF]/20 to-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.1)]"
                    : "border border-transparent text-gray-400 hover:text-white hover:bg-[#0B1730]/60 hover:border-[#00D4FF]/10"
                }
              `}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
              {item.disabled && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0B1730] text-gray-500 border border-[#00D4FF]/10">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function AutomationMetricsBar({
  activeAutomations,
  todayRuns,
  successRate,
  timeSavedHours,
}: {
  activeAutomations: number;
  todayRuns: number;
  successRate: number;
  timeSavedHours: number;
}) {
  const metrics = [
    { label: "Active Automations", value: activeAutomations, trend: 2 },
    { label: "Today's Runs", value: todayRuns, trend: 14 },
    { label: "Success %", value: `${successRate}%`, trend: 0.8 },
    { label: "Time Saved", value: `${timeSavedHours} hrs`, trend: 18 },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6 lg:mb-8">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -2 }}
          className="rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl p-4 hover:border-[#00D4FF]/25 hover:shadow-[0_0_24px_rgba(0,212,255,0.06)] transition-shadow"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider">{m.label}</p>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{m.value}</p>
          <p className="text-xs text-emerald-400 mt-1">↑ {m.trend}% vs yesterday</p>
        </motion.div>
      ))}
    </div>
  );
}
