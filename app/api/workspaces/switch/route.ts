import { NextRequest, NextResponse } from "next/server";
import { getApiUserEmail, unauthenticatedJsonResponse } from "@/lib/auth/get-api-user";
import { shouldUseSecureCookies } from "@/lib/auth/nextauth-url";
import {
  getMembershipContext,
  WORKSPACE_COOKIE,
  workspaceCookieOptions,
} from "@/lib/workspace";

/**
 * Switch active workspace via httpOnly cookie — no full page reload required.
 * Client updates React context after a successful response.
 */
export async function POST(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const body = (await request.json()) as { workspaceId?: string };
    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const membership = await getMembershipContext(workspaceId, email);
    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this workspace.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      active: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        logoUrl: membership.workspace.logo_url,
        icon: membership.workspace.icon,
        planId: membership.workspace.plan_id,
        role: membership.role,
        permissions: membership.permissions,
        ownerUserId: membership.workspace.owner_user_id,
        createdAt: membership.workspace.created_at,
      },
    });

    response.cookies.set(
      WORKSPACE_COOKIE,
      workspaceId,
      workspaceCookieOptions(shouldUseSecureCookies())
    );

    return response;
  } catch (error) {
    console.error("[api/workspaces/switch]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Switch failed." },
      { status: 500 }
    );
  }
}
