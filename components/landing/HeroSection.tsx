"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[#3B82F6]/[0.08] blur-[120px]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 text-sm font-medium tracking-wide text-[#3B82F6]"
          >
            Actora · Where conversations become execution.
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
          >
            Turn every conversation into execution.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg"
          >
            Actora transforms emails into tasks, CRM updates, meetings,
            follow-ups, and AI-powered workflows automatically.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#3B82F6] px-6 text-sm font-medium text-white transition-all hover:bg-[#2563EB] active:scale-[0.98]"
            >
              Start Free
            </Link>
            <a
              href="mailto:sales@useactora.com?subject=Actora%20Demo"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-6 text-sm font-medium text-white transition-all hover:border-white/[0.18] hover:bg-white/[0.04] active:scale-[0.98]"
            >
              Book Demo
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-xs text-[#71717A]"
          >
            14-day free trial · No credit card required
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
