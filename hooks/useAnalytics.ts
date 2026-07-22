"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCached,
  getCachedData,
  invalidateCachedPrefix,
} from "@/lib/client-data/query-cache";
import type {
  AnalyticsFilters,
  AnalyticsPeriod,
  AnalyticsSnapshot,
} from "@/lib/analytics/types";

const CACHE_PREFIX = "analytics_summary";
const CACHE_TTL_MS = 5 * 60_000;

function cacheKey(filters: AnalyticsFilters): string {
  return `${CACHE_PREFIX}:${filters.period}:${filters.workspace}:${filters.member}`;
}

const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
  period: "7d",
  generatedAt: new Date().toISOString(),
  overview: {
    emailsProcessed: 0,
    aiRepliesGenerated: 0,
    emailsSavedByAi: 0,
    contacts: 0,
    companies: 0,
    deals: 0,
    meetings: 0,
    tasks: 0,
    activeAutomations: 0,
    roxxConversations: 0,
    aiTimeSavedHours: 0,
    workspaceHealthScore: 0,
    healthRating: "needs_attention",
  },
  email: {
    emailsReceived: [],
    emailsReplied: [],
    aiRepliesVsManual: [],
    avgResponseTimeHours: 0,
    inboxZeroProgress: 0,
    priorityEmailPercent: 0,
    topCategories: [],
    hasData: false,
  },
  crm: {
    contactsGrowth: [],
    companiesGrowth: [],
    dealsCreated: [],
    dealsWon: 0,
    dealsLost: 0,
    pipelineValue: 0,
    conversionRate: 0,
    winRate: 0,
    avgDealSize: 0,
    pipelineByStage: [],
    hasData: false,
  },
  calendar: {
    meetingsThisWeek: 0,
    meetingsThisMonth: 0,
    hoursInMeetings: 0,
    upcomingMeetings: 0,
    completionRate: 0,
    meetingsTrend: [],
    hasData: false,
  },
  tasks: {
    completed: 0,
    pending: 0,
    overdue: 0,
    productivityTrend: [],
    hasData: false,
  },
  automations: {
    executed: 0,
    successful: 0,
    failed: 0,
    timeSavedHours: 0,
    mostUsed: null,
    runsTrend: [],
    hasData: false,
  },
  roxx: {
    totalConversations: 0,
    messagesSent: 0,
    avgResponseTimeSec: 0,
    actionsCompleted: 0,
    topPrompts: [],
    successRate: 0,
    usageTrend: [],
    hasData: false,
  },
  productivity: {
    inboxZero: 0,
    crmActivity: 0,
    tasksCompleted: 0,
    meetingsAttended: 0,
    automationUsage: 0,
    roxxUsage: 0,
  },
  recentActivity: [],
  hasAnyData: false,
};

export function useAnalytics(initialPeriod: AnalyticsPeriod = "7d") {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: initialPeriod,
    workspace: "my",
    member: "me",
  });
  const key = cacheKey(filters);

  const [data, setData] = useState<AnalyticsSnapshot>(() => {
    return getCachedData<AnalyticsSnapshot>(key, CACHE_TTL_MS) ?? EMPTY_SNAPSHOT;
  });
  const [loading, setLoading] = useState(
    () => !getCachedData<AnalyticsSnapshot>(key, CACHE_TTL_MS)
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (force = false) => {
      const cached = getCachedData<AnalyticsSnapshot>(key, CACHE_TTL_MS);
      if (cached) {
        setData(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const json = await fetchCached(
          key,
          async () => {
            const params = new URLSearchParams({ period: filters.period });
            const res = await fetch(`/api/analytics/summary?${params}`);
            const body = (await res.json()) as AnalyticsSnapshot & {
              error?: string;
            };
            if (!res.ok) {
              throw new Error(body.error ?? "Could not load analytics.");
            }
            return body;
          },
          { ttlMs: CACHE_TTL_MS, force: force || Boolean(cached) }
        );
        setData(json);
      } catch (err) {
        if (!cached) setData({ ...EMPTY_SNAPSHOT, period: filters.period });
        setError(
          err instanceof Error ? err.message : "Could not load analytics."
        );
      } finally {
        setLoading(false);
      }
    },
    [filters.period, key]
  );

  useEffect(() => {
    queueMicrotask(() => {
      void refresh(false);
    });
  }, [refresh]);

  const setPeriod = useCallback((period: AnalyticsPeriod) => {
    setFilters((prev) => ({ ...prev, period }));
  }, []);

  const invalidateAll = useCallback(() => {
    invalidateCachedPrefix(CACHE_PREFIX);
  }, []);

  return {
    snapshot: data,
    filters,
    setPeriod,
    setFilters,
    loading,
    error,
    refresh: () => {
      invalidateAll();
      return refresh(true);
    },
  };
}
