"use client";

import { useEffect } from "react";

/** Keep sidebar expanded when viewport is below lg (mobile drawer). */
export function useResetSidebarOnMobile(
  setCollapsed: (collapsed: boolean) => void
) {
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");

    const sync = () => {
      if (mq.matches) setCollapsed(false);
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [setCollapsed]);
}
