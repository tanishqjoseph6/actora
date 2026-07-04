"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

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
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus refetchInterval={5 * 60}>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  );
}