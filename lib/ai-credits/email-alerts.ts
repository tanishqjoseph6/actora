import "server-only";

import type { AiCreditUsageMilestone } from "./milestones";
import { sendProductionEmail } from "@/lib/email/send";
import { buildAiCreditUsageEmail } from "@/lib/email/templates/ai-credits";

export async function sendAiCreditUsageEmail(
  to: string,
  milestone: AiCreditUsageMilestone
): Promise<{ sent: boolean; skipped?: string }> {
  const template = buildAiCreditUsageEmail(milestone);
  const result = await sendProductionEmail({
    to,
    subject: template.subject,
    html: template.html,
    category: "ai_credit_usage",
    tags: [
      { name: "category", value: "ai_credit_usage" },
      { name: "milestone", value: String(milestone) },
    ],
  });

  if (result.skipped === "missing_resend_api_key") {
    console.warn("[ai-credits/email] Edge Function RESEND_API_KEY not set", {
      to,
      milestone,
    });
    return { sent: false, skipped: "missing_resend_api_key" };
  }

  if (!result.sent) {
    throw new Error(result.error ?? "AI credit usage email failed.");
  }

  return { sent: true };
}
