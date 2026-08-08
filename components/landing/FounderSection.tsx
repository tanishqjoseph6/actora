"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ComponentType } from "react";
import { FadeUp } from "./motion";
import { GlassCard } from "./ui/GlassCard";
import { landing } from "./landing-tokens";

type FounderSocial = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const FOUNDER_SOCIALS: FounderSocial[] = [
  {
    label: "Instagram",
    href: "https://instagram.com/tanishqjjoseph",
    icon: InstagramIcon,
  },
  // Future social links can be added here without changing the section layout.
];

export function FounderSection() {
  return (
    <section
      id="founder"
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] py-20 sm:py-28 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[min(80vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/[0.08] blur-[120px]"
      />

      <div className={`relative ${landing.container}`}>
        <FadeUp>
          <GlassCard className="relative overflow-hidden p-6 sm:p-10 lg:p-14" hover>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(59,130,246,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.025),transparent_45%)]"
            />

            <div className="relative grid items-center gap-10 lg:grid-cols-[auto_1fr_auto] lg:gap-14">
              <motion.div
                whileHover={{ scale: 1.04, rotate: 2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative mx-auto lg:mx-0"
              >
                <div
                  aria-label="Founder photo placeholder"
                  className="flex h-32 w-32 items-center justify-center rounded-full border border-[#60A5FA]/35 bg-gradient-to-br from-[#2563EB]/25 via-[#111827] to-[#0A0A0A] shadow-[0_0_0_8px_rgba(37,99,235,0.05),0_0_45px_rgba(37,99,235,0.2)] sm:h-40 sm:w-40"
                >
                  <span className="text-4xl font-semibold tracking-tight text-[#BFDBFE] sm:text-5xl">
                    TJ
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#111827] bg-[#2563EB] text-white shadow-[0_0_20px_rgba(37,99,235,0.55)]">
                  <Sparkles className="h-4 w-4" />
                </div>
              </motion.div>

              <div className="text-center lg:text-left">
                <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#60A5FA] lg:justify-start">
                  <Sparkles className="h-3.5 w-3.5" />
                  Meet the Founder
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Building the Future of AI Workspaces
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
                  Tanishq Joseph is an 18-year-old entrepreneur building Actora.
                  What started as a side project to solve his own productivity
                  challenges is now evolving into an AI-native workspace where
                  conversations become execution.
                </p>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-white">Tanishq Joseph</p>
                  <p className="mt-1 text-xs text-[#71717A]">Founder &amp; CEO · Actora</p>
                </div>
              </div>

              <div className="flex flex-col items-center lg:items-start">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[#71717A]">
                  Follow the Founder
                </p>
                {FOUNDER_SOCIALS.map(({ label, href, icon: Icon }) => (
                  <motion.div
                    key={label}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 340, damping: 22 }}
                  >
                    <Link
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Follow Tanishq Joseph on ${label}`}
                      className="group inline-flex items-center gap-2.5 rounded-xl border border-[#3B82F6]/30 bg-[#2563EB]/10 px-4 py-3 text-sm font-medium text-[#BFDBFE] shadow-[0_0_24px_rgba(37,99,235,0.12)] transition-all hover:border-[#60A5FA]/60 hover:bg-[#2563EB]/20 hover:text-white hover:shadow-[0_0_32px_rgba(37,99,235,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      Follow on Instagram
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#60A5FA] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </FadeUp>
      </div>
    </section>
  );
}
