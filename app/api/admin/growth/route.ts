import { NextRequest, NextResponse } from "next/server";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import { assertAdminEmail, getAdminGrowthStats } from "@/lib/growth/admin";

export async function GET(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  if (!assertAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const stats = await getAdminGrowthStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[api/admin/growth]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin stats failed." },
      { status: 500 }
    );
  }
}
