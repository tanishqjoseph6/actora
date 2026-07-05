import OpenAI from "openai";

export const REPLY_TONES = [
  "professional",
  "friendly",
  "formal",
  "short",
  "detailed",
] as const;

export type ReplyTone = (typeof REPLY_TONES)[number];

export const REPLY_TONE_LABELS: Record<ReplyTone, string> = {
  professional: "Professional",
  friendly: "Friendly",
  formal: "Formal",
  short: "Short",
  detailed: "Detailed",
};

const TONE_INSTRUCTIONS: Record<ReplyTone, string> = {
  professional:
    "Use a polished, business-appropriate tone. Be clear, respectful, and concise.",
  friendly:
    "Use a warm, approachable tone while staying professional and helpful.",
  formal:
    "Use formal language, proper titles where appropriate, and structured paragraphs.",
  short:
    "Keep the reply very brief — 2 to 4 sentences maximum. Get straight to the point.",
  detailed:
    "Provide a thorough reply that addresses every point in the original email in depth.",
};

export function isReplyTone(value: string): value is ReplyTone {
  return REPLY_TONES.includes(value as ReplyTone);
}

function getToneInstruction(tone: ReplyTone): string {
  return TONE_INSTRUCTIONS[tone];
}

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
  threadContext,
  tone = "professional",
}: {
  sender: string;
  subject: string;
  body: string;
  threadContext?: string;
  tone?: ReplyTone;
}): Promise<string> {
  const openai = getOpenAIClient();
  const toneGuide = getToneInstruction(tone);

  const threadSection = threadContext?.trim()
    ? `\n\nPrior messages in this thread (for context):\n${threadContext.slice(0, 8000)}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: tone === "short" ? 0.5 : 0.7,
    messages: [
      {
        role: "system",
        content: `You are Actora, a professional email assistant. Write clear, contextual replies that:
- Directly address the sender's questions, requests, or concerns
- Use thread history when provided to maintain continuity
- Tone guidance: ${toneGuide}
- Use a greeting and sign-off appropriate to the tone
- Never include a subject line, markdown, or quoted text from the original email
- Output only the reply body text`,
      },
      {
        role: "user",
        content: `Write a reply to this email.

From: ${sender}
Subject: ${subject}

Email body:
${body.slice(0, 12000)}${threadSection}`,
      },
    ],
  });

  const reply = response.choices[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("OpenAI returned an empty reply.");
  }

  return reply;
}

export async function generateEmailReplyWithRetry(
  input: Parameters<typeof generateEmailReply>[0]
): Promise<string> {
  try {
    return await generateEmailReply(input);
  } catch (firstError) {
    try {
      return await generateEmailReply(input);
    } catch {
      throw firstError;
    }
  }
}

export async function generateEmailSummary({
  sender,
  subject,
  body,
  threadContext,
}: {
  sender: string;
  subject: string;
  body: string;
  threadContext?: string;
}): Promise<string> {
  const openai = getOpenAIClient();

  const threadSection = threadContext?.trim()
    ? `\n\nPrior messages in this thread:\n${threadContext.slice(0, 6000)}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You are Actora, an email assistant. Summarize emails clearly for a busy professional.
- 2–4 short bullet points covering key facts, requests, and deadlines
- Note any action items for the recipient
- Keep under 120 words
- Use plain text bullets starting with "•"
- No markdown headers or subject line repetition`,
      },
      {
        role: "user",
        content: `Summarize this email.

From: ${sender}
Subject: ${subject}

Email body:
${body.slice(0, 12000)}${threadSection}`,
      },
    ],
  });

  const summary = response.choices[0]?.message?.content?.trim();

  if (!summary) {
    throw new Error("OpenAI returned an empty summary.");
  }

  return summary;
}

export async function generateEmailSummaryWithRetry(
  input: Parameters<typeof generateEmailSummary>[0]
): Promise<string> {
  try {
    return await generateEmailSummary(input);
  } catch (firstError) {
    try {
      return await generateEmailSummary(input);
    } catch {
      throw firstError;
    }
  }
}
