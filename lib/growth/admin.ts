import "server-only";

import { requireSupabaseAdmin } from "@/lib/supabase-admin";

export type AdminGrowthStats = {
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

function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? process.env.ACTORA_ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

export function assertAdminEmail(email: string | null): boolean {
  if (!email) return false;
  return isAdminEmail(email);
}

export async function getAdminGrowthStats(): Promise<AdminGrowthStats> {
  const db = requireSupabaseAdmin();

  const [
    subs,
    streaks,
    referralProfiles,
    referrals,
    workspaces,
    members,
    achievements,
    onboarding,
  ] = await Promise.all([
    db.from("user_subscriptions").select("user_id", { count: "exact", head: true }),
    db.from("user_streaks").select("user_id, last_active_date, total_active_days"),
    db.from("referral_profiles").select("user_id, successful_count", { count: "exact" }),
    db.from("referrals").select("id, status"),
    db.from("workspaces").select("id", { count: "exact", head: true }).is("deleted_at", null),
    db.from("workspace_members").select("workspace_id, user_id").eq("status", "active"),
    db.from("user_achievements").select("id", { count: "exact", head: true }),
    db.from("onboarding_email_log").select("id", { count: "exact", head: true }),
  ]);

  const now = Date.now();
  const day7 = now - 7 * 24 * 60 * 60 * 1000;
  const day30 = now - 30 * 24 * 60 * 60 * 1000;

  let activeUsers7d = 0;
  let activeUsers30d = 0;
  for (const row of streaks.data ?? []) {
    const d = row.last_active_date
      ? new Date(String(row.last_active_date) + "T00:00:00Z").getTime()
      : 0;
    if (d >= day7) activeUsers7d += 1;
    if (d >= day30) activeUsers30d += 1;
  }

  const referralRows = referrals.data ?? [];
  const successfulReferrals = referralRows.filter(
    (r) => r.status === "activated" || r.status === "rewarded"
  ).length;
  const pendingReferrals = referralRows.filter(
    (r) => r.status === "pending" || r.status === "signed_up"
  ).length;
  const totalAttributed = referralRows.length;
  const referralConversionRate =
    totalAttributed === 0
      ? 0
      : Math.round((successfulReferrals / totalAttributed) * 1000) / 10;

  const memberCounts = new Map<string, number>();
  for (const m of members.data ?? []) {
    const wid = String(m.workspace_id);
    memberCounts.set(wid, (memberCounts.get(wid) ?? 0) + 1);
  }
  const teamWorkspaces = [...memberCounts.values()].filter((n) => n > 1).length;

  return {
    totalUsers: subs.count ?? 0,
    activeUsers7d,
    activeUsers30d,
    referralProfiles: referralProfiles.count ?? 0,
    successfulReferrals,
    pendingReferrals,
    referralConversionRate,
    workspaces: workspaces.count ?? 0,
    teamWorkspaces,
    achievementsUnlocked: achievements.count ?? 0,
    onboardingEmailsSent: onboarding.count ?? 0,
  };
}
