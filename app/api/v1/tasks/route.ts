import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, allowApiRequest, canAccess } from "@/lib/public-api/auth";
import { createTaskRecord, listTaskRecords } from "@/lib/tasks/repository";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth || !canAccess(auth, "tasks")) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "A valid API key with tasks access is required." } }, { status: 401 });
  const rate = allowApiRequest(auth.keyId);
  if (!rate.allowed) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Rate limit exceeded." } }, { status: 429, headers: { "Retry-After": String(Math.ceil((rate.reset - Date.now()) / 1000)) } });
  const result = await listTaskRecords(auth.userId, { workspaceId: auth.workspaceId, excludeDone: request.nextUrl.searchParams.get("status") !== "all", limit: Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50), 100) });
  if (!result.ok) return NextResponse.json({ error: { code: result.error.code, message: result.error.message } }, { status: result.error.status });
  return NextResponse.json({ data: result.data, meta: { count: result.data.length } }, { headers: { "X-RateLimit-Remaining": String(rate.remaining) } });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth || !canAccess(auth, "tasks") || auth.role === "viewer") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Task write access is required." } }, { status: 403 });
  const body = await request.json();
  const result = await createTaskRecord({ userId: auth.userId, workspaceId: auth.workspaceId, title: String(body.title ?? ""), description: body.description, priority: body.priority, dueDate: body.due_date ?? body.dueDate, assignee: body.assignee, companyName: body.company_name ?? body.companyName, tags: body.tags });
  if (!result.ok) return NextResponse.json({ error: { code: result.error.code, message: result.error.message } }, { status: result.error.status });
  return NextResponse.json({ data: result.data }, { status: 201 });
}
