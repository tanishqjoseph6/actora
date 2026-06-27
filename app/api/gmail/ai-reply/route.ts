import { NextRequest, NextResponse } from "next/server";
import { generateEmailReply } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sender, subject, emailBody } = body;

    if (!sender || !subject || !emailBody) {
      return NextResponse.json(
        { error: "sender, subject, and emailBody are required." },
        { status: 400 }
      );
    }

    const reply = await generateEmailReply({
      sender,
      subject,
      body: emailBody,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[ai-reply] Failed to generate reply:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate AI reply";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
