import { formatCurrency } from "@/lib/crm/mock-data";
import type { HealthRating } from "./types";

export function formatKpiCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return formatCurrency(value);
  return `$${Math.round(value)}`;
}

export function formatHours(value: number): string {
  if (value < 1) return `${Math.round(value * 60)}m`;
  return `${value.toFixed(1)}h`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatActivityTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function healthRatingLabel(rating: HealthRating): string {
  switch (rating) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "average":
      return "Average";
    case "needs_attention":
      return "Needs Attention";
  }
}

export function healthRatingColor(rating: HealthRating): string {
  switch (rating) {
    case "excellent":
      return "#3B82F6";
    case "good":
      return "#60A5FA";
    case "average":
      return "#A1A1AA";
    case "needs_attention":
      return "#F87171";
  }
}
