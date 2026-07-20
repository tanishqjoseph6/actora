"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { SubscriptionSnapshot } from "@/lib/subscription";

type TrialUpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  subscription: SubscriptionSnapshot | null;
};

const PLANS: {
  id: string;
  name: string;
  price: string;
  highlight?: boolean;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    features: ["14-day trial access", "1 Gmail account", "Basic inbox & CRM"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹2,200",
    highlight: true,
    features: [
      "20 Gmail accounts",
      "AI Inbox + CRM",
      "Automations & Analytics",
      "Priority support",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "₹6,072",
    features: [
      "Everything in Pro",
      "Unlimited Gmail",
      "Shared inbox & workspace",
      "Admin dashboard",
    ],
  },
];

export function TrialUpgradeModal({
  open,
  onClose,
  subscription,
}: TrialUpgradeModalProps) {
  const current =
    subscription?.trialActive
      ? "Free Trial"
      : subscription?.planName ?? "Free";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close upgrade modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-upgrade-title"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[20px] border border-white/[0.08] bg-[#111111] p-5 shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#3B82F6]">
              Current plan · {current}
            </p>
            <h2
              id="trial-upgrade-title"
              className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
            >
              Upgrade your workspace
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#A1A1AA]">
              Compare Free, Pro, and Team. Keep conversations becoming execution
              after your trial ends.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-[18px] border p-4 ${
                    plan.highlight
                      ? "border-[#3B82F6]/45 bg-[#3B82F6]/10"
                      : "border-white/[0.06] bg-[#0A0A0A]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                    {plan.highlight && (
                      <span className="rounded-full bg-[#3B82F6] px-2 py-0.5 text-[10px] font-semibold text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[#3B82F6]">
                    {plan.price}
                    <span className="text-sm font-medium text-[#71717A]">/mo</span>
                  </p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-white"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/billing?plan=pro"
                onClick={onClose}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#3B82F6] text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
              >
                Upgrade to Pro
              </Link>
              <Link
                href="/billing#pricing"
                onClick={onClose}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] text-sm font-medium text-white transition-colors hover:bg-white/[0.04]"
              >
                Compare Plans
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
