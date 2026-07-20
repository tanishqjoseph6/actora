"use client";

import { FadeUp } from "./motion";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <FadeUp
      className={cn(
        "mb-12 sm:mb-16 max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {badge && (
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[#3B82F6]">
          {badge}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-white leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-[#A1A1AA] leading-relaxed">
          {subtitle}
        </p>
      )}
    </FadeUp>
  );
}
