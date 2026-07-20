import type { InboxEmail } from "@/lib/gmail";

export type PriorityLevel = "high" | "medium" | "low";

const URGENT_PATTERN =
  /\b(urgent|asap|immediate|deadline|today|eod|action required|time.?sensitive|important)\b/i;

export function scoreEmailPriority(email: InboxEmail): {
  level: PriorityLevel;
  score: number;
} {
  let score = 0;

  if (email.unread) score += 15;
  if (email.starred) score += 25;
  if (email.priority === "high") score += 40;
  if (email.priority === "medium") score += 20;

  const haystack = `${email.subject} ${email.preview}`;
  if (URGENT_PATTERN.test(haystack)) score += 30;
  if (/\?$/.test(email.subject.trim())) score += 5;
  if (/\b(re:|fwd:)/i.test(email.subject)) score -= 5;

  let level: PriorityLevel = "low";
  if (score >= 45) level = "high";
  else if (score >= 20) level = "medium";

  return { level, score };
}

export function sortByPriority(emails: InboxEmail[]): InboxEmail[] {
  return [...emails].sort((a, b) => {
    const sa = scoreEmailPriority(a).score;
    const sb = scoreEmailPriority(b).score;
    if (sb !== sa) return sb - sa;
    return 0;
  });
}
