"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { landing } from "../landing-tokens";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={cn(
        landing.rounded,
        landing.glass,
        hover && landing.glassHover,
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
