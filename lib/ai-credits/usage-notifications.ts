import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserNotification } from "@/lib/notifications/repository";
import { getAiCreditSnapshot } from "@/lib/ai-credits/snapshot";
import { sendAiCreditUsageEmail } from "@/lib/ai-credits/email-alerts";
import {
  AI_CREDIT_EMAIL_MILESTONES,
  type AiCreditUsageMilestone,
  milestoneMessage,
  milestoneTitle,
  reachedMilestones,
} from "@/lib/ai-credits/milestones";

type MilestoneRow = {
  user_id: string;
  cycle_key: string;
  milestone: number;
  percent_used: number;
  monthly_used: number;
  monthly_allotment: number;
  in_app_sent_at: string | null;
  email_sent_at: string | null;
  ui_acknowledged_at: string | null;
};

function isMissingMilestoneSchema(message: string): boolean {
  return message.toLowerCase().includes("ai_credit_usage_milestones");
}

async function getMilestoneRow(
  userId: string,
  cycleKey: string,
  milestone: AiCreditUsageMilestone
): Promise<MilestoneRow | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from("ai_credit_usage_milestones")
    .select("*")
    .eq("user_id", userId)
    .eq("cycle_key", cycleKey)
    .eq("milestone", milestone)
    .maybeSingle();

  if (error) {
    if (isMissingMilestoneSchema(error.message)) return null;
    throw new Error(error.message);
  }

  return (data as MilestoneRow | null) ?? null;
}

async function claimMilestone(
  userId: string,
  cycleKey: string,
  milestone: AiCreditUsageMilestone,
  snapshot: Awaited<ReturnType<typeof getAiCreditSnapshot>>
): Promise<MilestoneRow | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("ai_credit_usage_milestones")
    .upsert(
      {
        user_id: userId,
        cycle_key: cycleKey,
        milestone,
        percent_used: snapshot.percentUsed,
        monthly_used: snapshot.used,
        monthly_allotment: Number.isFinite(snapshot.totalMonthly)
          ? snapshot.totalMonthly
          : 0,
        created_at: now,
      },
      { onConflict: "user_id,cycle_key,milestone", ignoreDuplicates: true }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    if (isMissingMilestoneSchema(error.message)) return null;
    throw new Error(error.message);
  }

  if (data) return data as MilestoneRow;

  return getMilestoneRow(userId, cycleKey, milestone);
}

async function markInAppSent(
  userId: string,
  cycleKey: string,
  milestone: AiCreditUsageMilestone
) {
  const db = getSupabaseAdmin();
  if (!db) return;

  await db
    .from("ai_credit_usage_milestones")
    .update({ in_app_sent_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("cycle_key", cycleKey)
    .eq("milestone", milestone)
    .is("in_app_sent_at", null);
}

async function markEmailSent(
  userId: string,
  cycleKey: string,
  milestone: AiCreditUsageMilestone
) {
  const db = getSupabaseAdmin();
  if (!db) return;

  await db
    .from("ai_credit_usage_milestones")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("cycle_key", cycleKey)
    .eq("milestone", milestone)
    .is("email_sent_at", null);
}

export type AiCreditUsageEvent = {
  milestone: AiCreditUsageMilestone;
  title: string;
  message: string;
  tone: "green" | "yellow" | "orange" | "red";
  showExhaustedModal: boolean;
};

function toneFor(milestone: AiCreditUsageMilestone) {
  if (milestone <= 25) return "green" as const;
  if (milestone <= 50) return "yellow" as const;
  if (milestone <= 75) return "orange" as const;
  return "red" as const;
}

/**
 * Evaluate monthly credit usage milestones after a successful debit.
 * Creates in-app notifications + optional email (deduped per billing cycle).
 */
export async function evaluateAiCreditUsageNotifications(
  userId: string
): Promise<AiCreditUsageEvent[]> {
  const snapshot = await getAiCreditSnapshot(userId);
  if (snapshot.unlimited) return [];

  const triggered = reachedMilestones(snapshot.percentUsed);
  const events: AiCreditUsageEvent[] = [];

  for (const milestone of triggered) {
    const row = await claimMilestone(
      userId,
      snapshot.cycleKey,
      milestone,
      snapshot
    );
    if (!row) continue;

    const message = milestoneMessage(milestone);
    const title = milestoneTitle(milestone);

    if (!row.in_app_sent_at) {
      await createUserNotification(userId, {
        category: "Billing Updates",
        title,
        body: message,
        href: milestone === 100 ? "/billing#ai-credits" : "/billing",
      });
      await markInAppSent(userId, snapshot.cycleKey, milestone);
      events.push({
        milestone,
        title,
        message,
        tone: toneFor(milestone),
        showExhaustedModal: milestone === 100,
      });
    }

    if (
      AI_CREDIT_EMAIL_MILESTONES.includes(milestone) &&
      !row.email_sent_at
    ) {
      try {
        const result = await sendAiCreditUsageEmail(userId, milestone);
        if (result.sent) {
          await markEmailSent(userId, snapshot.cycleKey, milestone);
        }
      } catch (error) {
        console.error("[ai-credits] usage email failed:", error);
      }
    }
  }

  return events;
}

export async function listUnacknowledgedUsageEvents(
  userId: string,
  limit = 5
): Promise<AiCreditUsageEvent[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const snapshot = await getAiCreditSnapshot(userId);
  const { data, error } = await db
    .from("ai_credit_usage_milestones")
    .select("milestone, ui_acknowledged_at, in_app_sent_at")
    .eq("user_id", userId)
    .eq("cycle_key", snapshot.cycleKey)
    .is("ui_acknowledged_at", null)
    .not("in_app_sent_at", "is", null)
    .order("milestone", { ascending: true })
    .limit(limit);

  if (error) {
    if (isMissingMilestoneSchema(error.message)) return [];
    return [];
  }

  return (data ?? []).map((row) => {
    const milestone = row.milestone as AiCreditUsageMilestone;
    return {
      milestone,
      title: milestoneTitle(milestone),
      message: milestoneMessage(milestone),
      tone: toneFor(milestone),
      showExhaustedModal: milestone === 100,
    };
  });
}

export async function acknowledgeUsageEvents(
  userId: string,
  milestones: AiCreditUsageMilestone[]
) {
  const db = getSupabaseAdmin();
  if (!db || milestones.length === 0) return;

  const snapshot = await getAiCreditSnapshot(userId);
  await db
    .from("ai_credit_usage_milestones")
    .update({ ui_acknowledged_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("cycle_key", snapshot.cycleKey)
    .in("milestone", milestones);
}
