"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCached,
  getCachedData,
} from "@/lib/client-data/query-cache";
import {
  EMPTY_DASHBOARD_DATA,
  type DashboardData,
} from "@/lib/dashboard/types";

const CACHE_KEY = "dashboard_stats";
const CACHE_TTL_MS = 5 * 60_000;

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData>(() => {
    return (
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

      setData(json);
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
