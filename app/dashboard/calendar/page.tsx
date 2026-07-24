"use client";

import dynamic from "next/dynamic";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { CalendarContentSkeleton } from "@/components/calendar/CalendarContentSkeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

const CalendarWorkspace = dynamic(
  () =>
    import("@/components/calendar/CalendarWorkspace").then(
      (m) => m.CalendarWorkspace
    ),
  {
    ssr: false,
    loading: () => (
      <div className={dashboard.panelLg}>
        <CalendarContentSkeleton />
      </div>
    ),
  }
);

export default function CalendarPage() {
  return (
    <FeatureGate feature="meetings" fullPage>
      <CalendarWorkspace />
    </FeatureGate>
  );
}
