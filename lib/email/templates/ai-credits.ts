import type { AiCreditUsageMilestone } from "@/lib/ai-credits/milestones";
import {
  milestoneMessage,
  milestoneTitle,
} from "@/lib/ai-credits/milestones";
import { getAppUrl } from "@/lib/email/config";
import { actoraEmailLayout } from "@/lib/email/templates/layout";

export function buildAiCreditUsageEmail(milestone: AiCreditUsageMilestone) {
  const message = milestoneMessage(milestone);
  return {
    subject: milestoneTitle(milestone),
    html: actoraEmailLayout({
      eyebrow: "ACTORA · AI CREDITS",
      heading: milestoneTitle(milestone),
      body: message,
      ctaLabel: "Manage AI credits",
      ctaHref: `${getAppUrl()}/billing#ai-credits`,
    }),
  };
}
