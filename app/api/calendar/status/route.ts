import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import {
  calendarAccountRepository,
  toPublicCalendarAccount,
} from "@/lib/calendar/repository";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const accounts = await calendarAccountRepository.listByUser(userId);
  const primary = accounts[0] ?? null;

  return NextResponse.json({
    connected: Boolean(primary),
    account: primary ? toPublicCalendarAccount(primary) : null,
    accounts: accounts.map(toPublicCalendarAccount),
  });
}
