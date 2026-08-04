"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCached,
  getCachedData,
} from "@/lib/client-data/query-cache";
import {
  EMPTY_DASHBOARD_DATA,
  type DashboardAutomationPreview,
  type DashboardData,
  type DashboardMeetingPreview,
  type DashboardContactPreview,
} from "@/lib/dashboard/types";

const CACHE_KEY = "dashboard_stats";
const CACHE_TTL_MS = 5 * 60_000;

function normalizeDashboardData(value: unknown): DashboardData {
  const input =
    value && typeof value === "object"
      ? (value as Partial<DashboardData>)
      : {};
  const rawStats =
    input.stats && typeof input.stats === "object"
      ? (input.stats as Record<string, unknown>)
      : {};

  return {
    stats: {
      emailCount: Number(rawStats.emailCount) || 0,
      connectedGmailAccounts: Number(rawStats.connectedGmailAccounts) || 0,
      automations: Number(rawStats.automations) || 0,
      activeWorkflows: Number(rawStats.activeWorkflows) || 0,
      meetings: Number(rawStats.meetings) || 0,
      crmContacts: Number(rawStats.crmContacts) || 0,
    },
    todaysMeetings: Array.isArray(input.todaysMeetings)
      ? (input.todaysMeetings as DashboardMeetingPreview[])
      : [],
    automations: Array.isArray(input.automations)
      ? (input.automations as DashboardAutomationPreview[])
      : [],
    topContacts: Array.isArray(input.topContacts)
      ? (input.topContacts as DashboardContactPreview[])
      : [],
  };
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData>(() => {
    return normalizeDashboardData(
      getCachedData<DashboardData>(CACHE_KEY, CACHE_TTL_MS) ??
        EMPTY_DASHBOARD_DATA
    );
  });
  const [loading, setLoading] = useState(
    () => !getCachedData<DashboardData>(CACHE_KEY, CACHE_TTL_MS)
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    const cached = getCachedData<DashboardData>(CACHE_KEY, CACHE_TTL_MS);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const json = await fetchCached(
        CACHE_KEY,
        async () => {
          const res = await fetch("/api/dashboard/stats");
          const body = (await res.json()) as DashboardData & { error?: string };
          if (!res.ok) {
            throw new Error(body.error ?? "Could not load dashboard stats.");
          }
          return body;
        },
        { ttlMs: CACHE_TTL_MS, force: force || Boolean(cached) }
      );

      setData(normalizeDashboardData(json));
    } catch (err) {
      if (!cached) setData(EMPTY_DASHBOARD_DATA);
      setError(
        err instanceof Error ? err.message : "Could not load dashboard stats."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh(false);
    });
  }, [refresh]);

  return {
    stats: data.stats,
    todaysMeetings: data.todaysMeetings,
    automations: data.automations,
    topContacts: data.topContacts,
    loading,
    error,
    refresh: () => refresh(true),
  };
}
