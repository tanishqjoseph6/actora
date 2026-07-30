"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { EmptyStateIllustration } from "./PremiumEmptyState";
import { EmptyIllustration } from "./PremiumEmptyState";

export type SmartEmptyAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

type SmartEmptyStateProps = {
  illustration: EmptyStateIllustration;
  title: string;
  description: string;
  actions: SmartEmptyAction[];
  className?: string;
};

export function SmartEmptyState({
  illustration,
  title,
  description,
  actions,
  className = "",
}: SmartEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center rounded-2xl border border-[#1E293B] bg-[#111827]/80 px-6 py-14 text-center sm:py-16 lg:py-20 ${className}`}
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-3 rounded-full border border-dashed border-[#2563EB]/20"
          aria-hidden
        />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-[#1E293B] bg-[#0B1220] shadow-lg shadow-black/20 sm:h-32 sm:w-32">
          <EmptyIllustration type={illustration} />
        </div>
      </div>

      <h2 className="mb-2 max-w-md text-lg font-bold text-white sm:text-xl">
        {title}
      </h2>
      <p className={`mb-8 max-w-md text-sm leading-relaxed ${dashboard.muted}`}>
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actions.map((action, index) => {
          const isPrimary = action.variant !== "secondary" && index === 0;
          const className = isPrimary
            ? `${dashboard.btnPrimary} px-5 py-2.5 text-sm focus-ring`
            : `${dashboard.btnSecondary} px-5 py-2.5 text-sm`;

          if (action.href) {
            return (
              <Link key={action.label} href={action.href} className={className}>
                {action.label}
              </Link>
            );
          }

          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={className}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
