import { NextRequest, NextResponse } from "next/server";
import { getCalendarAuthClient } from "@/lib/calendar/auth";
import {
  calendarAccountRepository,
  toPublicCalendarAccount,
} from "@/lib/calendar/repository";
import { syncCalendarAccount } from "@/lib/calendar/sync";
import { logApiError } from "@/lib/api/log-error";

export async function POST(request: NextRequest) {
  const auth = await getCalendarAuthClient(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const result = await syncCalendarAccount(
      auth.userId,
      auth.account,
      auth.oauth2Client
    );
    const refreshed = await calendarAccountRepository.getPrimary(
      auth.userId,
      auth.account.provider
    );

    return NextResponse.json({
      syncedCount: result.syncedCount,
      account: refreshed ? toPublicCalendarAccount(refreshed) : null,
    });
  } catch (error) {
    logApiError("calendar/sync", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Calendar sync failed.",
        code: "SYNC_FAILED",
      },
      { status: 500 }
    );
  }
}
