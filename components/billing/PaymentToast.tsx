"use client";

import { useEffect, useState } from "react";

export type PaymentToastType = "success" | "error" | "info";

export type PaymentToastState = {
  type: PaymentToastType;
  title: string;
  message: string;
} | null;

type PaymentToastProps = {
  toast: PaymentToastState;
  onDismiss: () => void;
};

export function PaymentToast({ toast, onDismiss }: PaymentToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const styles = {
    success: {
      border: "border-emerald-400/30",
      glow: "shadow-emerald-500/20",
      icon: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    error: {
      border: "border-red-400/30",
      glow: "shadow-red-500/20",
      icon: "text-red-400",
      bg: "bg-red-500/10",
    },
    info: {
      border: "border-cyan-400/30",
      glow: "shadow-cyan-500/20",
      icon: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  }[toast.type];

  return (
    <div className="fixed top-6 right-6 z-[100] max-w-sm w-[calc(100%-3rem)] animate-slide-in-right">
      <div
        className={`rounded-2xl bg-[#081226]/95 backdrop-blur-xl border ${styles.border} shadow-2xl ${styles.glow} p-5`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl ${styles.bg} flex items-center justify-center`}
          >
            <ToastIcon type={toast.type} className={`w-5 h-5 ${styles.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{toast.title}</p>
            <p className="text-sm text-gray-400 mt-1">{toast.message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 text-gray-500 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastIcon({
  type,
  className,
}: {
  type: PaymentToastType;
  className?: string;
}) {
  if (type === "success") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function usePaymentToastFromUrl(
  onToast: (toast: PaymentToastState) => void
) {
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;

    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (!payment) return;

    if (payment === "success") {
      onToast({
        type: "success",
        title: "Payment successful",
        message: "Your subscription has been upgraded.",
      });
    } else if (payment === "failed") {
      onToast({
        type: "error",
        title: "Payment failed",
        message: "Something went wrong. Please try again.",
      });
    } else if (payment === "cancelled") {
      onToast({
        type: "info",
        title: "Payment cancelled",
        message: "No charges were made to your account.",
      });
    }

    window.history.replaceState({}, "", "/billing");
    setHandled(true);
  }, [handled, onToast]);
}
