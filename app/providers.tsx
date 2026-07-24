"use client";

import { SessionProvider } from "next-auth/react";
import { BillingPauseProvider } from "@/components/billing/BillingPauseProvider";

function SessionGuard({ children }: { children: React.ReactNode }) {
  return children;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchOnWindowFocus={false}
      refetchInterval={5 * 60}
    >
      <SessionGuard>
        <BillingPauseProvider>{children}</BillingPauseProvider>
      </SessionGuard>
    </SessionProvider>
  );
}