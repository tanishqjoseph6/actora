export const REPLY_TONES = [
  "professional",
  "friendly",
  "casual",
  "formal",
  "executive",
  "persuasive",
  "confident",
  "empathetic",
  "sales",
  "customer_support",
  "networking",
  "investor",
  "negotiation",
  "follow_up",
  "reminder",
  "thank_you",
  "apology",
  "polite",
  "apologetic",
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
  casual: "Casual",
  formal: "Formal",
  executive: "Executive",
  persuasive: "Persuasive",
  confident: "Confident",
  empathetic: "Empathetic",
  sales: "Sales",
  customer_support: "Customer Support",
  networking: "Networking",
  investor: "Investor",
  negotiation: "Negotiation",
  follow_up: "Follow-up",
  reminder: "Reminder",
  thank_you: "Thank You",
  apology: "Apology",
  polite: "Polite",
  apologetic: "Apologetic",
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
  "casual",
  "formal",
  "executive",
  "persuasive",
  "confident",
  "empathetic",
  "sales",
  "follow_up",
  "thank_you",
  "apology",
];

export const REPLY_LENGTHS = ["short", "medium", "long", "auto"] as const;
export type ReplyLength = (typeof REPLY_LENGTHS)[number];

export const REPLY_LENGTH_LABELS: Record<ReplyLength, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
  auto: "Auto",
};

/** Transform actions applied to an existing draft via the transform API. */
export const REPLY_ACTIONS = [
  "rewrite",
  "improve",
  "shorten",
  "expand",
  "make_professional",
  "make_friendly",
  "make_persuasive",
  "simplify",
  "translate",
  "fix_grammar",
  "regenerate",
] as const;

export type ReplyAction = (typeof REPLY_ACTIONS)[number];

export const REPLY_ACTION_LABELS: Record<ReplyAction, string> = {
  rewrite: "Rewrite",
  improve: "Improve",
  shorten: "Shorter",
  expand: "Longer",
  make_professional: "More Professional",
  make_friendly: "More Friendly",
  make_persuasive: "More Persuasive",
  simplify: "Simplify",
  translate: "Translate",
  fix_grammar: "Fix Grammar",
  regenerate: "Regenerate",
};

/**
 * Post-reply smart actions (UI / workspace workflows — not pure text transforms).
 */
export const SMART_REPLY_ACTIONS = [
  "create_task",
  "schedule_meeting",
  "add_reminder",
  "create_crm_contact",
  "follow_up_tomorrow",
  "summarize_thread",
  "copy",
  "insert",
] as const;

export type SmartReplyAction = (typeof SMART_REPLY_ACTIONS)[number];

export const SMART_REPLY_ACTION_LABELS: Record<SmartReplyAction, string> = {
  create_task: "Create Task",
  schedule_meeting: "Schedule Meeting",
  add_reminder: "Add Reminder",
  create_crm_contact: "Create CRM Contact",
  follow_up_tomorrow: "Follow Up Tomorrow",
  summarize_thread: "Summarize Thread",
  copy: "Copy",
  insert: "Insert",
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

export function isSmartReplyAction(value: unknown): value is SmartReplyAction {
  return (
    typeof value === "string" &&
    (SMART_REPLY_ACTIONS as readonly string[]).includes(value)
  );
}

/** Map legacy tone/length values. */
export function normalizeLegacyTone(
  tone: string | undefined
): { tone: ReplyTone; length?: ReplyLength } {
  if (tone === "short") return { tone: "professional", length: "short" };
  if (tone === "detailed" || tone === "long") {
    return { tone: "professional", length: "long" };
  }
  if (tone === "apologetic") return { tone: "apology" };
  if (isReplyTone(tone)) return { tone };
  return { tone: "professional" };
}

/** Normalize legacy length ids (`detailed` → `long`). */
export function normalizeReplyLength(value: unknown): ReplyLength {
  if (value === "detailed") return "long";
  if (isReplyLength(value)) return value;
  return "medium";
}
