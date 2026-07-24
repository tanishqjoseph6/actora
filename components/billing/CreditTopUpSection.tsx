"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Check, Sparkles, Zap } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  AI_CREDIT_PACKS,
  formatAiCreditPackPrice,
  type AiCreditPack,
  type AiCreditPackId,
} from "@/lib/ai-credits/packs";
import type { BillingCurrency } from "@/lib/billing/currency";
import { useBillingCurrency } from "@/hooks/useBillingCurrency";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import type { RazorpayOrderPaymentResponse } from "@/types/razorpay";
import type { PaymentToastState } from "@/components/billing/PaymentToast";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay."))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });
}

type PurchaseHistoryItem = {
  id: string;
  packId: string;
  packName: string;
  credits: number;
  amount: number;
  currency: BillingCurrency;
  paymentId: string | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
};

type CreditTopUpSectionProps = {
  subscription: SubscriptionSnapshot | null;
  onPurchaseSuccess?: () => void | Promise<void>;
  onToast?: (toast: PaymentToastState) => void;
};

export function CreditTopUpSection({
  subscription,
  onPurchaseSuccess,
  onToast,
}: CreditTopUpSectionProps) {
  const { data: session } = useSession();
  const { currency } = useBillingCurrency();
  const [selected, setSelected] = useState<AiCreditPackId>("pro");
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    packName: string;
    credits: number;
  } | null>(null);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const busyRef = useRef(false);

  const monthlyRemaining =
    subscription?.usage.monthlyCreditsRemaining ??
    Math.max(
      0,
      (subscription?.usage.aiCreditsAllotment ??
        subscription?.limits.aiActionsPerMonth ??
        0) - (subscription?.usage.aiActionsUsed ?? 0)
    );
  const purchasedRemaining =
    subscription?.usage.purchasedCreditsRemaining ?? 0;

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-credits/purchases?limit=10");
      if (!res.ok) return;
      const body = (await res.json()) as { purchases: PurchaseHistoryItem[] };
      setHistory(body.purchases ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const buyPack = useCallback(
    async (pack: AiCreditPack) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBuying(true);
      setError(null);
      setSelected(pack.id);

      try {
        const orderRes = await fetch("/api/ai-credits/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId: pack.id, currency }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error ?? "Failed to start checkout.");
        }

        await loadRazorpayScript();
        if (!window.Razorpay) {
          throw new Error("Razorpay failed to load.");
        }

        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Actora",
            description: orderData.description,
            order_id: orderData.orderId,
            prefill: {
              name: session?.user?.name,
              email: session?.user?.email,
            },
            theme: { color: "#3B82F6" },
            handler: (response) => {
              void (async () => {
                try {
                  const payment = response as RazorpayOrderPaymentResponse;
                  const verifyRes = await fetch("/api/ai-credits/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      razorpay_order_id: payment.razorpay_order_id,
                      razorpay_payment_id: payment.razorpay_payment_id,
                      razorpay_signature: payment.razorpay_signature,
                      packId: pack.id,
                    }),
                  });
                  const verifyData = await verifyRes.json();
                  if (!verifyRes.ok) {
                    throw new Error(
                      verifyData.error ?? "Payment verification failed."
                    );
                  }
                  setSuccess({
                    packName: pack.name,
                    credits: pack.credits,
                  });
                  onToast?.({
                    type: "success",
                    title: "Credits added",
                    message: `${pack.credits.toLocaleString("en-US")} credits are ready to use.`,
                  });
                  await onPurchaseSuccess?.();
                  await loadHistory();
                  resolve();
                } catch (err) {
                  reject(err);
                }
              })();
            },
            modal: {
              ondismiss: () => {
                onToast?.({
                  type: "info",
                  title: "Payment cancelled",
                  message: "Checkout was closed before payment completed.",
                });
                resolve();
              },
            },
          });

          rzp.on("payment.failed", (response) => {
            const message =
              response.error?.description ??
              "Payment failed. Please try again.";
            onToast?.({
              type: "error",
              title: "Payment failed",
              message,
            });
            reject(new Error(message));
          });

          rzp.open();
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Checkout failed.";
        setError(message);
        onToast?.({
          type: "error",
          title: "Checkout error",
          message,
        });
      } finally {
        busyRef.current = false;
        setBuying(false);
      }
    },
    [
      currency,
      loadHistory,
      onPurchaseSuccess,
      onToast,
      session?.user?.email,
      session?.user?.name,
    ]
  );

  const packs = useMemo(() => AI_CREDIT_PACKS, []);

  return (
    <section id="ai-credits" className="relative scroll-mt-24">
      <div className="mb-8 text-center sm:text-left">
        <p className={`text-sm font-medium ${dashboard.accent} mb-2`}>
          AI Credits
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Buy AI Credits
        </h2>
        <p className={`mt-2 text-sm sm:text-base ${dashboard.muted} max-w-xl`}>
          Top up anytime. Purchased credits stack on your monthly plan allotment and
          are used after monthly credits are exhausted.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={`${dashboard.cardBase} p-4`}>
          <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle}`}>
            Monthly credits
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-white">
            {Number.isFinite(monthlyRemaining)
              ? monthlyRemaining.toLocaleString("en-IN")
              : "Unlimited"}
          </p>
          <p className={`mt-1 text-xs ${dashboard.subtle}`}>
            Consumed first each billing cycle
          </p>
        </div>
        <div className={`${dashboard.cardBase} p-4`}>
          <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle}`}>
            Purchased credits
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-white">
            {purchasedRemaining.toLocaleString("en-IN")}
          </p>
          <p className={`mt-1 text-xs ${dashboard.subtle}`}>
            Used after monthly credits are exhausted
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {packs.map((pack) => {
          const active = selected === pack.id;
          const price = formatAiCreditPackPrice(pack.id, currency);
          return (
            <motion.div
              key={pack.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelected(pack.id)}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-[20px] border bg-[#111111] p-5 text-left transition-all duration-300",
                active
                  ? "border-[#3B82F6]/70 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_0_40px_rgba(59,130,246,0.18)]"
                  : "border-white/[0.06] hover:border-[#3B82F6]/40"
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#3B82F6]/20 blur-2xl transition-opacity",
                  active || pack.highlight ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                )}
              />

              <div className="relative flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-white">{pack.name}</p>
                  <p className={`mt-1 text-xs ${dashboard.muted}`}>
                    {pack.description}
                  </p>
                </div>
                {pack.badge && (
                  <span className="shrink-0 rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/15 px-2 py-0.5 text-[10px] font-semibold text-[#93C5FD]">
                    {pack.badge}
                  </span>
                )}
              </div>

              {pack.highlight === "most_popular" && (
                <span className="relative mt-3 inline-flex items-center gap-1 rounded-full border border-[#3B82F6]/35 bg-[#3B82F6]/10 px-2.5 py-1 text-[10px] font-medium text-[#93C5FD]">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </span>
              )}
              {pack.highlight === "best_value" && (
                <span className="relative mt-3 inline-flex items-center gap-1 rounded-full border border-[#2563EB]/40 bg-[#2563EB]/15 px-2.5 py-1 text-[10px] font-medium text-[#93C5FD]">
                  <Zap className="h-3 w-3" />
                  Best Value
                </span>
              )}

              <p className="relative mt-5 text-3xl font-bold tracking-tight text-white">
                {price}
              </p>
              <p className={`relative mt-1 text-sm tabular-nums ${dashboard.muted}`}>
                {pack.credits.toLocaleString("en-US")} AI Credits
              </p>

              <button
                type="button"
                disabled={buying}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(pack.id);
                  void buyPack(pack);
                }}
                className={cn(
                  dashboard.btnPrimary,
                  "relative mt-5 w-full px-4 py-2.5 text-sm disabled:opacity-60"
                )}
              >
                {buying && selected === pack.id ? "Processing…" : "Buy Now"}
              </button>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className={`${dashboard.cardLg} mt-8 p-4 sm:p-5`}>
        <h3 className="text-sm font-semibold text-white mb-3">
          Credit purchase history
        </h3>
        {history.length === 0 ? (
          <p className={`text-sm ${dashboard.muted} py-4 text-center`}>
            No credit purchases yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className={`border-b border-white/[0.06] text-xs ${dashboard.subtle}`}>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Credits</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Payment ID</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="py-2.5 tabular-nums text-[#A1A1AA]">
                      {new Date(row.paidAt ?? row.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-white">
                      {row.credits.toLocaleString("en-US")} · {row.packName}
                    </td>
                    <td className="py-2.5 tabular-nums text-white">
                      {row.currency === "USD"
                        ? `$${(row.amount / 100).toFixed(2)}`
                        : `₹${Math.round(row.amount / 100).toLocaleString("en-IN")}`}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-[#A1A1AA]">
                      {row.paymentId ?? "—"}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          row.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : row.status === "failed"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-white/5 text-[#A1A1AA]"
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {success && (
          <SuccessModal
            packName={success.packName}
            credits={success.credits}
            onClose={() => setSuccess(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function SuccessModal({
  packName,
  credits,
  onClose,
}: {
  packName: string;
  credits: number;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-[#3B82F6]/30 bg-[#0A0A0A] p-8 shadow-2xl shadow-blue-500/20"
          role="dialog"
          aria-modal
          aria-labelledby="credit-purchase-success"
        >
          <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#3B82F6]/25 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 16 }}
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
            >
              <Check className="h-8 w-8" strokeWidth={2.5} />
            </motion.div>
            <h3
              id="credit-purchase-success"
              className="text-2xl font-bold text-white"
            >
              Credits added
            </h3>
            <p className={`mt-2 text-sm ${dashboard.muted}`}>
              <span className="font-semibold text-white">
                {credits.toLocaleString("en-US")}
              </span>{" "}
              AI credits from {packName} are ready to use alongside your monthly
              allotment.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`${dashboard.btnPrimary} mt-6 px-6 py-2.5 text-sm`}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
