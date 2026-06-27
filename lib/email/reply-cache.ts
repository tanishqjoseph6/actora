import type { ReplyContent } from "@/components/email/ReplyComposer";
import type { ReplyTone } from "@/lib/openai";

type CachedReply = ReplyContent & {
  tone: ReplyTone;
};

const cache = new Map<string, CachedReply>();

function cacheKey(emailId: string, tone: ReplyTone): string {
  return `${emailId}:${tone}`;
}

export function getCachedReply(
  emailId: string,
  tone: ReplyTone
): CachedReply | null {
  return cache.get(cacheKey(emailId, tone)) ?? null;
}

export function setCachedReply(
  emailId: string,
  tone: ReplyTone,
  content: ReplyContent
): void {
  cache.set(cacheKey(emailId, tone), { ...content, tone });
}

export function clearCachedRepliesForEmail(emailId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${emailId}:`)) {
      cache.delete(key);
    }
  }
}
