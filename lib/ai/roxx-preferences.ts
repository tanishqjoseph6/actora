export type RoxxResponseStyle = "concise" | "balanced" | "detailed";
export type RoxxCreativity = "focused" | "balanced" | "creative";

export type RoxxAiPreferences = {
  responseStyle: RoxxResponseStyle;
  creativity: RoxxCreativity;
  language: string;
  voiceEnabled: boolean;
  voiceAutoSpeak: boolean;
  proactiveNotifications: boolean;
  agentModeDefault: boolean;
};

export const DEFAULT_ROXX_PREFERENCES: RoxxAiPreferences = {
  responseStyle: "balanced",
  creativity: "balanced",
  language: "en",
  voiceEnabled: true,
  voiceAutoSpeak: false,
  proactiveNotifications: true,
  agentModeDefault: false,
};

export const ROXX_PREFS_KEY = "actora_roxx_preferences_v1";
export const ROXX_PINNED_KEY = "actora_roxx_pinned_commands_v1";
export const ROXX_MEMORY_KEY = "actora_roxx_memory_notes_v1";

export const ROXX_OS_COMMANDS = [
  "Create a task for tomorrow",
  "Summarize today's meetings",
  "Show overdue tasks",
  "Find every conversation with Acme",
  "Generate a proposal",
  "Schedule a meeting next Friday",
  "Draft a follow-up email",
  "Create CRM lead",
  "Generate weekly report",
  "Follow up with all leads that haven't replied in 7 days",
] as const;

export type SmartSuggestion = {
  id: string;
  label: string;
  prompt?: string;
  href?: string;
};

export const DEFAULT_SMART_SUGGESTIONS: SmartSuggestion[] = [
  {
    id: "create-task",
    label: "Create Task",
    prompt:
      "Create a clear follow-up task from your last answer. Confirm what you created.",
  },
  {
    id: "send-email",
    label: "Send Email",
    prompt:
      "Draft a follow-up email based on your last answer. Include subject and body.",
  },
  {
    id: "schedule",
    label: "Schedule Meeting",
    prompt:
      "Propose scheduling a meeting based on your last answer. Use calendar tools if helpful.",
  },
  {
    id: "report",
    label: "Generate Report",
    prompt: "Turn your last answer into a concise weekly status report.",
  },
  { id: "crm", label: "Open CRM", href: "/dashboard/crm" },
  { id: "calendar", label: "View Calendar", href: "/dashboard/calendar" },
];

export function loadRoxxPreferences(): RoxxAiPreferences {
  if (typeof window === "undefined") return DEFAULT_ROXX_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(ROXX_PREFS_KEY);
    if (!raw) return DEFAULT_ROXX_PREFERENCES;
    return { ...DEFAULT_ROXX_PREFERENCES, ...(JSON.parse(raw) as Partial<RoxxAiPreferences>) };
  } catch {
    return DEFAULT_ROXX_PREFERENCES;
  }
}

export function saveRoxxPreferences(prefs: RoxxAiPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROXX_PREFS_KEY, JSON.stringify(prefs));
}

export function loadPinnedCommands(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ROXX_PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function savePinnedCommands(commands: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ROXX_PINNED_KEY,
    JSON.stringify(commands.slice(0, 12))
  );
}

export function togglePinnedCommand(command: string): string[] {
  const trimmed = command.trim();
  if (!trimmed) return loadPinnedCommands();
  const current = loadPinnedCommands();
  const exists = current.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  const next = exists
    ? current.filter((c) => c.toLowerCase() !== trimmed.toLowerCase())
    : [trimmed, ...current].slice(0, 12);
  savePinnedCommands(next);
  return next;
}

export function loadMemoryNotes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ROXX_MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

export function saveMemoryNotes(notes: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ROXX_MEMORY_KEY,
    JSON.stringify(notes.slice(0, 20))
  );
}

export function preferencesToPromptBlock(prefs: RoxxAiPreferences): string {
  const style =
    prefs.responseStyle === "concise"
      ? "Keep answers short and scannable (3–6 bullets when possible)."
      : prefs.responseStyle === "detailed"
        ? "Provide thorough context and clear structure."
        : "Balance brevity with enough detail to act.";

  const creativity =
    prefs.creativity === "focused"
      ? "Stay tightly on the request; minimize speculation."
      : prefs.creativity === "creative"
        ? "Offer smart alternatives when helpful."
        : "Be practical with light proactive suggestions.";

  return `User preferences:
- Response style: ${prefs.responseStyle}. ${style}
- Creativity: ${prefs.creativity}. ${creativity}
- Language: respond in ${prefs.language === "en" ? "English" : prefs.language}.
- Prefer executing workspace actions with tools over asking clarifying questions when context exists.`;
}
