import type { BillingCurrency } from "../currency";
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

export function isCheckoutAvailable(currency: BillingCurrency): boolean {
  return getPaymentProviderForCurrency(currency).isAvailable();
}

export function getCheckoutButtonLabel(currency: BillingCurrency): string {
  const provider = getPaymentProviderForCurrency(currency);

  if (!provider.isAvailable()) {
    return "Activate Plan (Dev)";
  }

  if (provider.id === "stripe") {
    return "Pay with Stripe";
  }

  return "Pay with Razorpay";
}

export function getCheckoutDescription(currency: BillingCurrency): string {
  const provider = getPaymentProviderForCurrency(currency);

  if (!provider.isAvailable()) {
    return "Development mode — activate plan without payment.";
  }

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
