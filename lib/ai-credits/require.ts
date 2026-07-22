import { NextResponse } from "next/server";
import { consumeAiCredits } from "@/lib/ai-credits/consume";
import type { AiCreditFeature } from "@/lib/ai-credits/costs";
import { canUseAiAction, subscriptionProvider } from "@/lib/subscription";

/**
 * Server-only gate: verify plan soft-check, then atomically consume credits.
 * Returns a NextResponse on failure, or the consume result on success.
 */
export async function requireAiCredits(
  userId: string,
  feature: AiCreditFeature,
  metadata?: Record<string, unknown>
) {
  const subscription = await subscriptionProvider.getSubscription(userId);
  const gate = canUseAiAction(subscription.planId, subscription.usage);
  if (!gate.allowed) {
    return {
      error: NextResponse.json(
        {
          error: gate.reason,
          code: "PLAN_LIMIT",
          limitType: gate.limitType,
          remaining: subscription.usage.aiCreditsRemaining ?? 0,
        },
        { status: 403 }
      ),
    };
  }

  const consumed = await consumeAiCredits(userId, feature, { metadata });
  if (!consumed.ok) {
    return {
      error: NextResponse.json(
        {
          error: consumed.reason,
          code: "PLAN_LIMIT",
          limitType: "ai_actions",
          remaining: consumed.remaining,
          allotment: consumed.allotment,
        },
        { status: 403 }
      ),
    };
  }

  return { consumed };
}

/** Same as requireAiCredits but returns a raw Response (for streaming routes). */
export async function requireAiCreditsResponse(
  userId: string,
  feature: AiCreditFeature,
  metadata?: Record<string, unknown>
): Promise<
  | { ok: true; remaining: number; allotment: number }
  | { ok: false; response: Response }
> {
  const subscription = await subscriptionProvider.getSubscription(userId);
  const gate = canUseAiAction(subscription.planId, subscription.usage);
  if (!gate.allowed) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: gate.reason,
          code: "PLAN_LIMIT",
          limitType: gate.limitType,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const consumed = await consumeAiCredits(userId, feature, { metadata });
  if (!consumed.ok) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: consumed.reason,
          code: "PLAN_LIMIT",
          limitType: "ai_actions",
          remaining: consumed.remaining,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return {
    ok: true,
    remaining: consumed.remaining,
    allotment: consumed.allotment,
  };
}
