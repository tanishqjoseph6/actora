import { RAZORPAY_CONNECTED } from "./config";
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
 * When Razorpay is connected, this will launch checkout instead of the modal.
 */
export function initiateUpgrade(
  selection: UpgradeSelection
): UpgradeFlowResult {
  if (RAZORPAY_CONNECTED) {
    // TODO: Initialize Razorpay Checkout here.
    // Example:
    // const rzp = new window.Razorpay({
    //   key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    //   amount: getAmountInPaise(selection),
    //   currency: "USD",
    //   name: "Actora",
    //   description: `${selection.plan.name} — ${selection.period}`,
    //   handler: (response) => { /* verify on server */ },
    // });
    // rzp.open();
    return { action: "checkout", selection };
  }

  return { action: "show_modal", selection };
}

/**
 * Placeholder for future Razorpay connection flow from the upgrade modal.
 */
export function connectRazorpayPlaceholder(): void {
  // TODO: Wire Razorpay account connection / onboarding flow here.
}
