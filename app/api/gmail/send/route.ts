import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { formatReplySubject, sendEmailReply } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { threadId, to, subject, replyBody, inReplyTo, references } = body;

    if (!threadId || !to || !subject || !replyBody) {
      return NextResponse.json(
        { error: "threadId, to, subject, and replyBody are required." },
        { status: 400 }
      );
    }

    const result = await sendEmailReply(auth.oauth2Client, {
      threadId,
      to,
      subject: formatReplySubject(subject),
      body: replyBody,
      inReplyTo,
      references,
    });

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error("[gmail] Failed to send reply:", error);

    const message =
      error instanceof Error ? error.message : "Failed to send email";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
