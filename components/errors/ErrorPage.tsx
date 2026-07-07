"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorIllustration } from "@/components/errors/ErrorIllustration";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type ErrorIllustrationVariant = "404" | "500" | "offline";

export type ErrorPageAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

type ErrorPageProps = {
  variant: ErrorIllustrationVariant;
  code?: string;
  title: string;
  description: string;
  primaryAction: ErrorPageAction;
  secondaryAction: ErrorPageAction;
  extraAction?: ErrorPageAction;
  footer?: ReactNode;
};

function ErrorActionButton({ action }: { action: ErrorPageAction }) {
  const className =
    action.variant === "secondary"
      ? `${dashboard.btnSecondary} px-5 py-3 text-sm min-w-[9.5rem]`
      : `${dashboard.btnPrimary} px-5 py-3 text-sm min-w-[9.5rem]`;

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export function ErrorPage({
  variant,
  code,
  title,
  description,
  primaryAction,
  secondaryAction,
  extraAction,
  footer,
}: ErrorPageProps) {
  return (
    <main className="relative min-h-screen bg-[#050816] text-white flex items-center justify-center px-4 sm:px-6 py-12 overflow-hidden">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,42rem)] h-72 bg-[#2563EB]/10 blur-[120px] rounded-full"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-[#3B82F6]/8 blur-[100px] rounded-full"
        aria-hidden
      />

      <div
        className={`relative w-full max-w-lg rounded-2xl border ${dashboard.border} bg-[#111827]/90 backdrop-blur-sm p-8 sm:p-10 text-center shadow-2xl shadow-black/30`}
        role="alert"
      >
        <div className="relative mx-auto mb-8 w-fit">
          <div
            className="absolute -inset-3 rounded-full border border-dashed border-[#2563EB]/20"
            aria-hidden
          />
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-center shadow-lg shadow-black/25">
            <ErrorIllustration variant={variant} />
          </div>
        </div>

        {code && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82F6] mb-3">
            {code}
          </p>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          {title}
        </h1>
        <p className={`text-sm sm:text-base ${dashboard.muted} leading-relaxed max-w-md mx-auto mb-8`}>
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <ErrorActionButton
            action={{ ...primaryAction, variant: primaryAction.variant ?? "primary" }}
          />
          <ErrorActionButton
            action={{
              ...secondaryAction,
              variant: secondaryAction.variant ?? "secondary",
            }}
          />
        </div>

        {extraAction && (
          <div className="mt-3">
            <ErrorActionButton
              action={{ ...extraAction, variant: extraAction.variant ?? "secondary" }}
            />
          </div>
        )}

        {footer && (
          <div className={`mt-6 text-xs ${dashboard.subtle}`}>{footer}</div>
        )}
      </div>
    </main>
  );
}
