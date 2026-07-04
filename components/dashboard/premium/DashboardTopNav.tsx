"use client";

import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { motion } from "framer-motion";

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
  const { subscription, loading } = usePlanGate();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-[#1E293B] bg-[#050816]/80 backdrop-blur-2xl">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl border border-[#1E293B] text-[#2563EB] hover:bg-[#2563EB]/5"
        aria-label="Open menu"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      <div className="flex-1 max-w-xl relative hidden sm:block">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search emails, contacts, deals…"
          className="w-full pl-11 pr-4 py-2.5 rounded-[14px] bg-[#111827]/80 border border-[#1E293B] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#1E293B] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/25"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-300">AI Online</span>
        </motion.div>

        <button
          type="button"
          className="relative p-2 rounded-xl border border-[#1E293B] text-gray-400 hover:text-white hover:border-[#1E293B] transition-colors"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB]" />
        </button>

        <CurrentPlanBadge subscription={subscription} loading={loading} compact />

        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-xs font-bold text-white">
          T
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
