import type { ReplyAction, ReplyLength, ReplyTone } from "./tones";
import { REPLY_ACTION_LABELS, REPLY_LENGTH_LABELS, REPLY_TONE_LABELS } from "./tones";

export type WritingStyleProfileData = {
  greetingStyle: string;
  closingStyle: string;
  vocabularyNotes: string;
  avgSentenceLength: "short" | "medium" | "long";
  formality: "casual" | "balanced" | "formal";
  emojiUsage: "none" | "rare" | "occasional";
  signatureStyle: string;
  personalityNotes: string;
  typicalPhrasing: string[];
  version: number;
};

export type ReplyBusinessContext = {
  crmContact?: string | null;
  crmCompany?: string | null;
  openDeals?: string | null;
  upcomingMeetings?: string | null;
  openTasks?: string | null;
  workspaceNotes?: string | null;
};

export type ReplyGenerateInput = {
  sender: string;
  subject: string;
  body: string;
  threadContext?: string;
  tone: ReplyTone;
  length: ReplyLength;
  customToneHint?: string;
  /** Internal only — never sent to the client */
  styleProfile?: WritingStyleProfileData | null;
  soundLikeMe?: boolean;
  businessContext?: ReplyBusinessContext | null;
  /** OpenAI model resolved server-side from plan */
  model?: string;
};

const TONE_GUIDES: Record<ReplyTone, string> = {
  professional:
    "Polished, clear, and business-appropriate. Warm enough to feel human, never stiff.",
  friendly:
    "Warm and approachable while remaining competent. Light personality is welcome.",
  casual:
    "Relaxed and conversational, like a competent teammate — not slangy or sloppy.",
  formal:
    "Traditional business formality. Proper structure, restrained warmth, careful wording.",
  executive:
    "Crisp executive voice: decisive, high-signal, minimal filler. Lead with the point.",
  persuasive:
    "Clear value and next step. Confident without pressure or hype.",
  confident:
    "Decisive and assured. Short sentences. Clear ownership of next steps.",
  empathetic:
    "Acknowledge feelings and constraints first. Supportive, calm, and specific.",
  sales:
    "Helpful seller energy: relevance, benefit, soft CTA. Never spammy.",
  customer_support:
    "Service mindset: diagnose, reassure, resolve, confirm. Clear steps.",
  networking:
    "Genuine relationship-building. Specific compliments, light ask, easy next step.",
  investor:
    "Precise, metrics-aware, calm confidence. No fluff. Clear ask or update.",
  negotiation:
    "Firm but collaborative. State positions clearly, invite options, protect rapport.",
  follow_up:
    "Polite nudge that references prior context and makes responding easy.",
  reminder:
    "Clear, kind reminder of the outstanding item, deadline, and easy path to complete.",
  thank_you:
    "Genuine gratitude. Specific about what mattered. Light next step if natural.",
  apology:
    "Sincere apology, ownership, and a concrete fix or next step. No over-apologizing.",
  polite:
    "Extra courtesy and deference without sounding servile or vague.",
  apologetic:
    "Sincere apology, ownership, and a concrete fix or next step. No over-apologizing.",
  meeting_confirmation:
    "Confirm time, timezone, attendees, and agenda briefly. Offer a calendar-friendly close.",
  meeting_reschedule:
    "Acknowledge conflict, propose 2–3 alternatives, make booking easy.",
  decline:
    "Clear no, respectful reason if appropriate, leave the door open when useful.",
  approval:
    "Clear yes, any conditions, and what happens next.",
  custom:
    "Follow the user's custom tone hint closely while staying natural.",
};

const LENGTH_GUIDES: Record<ReplyLength, string> = {
  short: "2–4 sentences. One idea per sentence. No fluff.",
  medium: "1–3 short paragraphs. Cover the key points without essays.",
  long: "Thorough but scannable. Address each ask. Short paragraphs, not walls of text.",
  auto: "Choose the shortest length that fully answers every ask and preserves rapport. Prefer medium unless the thread clearly needs a brief acknowledgment or a detailed multi-point reply.",
};

const ACTION_GUIDES: Record<ReplyAction, string> = {
  rewrite: "Rewrite with fresh phrasing while preserving meaning and facts.",
  improve: "Tighten clarity, flow, and impact. Keep the same intent.",
  shorten: "Cut to the essentials. Remove filler. Keep names/dates/links.",
  expand: "Add helpful specificity and structure without inventing facts.",
  fix_grammar: "Fix grammar, spelling, and punctuation. Keep voice and meaning.",
  make_professional: "Shift to a polished professional voice.",
  make_friendly: "Shift to a warmer, friendlier voice.",
  make_persuasive: "Increase clarity of value and call-to-action without hype.",
  simplify: "Use simpler words and shorter sentences. Keep meaning.",
  translate: "Translate to clear natural English if needed, or keep English and clarify.",
  regenerate: "Write a fresh alternative with the same goals.",
};

/**
 * World-class system prompt: understand first, then write like a human.
 */
