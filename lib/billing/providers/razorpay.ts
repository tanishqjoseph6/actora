import { createRazorpayOrder } from "../razorpay";
import { isRazorpayCheckoutAvailable } from "../config";
import type { PaymentProvider } from "./types";

export const razorpayProvider: PaymentProvider = {
  id: "razorpay",

  supportsCurrency() {
    return true;
  },

  isAvailable() {
    return isRazorpayCheckoutAvailable();
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
