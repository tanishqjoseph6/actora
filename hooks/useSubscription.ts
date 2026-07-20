"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getCachedData,
  setCachedData,
} from "@/lib/client-data/query-cache";
import type { PlanId } from "@/lib/subscription";
import type { BillingInterval, SubscriptionSnapshot } from "@/lib/subscription";

const CACHE_KEY = "subscription";
const CACHE_TTL_MS = 5 * 60_000;

type UseSubscriptionResult = {
  subscription: SubscriptionSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applySubscription: (snapshot: SubscriptionSnapshot) => void;
  upgradePlan: (planId: PlanId, billingInterval?: BillingInterval) => Promise<boolean>;
};

export function useSubscription(): UseSubscriptionResult {
  const { data: session, status, update: updateSession } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(
    () => getCachedData<SubscriptionSnapshot>(CACHE_KEY, CACHE_TTL_MS)
  );
  const [loading, setLoading] = useState(
    () => !getCachedData<SubscriptionSnapshot>(CACHE_KEY, CACHE_TTL_MS)
  );
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.email
    ? session.user.email.trim().toLowerCase()
    : undefined;
  const sessionPlanId = (session as { planId?: PlanId } | null)?.planId;

  const applySubscription = useCallback((snapshot: SubscriptionSnapshot) => {
    console.log("[useSubscription] applySubscription", {
      planId: snapshot.planId,
    });
    setSubscription(snapshot);
    setCachedData(CACHE_KEY, snapshot);
    setLoading(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (status === "loading") {
      return;
    }

    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setError(null);

    const cached = getCachedData<SubscriptionSnapshot>(CACHE_KEY, CACHE_TTL_MS);
    if (!cached) setLoading(true);

    try {
      const res = await fetch("/api/subscription");
      const data = await res.json();

      if (!res.ok) {
        console.error("[useSubscription] refresh failed", data.error);
        setError(data.error ?? "Failed to load subscription");
        return;
      }

      console.log("[useSubscription] refresh ok", {
        planId: data.subscription?.planId,
      });

      setSubscription(data.subscription);
      setCachedData(CACHE_KEY, data.subscription);

      if (data.subscription.planId !== sessionPlanId) {
        await updateSession({ planId: data.subscription.planId });
      }
    } catch {
      setError("Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, [status, userId, sessionPlanId, updateSession]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const upgradePlan = useCallback(
    async (planId: PlanId, billingInterval: BillingInterval = "monthly") => {
      try {
        const res = await fetch("/api/subscription", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, billingInterval }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Failed to upgrade plan");
          return false;
        }

        setSubscription(data.subscription);
        setCachedData(CACHE_KEY, data.subscription);
        await updateSession({ planId: data.subscription.planId });
        return true;
      } catch {
        setError("Failed to upgrade plan");
        return false;
      }
    },
    [updateSession]
  );

  return { subscription, loading, error, refresh, applySubscription, upgradePlan };
}
