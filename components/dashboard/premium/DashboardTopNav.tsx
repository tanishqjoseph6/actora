"use client";

import { useSession } from "next-auth/react";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "./dashboard-tokens";

type DashboardTopNavProps = {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export function DashboardTopNav({
  onMenuClick,
  searchQuery,
  onSearchChange,
}: DashboardTopNavProps) {
  const { data: session } = useSession();
  const { subscription, loading } = usePlanGate();
  const initial =
    session?.user?.name?.charAt(0) ??
    session?.user?.email?.charAt(0) ??
    "U";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-[#1E293B] bg-[#05070B]/95 backdrop-blur-xl min-w-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#2563EB]/40 transition-colors interactive-press"
        aria-label="Open menu"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0 max-w-xl relative hidden md:block">
        <SearchIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dashboard.subtle}`} />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search emails, contacts, deals…"
          className={`${dashboard.input} pl-10 pr-4 py-2.5`}
        />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 ml-auto shrink-0">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/25">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
          <span className="text-xs font-medium text-[#93C5FD]">AI online</span>
        </div>

        <button
          type="button"
          className="hidden sm:flex relative p-2 rounded-xl border border-[#1E293B] text-[#64748B] hover:text-white hover:border-[#2563EB]/40 transition-colors interactive-press"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB]" />
        </button>

        <div className="hidden sm:block shrink-0">
          <CurrentPlanBadge subscription={subscription} loading={loading} compact />
        </div>

        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-xs font-bold text-white uppercase">
          {initial}
        </div>
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
