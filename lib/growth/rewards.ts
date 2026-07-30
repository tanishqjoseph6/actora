import "server-only";

import { createUserNotification } from "@/lib/notifications/repository";
import { requireSupabaseAdmin } from "@/lib/supabase-admin";
import { getStoredSubscription } from "@/lib/subscription/repository";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import {
  activateReferral,
  ensureReferralProfile,
  getGrowthPreferences,
  markReferralRewardTier,
  unlockAchievement,
} from "./repository";
import { REFERRAL_REWARDS } from "./types";

/**
 * Extend trial window or paid period as a referral reward.
 * Avoids upsertUserSubscription paid-conversion side effects.
 */
export async function grantReferralBonusDays(
  userId: string,
  bonusDays: number
): Promise<{ endsAt: string }> {
  const uid = normalizeSubscriptionUserId(userId);
  const db = requireSupabaseAdmin();
  const sub = await getStoredSubscription(uid);
  const now = new Date();

  const isTrialish =
    !sub ||
    sub.isTrial ||
    sub.planId === "free" ||
    sub.status === "trialing";

  if (isTrialish) {
    const baseEnd = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : now;
    const end = new Date(Math.max(baseEnd.getTime(), now.getTime()));
    end.setUTCDate(end.getUTCDate() + bonusDays);
    const endsAt = end.toISOString();

    await db.from("user_subscriptions").upsert(
      {
        user_id: uid,
        plan_id: sub?.planId && sub.planId !== "free" ? sub.planId : "free",
        status: "trialing",
        billing_interval: sub?.billingInterval ?? "monthly",
        current_period_end: endsAt,
        is_trial: true,
        trial_expired: false,
        trial_started_at: sub?.trialStartedAt ?? now.toISOString(),
        trial_ends_at: endsAt,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    return { endsAt };
  }

  const baseEnd = sub!.currentPeriodEnd
    ? new Date(sub!.currentPeriodEnd)
    : now;
  const end = new Date(Math.max(baseEnd.getTime(), now.getTime()));
  end.setUTCDate(end.getUTCDate() + bonusDays);
  const endsAt = end.toISOString();

  await db
    .from("user_subscriptions")
    .update({
      current_period_end: endsAt,
      updated_at: now.toISOString(),
    })
    .eq("user_id", uid);

  return { endsAt };
}

export async function processReferralActivation(
  referredUserId: string
): Promise<void> {
  const referral = await activateReferral(referredUserId);
  if (!referral) return;

  const prefs = await getGrowthPreferences(referral.referrerUserId);
  if (prefs.notifyReferrals) {
    await createUserNotification(referral.referrerUserId, {
      category: "Growth",
      title: "Referral activated",
      body: "A friend you invited just got started on Actora.",
      href: "/dashboard/settings#referrals",
    });
  }

  const profile = await ensureReferralProfile(referral.referrerUserId);

  for (const tier of REFERRAL_REWARDS) {
    const claimed =
      tier.id === "tier_5"
        ? profile.rewardTierClaimed.tier5
        : profile.rewardTierClaimed.tier50;

    if (claimed) continue;
    if (profile.successfulCount < tier.invitesRequired) continue;

    await grantReferralBonusDays(referral.referrerUserId, tier.bonusDays);
    await markReferralRewardTier({
      userId: referral.referrerUserId,
      tier5: tier.id === "tier_5" ? true : undefined,
      tier50: tier.id === "tier_50" ? true : undefined,
      bonusDays: tier.bonusDays,
    });

    if (prefs.notifyReferrals || prefs.emailReferralRewards) {
      await createUserNotification(referral.referrerUserId, {
        category: "Growth",
        title: "Referral reward unlocked",
        body: `${tier.label} → ${tier.rewardLabel}`,
        href: "/dashboard/settings#referrals",
      });
    }

    if (tier.invitesRequired >= 5) {
      await unlockAchievement({
        userId: referral.referrerUserId,
        achievementId: "referral_5",
      });
    }
  }
}
