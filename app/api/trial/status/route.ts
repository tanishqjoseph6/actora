import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { logApiError } from "@/lib/api/log-error";
import { getTrialStatus } from "@/lib/trial/service";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);

  try {
    const status = await getTrialStatus(userId);
    return NextResponse.json(status);
  } catch (error) {
    logApiError("api/trial/status", error, { userId });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load trial status.",
      },
      { status: 500 }
    );
  }
}
