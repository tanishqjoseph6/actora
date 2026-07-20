import type { EmailInsights } from "@/lib/openai";

const cache = new Map<string, EmailInsights>();

export function getCachedInsights(emailId: string): EmailInsights | null {
  return cache.get(emailId) ?? null;
}

export function setCachedInsights(emailId: string, insights: EmailInsights) {
  cache.set(emailId, insights);
}

export function clearInsightsCache(emailId?: string) {
  if (emailId) cache.delete(emailId);
  else cache.clear();
}
