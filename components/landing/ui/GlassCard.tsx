"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { landing } from "../landing-tokens";
import { useTiltStyle } from "../motion";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  const tilt = useTiltStyle(3.5);

  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      style={hover ? tilt.style : undefined}
      onPointerMove={hover ? tilt.onPointerMove : undefined}
      onPointerLeave={hover ? tilt.onPointerLeave : undefined}
      className={cn(
        landing.rounded,
        landing.glass,
        hover && landing.glassHover,
        hover && landing.neonBorderHover,
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
