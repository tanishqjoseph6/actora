import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { listBillingPayments } from "@/lib/billing/payment-repository";
import { formatChargeAmount } from "@/lib/billing/pricing";
import { getPlanDisplayName } from "@/lib/subscription/plans";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const userId = normalizeSubscriptionUserId(email);
  const payments = await listBillingPayments(userId, 50);
  const payment = payments.find((row) => row.id === id);

  if (!payment) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const planName = getPlanDisplayName(payment.planId);
  const amount = formatChargeAmount(payment.amount, payment.currency);
  const date = new Date(payment.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Actora Invoice — ${planName}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #05070B; color: #e5e7eb; padding: 40px; }
    .card { max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1E293B; border-radius: 16px; padding: 32px; }
    h1 { color: #fff; margin: 0 0 8px; font-size: 24px; }
    .muted { color: #94A3B8; font-size: 14px; }
    .row { display: flex; justify-content: space-between; margin: 16px 0; padding: 12px 0; border-bottom: 1px solid #1E293B; }
    .total { font-size: 20px; font-weight: 700; color: #3B82F6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Actora</h1>
    <p class="muted">Invoice / Receipt</p>
    <div class="row"><span>Plan</span><strong>${planName}</strong></div>
    <div class="row"><span>Billing</span><strong>${payment.billingInterval}</strong></div>
    <div class="row"><span>Date</span><strong>${date}</strong></div>
    <div class="row"><span>Payment ID</span><strong>${payment.razorpayPaymentId ?? "—"}</strong></div>
    <div class="row"><span>Status</span><strong>${payment.status}</strong></div>
    <div class="row total"><span>Amount</span><span>${amount}</span></div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="actora-invoice-${id}.html"`,
    },
  });
}
