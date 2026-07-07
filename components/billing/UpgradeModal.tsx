"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingPeriod, PricingPlan } from "./pricing-data";
import type { UpgradeSelection } from "@/lib/billing/upgrade";
import type { BillingCurrency } from "@/lib/billing/currency";
import {
  getCheckoutButtonLabel,
  getCheckoutDescription,
} from "@/lib/billing/providers";
import { isDevBillingEnabled } from "@/lib/billing/config";
import type { PlanId } from "@/lib/subscription";

type UpgradeModalProps = {
  selection: UpgradeSelection | null;
  currency: BillingCurrency;
  onClose: () => void;
  onDevUpgrade?: (planId: PlanId) => Promise<boolean>;
  onCheckout?: (
    planId: PlanId,
    period: BillingPeriod,
    currency: BillingCurrency,
    razorpayPlanId?: string
  ) => Promise<void>;
  currentPlanId?: PlanId;
};

export function UpgradeModal({
  selection,
  currency,
  onClose,
  onDevUpgrade,
  onCheckout,
  currentPlanId,
}: UpgradeModalProps) {
  const isOpen = selection !== null;
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const devBilling = isDevBillingEnabled();

  useEffect(() => {
    if (!isOpen) {
      setActionError(null);
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!selection) return null;

  const { plan, period, currency: selectionCurrency } = selection;
  const isCurrentPlan = currentPlanId === plan.id;

  const handlePrimaryAction = async () => {
    if (isCurrentPlan) return;

    setIsProcessing(true);
    setActionError(null);
    try {
      if (devBilling) {
        if (!onDevUpgrade) {
          setActionError("Plan activation is unavailable right now.");
          return;
        }
        const success = await onDevUpgrade(plan.id);
        if (!success) {
          setActionError("Could not activate your plan. Please try again.");
        }
      } else if (onCheckout) {
        await onCheckout(
          plan.id,
          period,
          selectionCurrency,
          plan.razorpayPlanId
        );
      } else {
        setActionError("Checkout is unavailable right now.");
      }
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const primaryLabel = isProcessing
    ? devBilling
      ? "Activating…"
      : "Opening checkout…"
    : isCurrentPlan
      ? "Current Plan"
      : getCheckoutButtonLabel(selectionCurrency);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#0B1220]/95 backdrop-blur-xl border border-[rgba(37, 99, 235,0.2)] shadow-2xl shadow-blue-500/10 animate-scale-in overflow-hidden"
          role="dialog"
          aria-modal
          aria-labelledby="upgrade-modal-title"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#3B82F6]/20 blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-blue-500/10 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-wider text-[#3B82F6] mb-2">
                {period === "yearly" ? "Yearly billing" : "Monthly billing"} · {selectionCurrency}
              </p>
              <h2
                id="upgrade-modal-title"
                className="text-2xl font-bold text-white"
              >
                Upgrade to Actora
              </h2>
            </div>

            <div className="rounded-xl bg-[#111827]/60 border border-[rgba(37, 99, 235,0.12)] p-5 mb-5">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {plan.priceLabel}
                </span>
                {plan.priceSuffix && (
                  <span className="text-gray-400 text-sm">{plan.priceSuffix}</span>
                )}
              </div>
              {plan.billingNote && (
                <p className="text-xs text-gray-500 mt-1">{plan.billingNote}</p>
              )}
              {plan.saveNote && (
                <p className="text-xs text-[#3B82F6] mt-1">{plan.saveNote}</p>
              )}
            </div>

            <ul className="space-y-2.5 mb-6 max-h-40 overflow-y-auto">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-gray-300"
                >
                  <CheckIcon className="shrink-0 w-4 h-4 text-[#3B82F6] mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <p className="text-center text-sm text-gray-500 mb-6">
              {getCheckoutDescription(selectionCurrency)}
            </p>

            {actionError && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {actionError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePrimaryAction}
                disabled={isCurrentPlan || isProcessing}
                className="flex-1 py-3 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold shadow-lg shadow-blue-500/20 hover:bg-[#1D4ED8] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {primaryLabel}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(37, 99, 235,0.15)] text-gray-300 text-sm font-medium hover:border-[#3B82F6]/30 hover:text-white transition-all duration-300 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function useUpgradeModal() {
  const [selection, setSelection] = useState<UpgradeSelection | null>(null);

  const openUpgrade = useCallback(
    (plan: PricingPlan, period: BillingPeriod, currency: BillingCurrency) => {
      setSelection({ plan, period, currency });
    },
    []
  );

  const closeUpgrade = useCallback(() => {
    setSelection(null);
  }, []);

  return { selection, openUpgrade, closeUpgrade };
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
