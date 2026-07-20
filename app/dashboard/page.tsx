"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { DashboardHero } from "@/components/dashboard/premium/DashboardHero";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { DashboardWidgets } from "@/components/dashboard/premium/DashboardWidgets";
import { CrmPreviewSection } from "@/components/dashboard/premium/CrmPreviewSection";
import { RetryErrorState } from "@/components/ui/RetryErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

const AiAssistantPanel = dynamic(
  () =>
    import("@/components/dashboard/premium/AiAssistantPanel").then(
      (m) => m.AiAssistantPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className={`${dashboard.cardLg} mb-8 p-5 sm:p-6 lg:mb-10 lg:p-7`}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-20 w-full" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
    ),
  }
);

const InboxView = dynamic(
  () => import("@/components/email/InboxView").then((m) => m.InboxView),
  {
    ssr: false,
    loading: () => (
      <div className={`${dashboard.cardLg} p-5`}>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    ),
  }
);

export default function Dashboard() {
  const {
    stats,
    todaysMeetings,
    automations,
    topContacts,
    loading: statsLoading,
    error: statsError,
    refresh,
  } = useDashboardStats();

  const emailCountDisplay = useMemo(() => {
    if (statsLoading) return "—";
    return stats.emailCount;
  }, [stats.emailCount, statsLoading]);

  return (
    <>
      <DashboardHero />
      <AiAssistantPanel />

      {statsError && !statsLoading && (
        <div className="mb-6">
          <RetryErrorState
            title="Could not load dashboard stats"
            error={statsError}
            onRetry={() => void refresh()}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:mb-10 xl:grid-cols-6 lg:gap-4">
        <PremiumMetricCard
          title="Emails"
          value={emailCountDisplay}
          loading={statsLoading}
          delay={0}
        />
        <PremiumMetricCard
          title="Gmail Accounts"
          value={statsLoading ? "—" : stats.connectedGmailAccounts}
          loading={statsLoading}
          delay={0.03}
        />
        <PremiumMetricCard
          title="CRM Contacts"
          value={statsLoading ? "—" : stats.crmContacts}
          loading={statsLoading}
          delay={0.06}
        />
        <PremiumMetricCard
          title="Meetings"
          value={statsLoading ? "—" : stats.meetings}
          loading={statsLoading}
          delay={0.09}
        />
        <PremiumMetricCard
          title="Automations"
          value={statsLoading ? "—" : stats.automations}
          loading={statsLoading}
          delay={0.12}
        />
        <PremiumMetricCard
          title="Active Workflows"
          value={statsLoading ? "—" : stats.activeWorkflows}
          loading={statsLoading}
          delay={0.15}
        />
      </div>

      <DashboardWidgets
        todaysMeetings={todaysMeetings}
        automations={automations}
        connectedGmailAccounts={stats.connectedGmailAccounts}
        loading={statsLoading}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
        <InboxView compact />
        <CrmPreviewSection
          contacts={topContacts}
          contactCount={stats.crmContacts}
          loading={statsLoading}
        />
      </div>
    </>
  );
}
