"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Gauge, KeyRound, RefreshCw, type LucideIcon } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type Usage = {
  planName: string;
  callsUsed: number;
  callsRemaining: number | null;
  monthlyLimit: number | null;
  rateLimit: number;
  nextResetAt: string;
  activeKeys: number;
};

function normalizeUsage(value: unknown): Usage | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Usage>;
  return {
    planName: typeof raw.planName === "string" ? raw.planName : "Free",
    callsUsed: Number(raw.callsUsed) || 0,
    callsRemaining:
      raw.callsRemaining === null
        ? null
        : Number(raw.callsRemaining) || 0,
    monthlyLimit:
      raw.monthlyLimit === null || raw.monthlyLimit === undefined
        ? null
        : Number(raw.monthlyLimit) || 0,
    rateLimit: Number(raw.rateLimit) || 0,
    nextResetAt:
      typeof raw.nextResetAt === "string"
        ? raw.nextResetAt
        : new Date().toISOString(),
    activeKeys: Number(raw.activeKeys) || 0,
  };
}

export function ApiUsageCard() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/developers/usage")
      .then((response) => {
        return response.json();
      })
      .then((body) => {
        if (active) setUsage(normalizeUsage(body.usage));
      })
      .catch(() => {
        if (active) setUsage(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const progress = useMemo(() => {
    if (!usage?.monthlyLimit) return 0;
    return Math.min(100, (usage.callsUsed / usage.monthlyLimit) * 100);
  }, [usage]);
  const metrics: Array<[string, string, LucideIcon]> = [
    ["API calls used", loading ? "—" : usage?.callsUsed.toLocaleString("en-IN") ?? "0", Activity],
    ["API calls remaining", loading ? "—" : usage?.callsRemaining === null ? "Unlimited" : usage?.callsRemaining.toLocaleString("en-IN") ?? "0", RefreshCw],
    ["Rate limit", loading ? "—" : `${usage?.rateLimit ?? 0}/min`, Gauge],
    ["API keys", loading ? "—" : String(usage?.activeKeys ?? 0), KeyRound],
  ];

  return (
    <div className={`${dashboard.cardLg} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="text-base font-semibold text-white">API usage</h3>
          </div>
          <p className={`mt-1 text-sm ${dashboard.muted}`}>Public API consumption for this billing cycle.</p>
        </div>
        <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-medium text-[#93C5FD]">
          {loading ? "Loading…" : usage?.planName ?? "Free"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, MetricIcon]) => {
          return (
            <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-[#0A0A0A]/60 p-3.5">
              <MetricIcon className="h-4 w-4 text-[#3B82F6]" />
              <p className="mt-2 text-xs text-[#71717A]">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-white">{String(value)}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className={dashboard.muted}>Monthly usage</span>
          <span className="text-[#71717A]">
            {usage?.monthlyLimit ? `${usage.callsUsed.toLocaleString("en-IN")} / ${usage.monthlyLimit.toLocaleString("en-IN")}` : "Unlimited"}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <p className="mt-4 text-xs text-[#71717A]">
        Next reset: {usage ? new Date(usage.nextResetAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
      </p>
    </div>
  );
}
