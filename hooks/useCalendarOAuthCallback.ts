"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { fetchJson } from "@/lib/api/fetch-json";
import { CALENDAR_OAUTH_CALLBACK_PARAM } from "@/lib/calendar/scopes";
import type { CalendarAccountPublic } from "@/lib/calendar/types";

export function useCalendarOAuthCallback(options?: {
  onSuccess?: (account: CalendarAccountPublic) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (ran.current) return;
    if (searchParams.get(CALENDAR_OAUTH_CALLBACK_PARAM) !== "1") return;
    ran.current = true;

    const run = async () => {
      setConnecting(true);
      try {
        await getSession();
        const result = await fetchJson<{
          account: CalendarAccountPublic;
        }>("/api/calendar/connect", { method: "POST" });

        if (!result.ok) {
          setTone("error");
          setMessage(result.error.message);
        } else {
          setTone("success");
          setMessage(
            `Google Calendar connected as ${result.data.account.accountEmail}`
          );
          options?.onSuccess?.(result.data.account);
        }
      } catch (error) {
        setTone("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not connect Google Calendar."
        );
      } finally {
        setConnecting(false);
        const url = new URL(window.location.href);
        url.searchParams.delete(CALENDAR_OAUTH_CALLBACK_PARAM);
        router.replace(
          `${url.pathname}${url.search}${url.hash || "#integrations"}`
        );
      }
    };

    void run();
  }, [options, router, searchParams]);

  return { connecting, message, tone };
}
