"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCachedData,
  setCachedData,
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

  const refresh = useCallback(async () => {
    const cached = getCachedData<DashboardData>(CACHE_KEY, CACHE_TTL_MS);
    if (!cached) setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/stats");
      const json = (await res.json()) as DashboardData & { error?: string };

      if (!res.ok) {
        setData(EMPTY_DASHBOARD_DATA);
        setError(json.error ?? "Could not load dashboard stats.");
        return;
      }

      setData(json);
      setCachedData(CACHE_KEY, json);
    } catch {
      setData(EMPTY_DASHBOARD_DATA);
      setError("Could not load dashboard stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return {
    stats: data.stats,
    todaysMeetings: data.todaysMeetings,
    automations: data.automations,
    topContacts: data.topContacts,
    loading,
    error,
    refresh,
  };
}
