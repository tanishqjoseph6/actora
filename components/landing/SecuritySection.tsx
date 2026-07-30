"use client";

import { Cloud, KeyRound, Lock, Server, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { landing } from "./landing-tokens";
import { GlassCard } from "./ui/GlassCard";
import { SectionHeader } from "./SectionHeader";

const SECURITY_ITEMS: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Google Authentication",
    description:
      "Sign in securely with Google OAuth. We never store your password.",
    icon: KeyRound,
  },
  {
    title: "Encrypted Data",
    description:
      "Data in transit and at rest is protected with industry-standard encryption.",
    icon: Lock,
  },
  {
    title: "Modern Infrastructure",
    description:
      "Built on reliable, scalable cloud architecture designed for uptime.",
    icon: Server,
  },
  {
    title: "Reliable Cloud Hosting",
    description:
      "Enterprise-grade hosting with monitoring, backups, and secure deployments.",
    icon: Cloud,
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className={`scroll-mt-24 border-t border-white/[0.06] bg-[#0A0A0A] ${landing.section}`}
    >
      <div className={landing.container}>
        <SectionHeader
          badge="Security"
          title="Enterprise-grade security, startup speed"
          subtitle="Your workspace data is protected at every layer."
        />

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {SECURITY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <StaggerItem key={item.title}>
                <GlassCard className="group h-full p-6 text-center sm:p-7 sm:text-left">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/10 text-[#2563EB] transition-colors group-hover:border-[#2563EB]/40 sm:mx-0">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
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
