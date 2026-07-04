"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BILLING_FAQ } from "../pricing-data";

export function BillingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-[24px] bg-[#111827]/60 border border-[#1E293B] backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/20"
    >
      <h2 className="text-2xl font-bold text-white mb-2">FAQ</h2>
      <p className="text-sm text-gray-500 mb-6">Common questions about billing and plans</p>

      <div className="divide-y divide-[#2563EB]/10">
        {BILLING_FAQ.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={item.question} className="py-1">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left group"
              >
                <span className="text-sm sm:text-base font-medium text-white group-hover:text-[#2563EB] transition-colors">
                  {item.question}
                </span>
                <span
                  className={`shrink-0 w-8 h-8 rounded-xl border border-[#1E293B] flex items-center justify-center text-[#2563EB] transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
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
                    <p className="pb-4 text-sm text-gray-400 leading-relaxed pr-12">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
