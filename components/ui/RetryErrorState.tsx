"use client";

import Link from "next/link";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type RetryErrorStateProps = {
  title?: string;
  error: string | null;
  onRetry: () => void;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

export function RetryErrorState({
  title = "Something went wrong",
  error,
  onRetry,
  secondaryHref,
  secondaryLabel,
  className = "",
}: RetryErrorStateProps) {
  return (
    <div
      className={`${dashboard.cardBase} border-[#EF4444]/20 p-6 ${className}`.trim()}
      role="alert"
    >
      <p className="mb-2 font-medium text-[#FCA5A5]">{title}</p>
      {error && <p className={`mb-4 text-sm ${dashboard.muted}`}>{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className={`${dashboard.btnSecondary} px-4 py-2 text-sm`}
        >
          Try again
        </button>
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className={`${dashboard.btnPrimary} px-4 py-2 text-sm`}
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
