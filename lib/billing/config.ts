/**
 * Razorpay is enabled when server credentials are configured.
 * Client checkout uses NEXT_PUBLIC_RAZORPAY_KEY_ID (returned from create-order as keyId).
 */
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

export const RAZORPAY_CONNECTED = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

export const RAZORPAY_PUBLIC_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export const RAZORPAY_KEY_ID =
  RAZORPAY_PUBLIC_KEY_ID || process.env.RAZORPAY_KEY_ID || "";

/** Server: full Razorpay credentials must be present. */
export function isRazorpayCheckoutAvailableServer(): boolean {
  return RAZORPAY_CONNECTED && Boolean(RAZORPAY_KEY_ID);
}

/**
 * Client: production always routes to Razorpay checkout (never dev billing).
 * Local dev uses Razorpay when NEXT_PUBLIC_RAZORPAY_KEY_ID is set.
 */
export function isRazorpayCheckoutAvailableClient(): boolean {
  if (!IS_DEVELOPMENT) {
    return true;
  }
  return Boolean(RAZORPAY_PUBLIC_KEY_ID);
}

/** Dev-only plan activation without payment. Never enabled in production. */
export function isDevBillingEnabled(): boolean {
  return IS_DEVELOPMENT && !isRazorpayCheckoutAvailableClient();
}

/** @deprecated Prefer isRazorpayCheckoutAvailableServer or isRazorpayCheckoutAvailableClient */
export function isRazorpayCheckoutAvailable(): boolean {
  if (typeof window !== "undefined") {
    return isRazorpayCheckoutAvailableClient();
  }
  return isRazorpayCheckoutAvailableServer();
}
