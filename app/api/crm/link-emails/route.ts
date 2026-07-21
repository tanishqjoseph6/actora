import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCrmUserId } from "@/lib/crm/session";
import { linkInboxEmailsToCrm } from "@/lib/crm/email-link";

export async function POST(request: NextRequest) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const body = (await request.json()) as {
    emails?: { id: string; sender: string; subject: string; preview: string }[];
  };

  const result = await linkInboxEmailsToCrm(userId, body.emails ?? []);
  return NextResponse.json(result);
}
