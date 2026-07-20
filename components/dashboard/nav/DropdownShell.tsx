"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type DropdownShellProps = {
  open: boolean;
  align?: "left" | "right";
  className?: string;
  children: React.ReactNode;
  widthClassName?: string;
};

export function DropdownShell({
  open,
  align = "right",
  className,
  children,
  widthClassName = "w-[320px]",
}: DropdownShellProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#111111]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl",
            align === "right" ? "right-0" : "left-0",
            widthClassName,
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
