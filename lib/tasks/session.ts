import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getApiUserEmail } from "@/lib/auth/get-api-user";
import { isWritableRole } from "@/lib/workspace/permissions";
import { requireWorkspacePermission } from "@/lib/workspace/require";

export async function requireTasksUserId(
  request?: NextRequest
): Promise<string | NextResponse> {
  const auth = await requireWorkspacePermission("tasks", request);
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  return auth.email;
}

export async function requireTasksWriteUserId(
  request?: NextRequest
): Promise<string | NextResponse> {
  const auth = await requireWorkspacePermission("tasks", request);
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  if (!isWritableRole(auth.ctx.role)) {
    return NextResponse.json(
      {
        error: "You do not have permission to modify tasks.",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }
  return auth.email;
}

export async function getTasksUserId(request?: NextRequest): Promise<string | null> {
  return getApiUserEmail(request);
}
