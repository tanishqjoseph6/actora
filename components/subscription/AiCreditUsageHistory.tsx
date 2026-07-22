"use client";

import { useEffect, useState } from "react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";

type HistoryEntry = {
  id: string;
  feature: string;
  featureLabel: string;
  credits: number;
  balanceAfter: number;
  user: string;
  createdAt: string;
};

export function AiCreditUsageHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      try {
        const res = await fetch("/api/ai-credits/history?limit=25");
        if (!res.ok) throw new Error("Failed to load history");
        const body = (await res.json()) as { entries: HistoryEntry[] };
        if (!cancelled) setEntries(body.entries ?? []);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`${dashboard.cardLg} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AI usage history</h3>
        <span className={`text-xs ${dashboard.subtle}`}>This cycle</span>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <p className={`text-sm ${dashboard.muted} py-6 text-center`}>
          No AI credit usage yet. Roxx AI, inbox replies, and CRM insights will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className={`border-b border-white/[0.06] text-xs ${dashboard.subtle}`}>
                <th className="pb-2 font-medium">Date & time</th>
                <th className="pb-2 font-medium">Feature</th>
                <th className="pb-2 font-medium">Credits</th>
                <th className="pb-2 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-white/[0.04] last:border-0"
                >
                  <td className="py-2.5 tabular-nums text-[#A1A1AA]">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-white">{entry.featureLabel}</td>
                  <td className="py-2.5 tabular-nums text-white">
                    −{entry.credits}
                  </td>
                  <td className="py-2.5 truncate max-w-[160px] text-[#A1A1AA]">
                    {entry.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
