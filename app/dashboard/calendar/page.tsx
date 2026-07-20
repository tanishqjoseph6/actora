"use client";

import { FeatureGate } from "@/components/subscription/FeatureGate";
import { CalendarWorkspace } from "@/components/calendar/CalendarWorkspace";

export default function CalendarPage() {
  return (
    <FeatureGate feature="meetings" fullPage>
      <CalendarWorkspace />
    </FeatureGate>
  );
}
