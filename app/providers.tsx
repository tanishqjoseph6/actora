"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { BillingPauseProvider } from "@/components/billing/BillingPauseProvider";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      void signOut({ callbackUrl: "/login?error=RefreshAccessTokenError" });
    }
  }, [session?.error]);

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