"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { dashboard } from "./dashboard-tokens";

const PROMPTS = [
  "Summarize unread emails from today",
  "Create tasks from my latest thread",
  "Update CRM from this conversation",
  "Draft a follow-up for Meridian",
];

export function AiAssistantPanel() {
  const [typed, setTyped] = useState("");
  const full =
    "Where conversations become execution. Ask Actora to triage inbox, update CRM, or create tasks.";

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${dashboard.cardLg} mb-8 p-5 sm:p-6 lg:mb-10 lg:p-7`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
          <Bot className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2 py-0.5 text-[10px] font-medium text-[#93C5FD]">
              <Sparkles className="h-3 w-3" />
              Online
            </span>
          </div>
          <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-[#A1A1AA]">
            {typed}
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#3B82F6] align-middle" />
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {PROMPTS.map((prompt, index) => (
          <motion.div
            key={prompt}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
          >
            <Link
              href="/dashboard/inbox"
              className="inline-flex rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-3 py-2 text-xs text-[#A1A1AA] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/35 hover:text-white"
            >
              {prompt}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
