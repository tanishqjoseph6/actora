"use client";

import {
  BarChart3,
  Bot,
  Calendar,
  Inbox,
  Kanban,
  ListTodo,
  Users,
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
  analytics: BarChart3,
  workspace: Users,
};

type FeaturesGridProps = {
  /** Show longer detail copy (features page). */
  detailed?: boolean;
  limit?: number;
  showHeader?: boolean;
};

export function FeaturesGrid({
  detailed = false,
  limit,
  showHeader = true,
}: FeaturesGridProps) {
  const items = typeof limit === "number" ? FEATURES.slice(0, limit) : FEATURES;

  return (
    <section id="features" className="py-20 sm:py-28 scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {showHeader && (
          <SectionHeader
            badge="Features"
            title="Everything execution needs"
            subtitle="Eight focused surfaces — designed so conversations become outcomes."
          />
        )}

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {items.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <StaggerItem key={feature.id}>
                <article
                  id={feature.id}
                  className="group h-full scroll-mt-28 rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/35 hover:bg-[#141414] sm:p-7"
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0A0A0A] text-[#3B82F6] transition-colors group-hover:border-[#3B82F6]/30">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                    {detailed ? feature.detail : feature.description}
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
