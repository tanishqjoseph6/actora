export const REPLY_TONES = [
  "professional",
  "friendly",
  "formal",
  "casual",
  "persuasive",
  "empathetic",
  "confident",
  "polite",
  "apologetic",
  "sales",
  "customer_support",
  "follow_up",
  "negotiation",
  "thank_you",
  "meeting_confirmation",
  "meeting_reschedule",
  "decline",
  "approval",
  "custom",
] as const;

export type ReplyTone = (typeof REPLY_TONES)[number];

export const REPLY_TONE_LABELS: Record<ReplyTone, string> = {
  professional: "Professional",
  friendly: "Friendly",
  formal: "Formal",
  casual: "Casual",
  persuasive: "Persuasive",
  empathetic: "Empathetic",
  confident: "Confident",
  polite: "Polite",
  apologetic: "Apologetic",
  sales: "Sales",
  customer_support: "Customer Support",
  follow_up: "Follow-up",
  negotiation: "Negotiation",
  thank_you: "Thank You",
  meeting_confirmation: "Meeting Confirmation",
  meeting_reschedule: "Meeting Reschedule",
  decline: "Decline",
  approval: "Approval",
  custom: "Custom Tone",
};

/** Primary chips shown first in the UI (rest in “More”). */
export const PRIMARY_REPLY_TONES: ReplyTone[] = [
  "professional",
  "friendly",
  "formal",
  "casual",
  "empathetic",
  "follow_up",
  "thank_you",
  "sales",
];

export const REPLY_LENGTHS = ["short", "medium", "detailed"] as const;
export type ReplyLength = (typeof REPLY_LENGTHS)[number];

export const REPLY_LENGTH_LABELS: Record<ReplyLength, string> = {
  short: "Short",
  medium: "Medium",
  detailed: "Detailed",
};

export const REPLY_ACTIONS = [
  "rewrite",
  "improve",
  "shorten",
  "expand",
  "fix_grammar",
  "make_professional",
  "make_friendly",
  "simplify",
  "translate",
  "regenerate",
] as const;

export type ReplyAction = (typeof REPLY_ACTIONS)[number];

export const REPLY_ACTION_LABELS: Record<ReplyAction, string> = {
  rewrite: "Rewrite",
  improve: "Improve",
  shorten: "Shorten",
  expand: "Expand",
  fix_grammar: "Fix Grammar",
  make_professional: "Make Professional",
  make_friendly: "Make Friendly",
  simplify: "Simplify",
  translate: "Translate",
  regenerate: "Regenerate",
};

export function isReplyTone(value: unknown): value is ReplyTone {
  return (
    typeof value === "string" &&
    (REPLY_TONES as readonly string[]).includes(value)
  );
}

export function isReplyLength(value: unknown): value is ReplyLength {
  return (
    typeof value === "string" &&
    (REPLY_LENGTHS as readonly string[]).includes(value)
  );
}

export function isReplyAction(value: unknown): value is ReplyAction {
  return (
    typeof value === "string" &&
    (REPLY_ACTIONS as readonly string[]).includes(value)
  );
}

/** Map legacy tone values that mixed length into style. */
export function normalizeLegacyTone(
  tone: string | undefined
): { tone: ReplyTone; length?: ReplyLength } {
  if (tone === "short") return { tone: "professional", length: "short" };
  if (tone === "detailed") return { tone: "professional", length: "detailed" };
  if (isReplyTone(tone)) return { tone };
  return { tone: "professional" };
}
