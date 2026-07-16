"use client";

import { motion } from "framer-motion";
import type { PricingPlan } from "../pricing-data";
import type { PlanId } from "@/lib/subscription";

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
    if (isActionable) {
      onSelect(plan);
    }
  };

  const cardContent = (
    <>
      {plan.badge && (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${
            plan.recommended
              ? "bg-[#2563EB] text-white"
              : "bg-[#3B82F6]/15 border border-[#1E293B] text-[#3B82F6]"
          }`}
        >
          {plan.recommended && "✦ "}
          {plan.badge}
        </span>
      )}

      {showActiveBadge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/15 border border-[#1E293B] text-[#2563EB] text-xs font-bold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
          Active
        </span>
      )}

      <div className={!plan.badge && !showActiveBadge ? "" : ""}>
        <h3 className="text-2xl sm:text-3xl font-bold text-white">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{plan.description}</p>
      </div>

      <div className="mt-6 mb-6">
        <div className="flex items-baseline gap-1 flex-wrap">
          <motion.span
            key={`${plan.id}-${plan.priceLabel}-${plan.priceSuffix}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="font-bold tracking-tight text-4xl sm:text-5xl text-white"
          >
            {plan.priceLabel}
          </motion.span>
          <motion.span
            key={`${plan.id}-suffix-${plan.priceSuffix}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="text-gray-500 text-sm"
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
            className="text-xs text-[#94A3B8] mt-2"
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
            className="text-xs text-[#3B82F6] mt-2"
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
            className="text-xs text-gray-500 mt-1 line-through"
          >
            {plan.compareAtLabel}/year
          </motion.p>
        )}
        {isEnterprise && (
          <p className="text-sm text-gray-400 mt-2">Tailored to your organization</p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
            <CheckIcon className="shrink-0 w-4 h-4 text-[#2563EB] mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <PlanButton
        label={ctaLabel}
        variant={plan.ctaVariant}
        disabled={!marketingMode && (isFreeCurrent || (plan.id === "free" && !isCurrent))}
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
        className="relative lg:scale-[1.02] lg:z-10"
      >
        <div className="relative h-full flex flex-col rounded-[24px] bg-[#111827] border-2 border-[#2563EB]/50 p-6 sm:p-8 shadow-lg shadow-black/40">
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
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="h-full flex flex-col rounded-[24px] bg-[#111827] border border-[#1E293B] p-6 sm:p-8 shadow-sm shadow-black/30 transition-colors hover:border-[#2563EB]/40"
    >
      {cardContent}
    </motion.div>
  );
}

function PlanButton({
  label,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  variant: PricingPlan["ctaVariant"];
  disabled?: boolean;
  onClick: () => void;
}) {
  const base =
    "w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  if (variant === "gradient" || variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm disabled:hover:bg-[#2563EB]`}
      >
        {label}
      </button>
    );
  }

  if (variant === "enterprise") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-[#05070B]/80 border border-[#1E293B] text-white hover:border-[#2563EB]/40 hover:bg-[#111827]/80`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} border border-[#1E293B] text-[#2563EB] bg-transparent hover:bg-[#2563EB]/5`}
    >
      {label}
    </button>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
