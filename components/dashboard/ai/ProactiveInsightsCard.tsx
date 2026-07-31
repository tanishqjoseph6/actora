"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, Lightbulb, Sparkles } from "lucide-react";
import { useRoxxOptional } from "@/providers/RoxxProvider";
import { Skeleton } from "@/components/ui/Skeleton";

type Insight = {
  id: string;
  severity: "info" | "warning" | "urgent";
  title: string;
  body: string;
  href: string;
  actionPrompt: string;
};

export function ProactiveInsightsCard({ compact = false }: { compact?: boolean }) {
  const roxx = useRoxxOptional();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/insights", { credentials: "include" });
      const data = (await res.json()) as { insights?: Insight[] };
      if (res.ok) setInsights(data.insights ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton className={compact ? "h-24 w-full rounded-2xl" : "h-40 w-full rounded-2xl"} />;
  }

  if (insights.length === 0) return null;

  const visible = insights.slice(0, compact ? 3 : 6);

  return (
    <div
      className={`mb-4 rounded-2xl border border-white/[0.08] bg-[#111111]/80 p-4 ${
        compact ? "" : "sm:p-5"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#3B82F6]" />
        <p className="text-sm font-medium text-white">Roxx proactive</p>
        <span className="text-[10px] text-[#52525B]">Live workspace signals</span>
      </div>
      <ul className="space-y-2">
        {visible.map((insight, i) => {
          const Icon =
            insight.severity === "urgent"
              ? AlertTriangle
              : insight.severity === "warning"
                ? Bell
                : Lightbulb;
          return (
            <motion.li
              key={insight.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <button
                type="button"
                onClick={() => roxx?.askRoxx(insight.actionPrompt)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-white/[0.06] bg-[#0A0A0A]/70 px-3 py-2.5 text-left transition-colors hover:border-[#3B82F6]/30"
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    insight.severity === "urgent"
                      ? "text-red-400"
                      : insight.severity === "warning"
                        ? "text-amber-300"
                        : "text-[#93C5FD]"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">
                    {insight.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#71717A]">
                    {insight.body}
                  </span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
