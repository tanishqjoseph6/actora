"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { LANDING_FAQ } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { FadeUp } from "./motion";

type LandingFaqProps = {
  /** Limit items on the home page; omit on /faq */
  limit?: number;
  showHeader?: boolean;
};

export function LandingFaq({ limit, showHeader = true }: LandingFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = typeof limit === "number" ? LANDING_FAQ.slice(0, limit) : LANDING_FAQ;

  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {showHeader && (
          <SectionHeader
            badge="FAQ"
            title="Questions & answers"
            subtitle="Security, AI credits, billing, teams, and privacy — covered."
          />
        )}

        <FadeUp>
          <div className="divide-y divide-white/[0.06] rounded-[18px] border border-white/[0.06] bg-[#111111] px-5 sm:px-6">
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.id} id={item.id} className="scroll-mt-28 py-1">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium text-white sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-[#A1A1AA] transition-transform duration-300 ${
                        isOpen ? "rotate-45 border-[#3B82F6]/40 text-[#3B82F6]" : ""
                      }`}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pr-10 text-sm leading-relaxed text-[#A1A1AA]">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
