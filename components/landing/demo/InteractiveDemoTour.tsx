"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEMO_STEPS, DEMO_TOTAL_STEPS } from "./demo-config";
import { DemoControls } from "./DemoControls";
import { DemoScene } from "./DemoScenes";
import { DemoTooltip } from "./DemoTooltip";

type InteractiveDemoTourProps = {
  onClose: () => void;
};

export function InteractiveDemoTour({ onClose }: InteractiveDemoTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = DEMO_STEPS[stepIndex];
  const isEnding = currentStep?.id === "ending";

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      clearTimer();
      setStepIndex(Math.max(0, Math.min(index, DEMO_TOTAL_STEPS - 1)));
    },
    [clearTimer]
  );

  const handleNext = useCallback(() => {
    if (stepIndex < DEMO_TOTAL_STEPS - 1) {
      goToStep(stepIndex + 1);
    }
  }, [stepIndex, goToStep]);

  const handlePrevious = useCallback(() => {
    if (stepIndex > 0) {
      goToStep(stepIndex - 1);
    }
  }, [stepIndex, goToStep]);

  const handleRestart = useCallback(() => {
    setIsPaused(false);
    goToStep(0);
  }, [goToStep]);

  const handleSkip = useCallback(() => {
    clearTimer();
    onClose();
  }, [clearTimer, onClose]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || isEnding) {
      clearTimer();
      return;
    }

    const duration = currentStep?.durationMs ?? 0;
    if (duration <= 0) return;

    timerRef.current = setTimeout(() => {
      if (stepIndex < DEMO_TOTAL_STEPS - 1) {
        setStepIndex((prev) => prev + 1);
      }
    }, duration);

    return clearTimer;
  }, [stepIndex, isPaused, isEnding, currentStep?.durationMs, clearTimer]);

  // Reset on mount
  useEffect(() => {
    setStepIndex(0);
    setIsPaused(false);
    return clearTimer;
  }, [clearTimer]);

  // Body scroll lock + keyboard
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleSkip, handleNext, handlePrevious]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#050505]/95 backdrop-blur-md"
      role="dialog"
      aria-modal
      aria-label="Actora interactive product demo"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08),transparent_50%)]" />

      {/* Top bar */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">
            Interactive Demo
          </span>
          <span className="hidden text-xs text-[#52525B] sm:inline">·</span>
          <span className="hidden text-xs text-[#71717A] sm:inline">
            {currentStep?.title}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#71717A] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          Exit
        </button>
      </div>

      {/* Main demo area */}
      <div className="relative flex flex-1 flex-col overflow-hidden px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="relative mx-auto h-full w-full max-w-4xl flex-1 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep?.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full min-h-[300px] sm:min-h-[380px]"
            >
              {currentStep && (
                <DemoScene
                  stepId={currentStep.id}
                  activeNav={currentStep.sidebarHighlight}
                  onClose={handleSkip}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {currentStep && !isEnding && (
              <DemoTooltip text={currentStep.tooltip} stepIndex={stepIndex} />
            )}
          </AnimatePresence>
        </div>
      </div>

      <DemoControls
        stepIndex={stepIndex}
        totalSteps={DEMO_TOTAL_STEPS}
        isPaused={isPaused}
        isEnding={isEnding}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onPause={() => setIsPaused((p) => !p)}
        onSkip={handleSkip}
        onRestart={handleRestart}
      />
    </motion.div>
  );
}
