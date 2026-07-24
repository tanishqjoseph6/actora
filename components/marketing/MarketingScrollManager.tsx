"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Resets window scroll on marketing route changes.
 * Preserves hash deep links (e.g. /features#crm, /faq#security).
 */
export function MarketingScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace(/^#/, "");
      const scrollToTarget = () => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return true;
        }
        return false;
      };
      if (!scrollToTarget()) {
        window.setTimeout(scrollToTarget, 100);
      }
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
