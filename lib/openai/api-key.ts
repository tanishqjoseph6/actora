/**
 * Reads OPENAI_API_KEY and returns only the OpenAI key token.
 *
 * Vercel / .env mistakes sometimes paste multiple assignments on one line, e.g.
 * `sk-proj-... RAZORPAY_KEY_ID=rzp_...` — the OpenAI SDK would then send
 * `Authorization: Bearer sk-proj-... RAZORPAY_KEY_ID=...`.
 */
export function resolveOpenAiApiKey(): string | undefined {
  const raw = process.env.OPENAI_API_KEY;
  if (!raw) return undefined;

  let value = raw.trim();
  if (!value) return undefined;

  const concatenatedEnv = value.search(/\s+[A-Z][A-Z0-9_]*=/);
  if (concatenatedEnv !== -1) {
    value = value.slice(0, concatenatedEnv).trim();
  }

  const token = value.split(/\s+/)[0]?.trim();
  if (!token) return undefined;

  if (token !== raw.trim() && process.env.NODE_ENV !== "test") {
    console.warn(
      "[openai] OPENAI_API_KEY contained extra text after the key; using the key token only."
    );
  }

  return token;
}
