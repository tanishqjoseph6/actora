"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Opacity-only page enter — no vertical translate (avoids scroll/layout jump).
 */
function DashboardPageTransitionInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-0 will-change-[opacity]"
    >
      {children}
    </motion.div>
  );
}

export const DashboardPageTransition = memo(DashboardPageTransitionInner);
