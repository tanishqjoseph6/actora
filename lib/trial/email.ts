import { requireSupabaseAdmin } from "@/lib/supabase-admin";
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
import { logDbWriteResult, logDbWriteStart } from "@/lib/supabase/db-log";

export type TrialEmailType = "day_0" | "day_7" | "day_12" | "day_14";

const FROM_EMAIL =
  process.env.TRIAL_EMAIL_FROM?.trim() ||
  process.env.EMAIL_FROM?.trim() ||
  "Actora <onboarding@useactora.com>";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
  "https://useactora.com";

const EMAIL_COPY: Record<
  TrialEmailType,
  { subject: string; heading: string; body: string; cta: string }
> = {
  day_0: {
    subject: "Welcome to Actora 🎉",
    heading: "Your 14-day free trial is live",
    body: "Explore inbox, CRM, automations, and AI — no credit card required. Upgrade anytime to keep everything unlocked.",
    cta: "Open dashboard",
  },
  day_7: {
    subject: "You're halfway through your Actora trial",
    heading: "7 days left on your free trial",
    body: "You've used half of your trial. Upgrade to Pro or Team so your workflows keep running after day 14.",
    cta: "View plans",
  },
  day_12: {
    subject: "Only 2 days remaining on your Actora trial",
    heading: "2 days left",
    body: "Your trial ends soon. Upgrade now to keep inbox sync, CRM, and automations without interruption.",
    cta: "Upgrade now",
  },
  day_14: {
    subject: "Your Actora trial has ended",
    heading: "Trial expired",
    body: "Your 14-day trial is over. Upgrade to continue using Actora's premium features — your data is safe.",
    cta: "Upgrade to continue",
  },
};

function buildHtml(type: TrialEmailType): string {
  const copy = EMAIL_COPY[type];
  const href = `${APP_URL}/billing`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#05070B;color:#E2E8F0;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0B1220;border:1px solid #1E293B;border-radius:16px;padding:32px;">
        <tr><td style="font-size:13px;color:#3B82F6;font-weight:600;letter-spacing:0.04em;">ACTORA</td></tr>
        <tr><td style="padding-top:16px;font-size:24px;font-weight:700;color:#fff;">${copy.heading}</td></tr>
        <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#94A3B8;">${copy.body}</td></tr>
        <tr><td style="padding-top:28px;">
          <a href="${href}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">${copy.cta}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[trial/email] RESEND_API_KEY not set — skipping send", {
      to,
      type,
    });
    return { sent: false, skipped: "missing_resend_api_key" };
  }

  const copy = EMAIL_COPY[type];
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: copy.subject,
      html: buildHtml(type),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API ${response.status}: ${body}`);
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
    // Mark as sent even when provider is not configured so cron does not retry forever.
    // When Resend is configured later, day_0 still fires at trial start; cron emails
    // for later days will send once the key exists if not yet marked.
    if (result.sent) {
      await markEmailSent(userId, emailType);
    } else if (process.env.NODE_ENV === "production") {
      // In production without Resend, still mark to avoid infinite cron retries.
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
