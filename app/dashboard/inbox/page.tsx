"use client";

import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";

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
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/8 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold">
            📥 <span className="text-blue-400">Inbox</span>
          </h1>
          <CurrentPlanBadge
            subscription={subscription}
            loading={loading}
            compact
          />
        </div>

        <div className="space-y-4">
          {emails.map((email, i) => (
            <div
              key={i}
              className="bg-[#0B1220]/80 backdrop-blur-sm p-5 rounded-2xl border border-[rgba(37, 99, 235,0.15)]"
            >
              <div className="flex justify-between">
                <h2 className="font-bold">{email.sender}</h2>
                <span className="text-gray-400">{email.time}</span>
              </div>

              <p className="font-medium mt-2">{email.subject}</p>
              <p className="text-gray-400">{email.preview}</p>

              <button
                className="mt-4 px-4 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold hover:bg-[#1D4ED8] transition-all"
                onClick={handleAiSummary}
              >
                AI Summary
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
