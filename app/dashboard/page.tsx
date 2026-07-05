"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxEmail } from "@/lib/gmail";
import { EmailDetailPanel } from "@/components/email/EmailDetailPanel";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { formatLimit } from "@/lib/subscription";
import { PremiumDashboardShell } from "@/components/dashboard/premium/PremiumDashboardShell";
import { DashboardHero } from "@/components/dashboard/premium/DashboardHero";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { DashboardWidgets } from "@/components/dashboard/premium/DashboardWidgets";
import { DashboardInboxSection } from "@/components/dashboard/premium/DashboardInboxSection";
import { CrmPreviewSection } from "@/components/dashboard/premium/CrmPreviewSection";
import { MOCK_PIPELINE_DEALS } from "@/lib/crm/pipeline";

type FetchState = "loading" | "error" | "success";
type FilterChip = "all" | "unread" | "starred";

export default function Dashboard() {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [openAiReply, setOpenAiReply] = useState(false);
  const { subscription } = usePlanGate();

  const aiActionsDisplay = useMemo(() => {
    if (!subscription) return "—";
    const { aiActionsUsed } = subscription.usage;
    const limit = formatLimit(subscription.limits.aiActionsPerMonth);
    return `${aiActionsUsed}/${limit}`;
  }, [subscription]);

  const pipelineValue = useMemo(
    () => MOCK_PIPELINE_DEALS.reduce((sum, d) => sum + d.value, 0),
    []
  );

  const formatRevenue = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value}`;
  };

  const loadEmails = useCallback(async (silent = false) => {
    if (!silent) {
      setFetchState("loading");
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const res = await fetch("/api/gmail");
      const data = await res.json();

      if (!res.ok) {
        if (!silent) {
          setFetchState("error");
          setError(data.error ?? "Failed to load emails");
          setEmails([]);
          setUnreadCount(0);
        }
        return;
      }

      setEmails(data.emails ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setFetchState("success");
    } catch {
      if (!silent) {
        setFetchState("error");
        setError("Failed to load emails. Check your connection and try again.");
        setEmails([]);
        setUnreadCount(0);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmails();

    const interval = setInterval(() => {
      loadEmails(true);
    }, 60_000);

    return () => clearInterval(interval);
  }, [loadEmails]);

  const filteredEmails = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return emails.filter((email) => {
      if (activeFilter === "unread" && !email.unread) return false;
      if (activeFilter === "starred" && !email.starred) return false;

      if (!query) return true;

      return (
        email.sender.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.preview.toLowerCase().includes(query)
      );
    });
  }, [emails, searchQuery, activeFilter]);

  const starredCount = useMemo(
    () => emails.filter((email) => email.starred).length,
    [emails]
  );

  return (
    <>
      <PremiumDashboardShell
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <DashboardHero />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 lg:gap-4 mb-8 lg:mb-10">
          <PremiumMetricCard
            title="Emails"
            value={fetchState === "loading" ? "—" : emails.length}
            trend={12}
            sparkline={[4, 6, 5, 8, 7, 9, 10]}
            delay={0}
          />
          <PremiumMetricCard title="AI Replies" value={0} trend={8} delay={0.03} />
          <PremiumMetricCard title="Tasks" value={0} trend={-2} sparkline={[2, 3, 2, 4, 3, 2, 3]} delay={0.06} />
          <PremiumMetricCard title="Meetings" value={3} trend={5} delay={0.09} />
          <PremiumMetricCard
            title="Revenue"
            value={formatRevenue(pipelineValue)}
            trend={14}
            sparkline={[42, 48, 45, 58, 62, 71, 84]}
            delay={0.12}
          />
          <PremiumMetricCard
            title="CRM Deals"
            value={MOCK_PIPELINE_DEALS.length}
            trend={6}
            delay={0.15}
          />
          <PremiumMetricCard
            title="AI Usage"
            value={aiActionsDisplay}
            trend={18}
            delay={0.18}
          />
          <PremiumMetricCard title="Automation Runs" value={39} trend={22} delay={0.21} />
        </div>

        <DashboardWidgets />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
          <DashboardInboxSection
            fetchState={fetchState}
            error={error}
            isRefreshing={isRefreshing}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            emails={emails}
            filteredEmails={filteredEmails}
            unreadCount={unreadCount}
            starredCount={starredCount}
            selectedEmailId={selectedEmail?.id ?? null}
            onSelectEmail={setSelectedEmail}
            onAiReply={(target) => {
              setSelectedEmail(target);
              setOpenAiReply(true);
            }}
            onRetry={() => loadEmails()}
          />
          <CrmPreviewSection />
        </div>
      </PremiumDashboardShell>

      {selectedEmail && (
        <EmailDetailPanel
          email={selectedEmail}
          onClose={() => {
            setSelectedEmail(null);
            setOpenAiReply(false);
          }}
          openAiReply={openAiReply}
          onAiReplyOpened={() => setOpenAiReply(false)}
        />
      )}
    </>
  );
}
