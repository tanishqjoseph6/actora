"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
} from "framer-motion";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

const STAGES = [
  { id: "inbox", label: "Inbox", duration: 2800 },
  { id: "summary", label: "AI Summary", duration: 2800 },
  { id: "task", label: "Task Creation", duration: 2600 },
  { id: "crm", label: "CRM Update", duration: 2600 },
  { id: "calendar", label: "Calendar Sync", duration: 2600 },
  { id: "analytics", label: "Analytics", duration: 0 },
] as const;

type StageId = (typeof STAGES)[number]["id"];

type HeroWorkflowVisualProps = {
  onTryDemo?: () => void;
};

export function HeroWorkflowVisual({ onTryDemo }: HeroWorkflowVisualProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [stageIndex, setStageIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!inView || hasStarted) return;
    setHasStarted(true);
  }, [inView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const stage = STAGES[stageIndex];
    if (!stage || stage.duration === 0) return;

    const timer = window.setTimeout(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, stage.duration);

    return () => window.clearTimeout(timer);
  }, [hasStarted, stageIndex]);

  const currentStage = STAGES[stageIndex]?.id ?? "inbox";

  return (
    <div ref={ref} className="relative w-full">
      <div
        className="pointer-events-none absolute -inset-8 rounded-[32px] bg-[#2563EB]/15 blur-3xl"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111]/80 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0A0A0A]/60 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/70" />
            <span className="ml-2 text-[11px] font-medium text-[#71717A]">
              Actora Workspace
            </span>
          </div>
          <div className="flex gap-1">
            {STAGES.map((s, i) => (
              <span
                key={s.id}
                className={`h-1 w-6 rounded-full transition-colors duration-500 ${
                  i <= stageIndex ? "bg-[#2563EB]" : "bg-white/[0.08]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid min-h-[300px] sm:min-h-[340px] sm:grid-cols-[130px_1fr] md:grid-cols-[150px_1fr]">
          <nav className="hidden border-r border-white/[0.06] p-3 sm:block">
            {["Inbox", "CRM", "Tasks", "Calendar", "Analytics"].map((item) => (
              <div
                key={item}
                className={`mb-0.5 rounded-lg px-2.5 py-2 text-[11px] font-medium ${
                  (currentStage === "inbox" && item === "Inbox") ||
                  (currentStage === "crm" && item === "CRM") ||
                  (currentStage === "task" && item === "Tasks") ||
                  (currentStage === "calendar" && item === "Calendar") ||
                  (currentStage === "analytics" && item === "Analytics")
                    ? "bg-[#2563EB]/15 text-[#93C5FD]"
                    : "text-[#52525B]"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>

          <div className="relative p-4 sm:p-5 md:p-6">
            <AnimatePresence mode="wait">
              <StageContent key={currentStage} stage={currentStage} />
            </AnimatePresence>
          </div>
        </div>

        {onTryDemo && (
          <button
            type="button"
            onClick={onTryDemo}
            className="absolute bottom-4 right-4 rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/10 px-3 py-1.5 text-[11px] font-medium text-[#93C5FD] backdrop-blur-md transition-colors hover:bg-[#2563EB]/20 sm:text-xs"
          >
            Full interactive tour →
          </button>
        )}
      </motion.div>

      {/* Stage labels */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {STAGES.map((s, i) => (
          <span
            key={s.id}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-500 sm:text-xs ${
              i === stageIndex
                ? "bg-[#2563EB]/20 text-[#93C5FD] ring-1 ring-[#2563EB]/30"
                : i < stageIndex
                  ? "text-[#52525B]"
                  : "text-[#3F3F46]"
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function StageContent({ stage }: { stage: StageId }) {
  const enter = { opacity: 0, y: 16, scale: 0.98 };
  const center = { opacity: 1, y: 0, scale: 1 };
  const exit = { opacity: 0, y: -12, scale: 0.98 };
  const t = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

  if (stage === "inbox") {
    return (
      <motion.div initial={enter} animate={center} exit={exit} transition={t} className="space-y-2.5">
        <p className="text-xs font-semibold text-white">Incoming emails</p>
        {[
          { from: "Sarah Chen", sub: "Partnership proposal — urgent", pri: true },
          { from: "Acme Corp", sub: "Re: Demo scheduling", pri: false },
        ].map((e) => (
          <div
            key={e.from}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              e.pri ? "border-[#2563EB]/30 bg-[#2563EB]/[0.06]" : "border-white/[0.06] bg-[#0A0A0A]"
            }`}
          >
            <Mail className="h-4 w-4 shrink-0 text-[#2563EB]" />
            <div>
              <p className="text-xs font-medium text-white">{e.from}</p>
              <p className="text-[11px] text-[#71717A]">{e.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  if (stage === "summary") {
    return (
      <motion.div initial={enter} animate={center} exit={exit} transition={t}>
        <div className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/[0.07] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#93C5FD]">
            <Sparkles className="h-4 w-4" />
            AI Summary
          </div>
          <p className="text-sm leading-relaxed text-[#E4E4E7]">
            Sarah requests a partnership demo. Intent: high priority. Suggested: reply,
            create deal, schedule call.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Smart reply", "Priority: High"].map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-[#2563EB]/25 bg-[#2563EB]/10 px-2 py-0.5 text-[10px] text-[#93C5FD]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === "task") {
    return (
      <motion.div initial={enter} animate={center} exit={exit} transition={t} className="space-y-2">
        <p className="text-xs font-semibold text-white">Task created</p>
        {["Send partnership deck", "Schedule demo call"].map((task, i) => (
          <motion.div
            key={task}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-3"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-[#2563EB]/40 bg-[#2563EB]/10">
              <CheckCircle2 className="h-3 w-3 text-[#93C5FD]" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">{task}</p>
              <p className="text-[10px] text-[#52525B]">Assigned · Due this week</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (stage === "crm") {
    return (
      <motion.div initial={enter} animate={center} exit={exit} transition={t}>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/15">
            <User className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sarah Chen · Acme Corp</p>
            <p className="text-xs text-emerald-400">Deal moved to Qualified</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#71717A]">Conversation history linked automatically.</p>
      </motion.div>
    );
  }

  if (stage === "calendar") {
    return (
      <motion.div initial={enter} animate={center} exit={exit} transition={t}>
        <div className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/[0.06] p-4">
          <div className="flex items-center gap-2 text-[#93C5FD]">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Calendar Sync</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">Demo with Sarah Chen</p>
          <p className="text-xs text-[#A1A1AA]">Wed 2:00 PM · Google Meet · Synced</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={enter} animate={center} exit={exit} transition={t}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-[#2563EB]" />
        <p className="text-xs font-semibold text-white">Analytics</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { l: "Tasks", v: "24" },
          { l: "Deals", v: "$42k" },
          { l: "AI runs", v: "156" },
        ].map((m) => (
          <div key={m.l} className="rounded-lg border border-white/[0.06] bg-[#0A0A0A] p-2 text-center">
            <p className="text-[9px] uppercase text-[#52525B]">{m.l}</p>
            <p className="text-sm font-bold text-white">{m.v}</p>
          </div>
        ))}
      </div>
      <div className="flex h-16 items-end gap-1">
        {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="flex-1 rounded-t bg-gradient-to-t from-[#2563EB] to-[#3B82F6]/50"
          />
        ))}
      </div>
    </motion.div>
  );
}
