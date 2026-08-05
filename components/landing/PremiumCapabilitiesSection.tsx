"use client";

import {
  Bell,
  Bot,
  CalendarDays,
  FileText,
  FolderKanban,
  Inbox,
  Layers3,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { FadeUp, Stagger, StaggerItem } from "./motion";
import { SectionHeader } from "./SectionHeader";
import { landing } from "./landing-tokens";

const CAPABILITIES: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { title: "AI Email", description: "Triage, summarize, and reply with context.", icon: Inbox, accent: "from-blue-400/20" },
  { title: "Calendar", description: "Find time and keep every commitment visible.", icon: CalendarDays, accent: "from-sky-400/20" },
  { title: "Meetings", description: "Prep, capture notes, and close the loop.", icon: Users, accent: "from-indigo-400/20" },
  { title: "CRM", description: "Keep contacts and pipeline current automatically.", icon: FolderKanban, accent: "from-blue-500/20" },
  { title: "Documents", description: "Turn conversations into polished deliverables.", icon: FileText, accent: "from-cyan-400/20" },
  { title: "Tasks", description: "Make every promise owned and actionable.", icon: Layers3, accent: "from-blue-300/20" },
  { title: "Automation", description: "Build workflows that run while you focus.", icon: Workflow, accent: "from-violet-400/20" },
  { title: "Public API", description: "Compose Actora into your own stack.", icon: Sparkles, accent: "from-blue-500/20" },
  { title: "Storage", description: "Keep workspace files secure and organized.", icon: ShieldCheck, accent: "from-emerald-400/20" },
  { title: "Integrations", description: "Connect the tools your team already trusts.", icon: Settings2, accent: "from-sky-400/20" },
  { title: "Workspace Search", description: "Find answers across every surface instantly.", icon: Search, accent: "from-blue-300/20" },
  { title: "AI Memory", description: "Roxx remembers the context that matters.", icon: Bot, accent: "from-indigo-400/20" },
  { title: "Notifications", description: "Stay ahead of the moments that need you.", icon: Bell, accent: "from-amber-400/20" },
  { title: "Analytics", description: "See momentum from inbox to outcome.", icon: Layers3, accent: "from-cyan-400/20" },
];

const STORAGE_PLANS: Array<{
  name: string;
  storage: string;
  detail: string;
  featured?: boolean;
}> = [
  { name: "Free", storage: "5 GB", detail: "Start organized" },
  { name: "Pro", storage: "50 GB", detail: "For growing operators", featured: true },
  { name: "Team", storage: "250 GB", detail: "For shared workspaces" },
] as const;

const INTEGRATIONS = ["Google", "Gmail", "Slack", "Notion", "Zoom", "GitHub", "Linear", "Discord", "Calendar", "Drive"];

export function PremiumCapabilitiesSection() {
  return (
    <>
      <section id="capabilities" className={`scroll-mt-24 border-t border-white/[0.06] ${landing.section}`}>
        <div className={landing.container}>
          <SectionHeader
            badge="The workspace"
            title="Everything your team needs to execute"
            subtitle="One intelligent layer across the tools, context, and actions that keep work moving."
          />
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map(({ title, description, icon: Icon, accent }) => (
              <StaggerItem key={title}>
                <GlassCard className="group relative h-full overflow-hidden p-5" hover>
                  <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100`} />
                  <Icon className="relative h-5 w-5 text-[#60A5FA]" strokeWidth={1.7} />
                  <h3 className="relative mt-5 text-sm font-semibold text-white">{title}</h3>
                  <p className="relative mt-2 text-xs leading-relaxed text-[#71717A]">{description}</p>
                </GlassCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="storage" className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.09),transparent_60%)]" aria-hidden />
        <div className={`relative ${landing.container}`}>
          <FadeUp className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-[#2563EB]">Workspace storage</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your work, with room to grow.</h2>
            <p className="mt-4 text-base text-[#A1A1AA] sm:text-lg">Secure files, documents, and artifacts in the same workspace as the conversations that created them.</p>
          </FadeUp>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
            {STORAGE_PLANS.map((plan, index) => (
              <FadeUp key={plan.name} delay={index * 0.08}>
                <GlassCard className={`relative h-full p-6 ${plan.featured ? "border-[#2563EB]/45 shadow-[0_0_44px_rgba(37,99,235,0.13)]" : ""}`} hover>
                  {plan.featured && <span className="absolute right-5 top-5 rounded-full border border-[#60A5FA]/30 bg-[#2563EB]/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#93C5FD]">Popular</span>}
                  <p className="text-xs uppercase tracking-wider text-[#71717A]">{plan.name}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-white">{plan.storage}</p>
                  <p className="mt-2 text-sm text-[#A1A1AA]">{plan.detail}</p>
                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <MotionBar width={plan.featured ? "58%" : plan.name === "Team" ? "82%" : "28%"} />
                  </div>
                </GlassCard>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section id="integrations" className="border-t border-white/[0.06] py-16 sm:py-20">
        <div className={landing.container}>
          <FadeUp className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#2563EB]">Integrations</p>
            <p className="mt-3 text-sm text-[#71717A]">Fits into the stack your team already uses.</p>
          </FadeUp>
          <Stagger className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2.5">
            {INTEGRATIONS.map((integration) => (
              <StaggerItem key={integration}>
                <div className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#111111]/70 px-4 py-2.5 text-xs text-[#A1A1AA] shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/35 hover:text-white">
                  <span className="h-2 w-2 rounded-full bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.7)]" />
                  {integration}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}

function MotionBar({ width }: { width: string }) {
  return <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-700" style={{ width }} />;
}
