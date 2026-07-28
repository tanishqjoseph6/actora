import type { BillingCurrency } from "../currency";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";

export type PaymentProviderId = "razorpay" | "stripe";

export type CheckoutOrderRequest = {
  userId: string;
  email?: string;
  planId: PlanId;
  period: BillingPeriod;
  currency: BillingCurrency;
};

export type CheckoutOrderResult = {
  provider: PaymentProviderId;
  orderId?: string;
  subscriptionId?: string;
  razorpayPlanId?: string;
  amount?: number;
  currency: BillingCurrency;
  keyId?: string;
  description: string;
  /** Approximate INR label for Indian checkout disclaimer. */
  approximateInrLabel?: string;
  /** Full disclaimer text shown before Razorpay opens. */
  exchangeRateNotice?: string;
};

export interface PaymentProvider {
  id: PaymentProviderId;
  supportsCurrency(currency: BillingCurrency): boolean;
  isAvailable(): boolean;
  createOrder(request: CheckoutOrderRequest): Promise<CheckoutOrderResult>;
}
