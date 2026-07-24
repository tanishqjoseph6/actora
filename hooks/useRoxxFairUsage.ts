"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RoxxFairUsageStatus } from "@/lib/assistant/fair-usage/types";

const DEFAULT_STATUS: RoxxFairUsageStatus = {
  allowed: true,
  inCooldown: false,
  unlimited: false,
  planId: "free",
  planName: "Free",
  upgradePlan: "pro",
  sessionStartedAt: null,
  lastActivityAt: null,
  continuousSecondsUsed: 0,
  continuousLimitSeconds: 900,
  cooldownEndsAt: null,
  cooldownRemainingSeconds: 0,
  inactivityResetSeconds: 600,
  messageCount: 0,
  totalTokens: 0,
  lastModel: null,
};

type UseRoxxFairUsageOptions = {
  enabled?: boolean;
};

export function useRoxxFairUsage(options: UseRoxxFairUsageOptions = {}) {
  const { enabled = true } = options;
  const [status, setStatus] = useState<RoxxFairUsageStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch("/api/assistant/fair-usage", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as RoxxFairUsageStatus;
      setStatus(data);
    } catch {
      /* ignore — keep last known status */
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const intervalMs = status.inCooldown ? 1000 : 15000;
    const id = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, refresh, status.inCooldown]);

  useEffect(() => {
    if (!enabled || !status.inCooldown) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [enabled, status.inCooldown]);

  const localRemaining = (() => {
    if (!status.cooldownEndsAt) return status.cooldownRemainingSeconds;
    const diff = Math.ceil(
      (new Date(status.cooldownEndsAt).getTime() - Date.now()) / 1000
    );
    return Math.max(0, diff);
  })();

  const blocked =
    !status.unlimited &&
    (status.inCooldown || localRemaining > 0 || !status.allowed);

  useEffect(() => {
    if (!blocked && status.inCooldown && localRemaining <= 0) {
      void refresh();
    }
  }, [blocked, localRemaining, refresh, status.inCooldown, tick]);

  return {
    status: {
      ...status,
      cooldownRemainingSeconds: localRemaining,
      inCooldown: localRemaining > 0 || status.inCooldown,
      allowed:
        status.unlimited || (status.allowed && localRemaining <= 0),
    },
    loading,
    blocked: status.unlimited
      ? false
      : localRemaining > 0 || status.inCooldown || !status.allowed,
    refresh,
  };
}

export function formatCooldownClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
