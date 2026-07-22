"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeatureGate } from "@/components/subscription/FeatureGate";

/** Meetings route now lives at /dashboard/calendar */
export default function MeetingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/calendar", { scroll: false });
  }, [router]);

  return (
    <FeatureGate feature="meetings" fullPage>
      <p className="text-sm text-[#A1A1AA]">Opening calendar…</p>
    </FeatureGate>
  );
}
