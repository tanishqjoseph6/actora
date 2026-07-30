"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  SettingsToggle,
} from "@/components/settings/SettingsSection";

type Prefs = {
  emailOnboarding: boolean;
  emailProductUpdates: boolean;
  emailWeeklyDigest: boolean;
  emailReferralRewards: boolean;
  notifyReferrals: boolean;
  notifyInvites: boolean;
  notifyAutomations: boolean;
  notifyAiSummary: boolean;
  notifyProductUpdates: boolean;
};

type UsageTotals = {
  tasksCompleted: number;
  meetingsSummarized: number;
  aiPrompts: number;
  crmUpdates: number;
  documentsCreated: number;
  automationRuns: number;
};

type MetricDay = {
  day: string;
  tasksCompleted: number;
  meetingsSummarized: number;
  aiPrompts: number;
  crmUpdates: number;
  documentsCreated: number;
  automationRuns: number;
};

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const frames = 24;
    const tick = () => {
      frame += 1;
      setDisplay(Math.round((value * frame) / frames));
      if (frame < frames) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className="tabular-nums">{display}</span>;
}

export function GrowthUsagePanel() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [metrics, setMetrics] = useState<MetricDay[]>([]);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/usage?period=${period}`, {
        credentials: "include",
      });
      const json = (await res.json()) as {
        totals: UsageTotals;
        metrics: MetricDay[];
        preferences: Prefs;
      };
      if (res.ok) {
        setTotals(json.totals);
        setMetrics(json.metrics);
        setPrefs(json.preferences);
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePrefs = async (next: Prefs) => {
    setPrefs(next);
    setSaving(true);
    try {
      await fetch("/api/growth/usage", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !totals) {
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  }

  const cards = [
    { label: "Tasks completed", value: totals?.tasksCompleted ?? 0 },
    { label: "Meetings summarized", value: totals?.meetingsSummarized ?? 0 },
    { label: "AI prompts used", value: totals?.aiPrompts ?? 0 },
    { label: "CRM updates", value: totals?.crmUpdates ?? 0 },
    { label: "Documents created", value: totals?.documentsCreated ?? 0 },
    { label: "Automation runs", value: totals?.automationRuns ?? 0 },
  ];

  const maxBar = Math.max(
    1,
    ...metrics.map(
      (m) =>
        m.aiPrompts +
        m.tasksCompleted +
        m.automationRuns +
        m.crmUpdates +
        m.meetingsSummarized +
        m.documentsCreated
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["7d", "30d", "90d"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p
                ? "bg-[#3B82F6]/15 text-[#93C5FD] border border-[#3B82F6]/30"
                : "border border-white/[0.08] text-[#71717A] hover:text-white"
            }`}
          >
            {p === "7d" ? "Daily · 7d" : p === "30d" ? "Weekly · 30d" : "Monthly · 90d"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-4`}
          >
            <p className={`text-xs ${dashboard.subtle}`}>{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              <AnimatedCounter value={card.value} />
            </p>
          </motion.div>
        ))}
      </div>

      {metrics.length > 0 && (
        <div className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-4`}>
          <p className="mb-4 text-sm font-medium text-white">Activity trend</p>
          <div className="flex h-28 items-end gap-1">
            {metrics.map((day) => {
              const total =
                day.aiPrompts +
                day.tasksCompleted +
                day.automationRuns +
                day.crmUpdates +
                day.meetingsSummarized +
                day.documentsCreated;
              const height = Math.max(4, Math.round((total / maxBar) * 100));
              return (
                <div
                  key={day.day}
                  className="group relative flex-1 rounded-t-md bg-[#3B82F6]/70 transition-opacity hover:opacity-100"
                  style={{ height: `${height}%`, opacity: 0.55 + height / 200 }}
                  title={`${day.day}: ${total} events`}
                />
              );
            })}
          </div>
        </div>
      )}

      {prefs && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Email & notification preferences</p>
            {saving && <span className="text-xs text-[#71717A]">Saving…</span>}
          </div>
          <SettingsToggle
            id="email-onboarding"
            label="Onboarding emails"
            description="Welcome sequence for new Actora users"
            checked={prefs.emailOnboarding}
            onChange={(v) => void savePrefs({ ...prefs, emailOnboarding: v })}
          />
          <SettingsToggle
            id="email-product-updates"
            label="Product updates"
            description="New features and product announcements"
            checked={prefs.emailProductUpdates}
            onChange={(v) => void savePrefs({ ...prefs, emailProductUpdates: v })}
          />
          <SettingsToggle
            id="email-weekly-digest"
            label="Weekly digest"
            description="Weekly AI summary of your workspace"
            checked={prefs.emailWeeklyDigest}
            onChange={(v) => void savePrefs({ ...prefs, emailWeeklyDigest: v })}
          />
          <SettingsToggle
            id="email-referral-rewards"
            label="Referral reward emails"
            description="When you unlock referral rewards"
            checked={prefs.emailReferralRewards}
            onChange={(v) => void savePrefs({ ...prefs, emailReferralRewards: v })}
          />
          <SettingsToggle
            id="notify-referrals"
            label="Referral notifications"
            description="In-app alerts for referrals and rewards"
            checked={prefs.notifyReferrals}
            onChange={(v) => void savePrefs({ ...prefs, notifyReferrals: v })}
          />
          <SettingsToggle
            id="notify-invites"
            label="Invite notifications"
            description="When teammates accept invitations"
            checked={prefs.notifyInvites}
            onChange={(v) => void savePrefs({ ...prefs, notifyInvites: v })}
          />
          <SettingsToggle
            id="notify-automations"
            label="Automation completed"
            description="When automations finish running"
            checked={prefs.notifyAutomations}
            onChange={(v) => void savePrefs({ ...prefs, notifyAutomations: v })}
          />
          <SettingsToggle
            id="notify-ai-summary"
            label="Daily AI summary"
            description="In-app daily AI insights"
            checked={prefs.notifyAiSummary}
            onChange={(v) => void savePrefs({ ...prefs, notifyAiSummary: v })}
          />
        </div>
      )}
    </div>
  );
}
