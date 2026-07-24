import { getAppUrl } from "@/lib/email/config";
import { actoraEmailLayout } from "@/lib/email/templates/layout";

export type TrialEmailType = "day_0" | "day_7" | "day_12" | "day_14";

export const TRIAL_EMAIL_COPY: Record<
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

export function buildTrialEmail(type: TrialEmailType) {
  const copy = TRIAL_EMAIL_COPY[type];
  const href = type === "day_0" ? `${getAppUrl()}/dashboard` : `${getAppUrl()}/billing`;
  return {
    subject: copy.subject,
    html: actoraEmailLayout({
      heading: copy.heading,
      body: copy.body,
      ctaLabel: copy.cta,
      ctaHref: href,
    }),
  };
}
