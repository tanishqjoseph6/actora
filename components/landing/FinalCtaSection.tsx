"use client";

import { motion } from "framer-motion";
import { BRAND_TAGLINE, landing } from "./landing-tokens";
import { LandingButton } from "./ui/LandingButton";
import { FadeUp } from "./motion";

export function FinalCtaSection() {
  return (
    <section className={`relative overflow-hidden ${landing.section}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/[0.12] blur-[100px]" />
      </div>

      <div className={`relative ${landing.container}`}>
        <FadeUp>
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative overflow-hidden rounded-[24px] border border-[#2563EB]/25 bg-[#111111]/80 px-6 py-16 text-center backdrop-blur-xl sm:px-12 sm:py-20 lg:py-24"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.1),transparent_70%)]"
              aria-hidden
            />

            <p className="relative text-xs font-medium uppercase tracking-[0.16em] text-[#2563EB]">
              {BRAND_TAGLINE}
            </p>
            <h2 className="relative mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to replace scattered tools?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-[#A1A1AA] sm:text-lg">
              Start using one AI workspace that helps your team move faster.
            </p>
            <div className="relative mt-10 flex justify-center">
              <LandingButton href="/signup" variant="primary" className="min-w-[200px]">
                Start Free
              </LandingButton>
            </div>
            <p className="relative mt-5 text-xs text-[#71717A]">
              14-day free trial · No credit card required
            </p>
          </motion.div>
        </FadeUp>
      </div>
    </section>
  );
}
