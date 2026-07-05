"use client";

import { motion } from "framer-motion";

type SectionHeaderProps = {
  badge?: string;
  title: string;
  subtitle: string;
  align?: "center" | "left";
  id?: string;
};

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  id,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className={centered ? "text-center max-w-2xl mx-auto mb-12 sm:mb-16" : "mb-8 sm:mb-10 max-w-xl"}
    >
      {badge && (
        <span className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-[#1E293B] bg-[#111827] text-[#2563EB] text-xs font-semibold uppercase tracking-wider">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
        {title}
      </h2>
      <p className={`mt-4 text-base sm:text-lg text-[#94A3B8] leading-relaxed ${centered ? "" : ""}`}>
        {subtitle}
      </p>
    </motion.div>
  );
}
