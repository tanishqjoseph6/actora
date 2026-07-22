"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-[#3B82F6]/[0.09] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Actora
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="mt-5 text-xl font-medium tracking-tight text-[#E4E4E7] sm:text-2xl lg:text-[1.75rem] lg:leading-snug"
          >
            Where conversations become execution.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg"
          >
            AI Inbox, Roxx AI, CRM, and automations — so every email turns into
            outcomes, not open tabs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#3B82F6] px-7 text-sm font-medium text-white transition-all hover:bg-[#2563EB] active:scale-[0.98]"
            >
              Get Started
            </Link>
            <a
              href="mailto:sales@useactora.com?subject=Actora%20Demo"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-7 text-sm font-medium text-white transition-all hover:border-white/[0.18] hover:bg-white/[0.04] active:scale-[0.98]"
            >
              Book a Demo
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-5 text-xs text-[#71717A]"
          >
            14-day free trial · No credit card required
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-14 max-w-5xl sm:mt-16"
        >
          <div
            className="pointer-events-none absolute -inset-x-8 -bottom-8 top-1/3 rounded-[40%] bg-[#3B82F6]/[0.07] blur-3xl"
            aria-hidden
          />
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
