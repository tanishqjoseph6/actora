"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
  return (
    <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-28 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#2563EB]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-[#1D4ED8]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[#1E293B] bg-[#111827]/60 text-[#2563EB] text-xs font-semibold uppercase tracking-wider"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          AI-native workspace
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl mx-auto"
        >
          <span className="text-white">Your AI Operating System </span>
          <span className="bg-gradient-to-r from-white via-[#93C5FD] to-[#2563EB] bg-clip-text text-transparent">
            for Email.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-6 text-lg sm:text-xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Read, reply, schedule, and automate—inside a workspace built for operators
          who live in their inbox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link
            href="/signup"
            className={`w-full sm:w-auto px-8 py-3.5 text-sm ${dashboard.btnPrimary}`}
          >
            Get started free
          </Link>
          <a
            href="#pricing"
            className={`w-full sm:w-auto px-8 py-3.5 text-sm ${dashboard.btnSecondary}`}
          >
            View pricing
          </a>
        </motion.div>

        <div className="mt-16 sm:mt-20">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
