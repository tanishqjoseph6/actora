"use client";

import type { BillingPeriod, PricingPlan } from "./pricing-data";
import { getDisplayPrice } from "@/lib/billing/pricing";
import type { BillingCurrency } from "@/lib/billing/currency";

type PricingCardProps = {
  plan: PricingPlan;
  period: BillingPeriod;
  currency: BillingCurrency;
  onUpgrade?: (plan: PricingPlan) => void;
  isCurrentPlan?: boolean;
};

export function PricingCard({
  plan,
  period,
  currency,
  onUpgrade,
  isCurrentPlan,
}: PricingCardProps) {
  const pricing = getDisplayPrice(currency, plan.id, period);
  const isEnterprise = plan.id === "enterprise";
  const showYearlyNote = Boolean(plan.saveNote);

  const isActionableCta =
    plan.cta === "Upgrade" || plan.cta === "Contact Sales";

  const handleCtaClick = () => {
    if (isActionableCta && onUpgrade) {
      onUpgrade(plan);
    }
  };

  if (plan.recommended) {
    return (
      <div className="relative group lg:-mt-2 lg:mb-2">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#3B82F6] via-[#3B82F6] to-[#3B82F6] opacity-80 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative h-full flex flex-col rounded-2xl bg-gradient-to-b from-[#111827] via-[#0B1220] to-[#050816] border border-[rgba(37, 99, 235,0.25)] p-6 sm:p-8 shadow-2xl shadow-blue-500/10 transition-all duration-300 hover:shadow-blue-500/20 hover:-translate-y-1">
          <PlanBadge label={plan.badge ?? "Recommended"} variant="gradient" />
          <PlanContent
            plan={plan}
            pricing={pricing}
            showYearlyNote={showYearlyNote}
            isEnterprise={isEnterprise}
            ctaVariant="gradient"
            onCtaClick={handleCtaClick}
            isCurrentPlan={isCurrentPlan}
            ctaLabel={plan.cta}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative h-full flex flex-col rounded-2xl bg-[#0B1220]/80 backdrop-blur-sm border border-[rgba(37, 99, 235,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20 transition-all duration-300 hover:border-[rgba(37, 99, 235,0.3)] hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
      {plan.badge && <PlanBadge label={plan.badge} variant="subtle" />}
      <PlanContent
        plan={plan}
        pricing={pricing}
        showYearlyNote={showYearlyNote}
        isEnterprise={isEnterprise}
        ctaVariant={plan.ctaVariant}
        onCtaClick={handleCtaClick}
        isCurrentPlan={isCurrentPlan}
        ctaLabel={plan.cta}
      />
    </div>
  );
}

function PlanContent({
  plan,
  pricing,
  showYearlyNote,
  isEnterprise,
  ctaVariant,
  onCtaClick,
  isCurrentPlan,
  ctaLabel,
}: {
  plan: PricingPlan;
  pricing: ReturnType<typeof getDisplayPrice>;
  showYearlyNote: boolean;
  isEnterprise: boolean;
  ctaVariant: PricingPlan["ctaVariant"];
  onCtaClick?: () => void;
  isCurrentPlan?: boolean;
  ctaLabel: string;
}) {
  return (
    <>
      <div className={plan.badge ? "mt-3" : ""}>
        <h3 className="text-2xl sm:text-3xl font-bold text-white">{plan.name}</h3>
        <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
      </div>

      <div className="mt-6 mb-6">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-bold ${
              plan.recommended
                ? "text-4xl sm:text-5xl bg-[#2563EB] bg-clip-text text-transparent"
                : "text-4xl sm:text-5xl text-white"
            }`}
          >
            {pricing.amount}
          </span>
          {pricing.suffix && (
            <span className="text-gray-400 text-sm">{pricing.suffix}</span>
          )}
        </div>
        {showYearlyNote && pricing.saveNote && (
          <p className="text-xs text-[#3B82F6] mt-1">{pricing.saveNote}</p>
        )}
        {pricing.billingNote && (
          <p className="text-xs text-gray-500 mt-1">{pricing.billingNote}</p>
        )}
        {isEnterprise && (
          <p className="text-sm text-[#3B82F6] mt-2">Tailored to your team</p>
        )}
        {plan.monthlyPrice === 0 && (
          <p className="text-sm text-gray-400 mt-1">Forever free</p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
            <CheckIcon className="shrink-0 w-4 h-4 text-[#3B82F6] mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      <PlanCta
        label={isCurrentPlan ? "Current Plan" : ctaLabel}
        variant={ctaVariant}
        onClick={onCtaClick}
        disabled={isCurrentPlan}
      />
    </>
  );
}

function PlanBadge({
  label,
  variant,
}: {
  label: string;
  variant: "gradient" | "subtle";
}) {
  if (variant === "gradient") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-bold">
        ✦ {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-semibold">
      {label}
    </span>
  );
}

function PlanCta({
  label,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  variant: PricingPlan["ctaVariant"];
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2563EB]";

  if (variant === "gradient") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:bg-[#1D4ED8]`}
      >
        {label}
      </button>
    );
  }

  if (variant === "primary") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-[#3B82F6] text-white hover:bg-[#3B82F6] shadow-md shadow-blue-500/20 hover:shadow-blue-500/30`}
      >
        {label}
      </button>
    );
  }

  if (variant === "enterprise") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-[#0B1220] border border-[rgba(37, 99, 235,0.25)] text-white hover:bg-[#111827] hover:border-[#3B82F6]/40`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      className={`${base} border border-[rgba(37, 99, 235,0.25)] text-[#3B82F6] hover:bg-[#3B82F6]/10`}
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
