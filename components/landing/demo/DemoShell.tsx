"use client";

import { motion } from "framer-motion";
import { SIDEBAR_ITEMS } from "./demo-config";

type DemoShellProps = {
  activeNav?: string;
  children: React.ReactNode;
  compact?: boolean;
};

export function DemoShell({ activeNav = "Dashboard", children, compact }: DemoShellProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0A0A] shadow-[0_32px_100px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#2563EB]/20 blur-3xl" aria-hidden />

      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#111111]/80 px-4 py-2.5 backdrop-blur-md">
        <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/80" />
        <span className="ml-3 text-[11px] font-medium tracking-wide text-[#71717A]">
          Actora · Workspace
        </span>
      </div>

      <div className={`grid h-[calc(100%-41px)] ${compact ? "grid-cols-1" : "grid-cols-[148px_1fr] md:grid-cols-[168px_1fr]"}`}>
        {!compact && (
          <nav className="hidden border-r border-white/[0.06] bg-[#111111]/40 p-3 sm:block">
            {SIDEBAR_ITEMS.map((item) => {
              const active = item === activeNav;
              return (
                <motion.div
                  key={item}
                  layout
                  className={`mb-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#2563EB]/15 text-[#93C5FD] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.25)]"
                      : "text-[#71717A]"
                  }`}
                >
                  {item}
                </motion.div>
              );
            })}
          </nav>
        )}

        <div className="relative overflow-hidden p-4 sm:p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}
