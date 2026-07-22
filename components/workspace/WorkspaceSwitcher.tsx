"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { cn } from "@/lib/utils";
import { PLAN_DISPLAY_NAMES, type PlanId } from "@/lib/subscription";

const ICON_GLYPH: Record<string, string> = {
  spark: "✦",
  hexagon: "⬡",
  orbit: "◎",
  layers: "⧉",
  bolt: "⚡",
  compass: "◈",
  diamond: "◆",
  wave: "〰",
};

function planLabel(planId: string) {
  return PLAN_DISPLAY_NAMES[planId as PlanId] ?? planId;
}

function WorkspaceAvatar({
  name,
  logoUrl,
  icon,
  size = 32,
}: {
  name: string;
  logoUrl: string | null;
  icon: string;
  size?: number;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/20 text-[#93C5FD] border border-[#3B82F6]/25"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {ICON_GLYPH[icon] ?? name.charAt(0).toUpperCase()}
    </div>
  );
}

type WorkspaceSwitcherProps = {
  collapsed?: boolean;
};

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const { active, workspaces, switchWorkspace, createWorkspace, switching, loading } =
    useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...workspaces].sort((a, b) => a.name.localeCompare(b.name)),
    [workspaces]
  );

  if (loading && !active) {
    return (
      <div className="mx-1 mb-1 h-12 animate-pulse rounded-xl bg-white/[0.04]" />
    );
  }

  if (!active) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] transition hover:border-[#3B82F6]/35"
        aria-label={`Workspace: ${active.name}`}
        title={active.name}
      >
        <WorkspaceAvatar
          name={active.name}
          logoUrl={active.logoUrl}
          icon={active.icon}
          size={28}
        />
      </button>
    );
  }

  return (
    <div className="relative mb-1 px-1" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-left transition",
          "hover:border-[#3B82F6]/35 hover:bg-white/[0.05]",
          open && "border-[#3B82F6]/40 bg-white/[0.05]"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <WorkspaceAvatar
          name={active.name}
          logoUrl={active.logoUrl}
          icon={active.icon}
          size={32}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">
            {active.name}
          </p>
          <p className="truncate text-[11px] text-[#71717A]">
            {planLabel(active.planId)} · {active.role}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#71717A] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close workspace menu"
              onClick={() => {
                setOpen(false);
                setCreating(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute left-1 right-1 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              role="listbox"
            >
              <div className="border-b border-white/[0.06] px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
                  Switch workspace
                </p>
              </div>
              <ul className="max-h-56 overflow-y-auto premium-scrollbar p-1.5">
                {sorted.map((ws) => {
                  const selected = ws.id === active.id;
                  return (
                    <li key={ws.id}>
                      <button
                        type="button"
                        disabled={switching || busy}
                        onClick={async () => {
                          setBusy(true);
                          await switchWorkspace(ws.id);
                          setBusy(false);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition",
                          selected
                            ? "bg-[#3B82F6]/15 text-white"
                            : "text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white"
                        )}
                        role="option"
                        aria-selected={selected}
                      >
                        <WorkspaceAvatar
                          name={ws.name}
                          logoUrl={ws.logoUrl}
                          icon={ws.icon}
                          size={28}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">
                            {ws.name}
                          </p>
                          <p className="truncate text-[11px] text-[#71717A]">
                            {planLabel(ws.planId)} · {ws.role}
                          </p>
                        </div>
                        {selected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#60A5FA]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-white/[0.06] p-1.5">
                {creating ? (
                  <form
                    className="space-y-2 p-1"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (newName.trim().length < 2) return;
                      setBusy(true);
                      try {
                        await createWorkspace({ name: newName.trim() });
                        setNewName("");
                        setCreating(false);
                        setOpen(false);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Workspace name"
                      className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-2.5 py-2 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#3B82F6]/50"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={busy || newName.trim().length < 2}
                        className="flex-1 rounded-lg bg-[#3B82F6] px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="rounded-lg border border-white/[0.08] px-2 py-1.5 text-xs text-[#A1A1AA]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-[#A1A1AA] transition hover:bg-white/[0.04] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create workspace
                    <Sparkles className="ml-auto h-3 w-3 text-[#60A5FA]" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export { WorkspaceAvatar };
