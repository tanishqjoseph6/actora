/**
 * Client-safe email-reply exports (tones / lengths / actions / prompts types).
 * Do NOT re-export style-learn or anything that imports googleapis.
 */
export * from "./tones";
export type { WritingStyleProfileData, ReplyGenerateInput } from "./prompts";
export {
  generateEmailReply,
  generateEmailReplyWithRetry,
  streamEmailReply,
  generateReplySuggestions,
  transformEmailReply,
} from "./generate";
export {
  getWritingStyleStatus,
  getWritingStyleProfileInternal,
  setWritingStyleEnabled,
} from "./style-profile";
