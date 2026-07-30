"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";

type AdminStats = {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  referralProfiles: number;
  successfulReferrals: number;
  pendingReferrals: number;
  referralConversionRate: number;
  workspaces: number;
  teamWorkspaces: number;
  achievementsUnlocked: number;
  onboardingEmailsSent: number;
};

export default function AdminGrowthPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/growth", { credentials: "include" });
        const data = (await res.json()) as { stats?: AdminStats; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Forbidden");
          return;
        }
        setStats(data.stats ?? null);
      } catch {
        setError("Failed to load admin stats.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = stats
    ? [
        { label: "Total users", value: stats.totalUsers },
        { label: "Active (7d)", value: stats.activeUsers7d },
        { label: "Active (30d)", value: stats.activeUsers30d },
        { label: "Referral conversion", value: `${stats.referralConversionRate}%` },
        { label: "Successful referrals", value: stats.successfulReferrals },
        { label: "Pending referrals", value: stats.pendingReferrals },
        { label: "Workspaces", value: stats.workspaces },
        { label: "Team workspaces", value: stats.teamWorkspaces },
        { label: "Achievements unlocked", value: stats.achievementsUnlocked },
        { label: "Onboarding emails sent", value: stats.onboardingEmailsSent },
      ]
    : [];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-[#71717A]">Admin</p>
        <h1 className={dashboard.pageTitle}>Growth analytics</h1>
        <p className={`${dashboard.muted} mt-2 max-w-xl text-sm`}>
          Users, retention signals, referral conversion, and workspace growth.
        </p>
      </div>

      {loading && <Skeleton className="h-48 w-full rounded-2xl" />}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-sm text-red-200">
          {error}
          <p className="mt-2 text-xs text-red-200/70">
            Set ADMIN_EMAILS in your environment to grant access.
          </p>
        </div>
      )}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-4`}
            >
              <p className={`text-xs ${dashboard.subtle}`}>{card.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
