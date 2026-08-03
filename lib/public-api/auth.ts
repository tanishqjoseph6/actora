import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMembershipContext } from "@/lib/workspace/repository";
import type { WorkspacePermission, WorkspaceRole } from "@/lib/workspace/types";
import { roleHasPermission } from "@/lib/workspace/permissions";
import { getStoredSubscription } from "@/lib/subscription/repository";
import { getPublicApiLimits, getPublicApiMonthStart } from "./limits";

const PREFIX = "actora_live_";
export type PublicApiAuth = {
  keyId: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  permissions: string[];
  planId: import("@/components/billing/pricing-data").PlanId;
  monthlyCallsLimit: number;
  requestsPerMinuteLimit: number;
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
  const subscription = await getStoredSubscription(data.created_by);
  const planId = subscription?.planId ?? "free";
  const limits = getPublicApiLimits(planId);
  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { keyId: data.id, workspaceId: data.workspace_id, userId: data.created_by, role: member.role, permissions: data.permissions ?? [], planId, monthlyCallsLimit: limits.monthlyCalls, requestsPerMinuteLimit: limits.requestsPerMinute };
}

export async function consumeApiQuota(auth: PublicApiAuth) {
  const db = getSupabaseAdmin();
  if (!db) return { allowed: false, reason: "unavailable" as const, remaining: 0, retryAfter: 60 };
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000).toISOString();
  const [rate, monthly] = await Promise.all([
    db.rpc("consume_public_api_rate_limit", { p_api_key_id: auth.keyId, p_window_start: windowStart, p_limit: auth.requestsPerMinuteLimit }),
    db.rpc("consume_public_api_call", { p_workspace_id: auth.workspaceId, p_api_key_id: auth.keyId, p_month_start: getPublicApiMonthStart(now).slice(0, 10), p_monthly_limit: Number.isFinite(auth.monthlyCallsLimit) ? auth.monthlyCallsLimit : -1 }),
  ]);
  if (rate.error || monthly.error) return { allowed: false, reason: "unavailable" as const, remaining: 0, retryAfter: 60 };
  const rateRow = rate.data?.[0];
  const monthlyRow = monthly.data?.[0];
  if (!rateRow?.allowed) return { allowed: false, reason: "rate" as const, remaining: 0, retryAfter: 60 };
  if (!monthlyRow?.allowed) return { allowed: false, reason: "monthly" as const, remaining: 0, retryAfter: 60 };
  return { allowed: true, reason: null, remaining: monthlyRow.calls_remaining, retryAfter: 0 };
}

export function canAccess(auth: PublicApiAuth, permission: WorkspacePermission) {
  return roleHasPermission(auth.role, permission) && (auth.permissions.length === 0 || auth.permissions.includes(permission));
}
