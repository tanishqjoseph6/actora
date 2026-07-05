"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "./landing-data";
import { SectionHeader } from "./SectionHeader";

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-[#1E293B]/60">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeader
          badge="Testimonials"
          title="Trusted by operators who ship"
          subtitle="Teams use Actora to move faster in email without adding another layer of complexity."
        />

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
          {TESTIMONIALS.map((item, index) => (
            <motion.blockquote
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="flex flex-col p-6 sm:p-7 rounded-2xl border border-[#1E293B] bg-[#111827] shadow-sm hover:border-[#2563EB]/35 transition-colors"
            >
              <p className="text-sm text-[#94A3B8] leading-relaxed flex-1">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-6 pt-5 border-t border-[#1E293B]">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{item.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
