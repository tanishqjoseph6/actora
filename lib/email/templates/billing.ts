import { getAppUrl } from "@/lib/email/config";
import { actoraEmailLayout } from "@/lib/email/templates/layout";

export function buildBillingPaymentEmail(input: {
  planName: string;
  billingInterval: string;
  amountLabel: string;
}) {
  return {
    subject: `Payment received — ${input.planName} plan`,
    html: actoraEmailLayout({
      eyebrow: "ACTORA · BILLING",
      heading: "Payment confirmed",
      body: `Thank you! We received your payment of ${input.amountLabel} for the ${input.planName} plan (${input.billingInterval}). Your subscription is now active.`,
      ctaLabel: "View billing",
      ctaHref: `${getAppUrl()}/billing`,
    }),
  };
}

export function buildCreditPurchaseEmail(input: {
  packName: string;
  credits: number;
  amountLabel: string;
}) {
  return {
    subject: "AI credits added to your account",
    html: actoraEmailLayout({
      eyebrow: "ACTORA · AI CREDITS",
      heading: "Credits purchase confirmed",
      body: `Your ${input.packName} pack (${input.credits.toLocaleString("en-US")} AI credits) is ready. We charged ${input.amountLabel}.`,
      ctaLabel: "Open dashboard",
      ctaHref: `${getAppUrl()}/dashboard`,
    }),
  };
}
