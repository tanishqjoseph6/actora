import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isWritableRole } from "@/lib/workspace/permissions";
import { requireWorkspacePermission } from "@/lib/workspace/require";

export async function getCrmUserId(
  request?: NextRequest
): Promise<string | null> {
  const auth = await requireWorkspacePermission("crm", request);
  if (!auth.ok) return null;
  return auth.email;
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

export function crmForbiddenResponse() {
  return NextResponse.json(
    {
      error: "You do not have permission to modify CRM records.",
      code: "FORBIDDEN",
    },
    { status: 403 }
  );
}

async function requireCrmAccess(
  request: NextRequest | undefined,
  write: boolean
): Promise<string | NextResponse> {
  const auth = await requireWorkspacePermission("crm", request);
  if (!auth.ok) {
    return auth.response as NextResponse;
  }
  if (write && !isWritableRole(auth.ctx.role)) {
    return crmForbiddenResponse();
  }
  return auth.email;
}

export async function requireCrmUserId(
  request?: NextRequest
): Promise<string | NextResponse> {
  return requireCrmAccess(request, false);
}

export async function requireCrmWriteUserId(
  request?: NextRequest
): Promise<string | NextResponse> {
  return requireCrmAccess(request, true);
}
