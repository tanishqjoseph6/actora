"use client";

import { PremiumEmptyState } from "@/components/ui/PremiumEmptyState";
import type { EmptyStateIllustration } from "@/components/ui/PremiumEmptyState";

type AnalyticsSectionEmptyProps = {
  illustration: EmptyStateIllustration;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function AnalyticsSectionEmpty({
  illustration,
  title,
  description,
  ctaLabel,
  ctaHref,
}: AnalyticsSectionEmptyProps) {
  return (
    <PremiumEmptyState
      illustration={illustration}
      title={title}
      description={description}
      cta={{ label: ctaLabel, href: ctaHref }}
      className="py-10 sm:py-12"
    />
  );
}
