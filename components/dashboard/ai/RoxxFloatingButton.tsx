"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useRoxx } from "@/providers/RoxxProvider";

export function RoxxFloatingButton() {
  const { openCopilot, copilotOpen } = useRoxx();

  if (copilotOpen) return null;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => openCopilot()}
      className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3B82F6]/30 bg-[#111111]/95 text-[#3B82F6] shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_40px_rgba(59,130,246,0.2)] backdrop-blur-xl transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6"
      aria-label="Open Roxx AI copilot"
      title="Roxx AI (⌘J)"
    >
      <Sparkles className="h-5 w-5" />
    </motion.button>
  );
}
