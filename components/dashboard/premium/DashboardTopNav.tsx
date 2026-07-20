"use client";

import { useSession } from "next-auth/react";
import {
  Bell,
  ChevronsUpDown,
  Menu,
  Search,
} from "lucide-react";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "./dashboard-tokens";

type DashboardTopNavProps = {
  onMenuClick: () => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  title?: string;
};

export function DashboardTopNav({
  onMenuClick,
  searchQuery = "",
  onSearchChange,
  title,
}: DashboardTopNavProps) {
  const { data: session } = useSession();
  const { subscription, loading } = usePlanGate();
  const initial =
    session?.user?.name?.charAt(0) ??
    session?.user?.email?.charAt(0) ??
    "U";
  const workspaceLabel =
    session?.user?.email?.split("@")[1]?.split(".")[0] ?? "Workspace";

  return (
    <header className="sticky top-0 z-30 flex min-w-0 items-center gap-2 border-b border-white/[0.06] bg-[#0A0A0A]/85 px-4 py-3 backdrop-blur-xl sm:gap-3 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/35 hover:text-white lg:hidden interactive-press"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {title && (
        <p className="truncate text-sm font-medium text-white md:hidden">
          {title}
        </p>
      )}

      <div className="relative hidden min-w-0 max-w-xl flex-1 md:block">
        <Search
          className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${dashboard.subtle}`}
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search emails, contacts, deals…"
          className={`${dashboard.input} py-2.5 pl-10 pr-4`}
          readOnly={!onSearchChange}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111111] px-3 py-2 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/30 hover:text-white sm:inline-flex"
          aria-label="Workspace switcher"
        >
          <span className="max-w-[120px] truncate capitalize">
            {workspaceLabel}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-[#71717A]" />
        </button>

        <button
          type="button"
          className="relative hidden rounded-xl border border-white/[0.08] p-2 text-[#71717A] transition-colors hover:border-[#3B82F6]/35 hover:text-white sm:flex interactive-press"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#3B82F6]" />
        </button>

        <div className="hidden shrink-0 sm:block">
          <CurrentPlanBadge
            subscription={subscription}
            loading={loading}
            compact
          />
        </div>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6] text-xs font-semibold uppercase text-white"
          title={session?.user?.email ?? "Profile"}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
