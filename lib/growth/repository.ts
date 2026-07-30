import "server-only";

import { requireSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type {
  GrowthDailyMetric,
  GrowthMetricKey,
  GrowthPreferences,
  ReferralProfile,
  ReferralRecord,
  ReferralStatus,
  UserAchievement,
  UserStreak,
  AchievementId,
} from "./types";

function generateReferralCode(userId: string): string {
  const base = userId
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || "ACTORA"}${suffix}`;
}

function mapProfile(row: Record<string, unknown>): ReferralProfile {
  return {
    userId: String(row.user_id),
    code: String(row.code),
    successfulCount: Number(row.successful_count ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    rewardDaysEarned: Number(row.reward_days_earned ?? 0),
    rewardTierClaimed: {
      tier5: Boolean(row.reward_tier_5_claimed),
      tier50: Boolean(row.reward_tier_50_claimed),
    },
    createdAt: String(row.created_at),
  };
}

function mapReferral(row: Record<string, unknown>): ReferralRecord {
  return {
    id: String(row.id),
    referrerUserId: String(row.referrer_user_id),
    referredUserId: row.referred_user_id ? String(row.referred_user_id) : null,
    referredEmail: row.referred_email ? String(row.referred_email) : null,
    status: row.status as ReferralStatus,
    code: String(row.code),
    signedUpAt: row.signed_up_at ? String(row.signed_up_at) : null,
    activatedAt: row.activated_at ? String(row.activated_at) : null,
    rewardedAt: row.rewarded_at ? String(row.rewarded_at) : null,
    createdAt: String(row.created_at),
  };
}

export async function ensureReferralProfile(
  userId: string
): Promise<ReferralProfile> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);

  const { data: existing } = await db
    .from("referral_profiles")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();

  if (existing) return mapProfile(existing);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode(uid);
    const { data, error } = await db
      .from("referral_profiles")
      .insert({
        user_id: uid,
        code,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (!error && data) return mapProfile(data);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }

  throw new Error("Could not create referral profile.");
}

export async function getReferralProfileByCode(
  code: string
): Promise<ReferralProfile | null> {
  const db = requireSupabaseAdmin();
  const { data } = await db
    .from("referral_profiles")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  return data ? mapProfile(data) : null;
}

export async function listReferralsForUser(
  userId: string
): Promise<ReferralRecord[]> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const { data, error } = await db
    .from("referrals")
    .select("*")
    .eq("referrer_user_id", uid)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapReferral(row));
}

export async function attributeReferralSignup(input: {
  code: string;
  referredUserId: string;
  referredEmail?: string | null;
}): Promise<ReferralRecord | null> {
  const profile = await getReferralProfileByCode(input.code);
  if (!profile) return null;

  const uid = normalizeSubscriptionUserId(input.referredUserId);
  if (profile.userId === uid) return null;

  const db = requireSupabaseAdmin();

  const { data: existing } = await db
    .from("referrals")
    .select("*")
    .eq("referred_user_id", uid)
    .maybeSingle();
  if (existing) return mapReferral(existing);

  const { data, error } = await db
    .from("referrals")
    .insert({
      referrer_user_id: profile.userId,
      referred_user_id: uid,
      referred_email:
        input.referredEmail ??
        (uid.includes("@") ? uid : null),
      status: "signed_up",
      code: profile.code,
      signed_up_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[growth/referrals] attribute failed", error);
    return null;
  }

  await db
    .from("referral_profiles")
    .update({
      pending_count: profile.pendingCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", profile.userId);

  return mapReferral(data);
}

export async function activateReferral(
  referredUserId: string
): Promise<ReferralRecord | null> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(referredUserId);

  const { data: referral } = await db
    .from("referrals")
    .select("*")
    .eq("referred_user_id", uid)
    .in("status", ["signed_up", "pending"])
    .maybeSingle();

  if (!referral) return null;

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("referrals")
    .update({
      status: "activated",
      activated_at: now,
    })
    .eq("id", referral.id)
    .select("*")
    .single();

  if (error || !data) return null;

  const profile = await ensureReferralProfile(String(referral.referrer_user_id));
  await db
    .from("referral_profiles")
    .update({
      successful_count: profile.successfulCount + 1,
      pending_count: Math.max(0, profile.pendingCount - 1),
      updated_at: now,
    })
    .eq("user_id", profile.userId);

  return mapReferral(data);
}

export async function markReferralRewardTier(input: {
  userId: string;
  tier5?: boolean;
  tier50?: boolean;
  bonusDays: number;
}): Promise<ReferralProfile> {
  const db = requireSupabaseAdmin();
  const profile = await ensureReferralProfile(input.userId);
  const { data, error } = await db
    .from("referral_profiles")
    .update({
      reward_tier_5_claimed: input.tier5 ?? profile.rewardTierClaimed.tier5,
      reward_tier_50_claimed: input.tier50 ?? profile.rewardTierClaimed.tier50,
      reward_days_earned: profile.rewardDaysEarned + input.bonusDays,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", profile.userId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Reward update failed.");
  return mapProfile(data);
}

export async function getLeaderboard(limit = 10): Promise<
  { userId: string; code: string; successfulCount: number }[]
> {
  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from("referral_profiles")
    .select("user_id, code, successful_count")
    .order("successful_count", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    userId: String(row.user_id),
    code: String(row.code),
    successfulCount: Number(row.successful_count ?? 0),
  }));
}

export async function listAchievements(
  userId: string
): Promise<UserAchievement[]> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const { data, error } = await db
    .from("user_achievements")
    .select("*")
    .eq("user_id", uid)
    .order("unlocked_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    achievementId: row.achievement_id as AchievementId,
    unlockedAt: String(row.unlocked_at),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

export async function unlockAchievement(input: {
  userId: string;
  achievementId: AchievementId;
  metadata?: Record<string, unknown>;
}): Promise<UserAchievement | null> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(input.userId);

  const { data: existing } = await db
    .from("user_achievements")
    .select("*")
    .eq("user_id", uid)
    .eq("achievement_id", input.achievementId)
    .maybeSingle();

  if (existing) {
    return {
      id: String(existing.id),
      userId: String(existing.user_id),
      achievementId: existing.achievement_id as AchievementId,
      unlockedAt: String(existing.unlocked_at),
      metadata: (existing.metadata as Record<string, unknown>) ?? {},
    };
  }

  const { data, error } = await db
    .from("user_achievements")
    .insert({
      user_id: uid,
      achievement_id: input.achievementId,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error?.message?.toLowerCase().includes("duplicate")) return null;
    console.error("[growth/achievements] unlock failed", error);
    return null;
  }

  return {
    id: String(data.id),
    userId: String(data.user_id),
    achievementId: data.achievement_id as AchievementId,
    unlockedAt: String(data.unlocked_at),
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  };
}

export async function getStreak(userId: string): Promise<UserStreak> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const { data } = await db
    .from("user_streaks")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();

  if (!data) {
    return {
      userId: uid,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalActiveDays: 0,
    };
  }

  return {
    userId: String(data.user_id),
    currentStreak: Number(data.current_streak ?? 0),
    longestStreak: Number(data.longest_streak ?? 0),
    lastActiveDate: data.last_active_date
      ? String(data.last_active_date)
      : null,
    totalActiveDays: Number(data.total_active_days ?? 0),
  };
}

export async function recordDailyActivity(userId: string): Promise<UserStreak> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const today = new Date().toISOString().slice(0, 10);
  const existing = await getStreak(uid);

  if (existing.lastActiveDate === today) return existing;

  let current = 1;
  if (existing.lastActiveDate) {
    const last = new Date(existing.lastActiveDate + "T00:00:00Z");
    const now = new Date(today + "T00:00:00Z");
    const diffDays = Math.round(
      (now.getTime() - last.getTime()) / (24 * 60 * 60 * 1000)
    );
    current = diffDays === 1 ? existing.currentStreak + 1 : 1;
  }

  const longest = Math.max(existing.longestStreak, current);
  const total = existing.totalActiveDays + 1;

  const { data, error } = await db
    .from("user_streaks")
    .upsert(
      {
        user_id: uid,
        current_streak: current,
        longest_streak: longest,
        last_active_date: today,
        total_active_days: total,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Streak update failed.");

  return {
    userId: uid,
    currentStreak: Number(data.current_streak),
    longestStreak: Number(data.longest_streak),
    lastActiveDate: String(data.last_active_date),
    totalActiveDays: Number(data.total_active_days),
  };
}

const DEFAULT_PREFS = (userId: string): GrowthPreferences => ({
  userId,
  emailOnboarding: true,
  emailProductUpdates: true,
  emailWeeklyDigest: true,
  emailReferralRewards: true,
  notifyReferrals: true,
  notifyInvites: true,
  notifyAutomations: true,
  notifyAiSummary: true,
  notifyProductUpdates: true,
});

function mapPrefs(row: Record<string, unknown>): GrowthPreferences {
  return {
    userId: String(row.user_id),
    emailOnboarding: Boolean(row.email_onboarding),
    emailProductUpdates: Boolean(row.email_product_updates),
    emailWeeklyDigest: Boolean(row.email_weekly_digest),
    emailReferralRewards: Boolean(row.email_referral_rewards),
    notifyReferrals: Boolean(row.notify_referrals),
    notifyInvites: Boolean(row.notify_invites),
    notifyAutomations: Boolean(row.notify_automations),
    notifyAiSummary: Boolean(row.notify_ai_summary),
    notifyProductUpdates: Boolean(row.notify_product_updates),
  };
}

export async function getGrowthPreferences(
  userId: string
): Promise<GrowthPreferences> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const { data } = await db
    .from("user_growth_preferences")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  return data ? mapPrefs(data) : DEFAULT_PREFS(uid);
}

export async function updateGrowthPreferences(
  userId: string,
  patch: Partial<Omit<GrowthPreferences, "userId">>
): Promise<GrowthPreferences> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const current = await getGrowthPreferences(uid);
  const next = { ...current, ...patch };

  const { data, error } = await db
    .from("user_growth_preferences")
    .upsert(
      {
        user_id: uid,
        email_onboarding: next.emailOnboarding,
        email_product_updates: next.emailProductUpdates,
        email_weekly_digest: next.emailWeeklyDigest,
        email_referral_rewards: next.emailReferralRewards,
        notify_referrals: next.notifyReferrals,
        notify_invites: next.notifyInvites,
        notify_automations: next.notifyAutomations,
        notify_ai_summary: next.notifyAiSummary,
        notify_product_updates: next.notifyProductUpdates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Prefs update failed.");
  return mapPrefs(data);
}

export async function incrementGrowthMetric(
  userId: string,
  key: GrowthMetricKey,
  amount = 1
): Promise<void> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const day = new Date().toISOString().slice(0, 10);

  const { data: existing } = await db
    .from("growth_daily_metrics")
    .select("*")
    .eq("user_id", uid)
    .eq("day", day)
    .maybeSingle();

  const current = existing
    ? {
        tasks_completed: Number(existing.tasks_completed ?? 0),
        meetings_summarized: Number(existing.meetings_summarized ?? 0),
        ai_prompts: Number(existing.ai_prompts ?? 0),
        crm_updates: Number(existing.crm_updates ?? 0),
        documents_created: Number(existing.documents_created ?? 0),
        automation_runs: Number(existing.automation_runs ?? 0),
      }
    : {
        tasks_completed: 0,
        meetings_summarized: 0,
        ai_prompts: 0,
        crm_updates: 0,
        documents_created: 0,
        automation_runs: 0,
      };

  current[key] = (current[key] ?? 0) + amount;

  await db.from("growth_daily_metrics").upsert(
    {
      user_id: uid,
      day,
      ...current,
    },
    { onConflict: "user_id,day" }
  );
}

export async function listGrowthMetrics(
  userId: string,
  days: number
): Promise<GrowthDailyMetric[]> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await db
    .from("growth_daily_metrics")
    .select("*")
    .eq("user_id", uid)
    .gte("day", sinceStr)
    .order("day", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    userId: String(row.user_id),
    day: String(row.day),
    tasksCompleted: Number(row.tasks_completed ?? 0),
    meetingsSummarized: Number(row.meetings_summarized ?? 0),
    aiPrompts: Number(row.ai_prompts ?? 0),
    crmUpdates: Number(row.crm_updates ?? 0),
    documentsCreated: Number(row.documents_created ?? 0),
    automationRuns: Number(row.automation_runs ?? 0),
  }));
}

export async function hasOnboardingEmail(
  userId: string,
  step: string
): Promise<boolean> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const { data } = await db
    .from("onboarding_email_log")
    .select("id")
    .eq("user_id", uid)
    .eq("step", step)
    .maybeSingle();
  return Boolean(data);
}

export async function logOnboardingEmail(
  userId: string,
  step: string
): Promise<void> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  await db.from("onboarding_email_log").upsert(
    { user_id: uid, step, sent_at: new Date().toISOString() },
    { onConflict: "user_id,step" }
  );
}
