"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { WORKFLOW_STEPS } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { FadeUp } from "./motion";

export function ProductShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="product" className="border-t border-white/[0.06] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          badge="Product"
          title="From email to done — automatically"
          subtitle="Watch how Actora turns a single conversation into a complete execution loop."
        />

        <FadeUp>
          <div className="rounded-[20px] border border-white/[0.06] bg-[#111111] p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {WORKFLOW_STEPS.map((step, index) => {
                const isActive = index === active;
                const isDone = index < active;
                return (
                  <div key={step.label} className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      className={`rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 sm:px-4 ${
                        isActive
                          ? "border-[#3B82F6]/50 bg-[#3B82F6]/10"
                          : isDone
                            ? "border-emerald-500/25 bg-emerald-500/5"
                            : "border-white/[0.06] bg-[#0A0A0A]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                            isDone
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isActive
                                ? "bg-[#3B82F6]/20 text-[#93C5FD]"
                                : "bg-white/5 text-[#71717A]"
                          }`}
                        >
                          {isDone ? <Check className="h-3 w-3" /> : index + 1}
                        </span>
                        <span
                          className={`text-xs font-medium sm:text-sm ${
                            isActive ? "text-white" : "text-[#A1A1AA]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </button>
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 text-[#3F3F46] sm:block" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 min-h-[120px] rounded-[16px] border border-white/[0.06] bg-[#0A0A0A] p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#3B82F6]">
                    Step {active + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {WORKFLOW_STEPS[active].label}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
                    {WORKFLOW_STEPS[active].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
