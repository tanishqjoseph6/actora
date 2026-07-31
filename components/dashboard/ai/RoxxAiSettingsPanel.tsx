"use client";

import { useEffect, useState } from "react";
import {
  SettingsDivider,
  SettingsField,
  SettingsSelect,
  SettingsToggle,
} from "@/components/settings/SettingsSection";
import {
  DEFAULT_ROXX_PREFERENCES,
  loadMemoryNotes,
  loadPinnedCommands,
  loadRoxxPreferences,
  saveMemoryNotes,
  savePinnedCommands,
  saveRoxxPreferences,
  type RoxxAiPreferences,
} from "@/lib/ai/roxx-preferences";

export function RoxxAiSettingsPanel() {
  const [prefs, setPrefs] = useState<RoxxAiPreferences>(DEFAULT_ROXX_PREFERENCES);
  const [pinned, setPinned] = useState("");
  const [memory, setMemory] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadRoxxPreferences());
    setPinned(loadPinnedCommands().join("\n"));
    setMemory(loadMemoryNotes().join("\n"));
  }, []);

  const persist = (next: RoxxAiPreferences) => {
    setPrefs(next);
    saveRoxxPreferences(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#A1A1AA]">
          Control how Roxx AI responds, speaks, and executes.
        </p>
        {saved && <span className="text-xs text-emerald-400">Saved</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsField label="Response style" htmlFor="roxx-style">
          <SettingsSelect
            id="roxx-style"
            value={prefs.responseStyle}
            onChange={(v) =>
              persist({
                ...prefs,
                responseStyle: v as RoxxAiPreferences["responseStyle"],
              })
            }
            options={[
              { value: "concise", label: "Concise" },
              { value: "balanced", label: "Balanced" },
              { value: "detailed", label: "Detailed" },
            ]}
          />
        </SettingsField>
        <SettingsField label="Creativity" htmlFor="roxx-creativity">
          <SettingsSelect
            id="roxx-creativity"
            value={prefs.creativity}
            onChange={(v) =>
              persist({
                ...prefs,
                creativity: v as RoxxAiPreferences["creativity"],
              })
            }
            options={[
              { value: "focused", label: "Focused" },
              { value: "balanced", label: "Balanced" },
              { value: "creative", label: "Creative" },
            ]}
          />
        </SettingsField>
        <SettingsField label="Language" htmlFor="roxx-language">
          <SettingsSelect
            id="roxx-language"
            value={prefs.language}
            onChange={(v) => persist({ ...prefs, language: v })}
            options={[
              { value: "en", label: "English" },
              { value: "hi", label: "Hindi" },
              { value: "es", label: "Spanish" },
              { value: "fr", label: "French" },
            ]}
          />
        </SettingsField>
      </div>

      <SettingsDivider />

      <SettingsToggle
        id="roxx-agent-default"
        label="Agent mode by default"
        description="Multi-step workflows execute automatically when possible."
        checked={prefs.agentModeDefault}
        onChange={(v) => persist({ ...prefs, agentModeDefault: v })}
      />
      <SettingsToggle
        id="roxx-proactive"
        label="Proactive notifications"
        description="Upcoming meetings, overdue tasks, stuck deals, priority email."
        checked={prefs.proactiveNotifications}
        onChange={(v) => persist({ ...prefs, proactiveNotifications: v })}
      />
      <SettingsToggle
        id="roxx-voice"
        label="Voice controls"
        description="Push-to-talk mic in the Roxx composer."
        checked={prefs.voiceEnabled}
        onChange={(v) => persist({ ...prefs, voiceEnabled: v })}
      />
      <SettingsToggle
        id="roxx-auto-speak"
        label="Speak responses"
        description="Read Roxx replies aloud (interrupt anytime)."
        checked={prefs.voiceAutoSpeak}
        onChange={(v) => persist({ ...prefs, voiceAutoSpeak: v })}
      />

      <SettingsDivider />

      <SettingsField
        label="Pinned commands"
        htmlFor="roxx-pinned"
        hint="One command per line — shown in ⌘K."
      >
        <textarea
          id="roxx-pinned"
          value={pinned}
          onChange={(e) => setPinned(e.target.value)}
          onBlur={() => {
            const list = pinned
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
            savePinnedCommands(list);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1200);
          }}
          rows={4}
          className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/40"
          placeholder="Create a task for tomorrow"
        />
      </SettingsField>

      <SettingsField
        label="Workspace memory notes"
        htmlFor="roxx-memory"
        hint="Facts Roxx should remember (preferences, key accounts, tone)."
      >
        <textarea
          id="roxx-memory"
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          onBlur={() => {
            const list = memory
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
            saveMemoryNotes(list);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1200);
          }}
          rows={4}
          className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/40"
          placeholder="Always address Acme Corp as priority account"
        />
      </SettingsField>
    </div>
  );
}
