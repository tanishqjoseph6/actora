import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { listContactMeetings } from "@/lib/calendar/meetings-store";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const contactEmail = request.nextUrl.searchParams.get("email");
  if (!contactEmail) {
    return NextResponse.json(
      { error: "Contact email is required." },
      { status: 400 }
    );
  }

  const userId = normalizeSubscriptionUserId(email);
  const result = await listContactMeetings(userId, contactEmail);

  return NextResponse.json(result);
}
