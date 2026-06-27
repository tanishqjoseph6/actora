"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingPeriod, PricingPlan } from "./pricing-data";
import { getDisplayPrice } from "./pricing-data";
import { connectRazorpayPlaceholder } from "@/lib/billing/upgrade";
import type { UpgradeSelection } from "@/lib/billing/upgrade";

type UpgradeModalProps = {
  selection: UpgradeSelection | null;
  onClose: () => void;
};

export function UpgradeModal({ selection, onClose }: UpgradeModalProps) {
  const isOpen = selection !== null;

  useEffect(() => {
    if (!isOpen) return;

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

  const { plan, period } = selection;
  const pricing = getDisplayPrice(plan.id, plan.monthlyPrice, period);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#081226]/95 backdrop-blur-xl border border-[rgba(0,255,255,0.2)] shadow-2xl shadow-cyan-500/10 animate-scale-in overflow-hidden"
          role="dialog"
          aria-modal
          aria-labelledby="upgrade-modal-title"
        >
          {/* Glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#00CFFF]/20 blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-cyan-500/10 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-wider text-[#00CFFF] mb-2">
                {period === "yearly" ? "Yearly billing" : "Monthly billing"}
              </p>
              <h2
                id="upgrade-modal-title"
                className="text-2xl font-bold text-white"
              >
                Upgrade to Actora
              </h2>
            </div>

            {/* Plan summary */}
            <div className="rounded-xl bg-[#0d1730]/60 border border-[rgba(0,255,255,0.12)] p-5 mb-5">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#60A5FA] bg-clip-text text-transparent">
                  {pricing.amount}
                </span>
                {pricing.suffix && (
                  <span className="text-gray-400 text-sm">{pricing.suffix}</span>
                )}
              </div>
              {pricing.annualTotal && (
                <p className="text-xs text-gray-500 mt-1">{pricing.annualTotal}</p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6 max-h-40 overflow-y-auto">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-gray-300"
                >
                  <CheckIcon className="shrink-0 w-4 h-4 text-[#00CFFF] mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <p className="text-center text-sm text-gray-500 mb-6">
              Payments coming soon.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => connectRazorpayPlaceholder()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#00CFFF] to-[#60A5FA] text-[#050816] text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all duration-300 active:scale-[0.98]"
              >
                Connect Razorpay
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(0,255,255,0.15)] text-gray-300 text-sm font-medium hover:border-[#00CFFF]/30 hover:text-white transition-all duration-300 active:scale-[0.98]"
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

  const openUpgrade = useCallback((plan: PricingPlan, period: BillingPeriod) => {
    setSelection({ plan, period });
  }, []);

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
