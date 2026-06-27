export type BillingPeriod = "monthly" | "yearly";

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type PricingPlan = {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number | null;
  badge?: string;
  recommended?: boolean;
  features: string[];
  cta: string;
  ctaVariant: "outline" | "primary" | "gradient" | "enterprise";
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with inbox automation",
    monthlyPrice: 0,
    features: [
      "50 AI actions/month",
      "1 inbox",
      "Basic email drafts",
      "Community support",
    ],
    cta: "Start Free",
    ctaVariant: "outline",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for growing businesses",
    monthlyPrice: 19,
    badge: "Best for startups",
    features: [
      "1,000 AI actions/month",
      "3 inboxes",
      "Smart drafts",
      "Meeting summaries",
      "Priority support",
    ],
    cta: "Upgrade",
    ctaVariant: "primary",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For power users & teams",
    monthlyPrice: 49,
    badge: "Recommended",
    recommended: true,
    features: [
      "Unlimited AI actions",
      "Unlimited inboxes",
      "AI automations",
      "AI Morning Brief",
      "Team collaboration",
      "Priority support",
    ],
    cta: "Upgrade",
    ctaVariant: "gradient",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large teams & organizations",
    monthlyPrice: null,
    features: [
      "Unlimited everything",
      "Team workspaces",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    ctaVariant: "enterprise",
  },
];

export const YEARLY_DISCOUNT = 0.15;

export function getPlanById(id: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
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
