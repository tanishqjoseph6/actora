"use client";

import { memo, useState } from "react";
import { Menu } from "lucide-react";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { GmailAccountSwitcher } from "@/components/dashboard/nav/GmailAccountSwitcher";
import { NotificationsPanel } from "@/components/dashboard/nav/NotificationsPanel";
import { UserProfileMenu } from "@/components/dashboard/nav/UserProfileMenu";
import { RoxxCommandTrigger } from "@/components/dashboard/ai/GlobalAiCommandPalette";
import { TrialUpgradeModal } from "@/components/dashboard/nav/TrialUpgradeModal";
import { useRoxx } from "@/providers/RoxxProvider";
import { Sparkles } from "lucide-react";

type DashboardTopNavProps = {
  onMenuClick: () => void;
  title?: string;
};

export const DashboardTopNav = memo(function DashboardTopNav({
  onMenuClick,
  title,
}: DashboardTopNavProps) {
  const { subscription, loading } = usePlanGate();
  const { openCopilot } = useRoxx();
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

        <RoxxCommandTrigger />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => openCopilot()}
            className="hidden rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/10 p-2 text-[#93C5FD] transition-colors hover:border-[#3B82F6]/45 sm:inline-flex interactive-press"
            aria-label="Open Roxx AI copilot"
            title="Roxx AI (⌘J)"
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </button>
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
});
