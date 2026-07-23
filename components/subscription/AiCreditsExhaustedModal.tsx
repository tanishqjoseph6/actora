"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import { isUnlimited } from "@/lib/subscription";

type AiCreditsExhaustedModalProps = {
  open: boolean;
  subscription: SubscriptionSnapshot | null;
  onClose: () => void;
  onUpgradePlan?: () => void;
};

export function AiCreditsExhaustedModal({
  open,
  subscription,
  onClose,
  onUpgradePlan,
}: AiCreditsExhaustedModalProps) {
  const purchased =
    subscription?.usage.purchasedCreditsRemaining ?? 0;
  const hasPurchased = purchased > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-[#3B82F6]/30 bg-[#0A0A0A] p-8 shadow-2xl shadow-blue-500/20"
              role="dialog"
              aria-modal
              aria-labelledby="ai-credits-exhausted-title"
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-[#71717A] hover:bg-white/[0.06] hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#3B82F6]/20 blur-3xl" />

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3B82F6]/35 bg-[#3B82F6]/10 text-[#3B82F6]">
                  <Sparkles className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <h2
                  id="ai-credits-exhausted-title"
                  className="text-2xl font-bold text-white"
                >
                  You&apos;re out of AI Credits
                </h2>
                <p className={`mt-3 text-sm leading-relaxed ${dashboard.muted}`}>
                  You&apos;ve used all of your monthly AI credits.
                  {hasPurchased ? (
                    <>
                      {" "}
                      You still have{" "}
                      <span className="font-semibold text-white">
                        {purchased.toLocaleString("en-IN")}
                      </span>{" "}
                      purchased credits available.
                    </>
                  ) : (
                    <>
                      {" "}
                      Purchase additional AI credits to continue using Roxxx AI
                      immediately.
                    </>
                  )}
                </p>

                <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
                  <Link
                    href="/billing#ai-credits"
                    onClick={onClose}
                    className={`${dashboard.btnPrimary} w-full px-5 py-2.5 text-sm`}
                  >
                    Buy More Credits
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onUpgradePlan?.();
                    }}
                    className={`${dashboard.btnSecondary} w-full px-5 py-2.5 text-sm text-white`}
                  >
                    Upgrade Plan
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 text-xs text-[#71717A] hover:text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
