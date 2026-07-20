"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export function AnalyticsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <p className={`text-sm ${dashboard.subtle} mb-2`}>📊 Insights</p>
        <h1 className={dashboard.pageTitle}>
          Analytics
        </h1>
        <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
          Pipeline performance, inbox volume, and AI usage — unified in one dashboard.
        </p>
      </div>
      <button
        type="button"
        disabled
        className={`${dashboard.btnSecondary} px-4 py-2.5 text-sm opacity-60 cursor-not-allowed shrink-0`}
        title="Coming soon"
      >
        Export report
      </button>
    </div>
  );
}
