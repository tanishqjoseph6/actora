import type { ReplyContent } from "@/components/email/ReplyComposer";
import type { ReplyLength, ReplyTone } from "@/lib/email-reply/tones";

type CachedReply = ReplyContent & {
  tone: ReplyTone;
  length: ReplyLength;
  soundLikeMe: boolean;
};

const cache = new Map<string, CachedReply>();

function cacheKey(
  emailId: string,
  tone: ReplyTone,
  length: ReplyLength,
  soundLikeMe: boolean
): string {
  return `${emailId}:${tone}:${length}:${soundLikeMe ? "slm" : "std"}`;
}

export function getCachedReply(
  emailId: string,
  tone: ReplyTone,
  length: ReplyLength = "medium",
  soundLikeMe = false
): CachedReply | null {
  return cache.get(cacheKey(emailId, tone, length, soundLikeMe)) ?? null;
}

export function setCachedReply(
  emailId: string,
  tone: ReplyTone,
  content: ReplyContent,
  length: ReplyLength = "medium",
  soundLikeMe = false
): void {
  cache.set(cacheKey(emailId, tone, length, soundLikeMe), {
    ...content,
    tone,
    length,
    soundLikeMe,
  });
}

export function clearCachedRepliesForEmail(emailId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${emailId}:`)) {
      cache.delete(key);
    }
  }
}
