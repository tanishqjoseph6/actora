"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Flame, Sparkles } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";

type EngagementData = {
  badges: {
    id: string;
    title: string;
    description: string;
    category: string;
    unlocked: boolean;
    unlockedAt: string | null;
  }[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
  };
  unlockedCount: number;
  progress: {
    percent: number;
    steps: { id: string; label: string; done: boolean }[];
  };
};

export function AchievementsPanel() {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/growth/engagement", { credentials: "include" });
      const json = (await res.json()) as EngagementData;
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (!data) {
    return <p className="text-sm text-[#71717A]">Could not load achievements.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-4`}>
          <div className="flex items-center gap-2 text-[#71717A]">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-xs uppercase tracking-wide">Streak</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.streak.currentStreak}
            <span className="text-sm font-normal text-[#71717A]"> days</span>
          </p>
          <p className={`mt-1 text-xs ${dashboard.subtle}`}>
            Best {data.streak.longestStreak} · {data.streak.totalActiveDays} total
          </p>
        </div>
        <div className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-4 sm:col-span-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#71717A]">
              <Sparkles className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-xs uppercase tracking-wide">Workspace progress</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-white">
              {data.progress.percent}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-[#3B82F6]"
              initial={{ width: 0 }}
              animate={{ width: `${data.progress.percent}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {data.progress.steps.map((step) => (
              <li
                key={step.id}
                className={`text-xs ${step.done ? "text-emerald-400" : "text-[#71717A]"}`}
              >
                {step.done ? "✓" : "○"} {step.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-white">
          Badges · {data.unlockedCount} unlocked
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl border p-3 ${
                badge.unlocked
                  ? "border-[#3B82F6]/30 bg-[#3B82F6]/10"
                  : "border-white/[0.06] bg-[#0A0A0A]/50 opacity-60"
              }`}
            >
              <div className="flex items-start gap-2">
                <Award
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    badge.unlocked ? "text-[#93C5FD]" : "text-[#52525B]"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-white">{badge.title}</p>
                  <p className={`mt-0.5 text-xs ${dashboard.subtle}`}>
                    {badge.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
