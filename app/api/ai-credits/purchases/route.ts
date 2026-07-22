import { NextResponse } from "next/server";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import { listCreditPurchases } from "@/lib/ai-credits/purchases";
import { getAiCreditPack } from "@/lib/ai-credits/packs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getApiUserEmail();
  if (!userId) return unauthenticatedJsonResponse();

  const url = new URL(request.url);
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20)
  );

  const purchases = await listCreditPurchases(userId, limit);

  return NextResponse.json({
    purchases: purchases.map((p) => ({
      id: p.id,
      packId: p.packId,
      packName: getAiCreditPack(p.packId)?.name ?? p.packId,
      credits: p.credits,
      amount: p.amount,
      currency: p.currency,
      paymentId: p.razorpayPaymentId,
      orderId: p.razorpayOrderId,
      status: p.status,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    })),
  });
}
