"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_PREFETCH_ROUTES } from "@/components/dashboard/nav-config";

export function useRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const prefetchAll = () => {
      if (cancelled) return;
      for (const route of DASHBOARD_PREFETCH_ROUTES) {
        router.prefetch(route);
      }
    };

    if (
      typeof window !== "undefined" &&
      "requestIdleCallback" in window &&
      typeof window.requestIdleCallback === "function"
    ) {
      const id = window.requestIdleCallback(prefetchAll, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timeoutId = setTimeout(prefetchAll, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [router]);
}
