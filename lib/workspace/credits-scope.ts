import type { NextRequest } from "next/server";
import { resolveActiveWorkspace } from "./require";

/**
 * Credits & plan allotment are billed to the workspace owner.
 * All members consume from that shared pool.
 */
export async function resolveWorkspaceCreditOwner(
  actorUserId: string,
  request?: NextRequest
): Promise<{
  creditUserId: string;
  workspaceId: string;
  actorUserId: string;
}> {
  const ctx = await resolveActiveWorkspace(actorUserId, request);
  return {
    creditUserId: ctx.workspace.owner_user_id,
    workspaceId: ctx.workspaceId,
    actorUserId,
  };
}
