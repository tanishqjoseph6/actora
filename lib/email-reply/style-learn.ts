import OpenAI from "openai";
import { google } from "googleapis";
import { resolveOpenAiApiKey } from "@/lib/openai/api-key";
import { withModelSafeParams } from "@/lib/openai/model-params";
import type { GmailAuthResult } from "@/lib/gmail-auth";
import { htmlToPlainText } from "@/lib/email/html";
import {
  emptyStyleProfile,
  type WritingStyleProfileData,
} from "./prompts";
import { upsertLearnedStyleProfile } from "./style-profile";

function getOpenAIClient() {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) throw new Error("OpenAI API key is not configured.");
  return new OpenAI({ apiKey });
}

type SentSample = { body: string };

/**
 * Pull a small set of sent emails for style learning (bodies only).
 */
export async function fetchSentEmailSamples(
  auth: Extract<GmailAuthResult, { ok: true }>,
  limit = 12
): Promise<SentSample[]> {
  const gmail = google.gmail({ version: "v1", auth: auth.oauth2Client });
  const list = await gmail.users.messages.list({
    userId: "me",
    q: "in:sent -in:chats",
    maxResults: limit,
  });

  const ids = (list.data.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id));

  const samples: SentSample[] = [];

  for (const id of ids.slice(0, limit)) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });
    const payload = detail.data.payload;
    if (!payload) continue;

    let body = "";
    const walk = (part: typeof payload) => {
      if (!part) return;
      if (part.mimeType === "text/plain" && part.body?.data) {
        body += Buffer.from(part.body.data, "base64url").toString("utf8");
      } else if (part.mimeType === "text/html" && part.body?.data && !body) {
        const html = Buffer.from(part.body.data, "base64url").toString("utf8");
        body += htmlToPlainText(html);
      }
      for (const child of part.parts ?? []) walk(child);
    };
    walk(payload);

    const cleaned = body.replace(/\r/g, "").trim();
    if (cleaned.length < 40) continue;
    // Cap each sample — patterns only
    samples.push({ body: cleaned.slice(0, 2500) });
    if (samples.length >= 10) break;
  }

  return samples;
}

function parseStyleJson(raw: string): WritingStyleProfileData {
  const parsed = JSON.parse(raw) as Partial<WritingStyleProfileData>;
  const base = emptyStyleProfile();
  return {
    ...base,
    greetingStyle:
      typeof parsed.greetingStyle === "string" ? parsed.greetingStyle.slice(0, 240) : "",
    closingStyle:
      typeof parsed.closingStyle === "string" ? parsed.closingStyle.slice(0, 240) : "",
    vocabularyNotes:
      typeof parsed.vocabularyNotes === "string"
        ? parsed.vocabularyNotes.slice(0, 400)
        : "",
    avgSentenceLength:
      parsed.avgSentenceLength === "short" || parsed.avgSentenceLength === "long"
        ? parsed.avgSentenceLength
        : "medium",
    formality:
      parsed.formality === "casual" || parsed.formality === "formal"
        ? parsed.formality
        : "balanced",
    emojiUsage:
      parsed.emojiUsage === "rare" || parsed.emojiUsage === "occasional"
        ? parsed.emojiUsage
        : "none",
    signatureStyle:
      typeof parsed.signatureStyle === "string"
        ? parsed.signatureStyle.slice(0, 240)
        : "",
    personalityNotes:
      typeof parsed.personalityNotes === "string"
        ? parsed.personalityNotes.slice(0, 400)
        : "",
    typicalPhrasing: Array.isArray(parsed.typicalPhrasing)
      ? parsed.typicalPhrasing
          .filter((p): p is string => typeof p === "string")
          .map((p) => p.slice(0, 120))
          .slice(0, 10)
      : [],
    version: 1,
  };
}

/**
 * Learn writing patterns from sent samples. Stores aggregated style only —
 * never stores full email copies in the profile.
 */
export async function learnWritingStyleFromSamples(
  userId: string,
  samples: SentSample[]
) {
  if (samples.length === 0) {
    throw new Error("Not enough sent emails to learn your writing style yet.");
  }

  const openai = getOpenAIClient();
  const corpus = samples
    .map((s, i) => `--- Sample ${i + 1} ---\n${s.body}`)
    .join("\n\n")
    .slice(0, 18000);

  const response = await openai.chat.completions.create(
    withModelSafeParams({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract writing STYLE PATTERNS only from a person's sent emails.
Return JSON:
{
  "greetingStyle": "how they typically open",
  "closingStyle": "how they typically close",
  "vocabularyNotes": "word choice / register notes",
  "avgSentenceLength": "short"|"medium"|"long",
  "formality": "casual"|"balanced"|"formal",
  "emojiUsage": "none"|"rare"|"occasional",
  "signatureStyle": "sign-off habits",
  "personalityNotes": "personality of writing",
  "typicalPhrasing": ["short phrases they reuse"]
}
Do NOT copy email bodies. Do NOT include private facts, names of third parties beyond pattern notes, or secrets.`,
        },
        {
          role: "user",
          content: `Analyze these sent emails for style patterns only:\n\n${corpus}`,
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Failed to learn writing style.");

  const profile = parseStyleJson(raw);
  return upsertLearnedStyleProfile({
    userId,
    profile,
    sampleCount: samples.length,
  });
}
