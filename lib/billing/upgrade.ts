import type {
  BillingPeriod,
  PricingPlan,
} from "@/components/billing/pricing-data";

export type UpgradeSelection = {
  plan: PricingPlan;
  period: BillingPeriod;
};

export type UpgradeFlowResult =
  | { action: "show_modal"; selection: UpgradeSelection }
  | { action: "checkout"; selection: UpgradeSelection };

/**
 * Entry point for all upgrade CTAs.
 * Opens the upgrade modal; Razorpay checkout is triggered from the modal.
 */
export function initiateUpgrade(
  selection: UpgradeSelection
): UpgradeFlowResult {
  return { action: "show_modal", selection };
}
