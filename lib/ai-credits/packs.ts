import type { BillingCurrency } from "@/lib/billing/currency";
import { getUsdInrExchangeRate } from "@/lib/billing/exchange-rate";

export const AI_CREDIT_PACK_IDS = [
  "starter",
  "growth",
  "pro",
  "enterprise",
] as const;

export type AiCreditPackId = (typeof AI_CREDIT_PACK_IDS)[number];

export type AiCreditPack = {
  id: AiCreditPackId;
  name: string;
  credits: number;
  /** USD price in cents */
  usdCents: number;
  badge?: "5% OFF";
  highlight?: "most_popular" | "best_value";
  description: string;
};

export const AI_CREDIT_PACKS: AiCreditPack[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 1_000,
    usdCents: 400,
    description: "A light top-up for occasional AI bursts.",
  },
  {
    id: "growth",
    name: "Growth",
    credits: 5_000,
    usdCents: 900,
    description: "Keep Roxx AI and inbox automation flowing.",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 10_000,
    usdCents: 1500,
    badge: "5% OFF",
    highlight: "most_popular",
    description: "Best for daily AI-powered operators.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 50_000,
    usdCents: 2200,
    badge: "5% OFF",
    highlight: "best_value",
    description: "Maximum runway for teams and heavy workflows.",
  },
];

export function getAiCreditPack(packId: string): AiCreditPack | null {
  return AI_CREDIT_PACKS.find((p) => p.id === packId) ?? null;
}

export function isAiCreditPackId(value: string): value is AiCreditPackId {
  return (AI_CREDIT_PACK_IDS as readonly string[]).includes(value);
}

/** Charge amount in the currency's smallest unit (cents / paise). */
export function getAiCreditPackAmount(
  packId: AiCreditPackId,
  currency: BillingCurrency
): number {
  const pack = getAiCreditPack(packId);
  if (!pack) return 0;
  if (currency === "USD") return pack.usdCents;
  return Math.round(pack.usdCents * getUsdInrExchangeRate());
}

export function formatAiCreditPackPrice(
  packId: AiCreditPackId,
  currency: BillingCurrency
): string {
  const amount = getAiCreditPackAmount(packId, currency);
  if (currency === "USD") {
    return `$${(amount / 100).toLocaleString("en-US", {
      minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${Math.round(amount / 100).toLocaleString("en-IN")}`;
}
