export type BillingPeriod = "monthly" | "yearly";

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type PricingPlan = {
  id: PlanId;
  name: string;
  description: string;
  /** UI display price (checkout uses backend catalog for paid plans). */
  priceLabel: string;
  priceSuffix: string;
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
    description: "Everything you need to get started",
    priceLabel: "$0",
    priceSuffix: "/month",
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
    priceLabel: "$25",
    priceSuffix: "/month",
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
    priceLabel: "$299",
    priceSuffix: "/month",
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
    priceLabel: "Custom",
    priceSuffix: " Pricing",
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
