import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getApiUserEmail,
} from "@/lib/auth/get-api-user";

export async function getCrmUserId(
  request?: NextRequest
): Promise<string | null> {
  return getApiUserEmail(request);
}

export function crmUnauthorizedResponse() {
  return NextResponse.json(
    {
      error: "Not authenticated.",
      code: "UNAUTHENTICATED",
      loginUrl: "/login",
    },
    { status: 401 }
  );
}

export async function requireCrmUserId(
  request?: NextRequest
): Promise<string | NextResponse> {
  const userId = await getCrmUserId(request);
  if (!userId) {
    return crmUnauthorizedResponse();
  }
  return userId;
}
