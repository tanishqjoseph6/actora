import type { BillingCurrency } from "../currency";
import { isDevBillingEnabled } from "../config";
import type { PaymentProvider, PaymentProviderId } from "./types";
import { razorpayProvider } from "./razorpay";
import { stripeProvider } from "./stripe";

const PROVIDERS: PaymentProvider[] = [razorpayProvider, stripeProvider];

export function getPaymentProviderForCurrency(
  currency: BillingCurrency
): PaymentProvider {
  if (currency === "INR") {
    return razorpayProvider;
  }

  const stripe = stripeProvider.isAvailable() ? stripeProvider : null;
  if (stripe?.supportsCurrency(currency)) {
    return stripe;
  }

  return razorpayProvider;
}

/** Server-side checkout availability (API routes). */
export function isCheckoutAvailableServer(currency: BillingCurrency): boolean {
  return getPaymentProviderForCurrency(currency).isAvailable();
}

/**
 * Client-side checkout routing.
 * Production never falls back to dev billing.
 */
export function isCheckoutAvailable(currency: BillingCurrency): boolean {
  if (isDevBillingEnabled()) {
    return false;
  }

  if (typeof window !== "undefined") {
    return true;
  }

  return isCheckoutAvailableServer(currency);
}

export function getCheckoutButtonLabel(currency: BillingCurrency): string {
  if (isDevBillingEnabled()) {
    return "Activate Plan (Dev)";
  }

  const provider = getPaymentProviderForCurrency(currency);

  if (provider.id === "stripe") {
    return "Pay with Stripe";
  }

  return "Pay with Razorpay";
}

export function getCheckoutDescription(currency: BillingCurrency): string {
  if (isDevBillingEnabled()) {
    return "Development mode — activate plan without payment.";
  }

  const provider = getPaymentProviderForCurrency(currency);

  if (provider.id === "stripe") {
    return "Secure checkout powered by Stripe.";
  }

  return "Secure checkout powered by Razorpay.";
}

export type {
  PaymentProvider,
  PaymentProviderId,
  CheckoutOrderRequest,
  CheckoutOrderResult,
} from "./types";
