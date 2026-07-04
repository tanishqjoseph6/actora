import type { BillingCurrency } from "@/lib/billing/currency";

export type BillingPeriod = "monthly" | "yearly";

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type PaidPlanId = "starter" | "pro";

/** Razorpay dashboard plan IDs — keyed by app plan + billing period only. */
export const RAZORPAY_PLAN_IDS: Record<PaidPlanId, Record<BillingPeriod, string>> = {
  pro: {
    monthly: "plan_T9Vz1oIg5vt4Ux",
    yearly: "plan_T9WNoB4e66qhpd",
  },
  starter: {
    monthly: "plan_T9W0MDNq5d0tGJ",
    yearly: "plan_T9WPxsmgqBlvi6",
  },
};

export type PlanDisplayConfig = {
  priceLabel: string;
  priceSuffix: string;
  billingNote?: string;
  saveNote?: string;
  chargeAmount: number;
};

/** Display prices per currency. Razorpay plan IDs come from RAZORPAY_PLAN_IDS. */
export const BILLING_PRICING: Record<
  BillingCurrency,
  Record<BillingPeriod, Record<PaidPlanId, PlanDisplayConfig>>
> = {
  USD: {
    monthly: {
      pro: {
        priceLabel: "$25",
        priceSuffix: "/month",
        chargeAmount: 2500,
      },
      starter: {
        priceLabel: "$299",
        priceSuffix: "/month",
        chargeAmount: 29900,
      },
    },
    yearly: {
      pro: {
        priceLabel: "$255",
        priceSuffix: "/year",
        billingNote: "Billed yearly",
        saveNote: "Save 15% with annual billing",
        chargeAmount: 25500,
      },
      starter: {
        priceLabel: "$3,049",
        priceSuffix: "/year",
        billingNote: "Billed yearly",
        saveNote: "Save 15% with annual billing",
        chargeAmount: 304900,
      },
    },
  },
  INR: {
    monthly: {
      pro: {
        priceLabel: "₹2,199",
        priceSuffix: "/month",
        chargeAmount: 219900,
      },
      starter: {
        priceLabel: "₹24,999",
        priceSuffix: "/month",
        chargeAmount: 2499900,
      },
    },
    yearly: {
      pro: {
        priceLabel: "₹22,429",
        priceSuffix: "/year",
        billingNote: "Billed yearly",
        saveNote: "Save 15% with annual billing",
        chargeAmount: 2242900,
      },
      starter: {
        priceLabel: "₹254,990",
        priceSuffix: "/year",
        billingNote: "Billed yearly",
        saveNote: "Save 15% with annual billing",
        chargeAmount: 25499000,
      },
    },
  },
};

export const YEARLY_DISCOUNT = 0.15;

export type PlanPriceConfig = PlanDisplayConfig & {
  razorpayPlanId: string;
};

export type PricingPlan = {
  id: PlanId;
  name: string;
  description: string;
  priceLabel: string;
  priceSuffix: string;
  billingNote?: string;
  saveNote?: string;
  chargeAmount?: number | null;
  razorpayPlanId?: string;
  monthlyPrice: number | null;
  badge?: string;
  recommended?: boolean;
  features: string[];
  cta: string;
  ctaVariant: "outline" | "primary" | "gradient" | "enterprise";
};

const PRICING_PLAN_TEMPLATES: Omit<
  PricingPlan,
  "priceLabel" | "priceSuffix" | "billingNote" | "saveNote" | "chargeAmount" | "razorpayPlanId"
>[] = [
  {
    id: "free",
    name: "Free",
    description: "Everything you need to get started",
    monthlyPrice: 0,
    features: [
      "1 Gmail Inbox",
      "AI Inbox",
      "Basic CRM",
      "100 AI Actions/month",
      "Community Support",
    ],
    cta: "Current Plan",
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
      "Unlimited Gmail Accounts",
      "AI Inbox",
      "CRM",
      "Pipeline",
      "Contacts",
      "Meetings",
      "Tasks",
      "Automations",
      "AI Assistant",
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
    monthlyPrice: 299,
    features: [
      "Everything in Pro",
      "Unlimited Team Members",
      "Shared Inbox",
      "Team Workspace",
      "Roles & Permissions",
      "Team Analytics",
      "Admin Dashboard",
      "Priority Onboarding",
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
  const display = BILLING_PRICING[currency][period][planId];
  return {
    ...display,
    razorpayPlanId: RAZORPAY_PLAN_IDS[planId][period],
  };
}

export function getRazorpayPlanId(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  return RAZORPAY_PLAN_IDS[planId][period];
}

export function getDisplayPlans(
  currency: BillingCurrency,
  period: BillingPeriod
): PricingPlan[] {
  return PRICING_PLAN_TEMPLATES.map((template) => {
    if (template.id === "free") {
      return {
        ...template,
        priceLabel: "$0",
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

    const priceConfig = getPlanPriceConfig(currency, period, template.id);
    return {
      ...template,
      priceLabel: priceConfig.priceLabel,
      priceSuffix: priceConfig.priceSuffix,
      billingNote: priceConfig.billingNote,
      saveNote: priceConfig.saveNote,
      chargeAmount: priceConfig.chargeAmount,
      razorpayPlanId: priceConfig.razorpayPlanId,
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

export const MOCK_BILLING_HISTORY = [
  {
    id: "inv_001",
    date: "Mar 1, 2026",
    plan: "Free",
    amount: "$0.00",
    status: "Paid" as const,
  },
  {
    id: "inv_002",
    date: "Feb 1, 2026",
    plan: "Free",
    amount: "$0.00",
    status: "Paid" as const,
  },
  {
    id: "inv_003",
    date: "Jan 1, 2026",
    plan: "Free",
    amount: "$0.00",
    status: "Paid" as const,
  },
];

export type ComparisonValue = boolean | string;

export type ComparisonRow = {
  label: string;
  free: ComparisonValue;
  pro: ComparisonValue;
  team: ComparisonValue;
  enterprise: ComparisonValue;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Gmail Accounts", free: "1", pro: "Unlimited", team: "Unlimited", enterprise: "Unlimited" },
  { label: "AI Inbox", free: true, pro: true, team: true, enterprise: true },
  { label: "CRM", free: "Basic", pro: true, team: true, enterprise: true },
  { label: "Automations", free: false, pro: true, team: true, enterprise: true },
  { label: "Meetings", free: false, pro: true, team: true, enterprise: true },
  { label: "Analytics", free: false, pro: true, team: true, enterprise: true },
  { label: "Shared Inbox", free: false, pro: false, team: true, enterprise: true },
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
      "Yes. Upgrades take effect immediately and are prorated through Razorpay checkout for supported currencies.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We handle refund requests case by case. Contact support within 7 days of a charge if something went wrong.",
  },
  {
    question: "How many Gmail accounts can I connect?",
    answer:
      "Free includes 1 inbox. Pro and above include unlimited Gmail accounts for your workspace.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely. Move between plans anytime from this page — upgrades open checkout, downgrades apply at renewal.",
  },
];
