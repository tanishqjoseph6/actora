"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Mail,
  Share2,
  Trophy,
  Users,
} from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";
import { REFERRAL_REWARDS } from "@/lib/growth/types";

type ReferralData = {
  profile: {
    code: string;
    successfulCount: number;
    pendingCount: number;
    rewardDaysEarned: number;
    rewardTierClaimed: { tier5: boolean; tier50: boolean };
  };
  link: string;
  referrals: {
    id: string;
    referredEmail: string | null;
    status: string;
    createdAt: string;
  }[];
  leaderboard: { userId: string; code: string; successfulCount: number }[];
  share: {
    whatsapp: string;
    linkedin: string;
    x: string;
    email: string;
  };
};

function maskEmail(email: string | null) {
  if (!email) return "Pending invite";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}•••@${domain}`;
}

export function ReferralSettingsPanel() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referrals", { credentials: "include" });
      const json = (await res.json()) as ReferralData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load.");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async () => {
    if (!data?.link) return;
    await navigator.clipboard.writeText(data.link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-300">{error ?? "Could not load referrals."}</p>
    );
  }

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-5`}>
        <p className="text-sm font-medium text-white">Your referral link</p>
        <p className={`mt-1 text-xs ${dashboard.subtle}`}>
          Share Actora — invite 5 friends for +7 days Pro, 50 for +1 month Pro.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={data.link}
            className={`flex-1 rounded-xl border ${dashboard.border} bg-black/30 px-3 py-2.5 text-sm text-white`}
          />
          <button
            type="button"
            onClick={() => void copyLink()}
            className={`${dashboard.btnPrimary} inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={data.share.whatsapp}
            target="_blank"
            rel="noreferrer"
            className={`${dashboard.btnSecondary} inline-flex items-center gap-2 px-3 py-2 text-xs`}
          >
            <Share2 className="h-3.5 w-3.5" />
            WhatsApp
          </a>
          <a
            href={data.share.linkedin}
            target="_blank"
            rel="noreferrer"
            className={`${dashboard.btnSecondary} inline-flex items-center gap-2 px-3 py-2 text-xs`}
          >
            <Share2 className="h-3.5 w-3.5" />
            LinkedIn
          </a>
          <a
            href={data.share.x}
            target="_blank"
            rel="noreferrer"
            className={`${dashboard.btnSecondary} inline-flex items-center gap-2 px-3 py-2 text-xs`}
          >
            <Share2 className="h-3.5 w-3.5" />
            X
          </a>
          <a
            href={data.share.email}
            className={`${dashboard.btnSecondary} inline-flex items-center gap-2 px-3 py-2 text-xs`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email invite
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Successful",
            value: data.profile.successfulCount,
            icon: Users,
          },
          {
            label: "Pending",
            value: data.profile.pendingCount,
            icon: Share2,
          },
          {
            label: "Reward days",
            value: data.profile.rewardDaysEarned,
            icon: Trophy,
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-4`}
            >
              <div className="flex items-center gap-2 text-[#71717A]">
                <Icon className="h-4 w-4 text-[#3B82F6]" />
                <span className="text-xs uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className={`rounded-2xl border ${dashboard.border} ${dashboard.surface} p-5`}>
        <p className="text-sm font-medium text-white">Rewards</p>
        <ul className="mt-3 space-y-2">
          {REFERRAL_REWARDS.map((tier) => {
            const claimed =
              tier.id === "tier_5"
                ? data.profile.rewardTierClaimed.tier5
                : data.profile.rewardTierClaimed.tier50;
            const progress = Math.min(
              100,
              Math.round(
                (data.profile.successfulCount / tier.invitesRequired) * 100
              )
            );
            return (
              <li
                key={tier.id}
                className="rounded-xl border border-white/[0.06] bg-[#0A0A0A]/60 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{tier.label}</p>
                    <p className={`text-xs ${dashboard.subtle}`}>{tier.rewardLabel}</p>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      claimed ? "text-emerald-400" : "text-[#A1A1AA]"
                    }`}
                  >
                    {claimed ? "Claimed" : `${progress}%`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#3B82F6]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {data.referrals.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-white">Recent referrals</p>
          <ul className="space-y-2">
            {data.referrals.slice(0, 8).map((r) => (
              <li
                key={r.id}
                className={`flex items-center justify-between rounded-xl border ${dashboard.border} px-3 py-2 text-sm`}
              >
                <span className="text-white">{maskEmail(r.referredEmail)}</span>
                <span className={`text-xs capitalize ${dashboard.subtle}`}>
                  {r.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.leaderboard.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-white">Leaderboard</p>
          <ul className="space-y-1.5">
            {data.leaderboard.slice(0, 5).map((row, index) => (
              <li
                key={row.code}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-[#A1A1AA]"
              >
                <span>
                  #{index + 1} · {row.code}
                </span>
                <span className="tabular-nums text-white">
                  {row.successfulCount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
