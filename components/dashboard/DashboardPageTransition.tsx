"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

function DashboardPageTransitionInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-0"
    >
      {children}
    </motion.div>
  );
}

export const DashboardPageTransition = memo(DashboardPageTransitionInner);
