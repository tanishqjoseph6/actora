"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CONTEXTUAL_AI_ACTIONS, resolvePageContext } from "@/lib/ai/roxx-config";
import { useRoxx } from "@/providers/RoxxProvider";
import { usePathname } from "next/navigation";

export function ContextualAiBar() {
  const pathname = usePathname();
  const { askRoxx } = useRoxx();
  const context = resolvePageContext(pathname);
  const actions = CONTEXTUAL_AI_ACTIONS[context];

  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#111111]/60 px-3 py-2.5 backdrop-blur-sm sm:px-4"
      role="region"
      aria-label="Contextual AI actions"
    >
      <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#52525B]">
        <Sparkles className="h-3 w-3 text-[#3B82F6]" />
        Roxx
      </span>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => askRoxx(action.prompt)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#0A0A0A]/80 px-2.5 py-1.5 text-xs text-[#A1A1AA] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/30 hover:text-white"
          >
            <Icon className="h-3.5 w-3.5 text-[#3B82F6]" />
            {action.label}
          </button>
        );
      })}
    </motion.div>
  );
}
