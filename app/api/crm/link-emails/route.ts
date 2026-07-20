import { NextResponse } from "next/server";
import { getCrmUserId } from "@/lib/crm/auth";
import { linkInboxEmailsToCrm } from "@/lib/crm/email-link";

export async function POST(request: Request) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json()) as {
    emails?: { id: string; sender: string; subject: string; preview: string }[];
  };

  const result = await linkInboxEmailsToCrm(userId, body.emails ?? []);
  return NextResponse.json(result);
}
