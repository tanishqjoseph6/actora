"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { GmailAccountSwitcher } from "@/components/dashboard/nav/GmailAccountSwitcher";
import { NotificationsPanel } from "@/components/dashboard/nav/NotificationsPanel";
import { UserProfileMenu } from "@/components/dashboard/nav/UserProfileMenu";
import { GlobalCommandSearch } from "@/components/dashboard/nav/GlobalCommandSearch";
import { TrialUpgradeModal } from "@/components/dashboard/nav/TrialUpgradeModal";

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
  const { subscription, loading } = usePlanGate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
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

        <GlobalCommandSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <GmailAccountSwitcher />
          <NotificationsPanel />

          <div className="hidden shrink-0 sm:block">
            <CurrentPlanBadge
              subscription={subscription}
              loading={loading}
              compact
              onClick={() => setUpgradeOpen(true)}
            />
          </div>

          <UserProfileMenu />
        </div>
      </header>

      <TrialUpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        subscription={subscription}
      />
    </>
  );
}
