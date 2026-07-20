"use client";

import {
  Bot,
  Calendar,
  Inbox,
  Kanban,
  ListTodo,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { Stagger, StaggerItem } from "./motion";

const ICONS: Record<(typeof FEATURES)[number]["icon"], LucideIcon> = {
  inbox: Inbox,
  crm: Kanban,
  tasks: ListTodo,
  meetings: Calendar,
  automations: Workflow,
  assistant: Bot,
};

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          badge="Features"
          title="Everything execution needs"
          subtitle="Six focused surfaces — designed to keep conversations moving into outcomes."
        />

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <StaggerItem key={feature.title}>
                <article className="group h-full rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/35 hover:bg-[#141414] sm:p-7">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0A0A0A] text-[#3B82F6] transition-colors group-hover:border-[#3B82F6]/30">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                    {feature.description}
                  </p>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
