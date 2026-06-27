import OpenAI from "openai";

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateEmailReply({
  sender,
  subject,
  body,
}: {
  sender: string;
  subject: string;
  body: string;
}): Promise<string> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are a professional email assistant. Write concise, polite, and clear email replies. Match the tone of the original email. Do not include a subject line — only the reply body. Do not wrap the reply in quotes or markdown.",
      },
      {
        role: "user",
        content: `Write a professional reply to this email.

From: ${sender}
Subject: ${subject}

Email body:
${body}`,
      },
    ],
  });

  const reply = response.choices[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("OpenAI returned an empty reply.");
  }

  return reply;
}
