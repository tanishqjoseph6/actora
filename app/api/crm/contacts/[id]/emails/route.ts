import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCrmUserId } from "@/lib/crm/session";
import { runCrmRoute } from "@/lib/crm/api-response";
import { getContactEmailHistory } from "@/lib/crm/email-link";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/contacts/[id]/emails GET",
    async () => {
      const emails = await getContactEmailHistory(userId, id);
      return NextResponse.json({ emails });
    },
    { userId, contactId: id }
  );

  return result instanceof NextResponse ? result : result;
}
