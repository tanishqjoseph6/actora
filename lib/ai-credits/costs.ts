/**
 * AI credit costs per feature. Every AI request deducts at least 1 credit.
 * Backend is the source of truth — never trust client-reported costs.
 */
export const AI_CREDIT_FEATURES = [
  "roxx_chat",
  "email_reply",
  "email_summary",
  "email_insights",
  "crm_insights",
  "automation_ai",
] as const;

export type AiCreditFeature = (typeof AI_CREDIT_FEATURES)[number];

export const AI_CREDIT_COSTS: Record<AiCreditFeature, number> = {
  roxx_chat: 1,
  email_reply: 1,
  email_summary: 1,
  email_insights: 1,
  crm_insights: 1,
  automation_ai: 1,
};

export const AI_CREDIT_FEATURE_LABELS: Record<AiCreditFeature, string> = {
  roxx_chat: "Roxx AI",
  email_reply: "AI Email Reply",
  email_summary: "AI Email Summary",
  email_insights: "AI Email Insights",
  crm_insights: "CRM AI Insights",
  automation_ai: "Automation AI",
};

export function getAiCreditCost(feature: AiCreditFeature): number {
  return AI_CREDIT_COSTS[feature] ?? 1;
}

export function isAiCreditFeature(value: string): value is AiCreditFeature {
  return (AI_CREDIT_FEATURES as readonly string[]).includes(value);
}
