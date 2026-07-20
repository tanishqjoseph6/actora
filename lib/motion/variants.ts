import type { Transition, Variants } from "framer-motion";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const pageTransition: Transition = {
  duration: 0.2,
  ease: easeOut,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: easeOut },
  },
};

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: easeOut },
  },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: easeOut },
  },
};

export const scaleTap = { scale: 0.97 };
export const hoverLift = { y: -2 };
