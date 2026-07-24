import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { listBillingPayments } from "@/lib/billing/payment-repository";
import { formatChargeAmount } from "@/lib/billing/pricing";
import { getAiCreditPack } from "@/lib/ai-credits/packs";
import { listCreditPurchases } from "@/lib/ai-credits/purchases";
import { getPlanDisplayName } from "@/lib/subscription/plans";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export type UnifiedPaymentRow = {
  id: string;
  date: string;
  type: "Subscription" | "Credit Pack";
  label: string;
  amount: string;
  amountRaw: number;
  currency: string;
  status: string;
  paymentId: string | null;
  invoiceId: string | null;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);

  const [subscriptionPayments, creditPurchases] = await Promise.all([
    listBillingPayments(userId, 50),
    listCreditPurchases(userId, 50),
  ]);

  const rows: UnifiedPaymentRow[] = [
    ...subscriptionPayments.map((payment) => ({
      id: `sub-${payment.id}`,
      date: payment.createdAt,
      type: "Subscription" as const,
      label: `${getPlanDisplayName(payment.planId)} (${payment.billingInterval})`,
      amount: formatChargeAmount(payment.amount, payment.currency),
      amountRaw: payment.amount,
      currency: payment.currency,
      status: payment.status === "paid" ? "Paid" : payment.status,
      paymentId: payment.razorpayPaymentId,
      invoiceId: payment.id,
    })),
    ...creditPurchases
      .filter((p) => p.status === "paid" || p.status === "failed")
      .map((purchase) => {
        const pack = getAiCreditPack(purchase.packId);
        return {
          id: `credit-${purchase.id}`,
          date: purchase.paidAt ?? purchase.createdAt,
          type: "Credit Pack" as const,
          label:
            pack?.name ??
            `${purchase.credits.toLocaleString("en-US")} Credits`,
          amount: formatChargeAmount(purchase.amount, purchase.currency),
          amountRaw: purchase.amount,
          currency: purchase.currency,
          status:
            purchase.status === "paid"
              ? "Paid"
              : purchase.status === "failed"
                ? "Failed"
                : purchase.status,
          paymentId: purchase.razorpayPaymentId,
          invoiceId: null,
        };
      }),
  ];

  rows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return NextResponse.json({
    payments: rows.slice(0, 50),
  });
}
