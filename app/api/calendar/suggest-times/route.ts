import { NextRequest, NextResponse } from "next/server";
import { getCalendarAuthClient } from "@/lib/calendar/auth";
import { getCalendarProvider } from "@/lib/calendar/providers";
import type { SuggestTimesInput } from "@/lib/calendar/types";
import { logApiError } from "@/lib/api/log-error";

export async function POST(request: NextRequest) {
  const auth = await getCalendarAuthClient(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const body = (await request.json().catch(() => ({}))) as SuggestTimesInput;

  try {
    const provider = getCalendarProvider(auth.account.provider);
    const suggestions = await provider.suggestTimes(auth.oauth2Client, body);
    return NextResponse.json({ suggestions });
  } catch (error) {
    logApiError("calendar/suggest-times", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to suggest meeting times.",
      },
      { status: 500 }
    );
  }
}
