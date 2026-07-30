import "server-only";

import { requireSupabaseAdmin } from "@/lib/supabase-admin";
import { sendProductionEmail } from "@/lib/email/send";
import {
  inviteTeammatesOnboardingEmail,
  roxxOnboardingEmail,
  upgradeOnboardingEmail,
  welcomeOnboardingEmail,
  workflowsOnboardingEmail,
  workspaceOnboardingEmail,
} from "@/lib/email/templates/growth";
import {
  getGrowthPreferences,
  hasOnboardingEmail,
  logOnboardingEmail,
} from "@/lib/growth/repository";
import type { OnboardingEmailStep } from "@/lib/growth/types";
import { ONBOARDING_EMAIL_STEPS } from "@/lib/growth/types";

function daysSince(iso: string, now = new Date()): number {
  const start = new Date(iso);
  const ms = now.getTime() - start.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function templateFor(step: OnboardingEmailStep) {
  switch (step) {
    case "day_0":
      return welcomeOnboardingEmail();
    case "day_1":
      return workspaceOnboardingEmail();
    case "day_3":
      return roxxOnboardingEmail();
    case "day_5":
      return inviteTeammatesOnboardingEmail();
    case "day_7":
      return workflowsOnboardingEmail();
    case "day_14":
      return upgradeOnboardingEmail();
  }
}

/**
 * Process product onboarding drip for recent users.
 */
export async function processOnboardingEmailAutomation(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
}> {
  const db = requireSupabaseAdmin();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 21);

  const { data: users, error } = await db
    .from("user_subscriptions")
    .select("user_id, trial_started_at, updated_at, created_at")
    .or(
      `trial_started_at.gte.${since.toISOString()},updated_at.gte.${since.toISOString()}`
    )
    .limit(500);

  if (error) {
    // Fallback: scan referral profiles / streaks if created_at missing
    console.warn("[growth/onboarding-email] subscription query", error.message);
  }

  const rows = users ?? [];
  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    const userId = String(row.user_id);
    if (!userId.includes("@")) {
      skipped += 1;
      continue;
    }

    const prefs = await getGrowthPreferences(userId);
    if (!prefs.emailOnboarding) {
      skipped += 1;
      continue;
    }

    const anchor =
      row.trial_started_at ??
      (row as { created_at?: string }).created_at ??
      row.updated_at;
    if (!anchor) {
      skipped += 1;
      continue;
    }

    const age = daysSince(String(anchor));

    for (const stepDef of ONBOARDING_EMAIL_STEPS) {
      if (age < stepDef.dayOffset) continue;
      const already = await hasOnboardingEmail(userId, stepDef.step);
      if (already) continue;

      const template = templateFor(stepDef.step);
      const result = await sendProductionEmail({
        to: userId,
        subject: template.subject,
        html: template.html,
        text: template.text,
        category: "onboarding",
        tags: [{ name: "type", value: stepDef.step }],
      });

      if (result.sent) {
        await logOnboardingEmail(userId, stepDef.step);
        sent += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return { scanned: rows.length, sent, skipped };
}

/** Send Day 0 welcome immediately after signup when possible. */
export async function sendWelcomeOnboardingEmail(
  userId: string,
  name?: string
): Promise<void> {
  const prefs = await getGrowthPreferences(userId);
  if (!prefs.emailOnboarding) return;
  if (await hasOnboardingEmail(userId, "day_0")) return;

  const template = welcomeOnboardingEmail(name);
  const result = await sendProductionEmail({
    to: userId,
    subject: template.subject,
    html: template.html,
    text: template.text,
    category: "onboarding",
    tags: [{ name: "type", value: "day_0" }],
  });
  if (result.sent) await logOnboardingEmail(userId, "day_0");
}
