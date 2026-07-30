"use client";

import { motion } from "framer-motion";
import type { LandingFeatureId } from "./landing-data";

type FeatureMockupProps = {
  featureId: LandingFeatureId;
};

export function FeatureMockup({ featureId }: FeatureMockupProps) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111]/80 p-1 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-2 text-[10px] text-[#52525B]">Actora · {featureId}</span>
      </div>
      <div className="p-4 sm:p-5">{renderMockup(featureId)}</div>
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#2563EB]/10 blur-3xl"
        aria-hidden
      />
    </div>
  );
}

function renderMockup(id: LandingFeatureId) {
  switch (id) {
    case "ai-inbox":
      return <InboxMockup />;
    case "crm":
      return <CrmMockup />;
    case "tasks":
      return <TasksMockup />;
    case "meetings":
      return <MeetingsMockup />;
    case "calendar":
      return <CalendarMockup />;
    case "documents":
      return <DocumentsMockup />;
    case "automations":
      return <AutomationsMockup />;
    case "analytics":
      return <AnalyticsMockup />;
    default:
      return null;
  }
}

function InboxMockup() {
  return (
    <div className="space-y-2">
      {["Partnership proposal", "Contract review"].map((s, i) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={`rounded-xl border p-2.5 ${i === 0 ? "border-[#2563EB]/30 bg-[#2563EB]/[0.06]" : "border-white/[0.06] bg-[#0A0A0A]"}`}
        >
          <p className="text-xs font-medium text-white">{s}</p>
          <p className="text-[10px] text-[#71717A]">AI priority · Smart reply ready</p>
        </motion.div>
      ))}
    </div>
  );
}

function CrmMockup() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-[#2563EB]/20" />
        <div>
          <p className="text-xs font-semibold text-white">Acme Corp</p>
          <p className="text-[10px] text-emerald-400">Qualified · $24k</p>
        </div>
      </div>
      <div className="flex gap-1">
        {["Lead", "Qualified", "Proposal"].map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= 1 ? "bg-[#2563EB]" : "bg-white/[0.06]"}`} />
            <p className="mt-1 text-[8px] text-[#52525B]">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksMockup() {
  return (
    <div className="space-y-2">
      {["Send pricing deck", "Review contract", "Schedule demo"].map((t, i) => (
        <motion.div
          key={t}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0A0A0A] p-2"
        >
          <div className={`h-3.5 w-3.5 rounded border ${i === 2 ? "border-emerald-500/50 bg-emerald-500/20" : "border-white/10"}`} />
          <span className={`text-[11px] ${i === 2 ? "text-[#71717A] line-through" : "text-white"}`}>{t}</span>
        </motion.div>
      ))}
    </div>
  );
}

function MeetingsMockup() {
  return (
    <div className="rounded-xl border border-[#2563EB]/25 bg-[#2563EB]/[0.06] p-3">
      <p className="text-xs font-semibold text-white">Q4 Planning Sync</p>
      <p className="mt-1 text-[10px] text-[#A1A1AA]">4 attendees · Notes auto-generated</p>
      <p className="mt-2 text-[10px] text-[#93C5FD]">3 action items extracted</p>
    </div>
  );
}

function CalendarMockup() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className={`aspect-square rounded-md text-center text-[10px] leading-6 ${
            i === 4 ? "bg-[#2563EB] font-semibold text-white" : "bg-white/[0.03] text-[#52525B]"
          }`}
        >
          {12 + i}
        </div>
      ))}
    </div>
  );
}

function DocumentsMockup() {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-white/[0.06] bg-[#0A0A0A] p-3">
        <p className="text-[10px] text-[#93C5FD]">AI generating…</p>
        <div className="mt-2 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-white/[0.06]" />
          <div className="h-1.5 w-4/5 rounded bg-white/[0.05]" />
          <div className="h-1.5 w-3/5 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function AutomationsMockup() {
  const steps = ["Reply", "CRM", "Task", "Notify"];
  return (
    <div className="flex flex-col items-center gap-1">
      {steps.map((s, i) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12 }}
          className="w-full rounded-lg border border-white/[0.06] bg-[#0A0A0A] px-3 py-1.5 text-center text-[10px] text-white"
        >
          {s}
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {[
          { l: "Tasks", v: "24" },
          { l: "Revenue", v: "$128k" },
        ].map((m) => (
          <div key={m.l} className="rounded-lg border border-white/[0.06] bg-[#0A0A0A] p-2 text-center">
            <p className="text-[8px] uppercase text-[#52525B]">{m.l}</p>
            <p className="text-sm font-bold text-white">{m.v}</p>
          </div>
        ))}
      </div>
      <div className="flex h-14 items-end gap-1">
        {[40, 65, 45, 80, 55, 90].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="flex-1 rounded-t bg-[#2563EB]/80"
          />
        ))}
      </div>
    </div>
  );
}
