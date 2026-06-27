/**
 * Razorpay is enabled when server credentials are configured.
 * Client checkout additionally requires NEXT_PUBLIC_RAZORPAY_KEY_ID.
 */
export const RAZORPAY_CONNECTED = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

export const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID ?? "";

export function isRazorpayCheckoutAvailable(): boolean {
  return RAZORPAY_CONNECTED && Boolean(RAZORPAY_KEY_ID);
}
