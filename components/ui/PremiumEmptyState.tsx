"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export type EmptyStateIllustration =
  | "inbox"
  | "crm"
  | "automations"
  | "meetings"
  | "tasks";

type PremiumEmptyStateProps = {
  illustration: EmptyStateIllustration;
  title: string;
  description: string;
  cta: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
};

export function PremiumEmptyState({
  illustration,
  title,
  description,
  cta,
  className = "",
}: PremiumEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center py-14 sm:py-16 lg:py-20 px-6 text-center rounded-2xl border border-[#1E293B] bg-[#111827]/80 ${className}`}
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-3 rounded-full border border-dashed border-[#2563EB]/20"
          aria-hidden
        />
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-center shadow-lg shadow-black/20">
          <EmptyIllustration type={illustration} />
        </div>
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 max-w-md">
        {title}
      </h2>
      <p className={`text-sm ${dashboard.muted} max-w-md mb-8 leading-relaxed`}>
        {description}
      </p>

      {cta.href ? (
        <Link href={cta.href} className={`${dashboard.btnPrimary} px-6 py-3 text-sm`}>
          {cta.label}
        </Link>
      ) : (
        <button
          type="button"
          onClick={cta.onClick}
          className={`${dashboard.btnPrimary} px-6 py-3 text-sm`}
        >
          {cta.label}
        </button>
      )}
    </motion.div>
  );
}

function EmptyIllustration({ type }: { type: EmptyStateIllustration }) {
  const gradientId = `empty-grad-${type}`;

  switch (type) {
    case "inbox":
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect x="14" y="22" width="52" height="36" rx="6" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
          <path d="M14 28 L40 44 L66 28" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M52 14 L56 20 L62 18" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          <circle cx="58" cy="16" r="1.5" fill="#93C5FD" opacity="0.7" />
          <circle cx="64" cy="22" r="1" fill="#3B82F6" opacity="0.6" />
        </svg>
      );

    case "crm":
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="28" r="10" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
          <circle cx="22" cy="54" r="8" fill="none" stroke="#2563EB" strokeWidth="2" opacity="0.7" />
          <circle cx="58" cy="54" r="8" fill="none" stroke="#2563EB" strokeWidth="2" opacity="0.7" />
          <path d="M32 36 L26 48 M48 36 L54 48 M34 54 L46 54" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 36 L26 48 M48 36 L54 48" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      );

    case "automations":
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect x="26" y="12" width="28" height="12" rx="4" fill={`url(#${gradientId})`} opacity="0.95" />
          <path d="M40 24 L40 32" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
          <rect x="16" y="34" width="48" height="12" rx="4" fill={`url(#${gradientId})`} opacity="0.65" />
          <path d="M40 46 L40 54" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
          <rect x="24" y="56" width="32" height="12" rx="4" fill={`url(#${gradientId})`} opacity="0.4" />
        </svg>
      );

    case "meetings":
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect x="16" y="18" width="48" height="44" rx="6" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
          <path d="M16 30 H64" stroke="#2563EB" strokeWidth="2" opacity="0.6" />
          <rect x="22" y="22" width="8" height="4" rx="1" fill="#3B82F6" opacity="0.5" />
          <rect x="50" y="22" width="8" height="4" rx="1" fill="#3B82F6" opacity="0.5" />
          <rect x="22" y="38" width="10" height="8" rx="2" fill={`url(#${gradientId})`} opacity="0.85" />
          <rect x="36" y="38" width="10" height="8" rx="2" fill="#2563EB" opacity="0.35" />
          <rect x="50" y="38" width="10" height="8" rx="2" fill="#2563EB" opacity="0.35" />
          <rect x="22" y="50" width="10" height="8" rx="2" fill="#2563EB" opacity="0.25" />
        </svg>
      );

    case "tasks":
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect x="20" y="16" width="40" height="48" rx="6" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
          <path d="M28 30 L34 36 L48 26" fill="none" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 44 H52" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M28 54 H46" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
          <circle cx="28" cy="44" r="3" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="28" cy="54" r="3" fill="none" stroke="#64748B" strokeWidth="1.5" />
        </svg>
      );
  }
}
