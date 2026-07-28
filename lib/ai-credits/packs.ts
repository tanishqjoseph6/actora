import type { BillingCurrency } from "@/lib/billing/currency";
import { formatUsdCents } from "@/lib/billing/exchange-rate";
import {
  convertUsdCentsToInrPaise,
  getUsdChargeAmount,
} from "@/lib/billing/pricing-amounts";

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
  /** USD price in cents — single source of truth */
  usdCents: number;
  badge?: string;
  highlight?: "most_popular" | "best_value";
  description: string;
};

/** Production top-up packs — purchased credits stack on monthly allotment. */
export const AI_CREDIT_PACKS: AiCreditPack[] = [
  {
    id: "starter",
    name: "1,000 Credits",
    credits: 1_000,
    usdCents: 500,
    description: "Light top-up for occasional AI bursts.",
  },
  {
    id: "growth",
    name: "5,000 Credits",
    credits: 5_000,
    usdCents: 1900,
    description: "Keep Roxx AI and inbox automation flowing.",
  },
  {
    id: "pro",
    name: "10,000 Credits",
    credits: 10_000,
    usdCents: 3900,
    highlight: "most_popular",
    description: "Best for daily AI-powered operators.",
  },
  {
    id: "enterprise",
    name: "25,000 Credits",
    credits: 25_000,
    usdCents: 5000,
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

/** Display price in USD only — INR is shown at checkout via backend preview. */
export function formatAiCreditPackPrice(packId: AiCreditPackId): string {
  const pack = getAiCreditPack(packId);
  if (!pack) return "";
  return formatUsdCents(pack.usdCents);
}

/**
 * Server-side charge amount in the currency's smallest unit.
 * INR amounts use the live USD → INR exchange rate.
 */
export async function getAiCreditPackAmount(
  packId: AiCreditPackId,
  currency: BillingCurrency
): Promise<number> {
  const pack = getAiCreditPack(packId);
  if (!pack) return 0;
  if (currency === "USD") return pack.usdCents;
  const { paise } = await convertUsdCentsToInrPaise(pack.usdCents);
  return paise;
}

export function getAiCreditPackUsdCents(packId: AiCreditPackId): number {
  return getAiCreditPack(packId)?.usdCents ?? 0;
}
