"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/errors/ErrorPage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <ErrorPage
      variant="500"
      code="Error 500"
      title="Something Went Wrong"
      description="An unexpected error occurred while loading this page. Try again, or return to your dashboard while we recover."
      primaryAction={{ label: "Try Again", onClick: reset }}
      secondaryAction={{ label: "Back to Dashboard", href: "/dashboard" }}
      footer={
        error.digest ? (
          <span className="font-mono text-[#64748B]">Reference: {error.digest}</span>
        ) : undefined
      }
    />
  );
}
