"use client";

import { motion } from "framer-motion";
import { BRAND_TAGLINE, landing } from "./landing-tokens";
import { LandingButton } from "./ui/LandingButton";
import { HeroWorkflowVisual } from "./HeroWorkflowVisual";

type HeroSectionProps = {
  onTryDemo?: () => void;
};

function FloatingOrb({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      animate={{ y: [0, -12, 0], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: "easeInOut" }}
      className={className}
    />
  );
}

export function HeroSection({ onTryDemo }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.14), transparent 55%)",
              "radial-gradient(ellipse 70% 55% at 55% -5%, rgba(59,130,246,0.12), transparent 50%)",
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.14), transparent 55%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#2563EB]/[0.08] blur-[130px]" />
        <FloatingOrb
          delay={0}
          className="absolute left-[12%] top-[28%] h-2 w-2 rounded-full bg-[#2563EB]/60 blur-[1px]"
        />
        <FloatingOrb
          delay={1.5}
          className="absolute right-[15%] top-[35%] h-1.5 w-1.5 rounded-full bg-[#93C5FD]/50"
        />
        <FloatingOrb
          delay={3}
          className="absolute left-[20%] bottom-[30%] h-1 w-1 rounded-full bg-[#3B82F6]/40"
        />
      </div>

      <div className={`relative ${landing.container}`}>
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-medium uppercase tracking-[0.2em] text-[#2563EB]"
          >
            {BRAND_TAGLINE}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="mt-5 text-3xl font-semibold tracking-tight text-white min-[400px]:text-4xl sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] mobile-text-balance"
          >
            One AI Workspace.
            <br />
            <span className="bg-gradient-to-r from-white via-[#93C5FD] to-[#2563EB] bg-clip-text text-transparent">
              Every Conversation. Every Workflow.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg"
          >
            Actora unifies conversations, tasks, meetings, CRM, documents, calendar
            and AI automation into one intelligent workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-10 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center"
          >
            <LandingButton href="/signup" variant="primary" className="w-full sm:w-auto">
              Start Free
            </LandingButton>
            <LandingButton variant="secondary" onClick={onTryDemo} className="w-full sm:w-auto">
              Try Interactive Demo
            </LandingButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-6 text-xs text-[#71717A]"
          >
            14-day free trial · 100 AI credits · No credit card required
          </motion.p>
        </div>

        {/* Glass stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 min-[400px]:grid-cols-3 sm:mt-10 sm:gap-4"
        >
          {[
            { label: "AI surfaces", value: "8+" },
            { label: "Setup time", value: "<5 min" },
            { label: "Free trial", value: "14 days" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="rounded-2xl border border-white/[0.08] bg-[#111111]/50 px-3 py-3 text-center backdrop-blur-md sm:px-4 sm:py-4"
            >
              <p className="text-lg font-bold tabular-nums text-white sm:text-xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#71717A] sm:text-xs">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-14 max-w-5xl sm:mt-16 lg:mt-20"
        >
          <HeroWorkflowVisual onTryDemo={onTryDemo} />
        </motion.div>
      </div>
    </section>
  );
}
