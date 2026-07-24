"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { cn } from "@/lib/utils";

type CompactEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
};

export function CompactEmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className,
}: CompactEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#0A0A0A]/60 px-4 py-8 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/10">
        <Icon className="h-4 w-4 text-[#60A5FA]" aria-hidden />
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className={`mt-1 max-w-[16rem] text-xs leading-relaxed ${dashboard.subtle}`}>
        {description}
      </p>
      {cta &&
        (cta.href ? (
          <Link
            href={cta.href}
            className={`${dashboard.btnPrimary} mt-4 px-4 py-2 text-xs focus-ring`}
          >
            {cta.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={cta.onClick}
            className={`${dashboard.btnPrimary} mt-4 px-4 py-2 text-xs focus-ring`}
          >
            {cta.label}
          </button>
        ))}
    </div>
  );
}
