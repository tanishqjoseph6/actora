"use client";

import { Bot, Layers, Shield, Zap, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { landing } from "./landing-tokens";
import { GlassCard } from "./ui/GlassCard";
import { SectionHeader } from "./SectionHeader";

const WHY_ACTORA: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "AI Native",
    description:
      "Built around AI from day one — not AI bolted onto legacy software.",
    icon: Bot,
  },
  {
    title: "Unified Workspace",
    description:
      "Conversations, CRM, tasks, meetings, and documents in one intelligent place.",
    icon: Layers,
  },
  {
    title: "Fast",
    description:
      "Instant search and fast loading — built for operators who move quickly.",
    icon: Zap,
  },
  {
    title: "Privacy First",
    description:
      "Secure authentication and protected data with workspace-scoped access.",
    icon: Shield,
  },
];

export function WhyActoraSection() {
  return (
    <section
      id="why-actora"
      className={`scroll-mt-24 border-t border-white/[0.06] ${landing.section}`}
    >
      <div className={landing.container}>
        <SectionHeader
          badge="Why Actora"
          title="Built for how modern teams actually work"
          subtitle="One workspace that replaces scattered tools — without sacrificing speed or security."
        />

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:gap-6">
          {WHY_ACTORA.map((item) => {
            const Icon = item.icon;
            return (
              <StaggerItem key={item.title}>
                <GlassCard className="group h-full p-6 sm:p-8">
                  <CardIcon Icon={Icon} />
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
                    {item.description}
                  </p>
                </GlassCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

function CardIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2563EB]/25 bg-[#2563EB]/10 text-[#2563EB] transition-all duration-300 group-hover:border-[#2563EB]/45 group-hover:shadow-[0_0_24px_rgba(37,99,235,0.2)]">
      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
    </div>
  );
}
