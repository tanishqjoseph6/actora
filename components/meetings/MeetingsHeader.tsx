"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type MeetingsHeaderProps = {
  onSchedule?: () => void;
};

export function MeetingsHeader({ onSchedule }: MeetingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <p className={`text-sm ${dashboard.subtle} mb-2`}>📅 Schedule</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
          Meetings
        </h1>
        <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
          Your calendar at a glance — upcoming calls, demos, and team syncs in one place.
        </p>
      </div>
      <button
        type="button"
        onClick={onSchedule}
        disabled
        className={`${dashboard.btnPrimary} px-4 py-2.5 text-sm opacity-60 cursor-not-allowed shrink-0`}
        title="Coming soon"
      >
        + Schedule meeting
      </button>
    </div>
  );
}
