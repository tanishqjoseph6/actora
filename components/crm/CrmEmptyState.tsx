"use client";

import { PremiumEmptyState } from "@/components/ui/PremiumEmptyState";

type CrmEmptyStateProps = {
  title: string;
  description: string;
  cta: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};

export function CrmEmptyState({ title, description, cta }: CrmEmptyStateProps) {
  return (
    <PremiumEmptyState
      illustration="crm"
      title={title}
      description={description}
      cta={cta}
      className="border-dashed bg-[#111111]/50"
    />
  );
}

/** @deprecated Use CrmEmptyState with PremiumEmptyState instead */
export function ContactEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

export function CompanyEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

export function DealEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.085-1.128-1.837-2.173-1.837h-1.043c-.607 0-1.174.303-1.512.808L12 8.25l-1.022-1.573c-.338-.505-.905-.808-1.512-.808H8.423C7.378 6.869 6.25 7.621 6.25 8.706v3.783a2.18 2.18 0 00.75 1.661m16.5 0h-16.5" />
    </svg>
  );
}
