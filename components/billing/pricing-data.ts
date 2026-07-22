import type { BillingCurrency } from "@/lib/billing/currency";
import {
  getInrChargeAmount,
  getInrPriceLabel,
  getUsdChargeAmount,
  getUsdPriceLabel,
} from "@/lib/billing/pricing-amounts";
import { formatInrPaise } from "@/lib/billing/exchange-rate";

export type BillingPeriod = "monthly" | "yearly";

export type PlanId = "free" | "trial" | "starter" | "pro" | "enterprise";

export type PaidPlanId = "starter" | "pro";

export type PlanDisplayConfig = {
  priceLabel: string;
  priceSuffix: string;
  billingNote?: string;
  saveNote?: string;
  compareAtLabel?: string;
  chargeAmount: number;
};

export const YEARLY_DISCOUNT = 0.15;

function buildPlanDisplayConfig(
  currency: BillingCurrency,
  period: BillingPeriod,
  planId: PaidPlanId
): PlanDisplayConfig {
  const chargeAmount =
    currency === "USD"
      ? getUsdChargeAmount(planId, period)
      : getInrChargeAmount(planId, period);

  const priceLabel =
    currency === "USD"
      ? getUsdPriceLabel(planId, period)
      : getInrPriceLabel(planId, period);

  const priceSuffix = period === "yearly" ? "/year" : "/month";

  if (period === "yearly") {
    const fullYearCents =
      currency === "USD"
        ? getUsdChargeAmount(planId, "monthly") * 12
        : getInrChargeAmount(planId, "monthly") * 12;

    const compareAtLabel =
      currency === "USD"
        ? `$${(fullYearCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
        : formatInrPaise(fullYearCents);

    return {
      priceLabel,
      priceSuffix,
      billingNote: "Billed yearly",
      saveNote: "Save 15% with annual billing",
      compareAtLabel,
      chargeAmount,
    };
  }

  return { priceLabel, priceSuffix, chargeAmount };
}

/** Display prices per currency. Razorpay plan IDs are configured via server env vars. */
export const BILLING_PRICING: Record<
  BillingCurrency,
  Record<BillingPeriod, Record<PaidPlanId, PlanDisplayConfig>>
> = {
  USD: {
    monthly: {
      pro: buildPlanDisplayConfig("USD", "monthly", "pro"),
      starter: buildPlanDisplayConfig("USD", "monthly", "starter"),
    },
    yearly: {
      pro: buildPlanDisplayConfig("USD", "yearly", "pro"),
      starter: buildPlanDisplayConfig("USD", "yearly", "starter"),
    },
  },
  INR: {
    monthly: {
      pro: buildPlanDisplayConfig("INR", "monthly", "pro"),
      starter: buildPlanDisplayConfig("INR", "monthly", "starter"),
    },
    yearly: {
      pro: buildPlanDisplayConfig("INR", "yearly", "pro"),
      starter: buildPlanDisplayConfig("INR", "yearly", "starter"),
    },
  },
};

export type PlanPriceConfig = PlanDisplayConfig;

export type PricingPlan = {
  id: PlanId;
  name: string;
  description: string;
  priceLabel: string;
  priceSuffix: string;
  billingNote?: string;
  saveNote?: string;
  compareAtLabel?: string;
  chargeAmount?: number | null;
  monthlyPrice: number | null;
  badge?: string;
  recommended?: boolean;
  features: string[];
  cta: string;
  ctaVariant: "outline" | "primary" | "gradient" | "enterprise";
};

const PRICING_PLAN_TEMPLATES: Omit<
  PricingPlan,
  | "priceLabel"
  | "priceSuffix"
  | "billingNote"
  | "saveNote"
  | "compareAtLabel"
  | "chargeAmount"
>[] = [
  {
    id: "free",
    name: "Free",
    description: "Start with a 14-day trial — no credit card required",
    monthlyPrice: 0,
    features: [
      "14-day free trial",
      "100 AI Credits",
      "1 Gmail Account",
      "1 Workspace",
      "Basic AI features",
      "No credit card required",
    ],
    cta: "Start Free 14-Day Trial",
    ctaVariant: "outline",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For operators who run their business on Actora",
    monthlyPrice: 25,
    badge: "Most Popular",
    recommended: true,
    features: [
      "5,000 AI Credits / billing cycle",
      "Up to 5 Gmail Accounts",
      "Full Roxx AI",
      "CRM",
      "Calendar",
      "Tasks",
      "Automations",
      "Analytics",
      "Priority Support",
    ],
    cta: "Upgrade to Pro",
    ctaVariant: "gradient",
  },
  {
    id: "starter",
    name: "Team",
    description: "Collaborate across your entire revenue team",
    monthlyPrice: 69,
    features: [
      "Everything in Pro",
      "50,000 AI Credits / billing cycle",
      "Unlimited Gmail Accounts",
      "Unlimited Team Members",
      "Shared Inbox",
      "Shared CRM",
      "Team Analytics",
      "Admin Roles & Permissions",
      "Priority AI processing",
      "API Access (future-ready)",
    ],
    cta: "Upgrade to Team",
    ctaVariant: "primary",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Security, scale, and white-glove support",
    monthlyPrice: null,
    features: [
      "Everything in Team",
      "Unlimited AI Usage",
      "Dedicated Account Manager",
      "SLA",
      "SSO",
      "Custom Integrations",
      "Priority Engineering Support",
    ],
    cta: "Contact Sales",
    ctaVariant: "enterprise",
  },
];

export function getPlanPriceConfig(
  currency: BillingCurrency,
  period: BillingPeriod,
  planId: PaidPlanId
): PlanPriceConfig {
  return BILLING_PRICING[currency][period][planId];
}

export function getDisplayPlans(
  currency: BillingCurrency,
  period: BillingPeriod
): PricingPlan[] {
  return PRICING_PLAN_TEMPLATES.map((template) => {
    if (template.id === "free" || template.id === "trial") {
      return {
        ...template,
        priceLabel: currency === "INR" ? "₹0" : "$0",
        priceSuffix: "/month",
        chargeAmount: null,
      };
    }

    if (template.id === "enterprise") {
      return {
        ...template,
        priceLabel: "Custom",
        priceSuffix: " Pricing",
        chargeAmount: null,
      };
    }

    const priceConfig = getPlanPriceConfig(
      currency,
      period,
      template.id as PaidPlanId
    );
    return {
      ...template,
      priceLabel: priceConfig.priceLabel,
      priceSuffix: priceConfig.priceSuffix,
      billingNote: priceConfig.billingNote,
      saveNote: priceConfig.saveNote,
      compareAtLabel: priceConfig.compareAtLabel,
      chargeAmount: priceConfig.chargeAmount,
    };
  });
}

/** @deprecated Use getDisplayPlans(currency, period) for billing UI */
export const PRICING_PLANS: PricingPlan[] = getDisplayPlans("USD", "monthly");

export function getPlanById(
  id: PlanId,
  currency: BillingCurrency = "USD",
  period: BillingPeriod = "monthly"
): PricingPlan | undefined {
  return getDisplayPlans(currency, period).find((plan) => plan.id === id);
}

export type ComparisonValue = boolean | string;

export type ComparisonRow = {
  label: string;
  free: ComparisonValue;
  pro: ComparisonValue;
  team: ComparisonValue;
  enterprise: ComparisonValue;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Gmail Accounts", free: "1", pro: "5", team: "Unlimited", enterprise: "Unlimited" },
  { label: "AI Credits / cycle", free: "100", pro: "5,000", team: "50,000", enterprise: "Unlimited" },
  { label: "AI Inbox", free: "Basic", pro: true, team: true, enterprise: true },
  { label: "CRM", free: "Basic", pro: true, team: true, enterprise: true },
  { label: "Automations", free: false, pro: true, team: true, enterprise: true },
  { label: "Meetings", free: false, pro: true, team: true, enterprise: true },
  { label: "Analytics", free: false, pro: true, team: true, enterprise: true },
  { label: "Shared Inbox", free: false, pro: false, team: true, enterprise: true },
  { label: "Team Members", free: "1", pro: "1", team: "Unlimited", enterprise: "Unlimited" },
  { label: "SSO", free: false, pro: false, team: false, enterprise: true },
  { label: "Priority Support", free: false, pro: true, team: true, enterprise: true },
  { label: "Dedicated Manager", free: false, pro: false, team: false, enterprise: true },
];

export const BILLING_FAQ = [
  {
    question: "What happens if I cancel?",
    answer:
      "You keep access until the end of your billing period. After that, your workspace moves to the Free plan and premium features are paused.",
  },
  {
    question: "Can I upgrade anytime?",
    answer:
      "Yes. Upgrades take effect immediately through Razorpay checkout. Downgrades apply at your next renewal date.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We handle refund requests case by case. Contact support within 7 days of a charge if something went wrong.",
  },
  {
    question: "How many Gmail accounts can I connect?",
    answer:
      "Free includes 1 inbox. Pro includes 20 Gmail accounts. Team and above include unlimited Gmail accounts.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely. Move between Pro and Team anytime from this page — upgrades open checkout, downgrades apply at renewal.",
  },
];
