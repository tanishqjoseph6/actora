"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { ComingSoonBadge } from "@/components/billing/BillingPauseProvider";

type ModalView = "form" | "success" | "already_subscribed";

type BillingWaitlistModalProps = {
  open: boolean;
  onClose: () => void;
};

export function BillingWaitlistModal({ open, onClose }: BillingWaitlistModalProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [view, setView] = useState<ModalView>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setView("form");
    setSubmitting(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    setEmail(session?.user?.email ?? "");
    setView("form");
    setSubmitting(false);
    setError(null);
  }, [open, resetState, session?.user?.email]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, submitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = (await response.json()) as {
        status?: "subscribed" | "already_subscribed";
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      if (data.status === "already_subscribed") {
        setView("already_subscribed");
        return;
      }

      setView("success");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            onClick={() => {
              if (!submitting) onClose();
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-waitlist-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="absolute right-4 top-4 rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {view === "form" && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/35 bg-[#3B82F6]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#93C5FD]">
                  <Bell className="h-3 w-3" />
                  Billing Waitlist
                </span>
                <h2
                  id="billing-waitlist-title"
                  className="mt-3 text-2xl font-semibold tracking-tight text-white"
                >
                  Get notified when Billing goes live
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                  We&apos;re putting the finishing touches on Actora&apos;s billing
                  experience. Leave your email and we&apos;ll let you know the moment
                  it&apos;s ready.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="billing-waitlist-email"
                      className="mb-2 block text-left text-xs font-medium uppercase tracking-wide text-[#71717A]"
                    >
                      Email address
                    </label>
                    <input
                      id="billing-waitlist-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={submitting}
                      placeholder="you@company.com"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-4 text-sm text-white placeholder:text-[#52525B] outline-none transition-colors focus:border-[#3B82F6]/50 focus:ring-2 focus:ring-[#3B82F6]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm text-red-300">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] text-sm font-medium text-white transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining waitlist…
                      </>
                    ) : (
                      "Notify Me"
                    )}
                  </button>
                </form>
              </>
            )}

            {view === "success" && (
              <div className="pt-1 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/15">
                  <CheckCircle2 className="h-6 w-6 text-[#93C5FD]" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                  You&apos;re on the list!
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                  We&apos;ll notify you as soon as Billing is available.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#3B82F6] text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                >
                  Done
                </button>
              </div>
            )}

            {view === "already_subscribed" && (
              <div className="pt-1 text-center">
                <ComingSoonBadge className="mx-auto" />
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                  You&apos;re already on the waitlist.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                  We&apos;ll email you as soon as Billing is available — no need to
                  sign up again.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] text-sm font-medium text-white transition-colors hover:bg-white/[0.05]"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
