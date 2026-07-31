import { NextRequest, NextResponse } from "next/server";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import {
  buildProactiveInsights,
  notifyProactiveInsights,
} from "@/lib/assistant/proactive";

export async function GET(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const notify = request.nextUrl.searchParams.get("notify") === "1";
    const insights = await buildProactiveInsights(email);
    let notified = 0;
    if (notify) {
      notified = await notifyProactiveInsights(email);
    }
    return NextResponse.json({ insights, notified });
  } catch (error) {
    console.error("[api/assistant/insights]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load insights.",
      },
      { status: 500 }
    );
  }
}
