import "server-only";

import { requireSupabaseAdmin } from "@/lib/supabase-admin";
import { logDbWriteResult, logDbWriteStart } from "@/lib/supabase/db-log";
import {
  getRemainingTrialDays,
  hasTrialExpired,
  isTrialActive,
} from "@/lib/trial/helpers";
import {
  expireTrialIfNeeded,
  listActiveTrialsForEmailJob,
  type StoredSubscription,
} from "@/lib/subscription/repository";
import { sendProductionEmail } from "@/lib/email/send";
import {
  buildTrialEmail,
  type TrialEmailType,
} from "@/lib/email/templates/trial";

export type { TrialEmailType } from "@/lib/email/templates/trial";

async function hasSentEmail(
  userId: string,
  emailType: TrialEmailType
): Promise<boolean> {
  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from("trial_email_log")
    .select("user_id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .maybeSingle();

  if (error) {
    console.error("[trial/email] log lookup failed", error);
    return false;
  }

  return Boolean(data);
}

async function markEmailSent(
  userId: string,
  emailType: TrialEmailType
): Promise<void> {
  const db = requireSupabaseAdmin();
  logDbWriteStart("trial/email", "insert", "trial_email_log", {
    user_id: userId,
    email_type: emailType,
  });

  const { error, status, statusText } = await db.from("trial_email_log").upsert(
    {
      user_id: userId,
      email_type: emailType,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "user_id,email_type" }
  );

  logDbWriteResult("trial/email", "insert", "trial_email_log", {
    httpStatus: status,
    statusText,
    error,
  });

  if (error) {
    throw new Error(`Failed to mark trial email sent: ${error.message}`);
  }
}

async function deliverEmail(
  to: string,
  type: TrialEmailType
): Promise<{ sent: boolean; skipped?: string }> {
  const template = buildTrialEmail(type);
  const result = await sendProductionEmail({
    to,
    subject: template.subject,
    html: template.html,
    category: "trial",
    tags: [{ name: "category", value: "trial" }, { name: "type", value: type }],
  });

  if (result.skipped === "missing_resend_api_key") {
    return { sent: false, skipped: "missing_resend_api_key" };
  }

  if (!result.sent) {
    throw new Error(result.error ?? "Trial email send failed.");
  }

  return { sent: true };
}

export async function sendTrialEmail(
  userId: string,
  emailType: TrialEmailType
): Promise<{ sent: boolean; reason?: string }> {
  if (await hasSentEmail(userId, emailType)) {
    return { sent: false, reason: "already_sent" };
  }

  const result = await deliverEmail(userId, emailType);
  if (result.sent || result.skipped === "missing_resend_api_key") {
    if (result.sent) {
      await markEmailSent(userId, emailType);
    } else if (process.env.NODE_ENV === "production") {
      await markEmailSent(userId, emailType);
    }
  }

  return { sent: result.sent, reason: result.skipped };
}

function pickEmailType(stored: StoredSubscription): TrialEmailType | null {
  const fields = {
    isTrial: stored.isTrial,
    trialStartedAt: stored.trialStartedAt,
    trialEndsAt: stored.trialEndsAt,
    trialExpired: stored.trialExpired,
  };

  if (hasTrialExpired(fields) || !isTrialActive(fields)) {
    return "day_14";
  }

  const daysLeft = getRemainingTrialDays(fields);
  if (daysLeft <= 2) return "day_12";
  if (daysLeft <= 7) return "day_7";
  return null;
}

/** Cron job: send lifecycle emails and expire trials. */
export async function processTrialEmailAutomation(): Promise<{
  processed: number;
  sent: TrialEmailType[];
  expired: number;
}> {
  const trials = await listActiveTrialsForEmailJob();
  const sent: TrialEmailType[] = [];
  let expired = 0;

  for (const trial of trials) {
    const refreshed = await expireTrialIfNeeded(trial);
    if (refreshed.trialExpired && !trial.trialExpired) {
      expired += 1;
      const result = await sendTrialEmail(refreshed.userId, "day_14");
      if (result.sent) sent.push("day_14");
      continue;
    }

    const type = pickEmailType(refreshed);
    if (!type || type === "day_0") continue;

    const result = await sendTrialEmail(refreshed.userId, type);
    if (result.sent) sent.push(type);
  }

  return { processed: trials.length, sent, expired };
}
