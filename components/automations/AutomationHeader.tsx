"use client";

import { motion } from "framer-motion";

type AutomationHeaderProps = {
  onNewAutomation: () => void;
  onImport: () => void;
  onShowTemplates: () => void;
};

export function AutomationHeader({
  onNewAutomation,
  onImport,
  onShowTemplates,
}: AutomationHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 lg:mb-8"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/5 text-[#00D4FF] text-xs font-medium mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
        AI Automation Builder
      </div>

      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00D4FF] to-[#4F8CFF]">
              AI Automation Builder
            </span>
          </h1>
          <p className="text-gray-500 mt-2 text-base lg:text-lg max-w-xl">
            Build workflows that let AI run repetitive work automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onNewAutomation}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-semibold bg-gradient-to-r from-[#4F8CFF] to-[#00D4FF] text-[#050816] shadow-lg shadow-[#00D4FF]/20 hover:shadow-[#00D4FF]/35 hover:scale-[1.02] transition-all"
          >
            <span aria-hidden>+</span>
            New Automation
          </button>
          <button
            type="button"
            onClick={onImport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-medium bg-[#0B1730]/60 border border-[#00D4FF]/15 text-gray-300 hover:border-[#00D4FF]/30 hover:text-white transition-all"
          >
            Import Workflow
          </button>
          <button
            type="button"
            onClick={onShowTemplates}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-medium bg-[#0B1730]/60 border border-[#00D4FF]/15 text-gray-300 hover:border-[#00D4FF]/30 hover:text-white transition-all"
          >
            Templates
          </button>
        </div>
      </div>
    </motion.header>
  );
}
