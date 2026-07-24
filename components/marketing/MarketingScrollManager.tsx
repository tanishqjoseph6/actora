"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Resets window scroll on marketing route changes.
 * Dashboard uses its own scroll container + useScrollRestoration.
 */
export function MarketingScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
