"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Captures ?ref= referral codes and attributes after login.
 * Also fires welcome onboarding once per browser session.
 */
export function GrowthBootstrap() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      try {
        window.localStorage.setItem("actora_referral_code", ref.trim().toUpperCase());
      } catch {
        /* ignore */
      }
    }

    const stored =
      ref?.trim().toUpperCase() ||
      (() => {
        try {
          return window.localStorage.getItem("actora_referral_code");
        } catch {
          return null;
        }
      })();

    void (async () => {
      try {
        if (stored) {
          await fetch("/api/referrals", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: stored }),
          });
          try {
            window.localStorage.removeItem("actora_referral_code");
          } catch {
            /* ignore */
          }
        }

        const welcomed = window.sessionStorage.getItem("actora_welcome_sent");
        if (!welcomed) {
          await fetch("/api/referrals", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "welcome" }),
          });
          window.sessionStorage.setItem("actora_welcome_sent", "1");
        }
      } catch {
        /* non-blocking */
      }
    })();
  }, [searchParams]);

  return null;
}
