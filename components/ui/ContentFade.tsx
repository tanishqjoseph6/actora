"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ContentFadeProps = {
  children: ReactNode;
  className?: string;
  /** When false, content is hidden with opacity 0 (keeps layout space if needed). */
  visible?: boolean;
};

/** Smooth opacity transition for loading → content swaps without layout jump. */
export function ContentFade({
  children,
  className,
  visible = true,
}: ContentFadeProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
