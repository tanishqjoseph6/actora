"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type LandingButtonProps = {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
};

export function LandingButton({
  href,
  onClick,
  variant = "primary",
  children,
  className,
}: LandingButtonProps) {
  const reducedMotion = useReducedMotion();
  const base =
    "inline-flex h-12 min-h-[44px] w-full items-center justify-center rounded-xl px-7 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] active:scale-[0.98] sm:min-w-[180px] sm:w-auto";

  const styles =
    variant === "primary"
      ? "bg-[#2563EB] text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:bg-[#1D4ED8] hover:shadow-[0_0_50px_rgba(37,99,235,0.4)]"
      : "border border-white/[0.1] bg-white/[0.03] text-white backdrop-blur-md hover:border-[#2563EB]/40 hover:bg-[#2563EB]/10";

  const classes = cn(base, styles, className);

  if (href) {
    return (
      <motion.div
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      >
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      className={classes}
    >
      {children}
    </motion.button>
  );
}
