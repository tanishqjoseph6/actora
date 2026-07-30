"use client";

import {
  Bot,
  Lock,
  Shield,
  Smartphone,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { landing } from "./landing-tokens";
import { GlassCard } from "./ui/GlassCard";
import { SectionHeader } from "./SectionHeader";

const TRUST_PILLARS: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "AI Powered",
    description:
      "Roxx AI executes across inbox, CRM, tasks, and calendar from one command.",
    icon: Bot,
  },
  {
    title: "Secure Authentication",
    description:
      "Google OAuth — we never store your password. Encrypted sessions by default.",
    icon: Lock,
  },
  {
    title: "Fast Performance",
    description:
      "Built on modern infrastructure for snappy inbox, CRM, and automation workflows.",
    icon: Zap,
  },
  {
    title: "Privacy First",
    description:
      "Your data stays yours. Workspace-scoped access with transparent policies.",
    icon: Shield,
  },
  {
    title: "Responsive Design",
    description:
      "Full workspace experience on desktop, tablet, and mobile — wherever you work.",
    icon: Smartphone,
  },
];

function PillarIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2563EB]/25 bg-[#2563EB]/10 text-[#2563EB]">
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
    </div>
  );
}

export function TrustSection() {
  return (
    <section
      aria-label="Trust and platform quality"
      className={`border-y border-white/[0.06] bg-[#0A0A0A] ${landing.section}`}
    >
      <div className={landing.container}>
        <SectionHeader
          badge="Trust"
          title="Built for modern teams."
          subtitle="Enterprise-grade foundations without enterprise complexity."
        />

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <StaggerItem key={pillar.title}>
                <GlassCard className="group h-full p-6 sm:p-7">
                  <PillarIcon Icon={Icon} />
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-white sm:text-lg">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                    {pillar.description}
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
