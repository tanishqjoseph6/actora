"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { BillingPeriod } from "@/components/billing/pricing-data";
import type { BillingCurrency } from "@/lib/billing/currency";
import type { PlanId, SubscriptionSnapshot } from "@/lib/subscription";
import type { RazorpayPaymentResponse } from "@/types/razorpay";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const VERIFY_MAX_RETRIES = 3;
const VERIFY_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });
}

type CheckoutCallbacks = {
  onSuccess?: (
    planId: PlanId,
    planName: string,
    subscription?: SubscriptionSnapshot
  ) => void;
  onFailure?: (message: string) => void;
  onCancel?: () => void;
};

export function useRazorpayCheckout(callbacks?: CheckoutCallbacks) {
  const { data: session } = useSession();
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const openCheckout = useCallback(
    async (
      planId: PlanId,
      period: BillingPeriod,
      currency: BillingCurrency,
      razorpayPlanId?: string
    ) => {
      try {
        const orderRes = await fetch("/api/payments/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            period,
            currency,
            razorpayPlanId,
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          callbacksRef.current?.onFailure?.(
            orderData.error ?? "Failed to start checkout."
          );
          return false;
        }

        if (orderData.provider !== "razorpay") {
          callbacksRef.current?.onFailure?.(
            "This currency uses a different payment provider."
          );
          return false;
        }

        await loadRazorpayScript();

        if (!window.Razorpay) {
          callbacksRef.current?.onFailure?.("Razorpay failed to initialize.");
          return false;
        }

        const checkoutBase = {
          key: orderData.keyId,
          name: "Actora",
          description: orderData.description,
          prefill: {
            name: session?.user?.name,
            email: session?.user?.email,
          },
          theme: { color: "#3B82F6" },
        };

        return await new Promise<boolean>((resolve) => {
          const handler = async (response: RazorpayPaymentResponse) => {
            const verifyPayload = {
              ...response,
              planId,
              period,
              currency,
              razorpayPlanId: orderData.razorpayPlanId,
            };

            let lastError = "Payment verification failed.";

            for (let attempt = 0; attempt < VERIFY_MAX_RETRIES; attempt += 1) {
              const verifyResult = await fetchJson<{
                success?: boolean;
                subscription?: SubscriptionSnapshot;
                error?: string;
              }>("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(verifyPayload),
              });

              if (verifyResult.ok) {
                const verifiedPlanId =
                  verifyResult.data.subscription?.planId ?? planId;
                const planName =
                  verifyResult.data.subscription?.planName ?? planId;
                console.log("[razorpay/checkout] verify success", {
                  planId: verifiedPlanId,
                  planName,
                  attempt,
                });
                callbacksRef.current?.onSuccess?.(
                  verifiedPlanId,
                  planName,
                  verifyResult.data.subscription
                );
                resolve(true);
                return;
              }

              lastError = verifyResult.error.message;
              console.error("[razorpay/checkout] verify failed", {
                attempt,
                status: verifyResult.error.status,
                error: verifyResult.error.message,
              });

              if (
                verifyResult.error.status &&
                verifyResult.error.status < 500
              ) {
                break;
              }

              if (attempt < VERIFY_MAX_RETRIES - 1) {
                await sleep(VERIFY_RETRY_DELAY_MS);
              }
            }

            callbacksRef.current?.onFailure?.(lastError);
            resolve(false);
          };

          const rzp = orderData.subscriptionId
            ? new window.Razorpay!({
                ...checkoutBase,
                subscription_id: orderData.subscriptionId,
                handler,
                modal: {
                  ondismiss: () => {
                    callbacksRef.current?.onCancel?.();
                    resolve(false);
                  },
                },
              })
            : new window.Razorpay!({
                ...checkoutBase,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.orderId,
                handler,
                modal: {
                  ondismiss: () => {
                    callbacksRef.current?.onCancel?.();
                    resolve(false);
                  },
                },
              });

          rzp.on("payment.failed", (response) => {
            callbacksRef.current?.onFailure?.(
              response.error.description ?? "Payment failed."
            );
            resolve(false);
          });

          rzp.open();
        });
      } catch (error) {
        callbacksRef.current?.onFailure?.(
          error instanceof Error
            ? error.message
            : "Failed to open checkout."
        );
        return false;
      }
    },
    [session]
  );

  return { openCheckout };
}
