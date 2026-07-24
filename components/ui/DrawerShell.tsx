"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PANEL_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

type DrawerShellProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible title id for aria-labelledby */
  titleId?: string;
  side?: "right" | "left";
  widthClassName?: string;
  className?: string;
  overlayClassName?: string;
};

export function DrawerShell({
  open,
  onClose,
  children,
  titleId,
  side = "right",
  widthClassName = "max-w-md",
  className,
  overlayClassName,
}: DrawerShellProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const slideFrom = side === "right" ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:bg-black/40",
              overlayClassName
            )}
            onClick={onClose}
            aria-label="Close panel"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={PANEL_TRANSITION}
            className={cn(
              "fixed inset-y-0 z-50 flex w-full flex-col border-white/[0.06] bg-[#0A0A0A] shadow-2xl shadow-black/50 premium-scrollbar",
              side === "right"
                ? "right-0 border-l"
                : "left-0 border-r",
              widthClassName,
              className
            )}
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
