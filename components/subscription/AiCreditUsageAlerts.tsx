"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { AiCreditsExhaustedModal } from "@/components/subscription/AiCreditsExhaustedModal";
import type { AiCreditUsageMilestone } from "@/lib/ai-credits/milestones";
import { isUnlimited } from "@/lib/subscription";
import { cn } from "@/lib/utils";

type PendingEvent = {
  milestone: AiCreditUsageMilestone;
  title: string;
  message: string;
  tone: "green" | "yellow" | "orange" | "red";
  showExhaustedModal: boolean;
};

const TONE_STYLES = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  yellow: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  orange: "border-orange-500/35 bg-orange-500/10 text-orange-100",
  red: "border-red-500/35 bg-red-500/10 text-red-100",
} as const;

const DISMISSED_KEY = "actora-ai-credit-toasts-v1";

function loadDismissed(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<number>) {
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

type AiCreditUsageAlertsProps = {
  onUpgradePlan?: () => void;
};

export function AiCreditUsageAlerts({ onUpgradePlan }: AiCreditUsageAlertsProps) {
  const { subscription } = useSubscription();
  const [toasts, setToasts] = useState<PendingEvent[]>([]);
  const [exhaustedOpen, setExhaustedOpen] = useState(false);
  const dismissedRef = useRef(loadDismissed());
  const pollingRef = useRef(false);

  const acknowledge = useCallback(async (milestones: AiCreditUsageMilestone[]) => {
    if (!milestones.length) return;
    await fetch("/api/ai-credits/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestones }),
    }).catch(() => undefined);
  }, []);

  const pollEvents = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const res = await fetch("/api/ai-credits/status", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { pendingEvents?: PendingEvent[] };
      const pending = body.pendingEvents ?? [];
      const fresh = pending.filter(
        (e) => !dismissedRef.current.has(e.milestone)
      );
      if (fresh.length) {
        setToasts((prev) => {
          const ids = new Set(prev.map((p) => p.milestone));
          return [...prev, ...fresh.filter((f) => !ids.has(f.milestone))];
        });
        if (fresh.some((e) => e.showExhaustedModal)) {
          setExhaustedOpen(true);
        }
      }
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void pollEvents();
    const id = window.setInterval(() => void pollEvents(), 20_000);
    return () => window.clearInterval(id);
  }, [pollEvents, subscription?.usage.aiActionsUsed]);

  useEffect(() => {
    if (!subscription) return;
    const allotment =
      subscription.usage.aiCreditsAllotment ??
      subscription.limits.aiActionsPerMonth;
    if (isUnlimited(allotment)) return;

    const monthlyRemaining = subscription.usage.monthlyCreditsRemaining ?? 0;
    const cycleKey = subscription.usage.cycleKey ?? "default";
    const modalKey = `actora-monthly-exhausted-${cycleKey}`;
    if (monthlyRemaining <= 0 && !sessionStorage.getItem(modalKey)) {
      setExhaustedOpen(true);
      sessionStorage.setItem(modalKey, "1");
    }
  }, [subscription]);

  const dismissToast = (event: PendingEvent) => {
    dismissedRef.current.add(event.milestone);
    saveDismissed(dismissedRef.current);
    setToasts((prev) => prev.filter((t) => t.milestone !== event.milestone));
    void acknowledge([event.milestone]);
  };

  return (
    <>
      <div className="pointer-events-none fixed bottom-6 right-4 z-[75] flex max-w-sm flex-col gap-3 sm:right-6">
        <AnimatePresence>
          {toasts.map((event) => (
            <motion.div
              key={event.milestone}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md",
                TONE_STYLES[event.tone]
              )}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#93C5FD]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {event.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {event.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => dismissToast(event)}
                    className="mt-3 text-[11px] font-medium text-[#93C5FD] hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AiCreditsExhaustedModal
        open={exhaustedOpen}
        subscription={subscription}
        onClose={() => setExhaustedOpen(false)}
        onUpgradePlan={onUpgradePlan}
      />
    </>
  );
}
