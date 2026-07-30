"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Mail,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { useRoxxOptional } from "@/providers/RoxxProvider";

const ONBOARDING_KEY = "actora_onboarding_v1";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Actora",
    description:
      "Your AI-native workspace for conversations, CRM, tasks, meetings, and documents.",
    icon: Sparkles,
  },
  {
    id: "workspace",
    title: "Create your workspace",
    description:
      "Organize your team, data, and automations in one intelligent place.",
    icon: Users,
    cta: { label: "Open settings", href: "/dashboard/settings" },
  },
  {
    id: "email",
    title: "Connect email",
    description:
      "Sync Gmail so Roxx can summarize, prioritize, and turn emails into action.",
    icon: Mail,
    cta: { label: "Connect Gmail", href: "/dashboard/connect-gmail" },
  },
  {
    id: "calendar",
    title: "Connect calendar",
    description:
      "See meetings, schedule follow-ups, and let AI generate minutes automatically.",
    icon: Calendar,
    cta: { label: "Connect calendar", href: "/dashboard/calendar" },
  },
  {
    id: "team",
    title: "Invite your team",
    description:
      "Collaborate with shared AI credits, tasks, and CRM in one workspace.",
    icon: Users,
    cta: { label: "Invite team", href: "/dashboard/settings" },
  },
  {
    id: "roxx",
    title: "Ask Roxx your first question",
    description:
      "Try: “Summarize my inbox and suggest follow-ups for this week.”",
    icon: Sparkles,
    cta: { label: "Open Roxx AI", action: "roxx" as const },
  },
] as const;

function isComplete(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "done";
  } catch {
    return true;
  }
}

function markComplete() {
  try {
    window.localStorage.setItem(ONBOARDING_KEY, "done");
  } catch {
    /* ignore */
  }
}

export function DashboardOnboarding() {
  const roxx = useRoxxOptional();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isComplete()) setOpen(true);
  }, []);

  const close = useCallback(() => {
    markComplete();
    setOpen(false);
  }, []);

  const skip = useCallback(() => {
    markComplete();
    setOpen(false);
  }, []);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label="Skip onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={skip}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-lg overflow-hidden rounded-[24px] border border-white/[0.08] ${dashboard.card} shadow-2xl`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_60%)]" />

          <div className="relative border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#3B82F6]">
                Step {step + 1} of {STEPS.length}
              </p>
              <button
                type="button"
                onClick={skip}
                className="text-xs text-[#71717A] transition-colors hover:text-white"
              >
                Skip
              </button>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-[#3B82F6]"
                initial={false}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
          </div>

          <div className="relative px-6 py-8 text-center">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3B82F6]/25 bg-[#3B82F6]/10 text-[#3B82F6]"
            >
              <Icon className="h-8 w-8" strokeWidth={1.75} />
            </motion.div>

            <h2 id="onboarding-title" className="text-xl font-semibold text-white sm:text-2xl">
              {current.title}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#A1A1AA]">
              {current.description}
            </p>

            {isLast && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </motion.div>
            )}
          </div>

          <div className="relative flex items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-4">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`${dashboard.btnSecondary} px-4 py-2 text-sm disabled:opacity-40`}
            >
              Back
            </button>

            <div className="flex items-center gap-2">
              {"cta" in current && current.cta && (
                <>
                  {"href" in current.cta && (
                    <Link
                      href={current.cta.href}
                      onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                      className={`${dashboard.btnSecondary} px-4 py-2 text-sm`}
                    >
                      {current.cta.label}
                    </Link>
                  )}
                  {"action" in current.cta && current.cta.action === "roxx" && (
                    <button
                      type="button"
                      onClick={() => roxx?.openCopilot()}
                      className={`${dashboard.btnSecondary} px-4 py-2 text-sm`}
                    >
                      {current.cta.label}
                    </button>
                  )}
                </>
              )}

              {isLast ? (
                <button
                  type="button"
                  onClick={close}
                  className={`${dashboard.btnPrimary} px-5 py-2 text-sm`}
                >
                  Get started
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className={`${dashboard.btnPrimary} px-5 py-2 text-sm`}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