export function buildReplySystemPrompt(input: {
  tone: ReplyTone;
  length: ReplyLength;
  customToneHint?: string;
  styleProfile?: WritingStyleProfileData | null;
  soundLikeMe?: boolean;
  businessContext?: ReplyBusinessContext | null;
}): string {
  const toneGuide = TONE_GUIDES[input.tone];
  const lengthGuide = LENGTH_GUIDES[input.length];
  const custom =
    input.tone === "custom" && input.customToneHint?.trim()
      ? `\nCustom tone direction: ${input.customToneHint.trim().slice(0, 400)}`
      : "";

  let styleBlock = "";
  if (input.soundLikeMe && input.styleProfile) {
    const p = input.styleProfile;
    styleBlock = `

SOUND LIKE ME (critical):
Mirror the author's writing patterns — do NOT copy any past email verbatim.
- Greeting style: ${p.greetingStyle || "natural for the relationship"}
- Closing style: ${p.closingStyle || "natural for the relationship"}
- Formality: ${p.formality}
- Typical sentence length: ${p.avgSentenceLength}
- Emoji usage: ${p.emojiUsage}
- Signature / sign-off habits: ${p.signatureStyle || "match existing habit lightly"}
- Vocabulary / personality: ${p.vocabularyNotes || "n/a"}
- Personality: ${p.personalityNotes || "n/a"}
- Typical phrasing cues: ${(p.typicalPhrasing ?? []).slice(0, 8).join(" · ") || "n/a"}
Write as if the user typed it themselves.`;
  }

  const ctx = input.businessContext;
  let businessBlock = "";
  if (ctx) {
    const lines = [
      ctx.crmContact ? `- CRM contact: ${ctx.crmContact}` : null,
      ctx.crmCompany ? `- Company: ${ctx.crmCompany}` : null,
      ctx.openDeals ? `- Open deals: ${ctx.openDeals}` : null,
      ctx.upcomingMeetings ? `- Upcoming meetings: ${ctx.upcomingMeetings}` : null,
      ctx.openTasks ? `- Related tasks: ${ctx.openTasks}` : null,
      ctx.workspaceNotes ? `- Workspace notes: ${ctx.workspaceNotes}` : null,
    ].filter(Boolean);
    if (lines.length) {
      businessBlock = `

BUSINESS CONTEXT (use only if relevant; never invent beyond this):
${lines.join("\n")}`;
    }
  }

  return `You are Actora's elite email reply engine — a seasoned business-communication professional, not a chatbot.

BEFORE writing, silently analyze:
1) Entire thread + previous replies (continuity of commitments and voice)
2) Sender intent and recipient intent
3) Relationship (client, customer, teammate, recruiter, manager, vendor, investor, other)
4) Urgency, stakes, and business context
5) Open questions, commitments, dates, numbers, links, names
6) What a sharp human professional would say next — specific, useful, never generic

HARD RULES:
- Never invent facts, offers, dates, prices, meetings, or commitments not present in the thread or business context.
- Preserve names, dates, numbers, company names, and links exactly when referenced.
- Avoid AI clichés and robotic tells: "I hope this finds you well", "As an AI", "I'd be happy to assist", "Please don't hesitate", "reaching out", "I wanted to follow up", overused em dashes, generic corporate fluff, repetitive transitions.
- Match the conversation's natural register. Continuity with prior replies matters.
- Prefer concrete next steps over vague availability.
- Output ONLY the reply body. No subject line. No markdown fences. No quoted original.

Tone: ${REPLY_TONE_LABELS[input.tone]} — ${toneGuide}${custom}
Length: ${REPLY_LENGTH_LABELS[input.length]} — ${lengthGuide}${styleBlock}${businessBlock}`;
}

export function buildReplyUserPrompt(input: ReplyGenerateInput): string {
  const thread = input.threadContext?.trim()
    ? `\n\nConversation history (oldest → newest excerpts):\n${input.threadContext.slice(0, 10000)}`
    : "\n\n(No prior thread messages provided.)";

  return `Write one email reply that an experienced professional would send.

From: ${input.sender}
Subject: ${input.subject}

Latest email body:
${input.body.slice(0, 14000)}${thread}

Produce the reply now.`;
}

export function buildTransformSystemPrompt(action: ReplyAction): string {
  return `You are Actora's email rewriting engine.
Action: ${REPLY_ACTION_LABELS[action]} — ${ACTION_GUIDES[action]}

Rules:
- Keep facts intact. Never invent information.
- Preserve names, dates, numbers, and links.
- Sound human. Avoid robotic AI phrasing.
- Output ONLY the revised email body.`;
}

export function buildSuggestionsSystemPrompt(input: {
  tone: ReplyTone;
  length: ReplyLength;
  customToneHint?: string;
  styleProfile?: WritingStyleProfileData | null;
  soundLikeMe?: boolean;
  businessContext?: ReplyBusinessContext | null;
}): string {
  return `${buildReplySystemPrompt(input)}

Return JSON only:
{ "suggestions": ["reply1", "reply2", "reply3"] }
Each suggestion must be a complete, distinct reply body (different angle or phrasing).`;
}

export function emptyStyleProfile(): WritingStyleProfileData {
  return {
    greetingStyle: "",
    closingStyle: "",
    vocabularyNotes: "",
    avgSentenceLength: "medium",
    formality: "balanced",
    emojiUsage: "none",
    signatureStyle: "",
    personalityNotes: "",
    typicalPhrasing: [],
    version: 1,
  };
}
