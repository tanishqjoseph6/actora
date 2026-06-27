import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { fetchEmailById } from "@/lib/gmail";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const email = await fetchEmailById(auth.oauth2Client, id);

    if (!email) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("[gmail] Failed to fetch email detail:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch email";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
