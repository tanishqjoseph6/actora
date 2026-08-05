"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";
import type { PointerEvent } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
export const LANDING_EASE = EASE;

export function useLandingReducedMotion() {
  return useReducedMotion();
}

export function useTiltStyle(intensity = 5) {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), {
    stiffness: 260,
    damping: 24,
    mass: 0.45,
  });
  const rotateY = useSpring(useMotionValue(0), {
    stiffness: 260,
    damping: 24,
    mass: 0.45,
  });

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    rotateX.set(-y * intensity);
    rotateY.set(x * intensity);
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return {
    reducedMotion,
    style: reducedMotion ? undefined : { rotateX, rotateY, transformPerspective: 900 },
    onPointerMove,
    onPointerLeave,
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

type FadeUpProps = HTMLMotionProps<"div"> & {
  delay?: number;
  className?: string;
};

export function FadeUp({
  children,
  className,
  delay = 0,
  ...props
}: FadeUpProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.5, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionDivider({ className }: { className?: string }) {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: EASE }}
      className={cn(
        "h-px origin-left bg-gradient-to-r from-transparent via-[#2563EB]/35 to-transparent",
        className
      )}
    />
  );
}
