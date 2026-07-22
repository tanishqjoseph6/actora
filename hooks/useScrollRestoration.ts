"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_PREFIX = "actora_scroll:";

/**
 * Restores scroll inside the dashboard main pane across App Router navigations.
 * Pair with <Link scroll={false}> / router.push(href, { scroll: false }).
 * Never forces window.scrollTo — only the provided scroll container.
 */
export function useScrollRestoration<T extends HTMLElement>() {
  const pathname = usePathname();
  const ref = useRef<T | null>(null);
  const previousPath = useRef<string | null>(null);
  const pendingRestore = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      // ignore
    }
  }, []);

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
      saved = Number(
        sessionStorage.getItem(`${STORAGE_PREFIX}${pathname}`) ?? 0
      );
    } catch {
      saved = 0;
    }

    if (!Number.isFinite(saved) || saved < 0) saved = 0;

    const restore = () => {
      const node = ref.current;
      if (!node) return;
      // Only restore a known position. Do not snap to 0 on every route —
      // leaving the container alone avoids fighting in-flight layout.
      if (saved > 0) {
        node.scrollTop = saved;
      }
    };

    if (pendingRestore.current != null) {
      cancelAnimationFrame(pendingRestore.current);
    }

    pendingRestore.current = requestAnimationFrame(() => {
      restore();
      pendingRestore.current = requestAnimationFrame(restore);
    });

    return () => {
      if (pendingRestore.current != null) {
        cancelAnimationFrame(pendingRestore.current);
        pendingRestore.current = null;
      }
    };
  }, [pathname]);

  // Persist continuously while scrolling so mid-scroll navigations stay accurate.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const path = previousPath.current ?? pathname;
        try {
          sessionStorage.setItem(
            `${STORAGE_PREFIX}${path}`,
            String(el.scrollTop)
          );
        } catch {
          // ignore
        }
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return ref;
}
