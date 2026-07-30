"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowDown,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react";
import { FadeUp } from "./motion";
import { landing } from "./landing-tokens";
import { GlassCard } from "./ui/GlassCard";
import { SectionHeader } from "./SectionHeader";

const STEPS = [
  {
    number: 1,
    title: "Connect",
    icon: Mail,
    items: ["Email", "Calendar", "Team"],
  },
  {
    number: 2,
    title: "AI Organizes",
    icon: Sparkles,
    items: ["Tasks", "CRM", "Meetings", "Docs"],
  },
  {
    number: 3,
    title: "Execute",
    icon: Zap,
    items: ["Automations", "Insights", "Follow-ups"],
  },
] as const;

function FlowArrow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <div ref={ref} className="flex justify-center py-4 sm:py-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-1"
      >
        <motion.div
          animate={inView ? { y: [0, 6, 0] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-6 w-6 text-[#2563EB] sm:rotate-0" aria-hidden />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function HowActoraWorksSection() {
  return (
    <section
      id="how-it-works"
      className={`scroll-mt-24 border-t border-white/[0.06] bg-[#0A0A0A] ${landing.section}`}
    >
      <div className={landing.container}>
        <SectionHeader
          badge="How it works"
          title="From connect to execute in three steps"
          subtitle="Actora turns scattered tools into one intelligent workflow."
        />

        <div className="flex flex-col items-stretch lg:flex-row lg:items-start lg:justify-center lg:gap-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex flex-col items-stretch lg:flex-row lg:items-start">
                <FadeUp delay={index * 0.1} className="flex-1 lg:max-w-sm">
                  <GlassCard className="relative h-full p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                        {step.number}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2563EB]/25 bg-[#2563EB]/10 text-[#2563EB]">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                      {step.title}
                    </h3>
                    <ul className="mt-4 space-y-2">
                      {step.items.map((item, i) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.15 + i * 0.08 }}
                          className="flex items-center gap-2 text-sm text-[#A1A1AA]"
                        >
                          <span className="h-1 w-1 rounded-full bg-[#2563EB]" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </GlassCard>
                </FadeUp>
                {index < STEPS.length - 1 && <FlowArrow />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
