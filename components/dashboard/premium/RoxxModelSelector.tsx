"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Lock } from "lucide-react";
import {
  listRoxxModelsForUi,
  type RoxxModelId,
} from "@/lib/assistant/models";
import type { PlanId } from "@/lib/subscription";
import { cn } from "@/lib/utils";

type RoxxModelSelectorProps = {
  planId: PlanId;
  value: RoxxModelId;
  onChange: (modelId: RoxxModelId) => void;
  onLockedSelect: (modelId: RoxxModelId, upgradePlan: PlanId) => void;
  disabled?: boolean;
};

export function RoxxModelSelector({
  planId,
  value,
  onChange,
  onLockedSelect,
  disabled,
}: RoxxModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const models = listRoxxModelsForUi(planId);
  const selected = models.find((m) => m.id === value) ?? models[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 max-w-[200px] items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0A0A0A]/60 px-2.5 text-left transition-all",
          "hover:border-[#3B82F6]/40 hover:bg-white/[0.03]",
          open && "border-[#3B82F6]/45 bg-white/[0.03]",
          disabled && "opacity-50"
        )}
      >
        <span className="truncate text-[11px] font-medium text-[#E4E4E7]">
          {selected.label}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-[#71717A] transition-transform",
            open && "rotate-180 text-[#60A5FA]"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listId}
            role="listbox"
            aria-label="Roxx AI model"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+6px)] z-30 w-[240px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414] shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
          >
            <ul className="p-1.5">
              {models.map((model) => {
                const isSelected = model.id === selected.id;
                return (
                  <li key={model.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (model.locked) {
                          onLockedSelect(model.id, model.upgradePlan);
                          setOpen(false);
                          return;
                        }
                        onChange(model.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-[#3B82F6]/15"
                          : "hover:bg-white/[0.04]",
                        model.locked && "opacity-90"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {model.locked ? (
                            <Lock
                              className="h-3 w-3 shrink-0 text-[#71717A]"
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={cn(
                              "truncate text-[12px] font-medium",
                              model.locked ? "text-[#A1A1AA]" : "text-white"
                            )}
                          >
                            {model.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-[#71717A]">
                          {model.locked
                            ? model.minPlan === "pro"
                              ? "🔒 Upgrade to Pro"
                              : "🔒 Upgrade to Team"
                            : model.planLabel}
                        </p>
                      </div>
                      {isSelected && !model.locked ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#60A5FA]" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
