import { NextResponse } from "next/server";
import { getCrmUserId } from "@/lib/crm/auth";
import { getContactEmailHistory } from "@/lib/crm/email-link";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await context.params;
  const emails = await getContactEmailHistory(userId, id);

  return NextResponse.json({ emails });
}
