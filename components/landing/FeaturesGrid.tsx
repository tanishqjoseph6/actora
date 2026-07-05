"use client";

import { motion } from "framer-motion";
import { FEATURES } from "./landing-data";
import { SectionHeader } from "./SectionHeader";

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 sm:py-28 border-t border-[#1E293B]/60">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeader
          badge="Features"
          title="Everything you need to run on email"
          subtitle="A focused toolkit for operators who live in their inbox—without the toolchain sprawl."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group p-6 sm:p-7 rounded-2xl border border-[#1E293B] bg-[#111827] shadow-sm hover:border-[#2563EB]/40 transition-colors"
            >
              <span className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-lg mb-4 group-hover:bg-[#2563EB]/15 transition-colors">
                {feature.icon}
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
