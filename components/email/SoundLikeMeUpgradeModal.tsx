"use client";

import Link from "next/link";
import {
  ComingSoonBadge,
  useBillingPause,
} from "@/components/billing/BillingPauseProvider";

type SoundLikeMeUpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SoundLikeMeUpgradeModal({
  open,
  onClose,
}: SoundLikeMeUpgradeModalProps) {
  const { paused, showComingSoon } = useBillingPause();
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal
          aria-labelledby="sound-like-me-title"
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#3B82F6]/25 bg-[#0A0A0A]/95 shadow-2xl shadow-blue-500/10 backdrop-blur-xl animate-scale-in"
        >
          <div className="relative p-6 sm:p-8">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-[#71717A] transition-colors hover:bg-[#3B82F6]/10 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>

            <p className="text-sm font-medium text-[#93C5FD]">✨ Upgrade to Pro</p>
            <h2
              id="sound-like-me-title"
              className="mt-2 text-2xl font-bold tracking-tight text-white"
            >
              Unlock Sound Like Me
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
              Write emails exactly like you.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-[#D4D4D8]">
              {[
                "Personalized AI",
                "Learns your writing style",
                "Better professional replies",
                "Premium AI experience",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#3B82F6]">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-7">
              {paused ? (
                <button
                  type="button"
                  onClick={() => {
                    showComingSoon();
                    onClose();
                  }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] text-sm font-semibold text-white hover:bg-[#2563EB]"
                >
                  Upgrade to Pro
                  <ComingSoonBadge />
                </button>
              ) : (
                <Link
                  href="/billing?plan=pro"
                  onClick={onClose}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#3B82F6] text-sm font-semibold text-white transition-colors hover:bg-[#2563EB]"
                >
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
