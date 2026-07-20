import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { calendarAccountRepository } from "@/lib/calendar/repository";
import { revokeOAuthToken } from "@/lib/gmail/oauth";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type { CalendarProviderId } from "@/lib/calendar/types";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const provider =
    (request.nextUrl.searchParams.get("provider") as CalendarProviderId | null) ??
    "google";
  const accountEmail =
    request.nextUrl.searchParams.get("accountEmail") ?? undefined;
  const account = await calendarAccountRepository.getPrimary(userId, provider);

  if (account?.accessToken) {
    await revokeOAuthToken(account.accessToken).catch(() => undefined);
  }

  await calendarAccountRepository.disconnect(
    userId,
    provider,
    accountEmail ?? account?.accountEmail
  );

  return NextResponse.json({ ok: true });
}
