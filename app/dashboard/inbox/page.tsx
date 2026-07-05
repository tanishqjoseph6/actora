"use client";

import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export default function InboxPage() {
  const { checkAiAction, subscription, loading } = usePlanGate();

  const emails = [
    {
      sender: "Amazon",
      subject: "Your order has shipped",
      preview: "Your package is on the way...",
      time: "10m ago",
    },
    {
      sender: "LinkedIn",
      subject: "New job opportunity",
      preview: "A recruiter viewed your profile...",
      time: "1h ago",
    },
    {
      sender: "Stripe",
      subject: "Payment received",
      preview: "You received a payment of $99...",
      time: "3h ago",
    },
  ];

  const handleAiSummary = () => {
    if (!checkAiAction()) return;

    alert(
      "AI Summary:\nThis email contains an important update that may require your attention."
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <div>
          <p className={`text-sm ${dashboard.subtle} mb-2`}>📥 Mail</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Inbox
          </h1>
          <p className={`${dashboard.muted} mt-2 text-sm sm:text-base`}>
            Review messages and run AI summaries on your threads.
          </p>
        </div>
        <CurrentPlanBadge
          subscription={subscription}
          loading={loading}
          compact
        />
      </div>

      <div className="space-y-3 sm:space-y-4">
        {emails.map((email, i) => (
          <div
            key={i}
            className={`${dashboard.cardBase} ${dashboard.cardHover} p-4 sm:p-5`}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3">
              <h2 className="font-semibold text-white truncate">{email.sender}</h2>
              <span className={`text-sm ${dashboard.subtle} shrink-0`}>{email.time}</span>
            </div>

            <p className="font-medium mt-2 text-white break-words">{email.subject}</p>
            <p className={`${dashboard.muted} text-sm mt-1 line-clamp-2`}>{email.preview}</p>

            <button
              type="button"
              className={`${dashboard.btnPrimary} mt-4 px-4 py-2 text-sm w-full sm:w-auto`}
              onClick={handleAiSummary}
            >
              AI Summary
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
