import "server-only";

import OpenAI from "openai";
import { resolveOpenAiApiKey } from "@/lib/openai/api-key";
import {
  OPENAI_MODEL,
  withModelSafeParams,
} from "@/lib/openai/model-params";
import {
  generateEmailReply as generateEmailReplyCore,
  generateEmailReplyWithRetry as generateEmailReplyWithRetryCore,
  normalizeLegacyTone,
  type ReplyTone,
} from "@/lib/email-reply";

export type {
  CrmContactInsights,
  EmailInsights,
  FollowUpSuggestion,
  NextActionSuggestion,
} from "@/lib/openai/types";
import type {
  CrmContactInsights,
  EmailInsights,
} from "@/lib/openai/types";

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
  tone?: ReplyTone | "short" | "detailed";
}): Promise<string> {
  const normalized = normalizeLegacyTone(tone);
  return generateEmailReplyCore({
    sender,
    subject,
    body,
    threadContext,
    tone: normalized.tone,
    length: normalized.length ?? "medium",
  });
}

export async function generateEmailReplyWithRetry(
  input: Parameters<typeof generateEmailReply>[0]
): Promise<string> {
  return generateEmailReplyWithRetryCore({
    sender: input.sender,
    subject: input.subject,
    body: input.body,
    threadContext: input.threadContext,
    tone: normalizeLegacyTone(input.tone).tone,
    length: normalizeLegacyTone(input.tone).length ?? "medium",
  });
}

function getOpenAIClient() {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  return new OpenAI({
    apiKey,
  });
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

  const response = await openai.chat.completions.create(
    withModelSafeParams({
      model: OPENAI_MODEL,
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
    })
  );

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

function parseInsightsJson(raw: string): EmailInsights {
  const parsed = JSON.parse(raw) as Partial<EmailInsights>;
  return {
    priority:
      parsed.priority === "high" || parsed.priority === "medium"
        ? parsed.priority
        : "low",
    priorityReason:
      typeof parsed.priorityReason === "string"
        ? parsed.priorityReason
        : "No priority context available.",
    followUps: Array.isArray(parsed.followUps)
      ? parsed.followUps
          .filter((item) => item && typeof item.label === "string")
          .slice(0, 4)
          .map((item) => ({
            label: item.label,
            timing: typeof item.timing === "string" ? item.timing : "This week",
            draftHint:
              typeof item.draftHint === "string" ? item.draftHint : "",
          }))
      : [],
    nextActions: Array.isArray(parsed.nextActions)
      ? parsed.nextActions
          .filter((item) => item && typeof item.label === "string")
          .slice(0, 5)
          .map((item) => ({
            label: item.label,
            type:
              item.type === "reply" ||
              item.type === "schedule" ||
              item.type === "task" ||
              item.type === "archive" ||
              item.type === "follow_up"
                ? item.type
                : "reply",
          }))
      : [],
  };
}

export async function generateEmailInsights({
  sender,
  subject,
  body,
  threadContext,
}: {
  sender: string;
  subject: string;
  body: string;
  threadContext?: string;
}): Promise<EmailInsights> {
  const openai = getOpenAIClient();

  const threadSection = threadContext?.trim()
    ? `\n\nPrior messages in this thread:\n${threadContext.slice(0, 6000)}`
    : "";

  const response = await openai.chat.completions.create(
    withModelSafeParams({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are Actora, an email intelligence assistant. Analyze the email and return JSON only with:
- priority: "high" | "medium" | "low"
- priorityReason: one short sentence
- followUps: array of up to 3 objects { label, timing, draftHint } for suggested follow-up messages
- nextActions: array of up to 4 objects { label, type } where type is reply|schedule|task|archive|follow_up
Be practical and specific to the email content.`,
        },
        {
          role: "user",
          content: `Analyze this email.

From: ${sender}
Subject: ${subject}

Email body:
${body.slice(0, 10000)}${threadSection}`,
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("OpenAI returned empty insights.");
  return parseInsightsJson(raw);
}

export async function generateEmailInsightsWithRetry(
  input: Parameters<typeof generateEmailInsights>[0]
): Promise<EmailInsights> {
  try {
    return await generateEmailInsights(input);
  } catch (firstError) {
    try {
      return await generateEmailInsights(input);
    } catch {
      throw firstError;
    }
  }
}

function parseCrmInsightsJson(raw: string): CrmContactInsights {
  const parsed = JSON.parse(raw) as Partial<CrmContactInsights>;
  return {
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "No summary available.",
    nextSteps: Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.filter((s) => typeof s === "string").slice(0, 5)
      : [],
    riskLevel:
      parsed.riskLevel === "high" || parsed.riskLevel === "medium"
        ? parsed.riskLevel
        : "low",
    engagementScore:
      typeof parsed.engagementScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.engagementScore)))
        : 50,
  };
}

export async function generateCrmContactInsights(input: {
  name: string;
  email: string;
  company: string;
  title: string;
  status: string;
  aiLeadScore: number;
  recentNotes: string[];
  recentActivities: string[];
  recentEmails: string[];
  openDeals: string[];
}): Promise<CrmContactInsights> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create(
    withModelSafeParams({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are Actora CRM AI. Analyze contact context and return JSON only:
- summary: 2-3 sentence overview of relationship health and deal potential
- nextSteps: array of up to 4 specific actionable next steps
- riskLevel: "low" | "medium" | "high" based on churn/disengagement risk
- engagementScore: 0-100 based on recent activity and email engagement`,
        },
        {
          role: "user",
          content: `Contact: ${input.name} (${input.title || "no title"})
Email: ${input.email}
Company: ${input.company || "Unknown"}
Status: ${input.status}
AI Lead Score: ${input.aiLeadScore}

Open deals: ${input.openDeals.join("; ") || "None"}

Recent notes:
${input.recentNotes.join("\n") || "None"}

Recent activity:
${input.recentActivities.join("\n") || "None"}

Recent emails:
${input.recentEmails.join("\n") || "None"}`,
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("OpenAI returned empty CRM insights.");
  return parseCrmInsightsJson(raw);
}
