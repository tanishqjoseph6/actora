"use client";

type RoxxThinkingIndicatorProps = {
  /** Optional secondary status (e.g. tool activity) */
  status?: string | null;
  className?: string;
};

/**
 * Premium CSS-only "Roxx AI is thinking" indicator.
 * Lightweight transforms/opacity — no JS animation loop.
 */
export function RoxxThinkingIndicator({
  status,
  className = "",
}: RoxxThinkingIndicatorProps) {
  return (
    <div
      className={`roxx-thinking ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label="Roxx AI is thinking"
    >
      <div className="roxx-thinking__stage" aria-hidden>
        <div className="roxx-thinking__glow" />
        <div className="roxx-thinking__orb">
          <div className="roxx-thinking__shimmer" />
        </div>
        <div className="roxx-thinking__dots">
          <span />
          <span />
          <span />
        </div>
      </div>
      <p className="roxx-thinking__label">Roxx AI is thinking...</p>
      {status ? <p className="roxx-thinking__status">{status}</p> : null}
    </div>
  );
}
