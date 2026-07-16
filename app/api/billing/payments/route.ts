import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { listBillingPayments } from "@/lib/billing/payment-repository";
import { formatChargeAmount } from "@/lib/billing/pricing";
import { getPlanDisplayName } from "@/lib/subscription/plans";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const payments = await listBillingPayments(userId);

  return NextResponse.json({
    payments: payments.map((payment) => ({
      id: payment.id,
      date: payment.createdAt,
      plan: getPlanDisplayName(payment.planId),
      planId: payment.planId,
      billingInterval: payment.billingInterval,
      amount: formatChargeAmount(payment.amount, payment.currency),
      amountRaw: payment.amount,
      currency: payment.currency,
      status: payment.status === "paid" ? "Paid" : payment.status,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,
    })),
  });
}
