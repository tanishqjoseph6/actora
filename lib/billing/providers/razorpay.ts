import { createRazorpayOrder } from "../razorpay";
import { isRazorpayCheckoutAvailableServer } from "../config";
import type { PaymentProvider } from "./types";

export const razorpayProvider: PaymentProvider = {
  id: "razorpay",

  supportsCurrency() {
    return true;
  },

  isAvailable() {
    return isRazorpayCheckoutAvailableServer();
  },

  async createOrder(request) {
    const order = await createRazorpayOrder(request);
    return {
      provider: "razorpay",
      ...order,
      currency: request.currency,
    };
  },
};
