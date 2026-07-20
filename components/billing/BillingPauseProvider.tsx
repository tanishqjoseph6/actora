"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { BILLING_TEMPORARILY_DISABLED } from "@/lib/billing/billing-pause";

type BillingPauseContextValue = {
  paused: boolean;
  showComingSoon: () => void;
};

const BillingPauseContext = createContext<BillingPauseContextValue>({
  paused: BILLING_TEMPORARILY_DISABLED,
  showComingSoon: () => undefined,
});

export function useBillingPause() {
  return useContext(BillingPauseContext);
}

export function BillingPauseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const showComingSoon = useCallback(() => {
    if (!BILLING_TEMPORARILY_DISABLED) return;
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      paused: BILLING_TEMPORARILY_DISABLED,
      showComingSoon,
    }),
    [showComingSoon]
  );

  return (
    <BillingPauseContext.Provider value={value}>
      {children}
      <BillingComingSoonModal open={open} onClose={() => setOpen(false)} />
    </BillingPauseContext.Provider>
  );
}

export function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#3B82F6]/35 bg-[#3B82F6]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#93C5FD] ${className}`.trim()}
    >
      Coming Soon
    </span>
  );
}

export function BillingComingSoonModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-coming-soon-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center rounded-full border border-[#3B82F6]/35 bg-[#3B82F6]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#93C5FD]">
              Coming Soon
            </span>
            <h2
              id="billing-coming-soon-title"
              className="mt-3 text-2xl font-semibold tracking-tight text-white"
            >
              Billing Coming Soon
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
              We&apos;re putting the finishing touches on Actora&apos;s billing
              experience. It&apos;ll be available very soon.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#3B82F6] text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
