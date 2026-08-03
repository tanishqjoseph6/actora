import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMembershipContext } from "@/lib/workspace/repository";
import type { WorkspacePermission, WorkspaceRole } from "@/lib/workspace/types";
import { roleHasPermission } from "@/lib/workspace/permissions";

const PREFIX = "actora_live_";
const WINDOW_MS = 60_000;
const LIMIT = 120;
const memoryRate = new Map<string, { reset: number; count: number }>();

export type PublicApiAuth = {
  keyId: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  permissions: string[];
};

export function hashApiKey(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createApiKey() {
  const secret = `${PREFIX}${crypto.randomBytes(32).toString("base64url")}`;
  return { secret, prefix: secret.slice(0, 18), hash: hashApiKey(secret) };
}

export async function authenticateApiKey(request: Request): Promise<PublicApiAuth | null> {
  const value = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!value?.startsWith(PREFIX)) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("api_keys").select("id, workspace_id, created_by, permissions")
    .eq("secret_hash", hashApiKey(value)).is("revoked_at", null).maybeSingle();
  if (!data) return null;
  const member = await getMembershipContext(data.workspace_id, data.created_by);
  if (!member) return null;
  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { keyId: data.id, workspaceId: data.workspace_id, userId: data.created_by, role: member.role, permissions: data.permissions ?? [] };
}

export function allowApiRequest(keyId: string) {
  const now = Date.now();
  const current = memoryRate.get(keyId);
  if (!current || now >= current.reset) {
    memoryRate.set(keyId, { reset: now + WINDOW_MS, count: 1 });
    return { allowed: true, remaining: LIMIT - 1, reset: now + WINDOW_MS };
  }
  current.count += 1;
  return { allowed: current.count <= LIMIT, remaining: Math.max(0, LIMIT - current.count), reset: current.reset };
}

export function canAccess(auth: PublicApiAuth, permission: WorkspacePermission) {
  return roleHasPermission(auth.role, permission) && (auth.permissions.length === 0 || auth.permissions.includes(permission));
}
