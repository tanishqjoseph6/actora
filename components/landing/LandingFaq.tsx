"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { HOME_LANDING_FAQ, LANDING_FAQ } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { FadeUp } from "./motion";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type LandingFaqProps = {
  /** Limit items on the home page; omit on /faq */
  limit?: number;
  showHeader?: boolean;
  /** Use homepage conversion FAQ by default when limit is set */
  useHomeFaq?: boolean;
  items?: readonly FaqItem[];
};

export function LandingFaq({
  limit,
  showHeader = true,
  useHomeFaq = true,
  items: itemsProp,
}: LandingFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const source = itemsProp ?? (useHomeFaq && limit ? HOME_LANDING_FAQ : LANDING_FAQ);
  const items =
    typeof limit === "number" ? source.slice(0, limit) : source;

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const index = items.findIndex((item) => item.id === hash);
    if (index < 0) return;

    setOpenIndex(index);
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [items]);

  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {showHeader && (
          <SectionHeader
            badge="FAQ"
            title="Questions & answers"
            subtitle="Everything you need to know before getting started."
          />
        )}

        <FadeUp>
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111]/80 backdrop-blur-sm">
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              const answerId = `${item.id}-answer`;
              return (
                <div key={item.id} id={item.id} className="scroll-mt-28 px-5 sm:px-6">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[#93C5FD]"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                  >
                    <span className="text-sm font-medium text-white sm:text-base">
                      {item.question}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                        isOpen
                          ? "border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB]"
                          : "border-white/[0.08] text-[#A1A1AA]"
                      }`}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={answerId}
                        role="region"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pr-4 text-sm leading-relaxed text-[#A1A1AA] sm:pr-10">
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
