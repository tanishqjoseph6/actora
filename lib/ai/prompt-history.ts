const PROMPT_HISTORY_KEY = "actora_roxx_prompt_history_v1";
const MAX_PROMPTS = 20;

export type PromptHistoryEntry = {
  prompt: string;
  at: string;
};

export function loadPromptHistory(): PromptHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROMPT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PromptHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_PROMPTS) : [];
  } catch {
    return [];
  }
}

export function savePromptToHistory(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) return;
  const existing = loadPromptHistory().filter(
    (item) => item.prompt.toLowerCase() !== trimmed.toLowerCase()
  );
  const next: PromptHistoryEntry[] = [
    { prompt: trimmed, at: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_PROMPTS);
  window.localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(next));
}
