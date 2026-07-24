"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

type PaymentRow = {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: string;
};

function formatPaymentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BillingHistoryTable() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      try {
        const response = await fetch("/api/billing/payments", { cache: "no-store" });
        const data = (await response.json()) as { payments?: PaymentRow[] };
        if (!cancelled) {
          setPayments(
            (data.payments ?? []).map((row) => ({
              ...row,
              date: formatPaymentDate(row.date),
            }))
          );
        }
      } catch {
        if (!cancelled) setPayments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPayments();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-sm border border-[rgba(37, 99, 235,0.15)] shadow-lg shadow-black/20 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-[rgba(37, 99, 235,0.1)]">
        <h3 className="text-lg font-bold text-white">Payment History</h3>
        <p className="text-sm text-gray-400 mt-1">
          View and download your past invoices
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(37, 99, 235,0.1)] text-left text-gray-500">
              <th className="px-6 sm:px-8 py-4 font-medium">Date</th>
              <th className="px-6 sm:px-8 py-4 font-medium">Plan</th>
              <th className="px-6 sm:px-8 py-4 font-medium">Amount</th>
              <th className="px-6 sm:px-8 py-4 font-medium">Status</th>
              <th className="px-6 sm:px-8 py-4 font-medium text-right">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[rgba(37, 99, 235,0.05)]">
                  <td className="px-6 sm:px-8 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-6 sm:px-8 py-4 text-right">
                    <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
                  </td>
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 sm:px-8 py-10 text-center text-gray-500">
                  No payments yet. Upgrade to a paid plan to see invoices here.
                </td>
              </tr>
            ) : (
              payments.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[rgba(37, 99, 235,0.05)] last:border-0 hover:bg-[#111827]/40 transition-colors duration-200"
                >
                  <td className="px-6 sm:px-8 py-4 text-gray-300 whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="px-6 sm:px-8 py-4 text-white font-medium">
                    {row.plan}
                  </td>
                  <td className="px-6 sm:px-8 py-4 text-gray-300">{row.amount}</td>
                  <td className="px-6 sm:px-8 py-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 text-xs font-medium">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 sm:px-8 py-4 text-right">
                    <a
                      href={`/api/billing/invoices/${row.id}`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(37, 99, 235,0.15)] text-[#3B82F6] text-xs font-medium hover:bg-[#3B82F6]/10 transition-all duration-200 active:scale-[0.98]"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      Download
                    </a>
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
};

function isRazorpayConnectedFromHealth(razorpay: RazorpayHealth | null): boolean {
  if (!razorpay) return false;
  return (
    razorpay.connected === true ||
    (razorpay.keyId === true && razorpay.keySecret === true)
  );
}

export function RazorpayPlaceholder() {
  const [status, setStatus] = useState<"loading" | "connected" | "missing">(
    "loading"
  );

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

  return (
    <div
      className={`rounded-2xl backdrop-blur-sm p-6 sm:p-8 ${
        isConnected
          ? "bg-[#0B1220]/80 border border-emerald-400/20"
          : "bg-[#0B1220]/60 border border-dashed border-[rgba(37, 99, 235,0.2)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#111827] border border-[rgba(37, 99, 235,0.15)] shrink-0">
          <PaymentIcon
            className={`w-6 h-6 ${isConnected ? "text-emerald-400" : "text-[#3B82F6]"}`}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">
            Razorpay Payment Gateway
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {isLoading
              ? "Checking payment gateway status…"
              : isConnected
                ? "Secure payments powered by Razorpay. Checkout is active."
                : "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments."}
          </p>
        </div>
        <span
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
            isLoading
              ? "bg-[#111827] border border-[rgba(37, 99, 235,0.1)] text-gray-400"
              : isConnected
                ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-400"
                : "bg-[#111827] border border-[rgba(37, 99, 235,0.1)] text-gray-500"
          }`}
        >
          {isLoading
            ? "Checking…"
            : isConnected
              ? "✅ Razorpay Connected"
              : "Not configured"}
        </span>
      </div>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}
