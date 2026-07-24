"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductionAlertVariant = "error" | "warning" | "info" | "success";

type ProductionAlertProps = {
  variant?: ProductionAlertVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

const VARIANT_STYLES: Record<
  ProductionAlertVariant,
  { border: string; bg: string; icon: string; title: string }
> = {
  error: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    icon: "text-red-400",
    title: "text-red-100",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    title: "text-amber-100",
  },
  info: {
    border: "border-[#3B82F6]/30",
    bg: "bg-[#3B82F6]/10",
    icon: "text-[#60A5FA]",
    title: "text-blue-100",
  },
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    title: "text-emerald-100",
  },
};

function AlertIcon({
  variant,
  className,
}: {
  variant: ProductionAlertVariant;
  className?: string;
}) {
  const props = { className, "aria-hidden": true as const };
  if (variant === "success") return <CheckCircle2 {...props} />;
  if (variant === "info") return <Info {...props} />;
  return <AlertCircle {...props} />;
}

export function ProductionAlert({
  variant = "error",
  title,
  message,
  onDismiss,
  action,
  className,
}: ProductionAlertProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      role="alert"
      className={cn(
        "animate-fade-in rounded-xl border px-4 py-3",
        styles.border,
        styles.bg,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertIcon
          variant={variant}
          className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium", styles.title)}>{title}</p>
          {message && (
            <p className="mt-1 text-sm leading-relaxed text-[#A1A1AA]">
              {message}
            </p>
          )}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD]"
            >
              {action.label}
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 text-[#71717A] transition-colors hover:bg-white/[0.04] hover:text-white"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
