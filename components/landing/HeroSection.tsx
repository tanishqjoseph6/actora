"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeroPreview } from "./HeroPreview";

type HeroSectionProps = {
  onTryDemo?: () => void;
};

export function HeroSection({ onTryDemo }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-[#2563EB]/[0.09] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-medium uppercase tracking-[0.18em] text-[#2563EB]"
          >
            AI-powered workspace
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.08]"
          >
            One AI Workspace.
            <br className="hidden sm:block" />
            <span className="text-[#93C5FD]"> Every Conversation. Every Workflow.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg"
          >
            Actora is an AI-powered workspace that brings conversations, CRM, tasks,
            meetings, documents and automations into one intelligent platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-xl bg-[#2563EB] px-7 text-sm font-semibold text-white shadow-[0_0_40px_rgba(37,99,235,0.25)] transition-all hover:bg-[#1D4ED8] active:scale-[0.98]"
            >
              Start Free
            </Link>
            <button
              type="button"
              onClick={onTryDemo}
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-7 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-[#2563EB]/40 hover:bg-[#2563EB]/10 active:scale-[0.98]"
            >
              Try Interactive Demo
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-5 text-xs text-[#71717A]"
          >
            14-day free trial · 100 AI credits included · No credit card required
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-14 max-w-5xl sm:mt-16"
        >
          <div
            className="pointer-events-none absolute -inset-x-8 -bottom-8 top-1/3 rounded-[40%] bg-[#2563EB]/[0.07] blur-3xl"
            aria-hidden
          />
          <HeroPreview onTryDemo={onTryDemo} />
        </motion.div>
      </div>
    </section>
  );
}
