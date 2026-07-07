"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/errors/ErrorPage";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050816] text-white antialiased">
        <ErrorPage
          variant="500"
          code="Error 500"
          title="Something Went Wrong"
          description="A critical error prevented Actora from loading. Reload the page or return to your dashboard."
          primaryAction={{ label: "Reload Page", onClick: handleReload }}
          secondaryAction={{ label: "Back to Dashboard", href: "/dashboard" }}
          extraAction={{ label: "Try Again", onClick: reset, variant: "secondary" }}
          footer={
            error.digest ? (
              <span className="font-mono text-[#64748B]">
                Reference: {error.digest}
              </span>
            ) : undefined
          }
        />
      </body>
    </html>
  );
}
