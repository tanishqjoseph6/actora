"use client";

import Link from "next/link";
import type { LimitType, PlanId } from "@/lib/subscription";
import { getPlanDisplayName } from "@/lib/subscription";

type PlanLimitModalProps = {
  isOpen: boolean;
  reason: string;
  limitType: LimitType;
  currentPlanId: PlanId;
  recommendedPlanId: PlanId;
  onClose: () => void;
};

const LIMIT_HEADINGS: Record<LimitType, string> = {
  ai_actions: "AI action limit reached",
  inboxes: "Inbox limit reached",
};

const LIMIT_FEATURES: Record<LimitType, string[]> = {
  ai_actions: [
    "More AI replies and drafts each month",
    "Faster inbox automation",
    "Priority support on paid plans",
  ],
  inboxes: [
    "Connect multiple Gmail accounts",
    "Manage team inboxes in one place",
    "Scale automation across accounts",
  ],
};

export function PlanLimitModal({
  isOpen,
  reason,
  limitType,
  currentPlanId,
  recommendedPlanId,
  onClose,
}: PlanLimitModalProps) {
  if (!isOpen) return null;

  const recommendedName = getPlanDisplayName(recommendedPlanId);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#0B1220]/95 backdrop-blur-xl border border-[rgba(37, 99, 235,0.2)] shadow-2xl shadow-blue-500/10 animate-scale-in overflow-hidden"
          role="dialog"
          aria-modal
          aria-labelledby="plan-limit-title"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-28 bg-[#3B82F6]/20 blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-blue-500/10 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-4">
                <LockIcon className="w-3.5 h-3.5" />
                Plan limit
              </span>
              <h2
                id="plan-limit-title"
                className="text-2xl font-bold text-white"
              >
                {LIMIT_HEADINGS[limitType]}
              </h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                {reason}
              </p>
            </div>

            <div className="rounded-xl bg-[#111827]/60 border border-[rgba(37, 99, 235,0.12)] p-5 mb-5">
              <p className="text-xs font-medium uppercase tracking-wider text-[#3B82F6] mb-2">
                Recommended upgrade
              </p>
              <h3 className="text-xl font-bold bg-[#2563EB] bg-clip-text text-transparent">
                Actora {recommendedName}
              </h3>
              <ul className="mt-4 space-y-2">
                {LIMIT_FEATURES[limitType].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <CheckIcon className="shrink-0 w-4 h-4 text-[#3B82F6] mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/billing?plan=${recommendedPlanId}`}
                className="flex-1 py-3 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold text-center shadow-lg shadow-blue-500/20 hover:bg-[#1D4ED8] transition-all duration-300 active:scale-[0.98]"
              >
                Upgrade to {recommendedName}
              </Link>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[rgba(37, 99, 235,0.15)] text-gray-300 text-sm font-medium hover:border-[#3B82F6]/30 hover:text-white transition-all duration-300 active:scale-[0.98]"
              >
                Maybe later
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              Current plan: {getPlanDisplayName(currentPlanId)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
