"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";

type DemoControlsProps = {
  stepIndex: number;
  totalSteps: number;
  isPaused: boolean;
  isEnding: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
  onSkip: () => void;
  onRestart: () => void;
};

export function DemoControls({
  stepIndex,
  totalSteps,
  isPaused,
  isEnding,
  onPrevious,
  onNext,
  onPause,
  onSkip,
  onRestart,
}: DemoControlsProps) {
  const displayStep = Math.min(stepIndex + 1, totalSteps);

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#0A0A0A]/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tabular-nums text-[#71717A] sm:text-sm">
            Step {displayStep} of {totalSteps}
          </span>
          <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06] sm:block sm:max-w-[200px]">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-500 ease-out"
              style={{ width: `${(displayStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={stepIndex === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-white transition-colors hover:bg-white/[0.06] disabled:opacity-40 sm:h-10 sm:px-4 sm:text-sm"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {!isEnding && (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-white transition-colors hover:bg-white/[0.06] sm:h-10 sm:px-4 sm:text-sm"
              aria-label={isPaused ? "Resume demo" : "Pause demo"}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              )}
            </button>
          )}

          {!isEnding && (
            <button
              type="button"
              onClick={onNext}
              disabled={stepIndex >= totalSteps - 1}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-40 sm:h-10 sm:px-4 sm:text-sm"
              aria-label="Next step"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-white sm:h-10 sm:px-4 sm:text-sm"
            aria-label="Restart demo"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-white sm:h-10 sm:px-4 sm:text-sm"
            aria-label="Skip demo"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Skip Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
