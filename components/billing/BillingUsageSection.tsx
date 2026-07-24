"use client";

import { useEffect, useState } from "react";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import { formatLimit } from "@/lib/subscription";
import { formatCredits, formatNextResetDate } from "@/lib/ai-credits/format";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";

type BillingUsageSectionProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
};

type UsageRow = {
  label: string;
  value: string;
};

export function BillingUsageSection({
  subscription,
  loading,
}: BillingUsageSectionProps) {
  const [requestCount, setRequestCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRequests() {
      try {
        const res = await fetch("/api/ai-credits/history?limit=100", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          entries?: Array<{ credits: number }>;
        };
        if (!cancelled) {
          const count = (body.entries ?? []).filter((e) => e.credits > 0).length;
          setRequestCount(count);
        }
      } catch {
        if (!cancelled) setRequestCount(0);
      }
    }
    void loadRequests();
    return () => {
      cancelled = true;
    };
  }, [subscription?.usage.aiActionsUsed, subscription?.usage.cycleKey]);

  if (loading || !subscription) {
    return (
      <section aria-busy="true" className="mb-10">
        <Skeleton className="mb-4 h-7 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </section>
    );
  }

  const allotment =
    subscription.usage.aiCreditsAllotment ??
    subscription.limits.aiActionsPerMonth;
  const used = subscription.usage.aiActionsUsed;
  const remaining =
    subscription.usage.aiCreditsRemaining ??
    Math.max(0, allotment - used) +
      (subscription.usage.purchasedCreditsRemaining ?? 0);
  const purchased = subscription.usage.purchasedCreditsRemaining ?? 0;
  const nextReset = formatNextResetDate(
    subscription.usage.periodEnd ?? subscription.currentPeriodEnd
  );

  const rows: UsageRow[] = [
    {
      label: "Credits used",
      value: formatCredits(used),
    },
    {
      label: "Credits remaining",
      value: Number.isFinite(remaining)
        ? formatCredits(remaining as number)
        : "Unlimited",
    },
    {
      label: "Monthly allocation",
      value: formatLimit(allotment),
    },
    {
      label: "Purchased credits",
      value: formatCredits(purchased),
    },
    {
      label: "AI requests (recent)",
      value:
        requestCount == null
          ? "…"
          : requestCount.toLocaleString("en-IN"),
    },
    {
      label: "Next reset",
      value: nextReset,
    },
  ];

  return (
    <section id="billing-usage" className="mb-10 scroll-mt-24">
      <div className="mb-5">
        <p className={`text-sm font-medium ${dashboard.accent}`}>Usage</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Credit usage
        </h2>
        <p className={`mt-1 text-sm ${dashboard.muted}`}>
          How your workspace is consuming AI credits this cycle.
        </p>
      </div>

      <div className={`${dashboard.cardLg} overflow-hidden`}>
        <dl className="divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
            >
              <dt className={`text-sm ${dashboard.muted}`}>{row.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-white">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
