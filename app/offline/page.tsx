"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorPage } from "@/components/errors/ErrorPage";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const handleRetry = useCallback(() => {
    setRetrying(true);

    if (navigator.onLine) {
      window.location.reload();
      return;
    }

    window.setTimeout(() => {
      setRetrying(false);
      setIsOnline(navigator.onLine);
    }, 600);
  }, []);

  if (isOnline) {
    return (
      <ErrorPage
        variant="offline"
        code="Back online"
        title="Connection restored"
        description="You're connected again. Head home or reload to pick up where you left off."
        primaryAction={{ label: "Back Home", href: "/" }}
        secondaryAction={{
          label: "Reload page",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  return (
    <ErrorPage
      variant="offline"
      code="Offline"
      title="You're Offline"
      description="Actora can't reach the network right now. Check your connection and try again when you're back online."
      primaryAction={{
        label: retrying ? "Checking…" : "Retry",
        onClick: handleRetry,
      }}
      secondaryAction={{ label: "Back Home", href: "/" }}
    />
  );
}
