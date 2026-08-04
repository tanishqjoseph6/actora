"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/errors/ErrorPage";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-render] dashboard segment failed", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <ErrorPage
      variant="500"
      code="Dashboard unavailable"
      title="Your dashboard is still available"
      description="One dashboard section failed to render. Try again while the rest of your workspace remains protected."
      primaryAction={{ label: "Try Again", onClick: reset }}
      secondaryAction={{ label: "Open Settings", href: "/dashboard/settings" }}
    />
  );
}
