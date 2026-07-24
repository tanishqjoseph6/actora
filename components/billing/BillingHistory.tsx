"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type PaymentRow = {
  id: string;
  date: string;
  type: "Subscription" | "Credit Pack";
  label: string;
  amount: string;
  status: string;
  paymentId: string | null;
  invoiceId: string | null;
};

function formatPaymentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "paid") {
    return "bg-emerald-500/15 border-emerald-400/25 text-emerald-400";
  }
  if (normalized === "failed") {
    return "bg-red-500/15 border-red-400/25 text-red-300";
  }
  return "bg-white/5 border-white/10 text-[#A1A1AA]";
}

type BillingHistoryTableProps = {
  refreshKey?: number;
};

export function BillingHistoryTable({ refreshKey = 0 }: BillingHistoryTableProps) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/payments", {
        cache: "no-store",
      });
      const data = (await response.json()) as { payments?: PaymentRow[] };
      setPayments(
        (data.payments ?? []).map((row) => ({
          ...row,
          date: formatPaymentDate(row.date),
        }))
      );
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadPayments();
  }, [loadPayments, refreshKey]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111]">
      <div className="border-b border-white/[0.06] p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white">Payment History</h3>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Subscriptions and credit pack purchases
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[#71717A]">
              <th className="px-6 py-4 font-medium sm:px-8">Date</th>
              <th className="px-6 py-4 font-medium sm:px-8">Type</th>
              <th className="px-6 py-4 font-medium sm:px-8">Amount</th>
              <th className="px-6 py-4 font-medium sm:px-8">Status</th>
              <th className="px-6 py-4 font-medium sm:px-8">Payment ID</th>
              <th className="px-6 py-4 text-right font-medium sm:px-8">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-6 py-4 sm:px-8">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-[#71717A] sm:px-8"
                >
                  No payments yet. Upgrade or buy credits to see history here.
                </td>
              </tr>
            ) : (
              payments.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-[#D4D4D8] sm:px-8">
                    {row.date}
                  </td>
                  <td className="px-6 py-4 sm:px-8">
                    <div className="font-medium text-white">{row.type}</div>
                    <div className="mt-0.5 text-xs text-[#71717A]">
                      {row.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 tabular-nums text-[#D4D4D8] sm:px-8">
                    {row.amount}
                  </td>
                  <td className="px-6 py-4 sm:px-8">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusClass(row.status)
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#A1A1AA] sm:px-8">
                    {row.paymentId ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right sm:px-8">
                    {row.invoiceId ? (
                      <a
                        href={`/api/billing/invoices/${row.invoiceId}`}
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#3B82F6] transition-all hover:bg-[#3B82F6]/10 active:scale-[0.98]"
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-[#52525B]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type RazorpayHealth = {
  connected: boolean;
  keyId: boolean;
  keySecret: boolean;
  webhookSecret: boolean;
  mode?: "TEST" | "LIVE" | "UNKNOWN";
};

function isRazorpayConnectedFromHealth(razorpay: RazorpayHealth | null): boolean {
  if (!razorpay) return false;
  return (
    razorpay.connected === true ||
    (razorpay.keyId === true && razorpay.keySecret === true)
  );
}

export function RazorpayStatusCard() {
  const [status, setStatus] = useState<"loading" | "connected" | "missing">(
    "loading"
  );
  const [mode, setMode] = useState<"TEST" | "LIVE" | "UNKNOWN" | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const data = (await response.json()) as {
          checks?: { razorpay?: RazorpayHealth };
        };
        const razorpay = data.checks?.razorpay ?? null;
        if (!cancelled) {
          setMode(razorpay?.mode ?? null);
          setStatus(
            isRazorpayConnectedFromHealth(razorpay) ? "connected" : "missing"
          );
        }
      } catch {
        if (!cancelled) {
          setStatus("missing");
        }
      }
    }

    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  const isConnected = status === "connected";
  const isLoading = status === "loading";

  // Hide developer env diagnostics from customers when payments are live.
  if (!isLoading && isConnected && mode === "LIVE") {
    return null;
  }

  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 ${
        isConnected
          ? "border border-emerald-400/20 bg-[#111111]"
          : "border border-dashed border-white/[0.12] bg-[#111111]/80"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
          <PaymentIcon
            className={`h-6 w-6 ${isConnected ? "text-emerald-400" : "text-[#3B82F6]"}`}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">
            Secure payments
          </h3>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            {isLoading
              ? "Checking payment gateway status…"
              : isConnected
                ? mode === "TEST"
                  ? "Checkout is connected in test mode. Switch to live keys for production charges."
                  : "Secure checkout is ready for subscriptions and credit packs."
                : "Payments are not configured yet. Contact support if checkout fails."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            isLoading
              ? "border border-white/[0.08] bg-[#0A0A0A] text-[#A1A1AA]"
              : isConnected
                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-400"
                : "border border-white/[0.08] bg-[#0A0A0A] text-[#71717A]"
          }`}
        >
          {isLoading
            ? "Checking…"
            : isConnected
              ? mode === "TEST"
                ? "Test mode"
                : "Connected"
              : "Unavailable"}
        </span>
      </div>
    </div>
  );
}

/** @deprecated Use RazorpayStatusCard */
export const RazorpayPlaceholder = RazorpayStatusCard;

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    </svg>
  );
}
