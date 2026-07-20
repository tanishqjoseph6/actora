import { NextRequest, NextResponse } from "next/server";
import { getCalendarAuthClient } from "@/lib/calendar/auth";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { logApiError } from "@/lib/api/log-error";

export async function POST(request: NextRequest) {
  const auth = await getCalendarAuthClient(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const body = (await request.json()) as {
    timeMin?: string;
    timeMax?: string;
  };

  const timeMin = body.timeMin ?? new Date().toISOString();
  const timeMax =
    body.timeMax ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const provider = getCalendarProvider(auth.account.provider);
    const busy = await provider.getFreeBusy(auth.oauth2Client, {
      timeMin,
      timeMax,
    });
    return NextResponse.json({
      busy,
      accountEmail: auth.account.accountEmail,
    });
  } catch (error) {
    logApiError("calendar/availability", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check availability.",
      },
      { status: 500 }
    );
  }
}
