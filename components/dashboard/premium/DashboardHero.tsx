"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const QUICK_ACTIONS: { href: string; label: string; icon: string; primary?: boolean }[] = [
  { href: "/dashboard/connect-gmail", label: "Connect Gmail", icon: "📧", primary: true },
  { href: "/dashboard/actions", label: "Create Automation", icon: "⚡" },
  { href: "/dashboard/crm", label: "Open CRM", icon: "🏢" },
  { href: "/dashboard", label: "AI Assistant", icon: "✨" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function DashboardHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mb-8 lg:mb-10"
    >
      <p className="text-sm text-gray-400 mb-2">
        {getGreeting()}, Tanishq 👋
      </p>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
        Your AI workforce is{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#4F8CFF] to-[#00D4FF]">
          managing your business
        </span>{" "}
        today.
      </h1>
      <p className="text-gray-500 mt-3 text-base lg:text-lg max-w-2xl">
        Emails, CRM, automations, and insights — orchestrated from one premium workspace.
      </p>

      <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.href + action.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <Link
              href={action.href}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-medium transition-all duration-200
                ${action.primary
                  ? "bg-gradient-to-r from-[#4F8CFF] to-[#00D4FF] text-[#050816] shadow-lg shadow-[#00D4FF]/20 hover:shadow-[#00D4FF]/35 hover:scale-[1.02]"
                  : "bg-[#0B1730]/60 border border-[#00D4FF]/15 text-gray-300 hover:border-[#00D4FF]/30 hover:text-white hover:bg-[#0B1730]"
                }
              `}
            >
              <span aria-hidden>{action.icon}</span>
              {action.label}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
