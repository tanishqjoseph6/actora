"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Mail,
  Sparkles,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { DemoStepId } from "./demo-config";
import { DemoShell } from "./DemoShell";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type SceneProps = {
  activeNav?: string;
};

export function DemoScene({ stepId, activeNav }: { stepId: DemoStepId; activeNav?: string }) {
  switch (stepId) {
    case "welcome":
      return <WelcomeScene activeNav={activeNav} />;
    case "inbox":
      return <InboxScene activeNav={activeNav} />;
    case "crm":
      return <CrmScene activeNav={activeNav} />;
    case "tasks":
      return <TasksScene activeNav={activeNav} />;
    case "calendar":
      return <CalendarScene activeNav={activeNav} />;
    case "documents":
      return <DocumentsScene activeNav={activeNav} />;
    case "automations":
      return <AutomationsScene activeNav={activeNav} />;
    case "roxx":
      return <RoxxScene activeNav={activeNav} />;
    case "analytics":
      return <AnalyticsScene activeNav={activeNav} />;
    case "ending":
      return <EndingScene />;
    default:
      return null;
  }
}

function WelcomeScene({ activeNav }: SceneProps) {
  return (
    <DemoShell activeNav={activeNav}>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex h-full min-h-[280px] flex-col items-center justify-center text-center sm:min-h-[320px]"
      >
        <motion.div variants={fadeUp} className="mb-6">
          <motion.div
            animate={{ scale: [0.92, 1], opacity: [0.5, 1] }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/10 shadow-[0_0_60px_rgba(37,99,235,0.25)]"
          >
            <Sparkles className="h-8 w-8 text-[#3B82F6]" />
          </motion.div>
        </motion.div>
        <motion.h3 variants={fadeUp} className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Welcome to Actora
        </motion.h3>
        <motion.p variants={fadeUp} className="mt-2 max-w-sm text-sm text-[#A1A1AA]">
          Your AI workspace is loading…
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="h-2 w-2 rounded-full bg-[#2563EB]"
            />
          ))}
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="mt-10 grid w-full max-w-lg grid-cols-3 gap-3"
        >
          {[
            { label: "Inbox", value: "12 new" },
            { label: "Tasks", value: "8 active" },
            { label: "Deals", value: "$42k" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-[#111111]/80 p-3 backdrop-blur-sm"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#71717A]">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-white">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function InboxScene({ activeNav }: SceneProps) {
  const emails = [
    { from: "Sarah Chen", subject: "Partnership proposal", priority: true, time: "2m" },
    { from: "Acme Corp", subject: "Re: Demo scheduling", priority: false, time: "14m" },
    { from: "Jordan Lee", subject: "Contract review needed", priority: true, time: "1h" },
  ];

  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">AI Inbox</h3>
          <span className="rounded-full bg-[#2563EB]/15 px-2 py-0.5 text-[10px] font-medium text-[#93C5FD]">
            3 priority
          </span>
        </motion.div>

        {emails.map((email, i) => (
          <motion.div
            key={email.from}
            variants={fadeUp}
            custom={i}
            className={`rounded-xl border p-3 ${
              email.priority
                ? "border-[#2563EB]/30 bg-[#2563EB]/[0.06]"
                : "border-white/[0.06] bg-[#111111]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                  <Mail className="h-3.5 w-3.5 text-[#93C5FD]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{email.from}</p>
                  <p className="text-[11px] text-[#A1A1AA]">{email.subject}</p>
                </div>
              </div>
              <span className="text-[10px] text-[#52525B]">{email.time}</span>
            </div>
          </motion.div>
        ))}

        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-[#2563EB]/25 bg-[#2563EB]/[0.07] p-3.5"
        >
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#93C5FD]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Summary
          </div>
          <p className="text-xs leading-relaxed text-[#D4D4D8]">
            Sarah wants a partnership demo. Suggested reply drafted. Priority: High.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Send reply", "Create deal", "Schedule call"].map((action) => (
              <span
                key={action}
                className="rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/10 px-2.5 py-1 text-[10px] font-medium text-[#93C5FD]"
              >
                {action}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function CrmScene({ activeNav }: SceneProps) {
  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB]/15">
            <User className="h-6 w-6 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sarah Chen</p>
            <p className="text-xs text-[#71717A]">Acme Corp · New lead</p>
          </div>
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400"
          >
            Qualified
          </motion.span>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-xl border border-white/[0.06] bg-[#111111] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[#71717A]">Deal stage</p>
          <div className="mt-2 flex gap-1">
            {["Lead", "Qualified", "Proposal", "Closed"].map((stage, i) => (
              <div key={stage} className="flex-1">
                <div
                  className={`h-1.5 rounded-full ${i <= 1 ? "bg-[#2563EB]" : "bg-white/[0.06]"}`}
                />
                <p className={`mt-1 text-[9px] ${i <= 1 ? "text-[#93C5FD]" : "text-[#52525B]"}`}>
                  {stage}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-[#71717A]">Conversation history</p>
          {[
            "Email: Partnership proposal received",
            "AI: Summary + reply drafted",
            "CRM: Deal moved to Qualified",
          ].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-center gap-2 text-xs text-[#A1A1AA]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {item}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function TasksScene({ activeNav }: SceneProps) {
  const tasks = [
    { title: "Send partnership deck", assignee: "You", due: "Today", done: false },
    { title: "Review contract terms", assignee: "Alex", due: "Tomorrow", done: false },
    { title: "Schedule demo call", assignee: "You", done: true },
  ];

  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Tasks</h3>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-1 text-[10px] text-emerald-400"
          >
            <Sparkles className="h-3 w-3" /> AI created 2 tasks
          </motion.span>
        </motion.div>

        {tasks.map((task, i) => (
          <motion.div
            key={task.title}
            variants={fadeUp}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              task.done ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-white/[0.06] bg-[#111111]"
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                task.done
                  ? "border-emerald-500/40 bg-emerald-500/20"
                  : "border-white/[0.12]"
              }`}
            >
              {task.done && <Check className="h-3 w-3 text-emerald-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium ${task.done ? "text-[#71717A] line-through" : "text-white"}`}>
                {task.title}
              </p>
              <p className="text-[10px] text-[#52525B]">
                {task.assignee}{task.due ? ` · Due ${task.due}` : ""}
              </p>
            </div>
          </motion.div>
        ))}

        <motion.div variants={fadeUp} className="rounded-xl border border-white/[0.06] bg-[#111111] p-3">
          <div className="mb-2 flex justify-between text-[10px] text-[#71717A]">
            <span>Progress</span>
            <span>67%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "67%" }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-[#2563EB]"
            />
          </div>
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function CalendarScene({ activeNav }: SceneProps) {
  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={fadeUp} className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-white">Calendar</h3>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/[0.06] p-4"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#93C5FD]">
            AI detected available time
          </p>
          <p className="mt-2 text-sm font-semibold text-white">Demo with Sarah Chen</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Wed, 2:00 PM · 30 min · Google Meet</p>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-3 flex items-center gap-2 text-xs text-emerald-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Synced to Google Calendar
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg text-center text-[10px] leading-[2rem] ${
                i === 3
                  ? "bg-[#2563EB] font-semibold text-white"
                  : "bg-white/[0.03] text-[#71717A]"
              }`}
            >
              {10 + i}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function DocumentsScene({ activeNav }: SceneProps) {
  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        <motion.div variants={fadeUp} className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-white">Documents</h3>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-white/[0.06] bg-[#111111] p-4"
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-[#93C5FD]">
            <Sparkles className="h-3.5 w-3.5" />
            AI generating proposal…
          </div>
          <motion.div
            initial={{ width: "20%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="mb-4 h-1 overflow-hidden rounded-full bg-white/[0.06]"
          >
            <div className="h-full w-full rounded-full bg-[#2563EB]" />
          </motion.div>
          <div className="space-y-2">
            <div className="h-2 w-3/4 rounded bg-white/[0.08]" />
            <div className="h-2 w-full rounded bg-white/[0.06]" />
            <div className="h-2 w-5/6 rounded bg-white/[0.06]" />
            <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
          {["Meeting notes", "Summary"].map((doc) => (
            <div
              key={doc}
              className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-3"
            >
              <FileText className="h-4 w-4 text-[#71717A]" />
              <p className="mt-2 text-xs font-medium text-white">{doc}</p>
              <p className="text-[10px] text-[#52525B]">Auto-generated</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function AutomationsScene({ activeNav }: SceneProps) {
  const steps = [
    "Customer replies",
    "Lead updated",
    "CRM updated",
    "Task created",
    "Reminder scheduled",
    "Notification sent",
  ];

  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center py-2">
        <motion.div variants={fadeUp} className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-white">Automation flow</h3>
        </motion.div>

        {steps.map((step, i) => (
          <motion.div key={step} variants={fadeUp} className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.35, duration: 0.4 }}
              className="flex w-full max-w-xs items-center gap-3 rounded-xl border border-white/[0.08] bg-[#111111]/90 px-4 py-2.5 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.35 + 0.2 }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              </motion.div>
              <span className="text-xs font-medium text-white">{step}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: i * 0.35 + 0.25, duration: 0.3 }}
                className="py-1"
              >
                <ArrowDown className="h-4 w-4 text-[#2563EB]/60" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </DemoShell>
  );
}

function RoxxScene({ activeNav }: SceneProps) {
  const actions = [
    "Finds conversations",
    "Generates replies",
    "Updates CRM",
    "Creates reminders",
    "Schedules follow-ups",
  ];

  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-white/[0.08] bg-[#111111] p-3"
        >
          <p className="text-[10px] uppercase tracking-wider text-[#71717A]">You</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mt-1 text-xs leading-relaxed text-white sm:text-sm"
          >
            &ldquo;Follow up with every customer that hasn&apos;t replied in 7 days.&rdquo;
          </motion.p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/[0.06] p-3.5"
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#3B82F6]" />
            <span className="text-xs font-semibold text-[#93C5FD]">Roxx AI</span>
          </div>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <motion.div
                key={action}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.4, duration: 0.35 }}
                className="flex items-center gap-2 text-xs text-[#D4D4D8]"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {action}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.8 }}
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-center text-xs font-medium text-emerald-400"
        >
          12 follow-ups queued · Running now
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function AnalyticsScene({ activeNav }: SceneProps) {
  const metrics = [
    { label: "Active Tasks", value: "24", trend: "+12%" },
    { label: "AI Automations", value: "156", trend: "+28%" },
    { label: "Revenue", value: "$128k", trend: "+18%" },
    { label: "Team Productivity", value: "94%", trend: "+6%" },
  ];

  const bars = [40, 65, 45, 80, 55, 90, 70];

  return (
    <DemoShell activeNav={activeNav}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={fadeUp} className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-white">Analytics</h3>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-white/[0.06] bg-[#111111] p-2.5"
            >
              <p className="text-[9px] uppercase tracking-wider text-[#71717A]">{m.label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">{m.value}</p>
              <p className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                {m.trend}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
          <p className="mb-3 text-[10px] uppercase tracking-wider text-[#71717A]">
            Weekly Activity
          </p>
          <div className="flex h-24 items-end justify-between gap-1.5">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 rounded-t-md bg-gradient-to-t from-[#2563EB] to-[#3B82F6]/60"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DemoShell>
  );
}

function EndingScene() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0A0A0A] px-6 text-center"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.12),transparent_70%)]" />
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="relative text-4xl font-bold tracking-[0.2em] text-white sm:text-5xl"
      >
        ACTORA
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative mt-4 text-base text-[#A1A1AA] sm:text-lg"
      >
        Where conversations become execution.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="relative mt-8 flex flex-col items-center gap-3"
      >
        <Link
          href="/signup"
          className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl bg-[#2563EB] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Start Free
        </Link>
        <p className="text-sm text-[#71717A]">useactora.com</p>
      </motion.div>
    </motion.div>
  );
}
