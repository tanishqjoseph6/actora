"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Mail, Play, Sparkles } from "lucide-react";

type HeroPreviewProps = {
  onTryDemo?: () => void;
};

export function HeroPreview({ onTryDemo }: HeroPreviewProps) {
  return (
    <div className="relative w-full">
      <div className="absolute -inset-6 rounded-[28px] bg-[#2563EB]/10 blur-3xl" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-[11px] font-medium tracking-wide text-[#71717A]">
            Actora · AI Workspace
          </span>
        </div>

        <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
          <div className="hidden border-r border-white/[0.06] p-4 sm:block">
            {["Dashboard", "Inbox", "CRM", "Tasks", "Roxx AI"].map((item, i) => (
              <div
                key={item}
                className={`mb-1 rounded-xl px-3 py-2 text-xs ${
                  i === 1
                    ? "bg-[#2563EB]/15 text-[#93C5FD]"
                    : "text-[#71717A]"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/15 text-[#2563EB]">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    Acme · Partnership follow-up
                  </p>
                  <span className="shrink-0 text-[10px] text-[#52525B]">2m</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">
                  Can we schedule a demo next week and send pricing?
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#2563EB]/25 bg-[#2563EB]/[0.07] p-3.5">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#93C5FD]">
                <Sparkles className="h-3.5 w-3.5" />
                AI Analysis
              </div>
              <p className="text-xs leading-relaxed text-[#D4D4D8]">
                Intent: demo request · Create CRM deal · Draft reply · Schedule meeting
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "CRM updated", sub: "Acme · Qualified" },
                { label: "Task created", sub: "Send pricing deck" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-3"
                >
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {card.label}
                  </div>
                  <p className="text-xs text-[#A1A1AA]">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {onTryDemo && (
          <button
            type="button"
            onClick={onTryDemo}
            className="group absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40"
            aria-label="Try interactive demo"
          >
            <span className="flex translate-y-2 items-center gap-2 rounded-full border border-white/20 bg-[#111111]/90 px-5 py-2.5 text-sm font-medium text-white opacity-0 shadow-xl backdrop-blur-md transition-all group-hover:translate-y-0 group-hover:opacity-100">
              <Play className="h-4 w-4 fill-white text-white" />
              Try Interactive Demo
            </span>
          </button>
        )}
      </motion.div>
    </div>
  );
}
