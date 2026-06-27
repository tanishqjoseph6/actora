import type { PaymentProvider } from "./types";

/**
 * Stripe provider stub — wire up when international USD checkout is added.
 * The pricing UI and billing page already route by currency; only this
 * provider implementation needs to be completed.
 */
export const stripeProvider: PaymentProvider = {
  id: "stripe",

  supportsCurrency(currency) {
    return currency === "USD";
  },

  isAvailable() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  },

  async createOrder() {
    throw new Error("Stripe checkout is not configured yet.");
  },
};
