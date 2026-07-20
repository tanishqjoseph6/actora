"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_PREFIX = "actora_scroll:";

export function useScrollRestoration<T extends HTMLElement>() {
  const pathname = usePathname();
  const ref = useRef<T | null>(null);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prev = previousPath.current;
    if (prev && prev !== pathname) {
      try {
        sessionStorage.setItem(
          `${STORAGE_PREFIX}${prev}`,
          String(el.scrollTop)
        );
      } catch {
        // ignore quota errors
      }
    }

    previousPath.current = pathname;

    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem(`${STORAGE_PREFIX}${pathname}`) ?? 0);
    } catch {
      saved = 0;
    }

    const restore = () => {
      if (ref.current) ref.current.scrollTop = saved;
    };

    if (saved > 0) {
      requestAnimationFrame(() => {
        restore();
        // Second frame covers late content growth (skeletons → data).
        requestAnimationFrame(restore);
      });
    } else {
      el.scrollTop = 0;
    }
  }, [pathname]);

  return ref;
}
