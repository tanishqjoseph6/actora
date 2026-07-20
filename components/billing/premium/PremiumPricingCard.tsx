"use client";

import { motion } from "framer-motion";
import type { PricingPlan } from "../pricing-data";
import type { PlanId } from "@/lib/subscription";
import { BILLING_TEMPORARILY_DISABLED } from "@/lib/billing/billing-pause";
import { ComingSoonBadge } from "@/components/billing/BillingPauseProvider";

type PremiumPricingCardProps = {
  plan: PricingPlan;
  index: number;
  currentPlanId?: PlanId;
  marketingMode?: boolean;
  onSelect: (plan: PricingPlan) => void;
};

export function PremiumPricingCard({
  plan,
  index,
  currentPlanId,
  marketingMode = false,
  onSelect,
}: PremiumPricingCardProps) {
  const isCurrent = !marketingMode && currentPlanId === plan.id;
  const isFreeCurrent = isCurrent && plan.id === "free";
  const showActiveBadge = isCurrent && plan.id !== "free";
  const isEnterprise = plan.id === "enterprise";
  const isActionable =
    isEnterprise ||
    (plan.id === "free" && marketingMode) ||
    (plan.id !== "free" && !isCurrent);

  const pausePaidCta =
    BILLING_TEMPORARILY_DISABLED &&
    !(marketingMode && plan.id === "free") &&
    plan.id !== "enterprise" &&
    (plan.id !== "free" || !marketingMode);

  const ctaLabel = isFreeCurrent
    ? "Current Plan"
    : plan.id === "free"
      ? marketingMode
        ? "Start Free"
        : "Free Plan"
      : plan.cta;

  const handleClick = () => {
    if (isEnterprise) {
      onSelect(plan);
      return;
    }
    if (pausePaidCta || isActionable) {
      onSelect(plan);
    }
  };

  const cardContent = (
    <>
      {plan.badge && (
        <span
          className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            plan.recommended
              ? "bg-[#3B82F6] text-white"
              : "border border-white/[0.08] bg-[#3B82F6]/15 text-[#3B82F6]"
          }`}
        >
          {plan.recommended && "✦ "}
          {plan.badge}
        </span>
      )}

      {showActiveBadge && (
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/15 px-3 py-1 text-xs font-semibold text-[#93C5FD]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3B82F6]" />
          Active
        </span>
      )}

      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {plan.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">
          {plan.description}
        </p>
      </div>

      <div className="mb-6 mt-6">
        <div className="flex flex-wrap items-baseline gap-1">
          <motion.span
            key={`${plan.id}-${plan.priceLabel}-${plan.priceSuffix}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-4xl font-bold tracking-tight text-[#3B82F6] sm:text-5xl"
          >
            {plan.priceLabel}
          </motion.span>
          <motion.span
            key={`${plan.id}-suffix-${plan.priceSuffix}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="text-sm text-[#71717A]"
          >
            {plan.priceSuffix}
          </motion.span>
        </div>
        {plan.billingNote && (
          <motion.p
            key={`${plan.id}-billing-${plan.billingNote}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-xs text-[#A1A1AA]"
          >
            {plan.billingNote}
          </motion.p>
        )}
        {plan.saveNote && (
          <motion.p
            key={`${plan.id}-save-${plan.saveNote}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="mt-2 text-xs text-[#3B82F6]"
          >
            {plan.saveNote}
          </motion.p>
        )}
        {plan.compareAtLabel && plan.saveNote && (
          <motion.p
            key={`${plan.id}-compare-${plan.compareAtLabel}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.08 }}
            className="mt-1 text-xs text-[#71717A] line-through"
          >
            {plan.compareAtLabel}/year
          </motion.p>
        )}
        {isEnterprise && (
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Tailored to your organization
          </p>
        )}
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-white">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#3B82F6]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <PlanButton
        label={ctaLabel}
        variant={plan.ctaVariant}
        disabled={
          !pausePaidCta &&
          !marketingMode &&
          (isFreeCurrent || (plan.id === "free" && !isCurrent))
        }
        comingSoon={pausePaidCta && !isFreeCurrent}
        onClick={handleClick}
      />
    </>
  );

  if (plan.recommended) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.08 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="relative lg:z-10 lg:scale-[1.02]"
      >
        <div className="relative flex h-full flex-col rounded-[20px] border-2 border-[#3B82F6]/45 bg-[#111111] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
          {cardContent}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="flex h-full flex-col rounded-[20px] border border-white/[0.06] bg-[#111111] p-6 shadow-sm shadow-black/30 transition-colors hover:border-[#3B82F6]/35 sm:p-8"
    >
      {cardContent}
    </motion.div>
  );
}

function PlanButton({
  label,
  variant,
  disabled,
  comingSoon,
  onClick,
}: {
  label: string;
  variant: PricingPlan["ctaVariant"];
  disabled?: boolean;
  comingSoon?: boolean;
  onClick: () => void;
}) {
  const base =
    "w-full rounded-2xl py-3.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  const content = (
    <span className="inline-flex items-center justify-center gap-2">
      {label}
      {comingSoon ? <ComingSoonBadge /> : null}
    </span>
  );

  if (variant === "gradient" || variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled && !comingSoon}
        aria-disabled={comingSoon || disabled}
        className={`${base} ${
          comingSoon
            ? "cursor-pointer bg-[#3B82F6]/40 text-white/90 opacity-80 hover:opacity-100"
            : "bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:hover:bg-[#3B82F6]"
        }`}
      >
        {content}
      </button>
    );
  }

  if (variant === "enterprise") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} border border-white/[0.1] bg-[#0A0A0A] text-white hover:border-[#3B82F6]/40 hover:bg-[#111111]`}
      >
        {content}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !comingSoon}
      aria-disabled={comingSoon || disabled}
      className={`${base} ${
        comingSoon
          ? "cursor-pointer border border-white/[0.1] bg-white/[0.03] text-white/80 opacity-80 hover:opacity-100"
          : "border border-white/[0.1] bg-transparent text-[#3B82F6] hover:bg-[#3B82F6]/10"
      }`}
    >
      {content}
    </button>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
