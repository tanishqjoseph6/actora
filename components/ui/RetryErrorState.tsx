"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { friendlyError } from "@/lib/errors/friendly";

type RetryErrorStateProps = {
  title?: string;
  error: string | null;
  onRetry: () => void;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
  category?: Parameters<typeof friendlyError>[1];
};

export function RetryErrorState({
  title,
  error,
  onRetry,
  secondaryHref,
  secondaryLabel,
  className = "",
  category = "server",
}: RetryErrorStateProps) {
  const friendly = friendlyError(error, category);
  const displayTitle = title ?? friendly.title;
  const displayMessage = friendly.message;

  return (
    <div
      className={`${dashboard.cardBase} border-red-500/20 p-6 animate-fade-in ${className}`.trim()}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-red-100">{displayTitle}</p>
          <p className={`mt-1 text-sm leading-relaxed ${dashboard.muted}`}>
            {displayMessage}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
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
      </div>
    </div>
  );
}
