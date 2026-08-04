"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  File,
  KeyRound,
  Layers3,
  LockKeyhole,
  type LucideIcon,
  Mail,
  Rocket,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { FadeUp } from "./motion";
import { landing } from "./landing-tokens";

const apiSurface: Array<{
  label: string;
  icon: LucideIcon;
  available: boolean;
  detail?: string;
}> = [
  { label: "REST API", icon: Zap, available: true },
  { label: "Secure API Keys", icon: KeyRound, available: true },
  { label: "API Rate Limits", icon: Layers3, available: true },
  { label: "Webhooks", icon: Webhook, available: false },
  { label: "SDKs", icon: BookOpen, available: false, detail: "Node.js & Python" },
  { label: "AI Actions", icon: Sparkles, available: true },
  { label: "CRM API", icon: Layers3, available: true },
  { label: "Tasks API", icon: Check, available: true },
  { label: "Inbox API", icon: Mail, available: true },
  { label: "Calendar API", icon: CalendarDays, available: true },
  { label: "File API", icon: File, available: true },
  { label: "Workspace API", icon: LockKeyhole, available: true },
] as const;

const advantages = [
  { icon: Zap, title: "Fast REST API", text: "Simple endpoints built for reliable automation." },
  { icon: LockKeyhole, title: "Secure Authentication", text: "Scoped bearer keys keep workspace data protected." },
  { icon: BookOpen, title: "Developer Docs", text: "Clear references and examples to get moving quickly." },
  { icon: Rocket, title: "Production Ready", text: "Rate limits and predictable responses from day one." },
] as const;

function CodeLine({
  children,
  number,
}: {
  children: React.ReactNode;
  number: number;
}) {
  return (
    <div className="flex min-h-7">
      <span className="mr-5 w-5 select-none text-right text-[#3F3F46]">{number}</span>
      <span className="whitespace-pre">{children}</span>
    </div>
  );
}

export function PublicApiSection() {
  return (
    <section id="public-api" className={`scroll-mt-24 overflow-hidden border-t border-white/[0.06] ${landing.section}`}>
      <div className={landing.container}>
        <FadeUp className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-[#2563EB]">
            Public API
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Build on Actora with the Public API
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
            Integrate your apps, automate workflows, and let Roxx AI execute actions across your workspace.
          </p>
        </FadeUp>

        <div className="relative mt-14 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#2563EB]/10 blur-[100px]"
            animate={{ opacity: [0.45, 0.7, 0.45], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <FadeUp className="relative">
            <p className="mb-5 text-sm leading-relaxed text-[#A1A1AA]">
              One secure interface for the systems your team already runs on. Start with a request, then compose Actora APIs with your own tools and agents.
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
              {apiSurface.map(({ label, icon: Icon, available, detail }) => (
                <div
                  key={label}
                  className="group flex min-h-[62px] items-start gap-2.5 rounded-xl border border-white/[0.06] bg-[#111111]/70 p-3 transition-colors hover:border-[#2563EB]/30 hover:bg-[#141414]"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#3B82F6]" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white">{label}</p>
                    {detail && <p className="mt-0.5 text-[10px] text-[#71717A]">{detail}</p>}
                    {!available && <p className="mt-1 text-[10px] text-[#71717A]">Coming soon</p>}
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.1} className="relative">
            <GlassCard className="overflow-hidden border-[#2563EB]/20 bg-[#0D0F14]" hover={false}>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/70" />
                </div>
                <span className="font-mono text-[10px] text-[#52525B]">actora-api · request</span>
              </div>
              <div className="overflow-x-auto p-5 font-mono text-[12px] leading-7 sm:p-7 sm:text-[13px]">
                <CodeLine number={1}>
                  <span className="font-semibold text-[#60A5FA]">POST</span>{" "}
                  <span className="text-white">/v1/tasks</span>
                </CodeLine>
                <CodeLine number={2}>
                  <span className="text-[#71717A]">Authorization:</span>{" "}
                  <span className="text-[#A7F3D0]">Bearer ACTORA_API_KEY</span>
                </CodeLine>
                <CodeLine number={3}>{""}</CodeLine>
                <CodeLine number={4}><span className="text-[#71717A]">{"{"}</span></CodeLine>
                <CodeLine number={5}>
                  {"  "}<span className="text-[#93C5FD]">&quot;title&quot;</span>
                  <span className="text-[#71717A]">: </span>
                  <span className="text-[#A7F3D0]">&quot;Follow up with Acme&quot;</span>
                  <span className="text-[#71717A]">,</span>
                </CodeLine>
                <CodeLine number={6}>
                  {"  "}<span className="text-[#93C5FD]">&quot;priority&quot;</span>
                  <span className="text-[#71717A]">: </span>
                  <span className="text-[#FDE68A]">&quot;high&quot;</span>
                </CodeLine>
                <CodeLine number={7}><span className="text-[#71717A]">{"}"}</span></CodeLine>
              </div>
              <div className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-3 text-xs text-[#71717A] sm:px-7">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Response 201 · Task created
              </div>
            </GlassCard>
          </FadeUp>
        </div>

        <FadeUp className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" delay={0.12}>
          {advantages.map(({ icon: Icon, title, text }) => (
            <GlassCard key={title} className="p-5" hover>
              <Icon className="h-5 w-5 text-[#3B82F6]" />
              <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#71717A]">{text}</p>
            </GlassCard>
          ))}
        </FadeUp>

        <FadeUp className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" delay={0.16}>
          <Link
            href="/docs"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-medium text-white shadow-[0_8px_30px_rgba(37,99,235,0.22)] transition-all hover:bg-[#3B82F6] hover:shadow-[0_10px_36px_rgba(37,99,235,0.32)]"
          >
            View API Docs
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/developers"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition-all hover:border-[#2563EB]/40 hover:bg-[#2563EB]/10"
          >
            Get API Key
            <ChevronRight className="h-4 w-4 text-[#93C5FD] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </FadeUp>
        <p className="mt-5 text-center text-xs text-[#52525B]">
          Public API available. Documentation coming soon.
        </p>
      </div>
    </section>
  );
}
