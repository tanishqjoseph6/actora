"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { WORKFLOW_STEPS } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { FadeUp } from "./motion";
import { landing } from "./landing-tokens";
import { GlassCard } from "./ui/GlassCard";

type ProductShowcaseProps = {
  onTryDemo?: () => void;
};

export function ProductShowcase({ onTryDemo }: ProductShowcaseProps) {
  return (
    <section
      id="product"
      className={`scroll-mt-24 border-t border-white/[0.06] ${landing.section}`}
    >
      <div className={landing.container}>
        <SectionHeader
          badge="Interactive Demo"
          title="See the full workflow in 90 seconds"
          subtitle="Take a guided tour through inbox, CRM, tasks, automations, and Roxx AI — no signup required."
        />

        <FadeUp>
          <GlassCard hover className="relative overflow-hidden p-6 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#2563EB]/10 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#2563EB]">
                  Guided product tour
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Experience Actora before you sign up
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
                  Walk through 10 real product workflows — from AI inbox triage to
                  Roxx executing follow-ups across your entire workspace.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {WORKFLOW_STEPS.map((step) => (
                    <li
                      key={step.label}
                      className="flex items-center gap-2.5 text-sm text-[#D4D4D8]"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                      {step.label}
                    </li>
                  ))}
                </ul>

                <motion.button
                  type="button"
                  onClick={onTryDemo}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-8 inline-flex h-12 min-h-[48px] items-center gap-2 rounded-xl bg-[#2563EB] px-6 text-sm font-semibold text-white shadow-[0_0_40px_rgba(37,99,235,0.25)] transition-colors hover:bg-[#1D4ED8]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Try Interactive Demo
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: "AI Inbox", desc: "Smart triage" },
                  { label: "CRM", desc: "Connected deals" },
                  { label: "Automations", desc: "Zero manual work" },
                  { label: "Roxx AI", desc: "Execute anything" },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.45 }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A]/80 p-4 backdrop-blur-sm transition-colors hover:border-[#2563EB]/30"
                  >
                    <p className="text-sm font-semibold text-white">{card.label}</p>
                    <p className="mt-1 text-xs text-[#71717A]">{card.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </FadeUp>
      </div>
    </section>
  );
}
