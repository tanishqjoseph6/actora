"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

const ACTIONS = [
  {
    title: "Drafted Reply",
    detail: "Proposal email prepared for client",
    icon: "✉️",
  },
  {
    title: "Task Created",
    detail: "Follow-up task generated automatically",
    icon: "✓",
  },
  {
    title: "Meeting Scheduled",
    detail: "Weekly update meeting added",
    icon: "📅",
  },
];

export default function ActionsPage() {
  return (
    <>
      <div className="mb-6 lg:mb-8">
        <p className={`text-sm ${dashboard.subtle} mb-2`}>⚡ Automation</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
          AI Actions
        </h1>
        <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
          Recent actions performed by Actora on your behalf.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIONS.map((action) => (
          <article
            key={action.title}
            className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-5 ${dashboard.cardBase} ${dashboard.cardHover}`}
          >
            <span className="w-10 h-10 rounded-xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-center text-lg shrink-0">
              {action.icon}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">{action.title}</h2>
              <p className={`text-sm ${dashboard.muted} mt-0.5`}>{action.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
