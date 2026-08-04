"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { DashboardHero } from "@/components/dashboard/premium/DashboardHero";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { DashboardWidgets } from "@/components/dashboard/premium/DashboardWidgets";
import { CrmPreviewSection } from "@/components/dashboard/premium/CrmPreviewSection";
import { RetryErrorState } from "@/components/ui/RetryErrorState";
import { InboxContentSkeleton } from "@/components/email/InboxContentSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import {
  AiCreditsCard,
  AiCreditWarningBanner,
} from "@/components/subscription/AiCreditsCard";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { ApiUsageCard } from "@/components/developers/ApiUsageCard";
import { WorkspaceUsageGrid } from "@/components/usage/WorkspaceUsageGrid";
import { ComponentErrorBoundary } from "@/components/ui/ComponentErrorBoundary";

const AiAssistantPanel = dynamic(
  () =>
    import("@/components/dashboard/premium/AiAssistantPanel").then(
      (m) => m.AiAssistantPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className={`${dashboard.cardLg} mb-8 overflow-hidden lg:mb-10`}
        style={{ minHeight: 320 }}
        aria-busy="true"
      >
        <div className="border-b border-white/[0.06] p-4 sm:p-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex h-[min(420px,58dvh)] min-h-[280px] flex-col p-4 sm:h-[min(520px,70vh)] sm:min-h-[400px] sm:p-5">
          <Skeleton className="h-20 w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-36" />
          </div>
          <div className="mt-auto">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    ),
  }
);

const InboxView = dynamic(
  () => import("@/components/email/InboxView").then((m) => m.InboxView),
  {
    ssr: false,
    loading: () => <InboxContentSkeleton compact />,
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
  const { subscription, loading: planLoading } = usePlanGate();

  const emailCountDisplay = useMemo(() => {
    if (statsLoading) return "—";
    return stats.emailCount;
  }, [stats.emailCount, statsLoading]);

  return (
    <>
      <ComponentErrorBoundary name="DashboardHero">
        <DashboardHero />
      </ComponentErrorBoundary>
      <ComponentErrorBoundary name="AiCreditWarningBanner">
        <AiCreditWarningBanner subscription={subscription} />
      </ComponentErrorBoundary>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ComponentErrorBoundary name="AiCreditsCard">
          <AiCreditsCard
            subscription={subscription}
            loading={planLoading}
            detailed
            className="lg:col-span-1"
          />
        </ComponentErrorBoundary>
      </div>
      <ComponentErrorBoundary name="ApiUsageCard">
        <div className="mb-8">
          <ApiUsageCard />
        </div>
      </ComponentErrorBoundary>
      <ComponentErrorBoundary name="WorkspaceUsageGrid">
        <div className="mb-8">
          <WorkspaceUsageGrid />
        </div>
      </ComponentErrorBoundary>
      <ComponentErrorBoundary name="AiAssistantPanel">
        <AiAssistantPanel />
      </ComponentErrorBoundary>

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

      <ComponentErrorBoundary name="DashboardWidgets">
        <DashboardWidgets
          todaysMeetings={todaysMeetings}
          automations={automations}
          connectedGmailAccounts={stats.connectedGmailAccounts}
          loading={statsLoading}
        />
      </ComponentErrorBoundary>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
        <ComponentErrorBoundary name="InboxView">
          <InboxView compact />
        </ComponentErrorBoundary>
        <ComponentErrorBoundary name="CrmPreviewSection">
          <CrmPreviewSection
            contacts={topContacts}
            contactCount={stats.crmContacts}
            loading={statsLoading}
          />
        </ComponentErrorBoundary>
      </div>
    </>
  );
}
