"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clipboard,
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
import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { FadeUp, useLandingReducedMotion } from "./motion";
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

const CODE_SAMPLES = {
  JavaScript: `const response = await fetch("https://api.useactora.com/v1/tasks", {
  method: "POST",
  headers: {
    Authorization: "Bearer ACTORA_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Follow up with Acme",
    priority: "high",
  }),
});`,
  Python: `import requests

response = requests.post(
    "https://api.useactora.com/v1/tasks",
    headers={"Authorization": "Bearer ACTORA_API_KEY"},
    json={"title": "Follow up with Acme", "priority": "high"},
)`,
  cURL: `curl -X POST https://api.useactora.com/v1/tasks \\
  -H "Authorization: Bearer ACTORA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Follow up with Acme","priority":"high"}'`,
} as const;

const RATE_LIMITS: Array<{
  name: string;
  calls: string;
  requests: string;
  featured?: boolean;
}> = [
  { name: "Free", calls: "250", requests: "20 req/min" },
  { name: "Pro", calls: "1,500", requests: "300 req/min", featured: true },
  { name: "Team", calls: "5,000", requests: "500 req/min" },
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

function ApiCube() {
  const reducedMotion = useLandingReducedMotion();
  const faces = [
    { label: "REST", className: "bg-[#2563EB]/25" },
    { label: "AI", className: "bg-[#3B82F6]/20" },
    { label: "CRM", className: "bg-[#60A5FA]/15" },
    { label: "TASKS", className: "bg-[#93C5FD]/15" },
    { label: "FILES", className: "bg-[#2563EB]/20" },
    { label: "ROXX", className: "bg-[#3B82F6]/25" },
  ];

  return (
    <div className="absolute -right-2 -top-14 hidden h-24 w-24 [perspective:600px] sm:block lg:-right-8 lg:-top-16">
      <motion.div
        aria-label="Actora API cube"
        animate={reducedMotion ? undefined : { rotateX: 360, rotateY: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {faces.map((face, index) => {
          const transforms = [
            "translateZ(48px)",
            "rotateY(180deg) translateZ(48px)",
            "rotateY(90deg) translateZ(48px)",
            "rotateY(-90deg) translateZ(48px)",
            "rotateX(90deg) translateZ(48px)",
            "rotateX(-90deg) translateZ(48px)",
          ];
          return (
            <div
              key={face.label}
              className={`absolute inset-0 flex items-center justify-center rounded-xl border border-[#93C5FD]/25 text-[9px] font-semibold tracking-[0.18em] text-[#BFDBFE] shadow-[0_0_24px_rgba(37,99,235,0.18)] backdrop-blur-sm ${face.className}`}
              style={{ transform: transforms[index], backfaceVisibility: "hidden" }}
            >
              {face.label}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export function PublicApiSection() {
  const [activeTab, setActiveTab] = useState<keyof typeof CODE_SAMPLES>("JavaScript");
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    await navigator.clipboard?.writeText(CODE_SAMPLES[activeTab]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

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
            <ApiCube />
            <GlassCard className="overflow-hidden border-[#2563EB]/20 bg-[#0D0F14]" hover={false}>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/70" />
                </div>
                <span className="font-mono text-[10px] text-[#52525B]">actora-api · request</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2">
                <div className="flex gap-1">
                  {(Object.keys(CODE_SAMPLES) as Array<keyof typeof CODE_SAMPLES>).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-lg px-2.5 py-1.5 text-[10px] transition-colors ${activeTab === tab ? "bg-[#2563EB]/15 text-[#BFDBFE]" : "text-[#71717A] hover:text-white"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => void copyCode()} className="inline-flex items-center gap-1.5 text-[10px] text-[#71717A] transition-colors hover:text-white">
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="min-h-[250px] overflow-x-auto p-5 font-mono text-[11px] leading-6 text-[#A7F3D0] sm:min-h-[278px] sm:p-7 sm:text-[12px]">
                <code>{CODE_SAMPLES[activeTab]}</code>
              </pre>
              {/* The compact request preview remains visible in the response footer. */}
              <div className="hidden">
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
              <div className="flex items-center justify-between border-t border-white/[0.07] bg-[#0A0A0A]/40 px-5 py-3 sm:px-7">
                <span className="text-[10px] uppercase tracking-wider text-[#52525B]">Live response</span>
                <span className="font-mono text-[10px] text-emerald-300">201 Created · 42ms</span>
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
        <FadeUp className="mx-auto mt-14 max-w-4xl" delay={0.14}>
          <div className="grid gap-3 md:grid-cols-3">
            {RATE_LIMITS.map((limit) => (
              <GlassCard key={limit.name} className={`p-5 ${limit.featured ? "border-[#2563EB]/45 bg-[#2563EB]/[0.06]" : ""}`} hover>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{limit.name}</p>
                  {limit.featured && <span className="text-[9px] uppercase tracking-wider text-[#93C5FD]">Popular</span>}
                </div>
                <p className="mt-4 text-2xl font-semibold tabular-nums text-white">{limit.calls}<span className="ml-1 text-xs font-normal text-[#71717A]">calls / month</span></p>
                <p className="mt-1 text-xs text-[#71717A]">{limit.requests}</p>
              </GlassCard>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-[#111111]/70 p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA]">API usage this cycle</span>
              <span className="text-[#71717A]">1,284 / 1,500 calls</span>
            </div>
            <div className="mt-4 flex h-16 items-end gap-1.5">
              {[32, 48, 42, 64, 54, 78, 68, 88, 72, 96, 82, 100].map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${height}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.035, duration: 0.45 }}
                  className="flex-1 rounded-t bg-gradient-to-t from-[#2563EB] to-[#60A5FA]"
                />
              ))}
            </div>
          </div>
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
