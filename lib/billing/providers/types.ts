import type { BillingCurrency } from "../currency";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";

export type PaymentProviderId = "razorpay" | "stripe";

export type CheckoutOrderRequest = {
  userId: string;
  planId: PlanId;
  period: BillingPeriod;
  currency: BillingCurrency;
};

export type CheckoutOrderResult = {
  provider: PaymentProviderId;
  orderId: string;
  amount: number;
  currency: BillingCurrency;
  keyId?: string;
  description: string;
};

export interface PaymentProvider {
  id: PaymentProviderId;
  supportsCurrency(currency: BillingCurrency): boolean;
  isAvailable(): boolean;
  createOrder(request: CheckoutOrderRequest): Promise<CheckoutOrderResult>;
}
