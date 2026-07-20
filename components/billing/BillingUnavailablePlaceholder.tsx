"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ComingSoonBadge } from "@/components/billing/BillingPauseProvider";

export function BillingUnavailablePlaceholder() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <div className="pointer-events-none fixed left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#3B82F6]/10 blur-[200px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-[500px] w-[600px] rounded-full bg-[#2563EB]/8 blur-[180px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full rounded-[20px] border border-white/[0.08] bg-[#111111] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-12"
        >
          <ComingSoonBadge />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Billing is temporarily unavailable
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
            We&apos;re currently improving our billing experience. Payments and
            subscriptions will be available soon.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex h-11 min-w-[160px] cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#3B82F6]/40 px-5 text-sm font-medium text-white/80 opacity-70"
            >
              Notify Me
              <ComingSoonBadge />
            </button>
            <Link
              href="/dashboard"
              className="inline-flex h-11 min-w-[160px] items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.05]"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
