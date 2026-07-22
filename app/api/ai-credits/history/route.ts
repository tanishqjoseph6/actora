import { NextResponse } from "next/server";
import { getApiUserEmail, unauthenticatedJsonResponse } from "@/lib/auth/get-api-user";
import { getAiCreditLedger } from "@/lib/ai-credits/consume";
import { AI_CREDIT_FEATURE_LABELS, isAiCreditFeature } from "@/lib/ai-credits/costs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getApiUserEmail();
  if (!userId) return unauthenticatedJsonResponse();

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 40) || 40)
  );

  const entries = await getAiCreditLedger(userId, limit);

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      feature: e.feature,
      featureLabel: isAiCreditFeature(e.feature)
        ? AI_CREDIT_FEATURE_LABELS[e.feature]
        : e.feature,
      credits: e.credits,
      balanceAfter: e.balanceAfter,
      user: e.userId,
      createdAt: e.createdAt,
    })),
  });
}
