"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Sparkles } from "lucide-react";

const PROMPTS = [
  "Create tomorrow's meeting agenda",
  "Summarize today's meetings",
  "Generate follow-up email",
  "Create task from this conversation",
  "Search customer conversations",
] as const;

type AiCommandBarProps = {
  hidden?: boolean;
};

export function AiCommandBar({ hidden = false }: AiCommandBarProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (hidden) return;

    const fullText = PROMPTS[promptIndex];
    let charIndex = 0;
    setDisplayText("");
    setIsTyping(true);

    const typeInterval = window.setInterval(() => {
      charIndex += 1;
      setDisplayText(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length) {
        window.clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 38);

    return () => window.clearInterval(typeInterval);
  }, [promptIndex, hidden]);

  useEffect(() => {
    if (hidden || isTyping) return;

    const pause = window.setTimeout(() => {
      setPromptIndex((i) => (i + 1) % PROMPTS.length);
    }, 2400);

    return () => window.clearTimeout(pause);
  }, [hidden, isTyping, promptIndex]);

  if (hidden) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 sm:pb-6"
      aria-hidden={false}
      role="complementary"
      aria-label="Roxx AI command bar preview"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto w-full max-w-xl"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111111]/90 shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(37,99,235,0.15)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#2563EB]/5 via-transparent to-[#2563EB]/5" />

          <div className="relative flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/15 text-[#2563EB]">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#71717A]">
                Ask Roxx anything…
              </p>
              <div className="mt-0.5 flex min-h-[1.25rem] items-center text-sm text-[#D4D4D8]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={promptIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {displayText}
                    {isTyping && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="ml-0.5 inline-block h-4 w-0.5 bg-[#2563EB] align-middle"
                      />
                    )}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-[#52525B] sm:flex">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
