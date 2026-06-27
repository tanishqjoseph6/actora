"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { PlanId } from "@/lib/subscription";
import type { BillingInterval, SubscriptionSnapshot } from "@/lib/subscription";

type UseSubscriptionResult = {
  subscription: SubscriptionSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upgradePlan: (planId: PlanId, billingInterval?: BillingInterval) => Promise<boolean>;
};

export function useSubscription(): UseSubscriptionResult {
  const { data: session, update: updateSession } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const res = await fetch("/api/subscription");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load subscription");
        return;
      }

      setSubscription(data.subscription);
      await updateSession({ planId: data.subscription.planId });
    } catch {
      setError("Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, [session, updateSession]);

  useEffect(() => {
    refresh();
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
        await updateSession({ planId: data.subscription.planId });
        return true;
      } catch {
        setError("Failed to upgrade plan");
        return false;
      }
    },
    [updateSession]
  );

  return { subscription, loading, error, refresh, upgradePlan };
}
