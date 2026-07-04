export type RazorpayOrderPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpaySubscriptionPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

export type RazorpayPaymentResponse =
  | RazorpayOrderPaymentResponse
  | RazorpaySubscriptionPaymentResponse;

type RazorpayCheckoutBaseOptions = {
  key: string;
  name: string;
  description: string;
  prefill?: {
    name?: string | null;
    email?: string | null;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

export type RazorpayOrderCheckoutOptions = RazorpayCheckoutBaseOptions & {
  amount: number;
  currency: string;
  order_id: string;
};

export type RazorpaySubscriptionCheckoutOptions = RazorpayCheckoutBaseOptions & {
  subscription_id: string;
};

export type RazorpayCheckoutOptions =
  | RazorpayOrderCheckoutOptions
  | RazorpaySubscriptionCheckoutOptions;

export type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (response: { error: { description: string } }) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export {};
