"use client";

import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";

type MobileDashboardHeaderProps = {
  title?: string;
  onMenuClick: () => void;
};

export function MobileDashboardHeader({
  title = "Actora",
  onMenuClick,
}: MobileDashboardHeaderProps) {
  const { subscription, loading } = usePlanGate();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-[#1E293B] bg-[#05070B]/95 backdrop-blur-xl min-w-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 rounded-xl border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#2563EB]/40 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <MenuIcon className="w-5 h-5" />
      </button>
      <span className="text-base sm:text-lg font-bold text-white truncate min-w-0">
        {title}
      </span>
      <div className="shrink-0 max-w-[140px] sm:max-w-none overflow-hidden">
        <CurrentPlanBadge subscription={subscription} loading={loading} compact />
      </div>
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
