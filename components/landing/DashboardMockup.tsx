"use client";

import { motion } from "framer-motion";

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative mx-auto max-w-5xl"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#2563EB]/30 via-[#1E293B]/20 to-transparent blur-sm" />
      <div className="relative rounded-2xl border border-[#1E293B] bg-[#0B1220] shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E293B] bg-[#05070B]/60">
          <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]/60" />
          <span className="ml-3 text-[10px] text-[#64748B] font-mono">app.useactora.com/dashboard</span>
        </div>

        <div className="flex min-h-[280px] sm:min-h-[340px]">
          <aside className="hidden sm:flex w-48 shrink-0 flex-col border-r border-[#1E293B] p-3 gap-1 bg-[#05070B]/40">
            <div className="text-xs font-bold text-white mb-3 px-2">Actora</div>
            {["Inbox", "CRM", "Automations", "Analytics"].map((item, i) => (
              <div
                key={item}
                className={`px-3 py-2 rounded-lg text-xs ${
                  i === 0
                    ? "bg-[#2563EB]/15 border border-[#2563EB]/30 text-white"
                    : "text-[#64748B]"
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          <div className="flex-1 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Today</p>
                <p className="text-sm font-semibold text-white mt-0.5">Good morning, Alex</p>
              </div>
              <div className="hidden sm:flex gap-2">
                {["12 unread", "3 deals", "AI online"].map((pill) => (
                  <span
                    key={pill}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-[#1E293B] text-[#94A3B8]"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "AI Actions", value: "847" },
                { label: "Pipeline", value: "$124k" },
                { label: "Response", value: "2.1h" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[#1E293B] bg-[#111827] p-3 hover:border-[#2563EB]/40 transition-colors"
                >
                  <p className="text-[10px] text-[#64748B]">{stat.label}</p>
                  <p className="text-lg font-bold text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {[
                { from: "Jordan Lee", subject: "Re: Q2 proposal timeline", unread: true },
                { from: "Acme Corp", subject: "Contract review — needs reply", unread: true },
                { from: "Calendar", subject: "Meeting summary: Product sync", unread: false },
              ].map((email) => (
                <div
                  key={email.subject}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    email.unread
                      ? "border-[#2563EB]/30 bg-[#111827] hover:border-[#2563EB]/50"
                      : "border-[#1E293B] bg-[#111827]/60 hover:border-[#1E293B]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {email.from.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{email.from}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{email.subject}</p>
                  </div>
                  {email.unread && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
