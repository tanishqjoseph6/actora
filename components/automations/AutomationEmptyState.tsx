"use client";

import { motion } from "framer-motion";

type AutomationEmptyStateProps = {
  onCreate: () => void;
};

export function AutomationEmptyState({ onCreate }: AutomationEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 lg:py-24 px-6 text-center rounded-[20px] bg-[#071426]/50 border border-[#00D4FF]/10 border-dashed"
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-32 h-32 rounded-full border border-dashed border-[#00D4FF]/20"
        />
        <div className="relative w-32 h-32 rounded-[20px] bg-gradient-to-br from-[#4F8CFF]/20 to-[#00D4FF]/10 border border-[#00D4FF]/25 flex items-center justify-center">
          <svg viewBox="0 0 80 80" className="w-16 h-16" aria-hidden>
            <defs>
              <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F8CFF" />
                <stop offset="100%" stopColor="#00D4FF" />
              </linearGradient>
            </defs>
            <rect x="20" y="12" width="40" height="12" rx="4" fill="url(#emptyGrad)" opacity="0.9" />
            <path d="M40 24 L40 32" stroke="#00D4FF" strokeWidth="2" strokeDasharray="2 2" />
            <rect x="16" y="34" width="48" height="12" rx="4" fill="url(#emptyGrad)" opacity="0.6" />
            <path d="M40 46 L40 54" stroke="#00D4FF" strokeWidth="2" strokeDasharray="2 2" />
            <rect x="24" y="56" width="32" height="12" rx="4" fill="url(#emptyGrad)" opacity="0.4" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
        No automations yet
      </h2>
      <p className="text-gray-500 max-w-md mb-8">
        Connect triggers, AI actions, and outputs into powerful workflows — like Zapier, but built for your AI workforce.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] text-sm font-semibold bg-gradient-to-r from-[#4F8CFF] to-[#00D4FF] text-[#050816] shadow-lg shadow-[#00D4FF]/25 hover:shadow-[#00D4FF]/40 hover:scale-[1.02] transition-all"
      >
        Create Your First Automation
      </button>
    </motion.div>
  );
}
