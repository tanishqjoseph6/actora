"use client";

import { useMemo } from "react";
import { PremiumDashboardShell } from "@/components/dashboard/premium/PremiumDashboardShell";
import { DashboardHero } from "@/components/dashboard/premium/DashboardHero";
import { AiAssistantPanel } from "@/components/dashboard/premium/AiAssistantPanel";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { DashboardWidgets } from "@/components/dashboard/premium/DashboardWidgets";
import { InboxView } from "@/components/email/InboxView";
import { CrmPreviewSection } from "@/components/dashboard/premium/CrmPreviewSection";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function Dashboard() {
  const {
    stats,
    todaysMeetings,
    automations,
    topContacts,
    loading: statsLoading,
  } = useDashboardStats();

  const emailCountDisplay = useMemo(() => {
    if (statsLoading) return "—";
    return stats.emailCount;
  }, [stats.emailCount, statsLoading]);

  return (
    <PremiumDashboardShell showTopNav>
      <DashboardHero />
      <AiAssistantPanel />

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
    </PremiumDashboardShell>
  );
}
